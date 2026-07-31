const ids = ['solaar', 'bluetooth', 'settings', 'input'];
const MOUSE_SETTINGS = ['dpi', 'smart-shift', 'scroll-ratchet', 'hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert'];
const KEYBOARD_SETTINGS = ['backlight', 'fn-swap', 'multiplatform'];

let latestResult;
let selectedDeviceName = '';

function configValue(output, setting) {
  const match = output.match(new RegExp(`^${setting.replace(/-/g, '\\-')}\\s*=\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function hasSetting(output, setting) {
  return configValue(output, setting) !== null;
}

function parseBool(value) {
  return /^(true|True|1)$/i.test(value);
}

function findDevice(name) {
  return (latestResult?.devices || []).find((device) => device.name === name);
}

function updateDeviceSelector(devices) {
  const select = document.querySelector('#device-select');
  const previous = selectedDeviceName;
  select.innerHTML = '';

  if (!devices.length) {
    select.innerHTML = '<option value="">No Solaar devices found</option>';
    selectedDeviceName = '';
    return;
  }

  for (const device of devices) {
    const option = document.createElement('option');
    option.value = device.name;
    option.textContent = `${device.name} (${device.kind})`;
    select.appendChild(option);
  }

  if (previous && devices.some((device) => device.name === previous)) {
    select.value = previous;
  }
  selectedDeviceName = select.value;
}

function showControlPanel(kind, configOutput) {
  const mousePanel = document.querySelector('#mouse-controls');
  const keyboardPanel = document.querySelector('#keyboard-controls');
  const noPanel = document.querySelector('#no-controls');

  const mouseAvailable = kind === 'mouse' && MOUSE_SETTINGS.some((setting) => hasSetting(configOutput, setting));
  const keyboardAvailable = kind === 'keyboard' && KEYBOARD_SETTINGS.some((setting) => hasSetting(configOutput, setting));

  mousePanel.hidden = !mouseAvailable;
  keyboardPanel.hidden = !keyboardAvailable;
  noPanel.hidden = mouseAvailable || keyboardAvailable;

  for (const setting of MOUSE_SETTINGS) {
    const label = mousePanel.querySelector(`[data-setting="${setting}"]`);
    if (label) label.hidden = !hasSetting(configOutput, setting);
  }
  for (const setting of KEYBOARD_SETTINGS) {
    const label = keyboardPanel.querySelector(`[data-setting="${setting}"]`);
    if (label) label.hidden = !hasSetting(configOutput, setting);
  }

  document.querySelectorAll('.mouse-stat').forEach((element) => { element.hidden = kind !== 'mouse'; });
  document.querySelectorAll('.keyboard-stat').forEach((element) => { element.hidden = kind !== 'keyboard'; });
}

function applyMouseSettings(output) {
  setFromOutput(output, 'dpi', /dpi = (\d+)/, Number);
  setFromOutput(output, 'smart-shift', /smart-shift = (\d+)/, Number);
  setFromOutput(output, 'scroll-ratchet', /scroll-ratchet = (Ratcheted|Freespinning)/, String);
  for (const name of ['hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert']) {
    const match = output.match(new RegExp(`${name} = (True|False)`));
    const element = document.querySelector(`#${name}`);
    if (match && element) element.checked = match[1] === 'True';
  }

  const dpi = configValue(output, 'dpi');
  document.querySelector('#active-dpi').textContent = dpi || '—';
  const smartShift = configValue(output, 'smart-shift');
  document.querySelector('#active-smart-shift').textContent = smartShift ?? '—';
}

function applyKeyboardSettings(output) {
  const backlight = configValue(output, 'backlight');
  const fnSwap = configValue(output, 'fn-swap');
  const multiplatform = configValue(output, 'multiplatform');

  if (backlight !== null) document.querySelector('#backlight').checked = parseBool(backlight);
  if (fnSwap !== null) document.querySelector('#fn-swap').checked = parseBool(fnSwap);
  if (multiplatform !== null) {
    const select = document.querySelector('#multiplatform');
    const normalized = multiplatform.replace(/['"]/g, '');
    if ([...select.options].some((option) => option.value === normalized)) select.value = normalized;
  }

  document.querySelector('#active-backlight').textContent = backlight === null ? '—' : (parseBool(backlight) ? 'On' : 'Off');
  document.querySelector('#active-fn-swap').textContent = fnSwap === null ? '—' : (parseBool(fnSwap) ? 'Enabled' : 'Disabled');
}

function updateSelectedDevice() {
  const device = findDevice(selectedDeviceName);
  const configOutput = device?.config?.output || '';
  const kind = device?.kind || 'unknown';

  document.querySelector('#device-kind').textContent = device ? kind : '—';
  document.querySelector('#settings-title').textContent = device ? `${device.name} settings` : 'Device settings';
  document.querySelector('#settings-state').textContent = device?.config?.ok ? 'Available' : 'Needs attention';
  document.querySelector('#settings-state').className = device?.config?.ok ? 'good' : 'bad';
  document.querySelector('#settings-output').textContent = device
    ? `$ ${device.config.command}\n\n${configOutput}`
    : 'No device selected.';

  document.querySelector('#battery').textContent = device?.battery || '—';
  document.querySelector('#battery-detail').textContent = device ? `Reported by ${device.name}` : 'Reported by device';

  showControlPanel(kind, configOutput);
  if (kind === 'mouse') applyMouseSettings(configOutput);
  if (kind === 'keyboard') applyKeyboardSettings(configOutput);
}

function update(result) {
  latestResult = result;

  for (const id of ids) {
    if (id === 'settings') continue;
    const item = result[id];
    document.querySelector(`#${id}-state`).textContent = item.ok ? 'Available' : 'Needs attention';
    document.querySelector(`#${id}-state`).className = item.ok ? 'good' : 'bad';
    document.querySelector(`#${id}-output`).textContent = `$ ${item.command}\n\n${item.output}`;
  }

  updateDeviceSelector(result.devices || []);
  updateSelectedDevice();

  const receiverMatch = /Bolt Receiver|Unifying Receiver|Lightspeed Receiver/i.test(result.solaar.output);
  document.querySelector('#connection').textContent = receiverMatch || (result.devices || []).length ? 'Connected' : 'Not found';
  document.querySelector('#connection-detail').textContent = receiverMatch ? 'Logi receiver detected' : `${(result.devices || []).length} device(s) via Solaar`;
}

function setFromOutput(output, id, pattern, transform) {
  const match = output.match(pattern);
  if (!match) return;
  const element = document.querySelector(`#${id}`);
  if (!element) return;
  element.value = transform(match[1]);
  const label = document.querySelector(`#${id}-value`);
  if (label) label.value = element.value;
}

async function save(setting, value, statusId = '#save-status') {
  if (!selectedDeviceName) return;
  const status = document.querySelector(statusId);
  status.textContent = 'Saving…';
  const result = await window.logi.setSetting(selectedDeviceName, setting, value);
  status.textContent = result.ok ? 'Saved to device' : `Could not save: ${result.output}`;
  status.className = result.ok ? 'good' : 'bad';
  if (result.ok) setTimeout(() => { status.textContent = ''; }, 1800);
  if (result.ok) refresh();
}

async function refresh() {
  document.querySelector('#refresh').disabled = true;
  for (const id of ids) document.querySelector(`#${id}-state`).textContent = 'Checking…';
  update(await window.logi.diagnostics());
  document.querySelector('#refresh').disabled = false;
}

document.querySelector('#refresh').addEventListener('click', refresh);
document.querySelector('#solaar').addEventListener('click', () => window.logi.openSolaar());
document.querySelector('#solaar-bottom').addEventListener('click', () => window.logi.openSolaar());
document.querySelector('#device-select').addEventListener('change', (event) => {
  selectedDeviceName = event.target.value;
  updateSelectedDevice();
});
document.querySelector('#copy-report').addEventListener('click', async () => {
  if (!latestResult) return;
  await navigator.clipboard.writeText(await window.logi.diagnosticText(latestResult));
  const button = document.querySelector('#copy-report');
  button.textContent = 'Report copied';
  setTimeout(() => { button.textContent = 'Copy report'; }, 1800);
});

for (const id of ['dpi', 'smart-shift']) {
  const element = document.querySelector(`#${id}`);
  element.addEventListener('input', () => {
    document.querySelector(`#${id}-value`).value = element.value;
    document.querySelector(`#active-${id}`).textContent = element.value;
  });
  element.addEventListener('change', () => save(id, element.value));
}

document.querySelector('#scroll-ratchet').addEventListener('change', (event) => save('scroll-ratchet', event.target.value));
for (const id of ['hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert']) {
  document.querySelector(`#${id}`).addEventListener('change', (event) => save(id, String(event.target.checked)));
}

document.querySelector('#backlight').addEventListener('change', (event) => save('backlight', String(event.target.checked), '#keyboard-save-status'));
document.querySelector('#fn-swap').addEventListener('change', (event) => save('fn-swap', String(event.target.checked), '#keyboard-save-status'));
document.querySelector('#multiplatform').addEventListener('change', (event) => save('multiplatform', event.target.value, '#keyboard-save-status'));

refresh();
