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

async function diagnostics() {
  const [solaar, bluetooth, input, settings] = await Promise.all([
    run('solaar', ['show']),
    run('bluetoothctl', ['devices']),
    run('cat', ['/proc/bus/input/devices']),
    run('solaar', ['config', 'MX Master 3S'])
  ]);
  return { solaar, bluetooth, input, settings };
}

function diagnosticText(_event, data) {
  return [
    'Logi Arch Control diagnostic report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '[Solaar]', data.solaar.output,
    '',
    '[MX Master 3S settings]', data.settings.output,
    '',
    '[Bluetooth devices]', data.bluetooth.output,
    '',
    '[Linux input devices]', data.input.output
  ].join('\n');
}

const allowedSettings = {
  'hires-smooth-invert': (value) => ['true', 'false'].includes(value),
  'hires-smooth-resolution': (value) => ['true', 'false'].includes(value),
  'scroll-ratchet': (value) => ['Ratcheted', 'Freespinning'].includes(value),
  'smart-shift': (value) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 50,
  'thumb-scroll-invert': (value) => ['true', 'false'].includes(value),
  dpi: (value) => Number.isInteger(Number(value)) && Number(value) >= 200 && Number(value) <= 8000 && Number(value) % 50 === 0
};

function setSetting(_event, setting, value) {
  const valid = allowedSettings[setting];
  if (!valid || !valid(String(value))) return { ok: false, output: 'That setting or value is not allowed.' };
  return run('solaar', ['config', 'MX Master 3S', setting, String(value)]);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 980,
    height: 760,
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
