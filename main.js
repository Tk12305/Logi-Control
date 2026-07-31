const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { execFile, spawn } = require('node:child_process');
const path = require('node:path');

function run(command, args = []) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 12000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        command: [command, ...args].join(' '),
        output: (stdout || stderr || error?.message || 'No output').trim()
      });
    });
  });
}

function parseDevices(solaarOutput) {
  const devices = [];
  const lines = solaarOutput.split('\n');
  let current = null;

  for (const line of lines) {
    const headerMatch = line.match(/^\s+(\d+):\s+(.+)$/);
    if (headerMatch) {
      if (current) devices.push(current);
      current = { number: Number(headerMatch[1]), name: headerMatch[2].trim(), kind: null, battery: null };
      continue;
    }
    if (!current) continue;

    const kindMatch = line.match(/Kind\s*:\s*(\S+)/);
    if (kindMatch) {
      const kind = kindMatch[1].toLowerCase();
      current.kind = kind === '?' ? null : kind;
    }

    const batteryMatch = line.match(/Battery:\s*(\d+%)/i);
    if (batteryMatch) current.battery = batteryMatch[1];
  }
  if (current) devices.push(current);

  return devices.filter((device) => device.name);
}

function inferKindFromConfig(configOutput) {
  if (/^dpi\s*=/m.test(configOutput) || /^smart-shift\s*=/m.test(configOutput)) return 'mouse';
  if (/^backlight\s*=/m.test(configOutput) || /^fn-swap\s*=/m.test(configOutput)) return 'keyboard';
  return 'unknown';
}

async function diagnostics() {
  const [solaar, bluetooth, input] = await Promise.all([
    run('solaar', ['show']),
    run('bluetoothctl', ['devices']),
    run('cat', ['/proc/bus/input/devices'])
  ]);

  const parsed = parseDevices(solaar.output);
  const configResults = await Promise.all(parsed.map((device) => run('solaar', ['config', device.name])));

  const devices = parsed.map((device, index) => {
    const config = configResults[index];
    const kind = device.kind || inferKindFromConfig(config.output);
    return { ...device, kind, config };
  });

  return { solaar, bluetooth, input, devices };
}

function diagnosticText(_event, data) {
  const deviceSections = (data.devices || []).flatMap((device) => [
    '',
    `[${device.name} settings]`,
    device.config?.output || 'No settings available.'
  ]);

  return [
    'Logi Control diagnostic report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '[Solaar]',
    data.solaar.output,
    ...deviceSections,
    '',
    '[Bluetooth devices]',
    data.bluetooth.output,
    '',
    '[Linux input devices]',
    data.input.output
  ].join('\n');
}

const allowedSettings = {
  'hires-smooth-invert': (value) => ['true', 'false'].includes(String(value).toLowerCase()),
  'hires-smooth-resolution': (value) => ['true', 'false'].includes(String(value).toLowerCase()),
  'scroll-ratchet': (value) => ['Ratcheted', 'Freespinning'].includes(value),
  'smart-shift': (value) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 50,
  'thumb-scroll-invert': (value) => ['true', 'false'].includes(String(value).toLowerCase()),
  dpi: (value) => Number.isInteger(Number(value)) && Number(value) >= 200 && Number(value) <= 8000 && Number(value) % 50 === 0,
  backlight: (value) => ['true', 'false'].includes(String(value).toLowerCase()),
  'fn-swap': (value) => ['true', 'false'].includes(String(value).toLowerCase()),
  multiplatform: (value) => ['Windows', 'MacOS', 'iOS', 'Android', '0', '1', '2', '3'].includes(String(value))
};

function setSetting(_event, device, setting, value) {
  if (!device || typeof device !== 'string' || device.trim().length < 3) {
    return { ok: false, output: 'A valid device name is required.' };
  }

  const valid = allowedSettings[setting];
  if (!valid || !valid(String(value))) return { ok: false, output: 'That setting or value is not allowed.' };
  return run('solaar', ['config', device.trim(), setting, String(value)]);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 980,
    height: 860,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#10161f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  window.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('diagnostics', diagnostics);
  ipcMain.handle('diagnostic-text', diagnosticText);
  ipcMain.handle('set-setting', setSetting);
  ipcMain.handle('open-solaar', () => new Promise((resolve) => {
    const child = spawn('solaar', [], { detached: true, stdio: 'ignore' });
    child.once('error', (error) => resolve({ ok: false, message: error.message }));
    child.unref();
    resolve({ ok: true });
  }));
  ipcMain.handle('open-help', () => shell.openExternal('https://pwr-solaar.github.io/Solaar/'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
