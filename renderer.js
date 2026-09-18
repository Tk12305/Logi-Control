const ids = ['solaar', 'bluetooth', 'settings', 'input'];
const MOUSE_SETTINGS = ['dpi', 'smart-shift', 'scroll-ratchet', 'hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert'];
const KEYBOARD_SETTINGS = ['backlight', 'fn-swap', 'multiplatform'];

let latestResult;
let selectedDeviceName = localStorage.getItem('logi-control.selected-device') || '';
let isSaving = false;
let isRefreshing = false;

function setHealth(title, detail, state = 'good') {
  const card = document.querySelector('#health-card');
  card.className = `health-card ${state === 'good' ? '' : state}`.trim();
  document.querySelector('#health-title').textContent = title;
  document.querySelector('#health-detail').textContent = detail;
}

function setSettingsBusy(isBusy) {
  document.querySelectorAll('.controls input, .controls select').forEach((control) => {
    control.disabled = isBusy;
  });
}

function setBluetoothBusy(isBusy) {
  document.querySelectorAll('.bluetooth-actions button, #bluetooth-address').forEach((control) => {
    control.disabled = isBusy;
  });
}

async function runBluetoothAction(action) {
  const address = document.querySelector('#bluetooth-address').value.trim();
  const status = document.querySelector('#bluetooth-action-status');
  const output = document.querySelector('#bluetooth-manager-output');
  if (action === 'remove' && !window.confirm(`Forget Bluetooth device ${address || 'this device'}?`)) return;

  setBluetoothBusy(true);
  status.textContent = action === 'scan' ? 'Scanning for 8 seconds…' : 'Working…';
  try {
    const result = await window.logi.bluetoothAction(action, address);
    output.textContent = `$ ${result.command}\n\n${result.output}`;
    status.textContent = result.ok ? 'Done' : 'Could not complete the action';
    status.className = result.ok ? 'good' : 'bad';
    if (result.ok && action !== 'scan') await refresh(true);
  } catch (_error) {
    status.textContent = 'Bluetooth service did not respond';
    status.className = 'bad';
  } finally {
    setBluetoothBusy(false);
  }
}

function markOnboardingComplete() {
  localStorage.setItem('logi-control.onboarding-complete', 'true');
  document.querySelector('#onboarding').hidden = true;
}

function showOnboarding(result) {
  if (localStorage.getItem('logi-control.onboarding-complete')) return;
  const solaarUnavailable = !result.solaar.ok;
  const noDevices = !(result.devices || []).length;
  const title = document.querySelector('#onboarding-title');
  const detail = document.querySelector('#onboarding-detail');
  const steps = document.querySelector('#onboarding-steps');
  const command = document.querySelector('#onboarding-command');
  const copyButton = document.querySelector('#onboarding-copy-command');

  if (solaarUnavailable) {
    title.textContent = 'Install the device service first';
    detail.textContent = 'Logi Control uses Solaar to securely read and change supported Logitech hardware settings.';
    steps.innerHTML = '<li>Install Solaar and Bluetooth tools.</li><li>Plug in your Logi Bolt or Unifying receiver.</li><li>Return here and refresh your devices.</li>';
    command.hidden = false;
    copyButton.hidden = false;
  } else if (noDevices) {
    title.textContent = 'Connect a Logitech device';
    detail.textContent = 'Solaar is ready. Connect or wake a compatible device so it can be detected.';
    steps.innerHTML = '<li>Plug in a Logi Bolt or Unifying receiver.</li><li>Turn on your mouse or keyboard.</li><li>Use the device’s Easy-Switch channel if applicable.</li>';
    command.hidden = true;
    copyButton.hidden = true;
  } else {
    title.textContent = 'Your device is ready';
    detail.textContent = 'Choose a device to customise its supported hardware settings. You can revisit diagnostics whenever you need them.';
    steps.innerHTML = '<li>Select your device from the list.</li><li>Adjust the settings it supports.</li><li>Changes save directly to your device.</li>';
    command.hidden = true;
    copyButton.hidden = true;
  }
  document.querySelector('#onboarding').hidden = false;
}

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
    localStorage.removeItem('logi-control.selected-device');
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
  document.querySelector('#selected-device-heading').textContent = device ? device.name : 'Ready to customise';
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
  document.querySelector('#bluetooth-manager-output').textContent = result.bluetooth.ok
    ? result.bluetooth.output || 'No paired Bluetooth devices found.'
    : 'Bluetooth is unavailable. Check that the Bluetooth service is running.';

  updateDeviceSelector(result.devices || []);
  updateSelectedDevice();

  const receiverMatch = /Bolt Receiver|Unifying Receiver|Lightspeed Receiver/i.test(result.solaar.output);
  document.querySelector('#connection').textContent = receiverMatch || (result.devices || []).length ? 'Connected' : 'Not found';
  document.querySelector('#connection-detail').textContent = receiverMatch ? 'Logi receiver detected' : `${(result.devices || []).length} device(s) via Solaar`;

  if (!result.solaar.ok) {
    setHealth('Solaar needs attention', 'Logi Control could not reach Solaar. Install or start Solaar, then refresh this page.', 'error');
  } else if (!(result.devices || []).length) {
    setHealth('No compatible device found', 'Connect a Logi Bolt or Unifying receiver, wake your device, then choose Refresh.', 'warning');
  } else if (!result.bluetooth.ok) {
    setHealth('Your Logitech device is ready', 'Bluetooth details are unavailable, but the connected device can still be configured through Solaar.', 'warning');
  } else {
    setHealth('Your setup is ready', `${result.devices.length} Logitech ${result.devices.length === 1 ? 'device is' : 'devices are'} available to customise.`);
  }
  showOnboarding(result);
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
  isSaving = true;
  setSettingsBusy(true);
  status.textContent = 'Saving…';
  try {
    const result = await window.logi.setSetting(selectedDeviceName, setting, value);
    status.textContent = result.ok ? 'Saved to device' : 'Could not save this setting. Check the diagnostics below and try again.';
    status.className = result.ok ? 'good' : 'bad';
    if (result.ok) {
      setTimeout(() => { status.textContent = ''; }, 1800);
      await refresh(true);
    }
  } catch (_error) {
    status.textContent = 'Could not save this setting. Please refresh and try again.';
    status.className = 'bad';
  } finally {
    isSaving = false;
    setSettingsBusy(false);
  }
}

async function refresh(force = false) {
  if (isRefreshing || (isSaving && !force)) return;
  if (!force && document.querySelector('.controls input:focus, .controls select:focus')) return;
  isRefreshing = true;
  document.querySelector('#refresh').disabled = true;
  for (const id of ids) document.querySelector(`#${id}-state`).textContent = 'Checking…';
  try {
    update(await window.logi.diagnostics());
  } catch (_error) {
    setHealth('Could not refresh devices', 'The system services did not respond. Check that Solaar is installed and try again.', 'error');
  } finally {
    isRefreshing = false;
    document.querySelector('#refresh').disabled = false;
  }
}

document.querySelector('#refresh').addEventListener('click', refresh);
document.querySelector('#solaar').addEventListener('click', () => window.logi.openSolaar());
document.querySelector('#solaar-bottom').addEventListener('click', () => window.logi.openSolaar());
document.querySelector('#device-select').addEventListener('change', (event) => {
  selectedDeviceName = event.target.value;
  if (selectedDeviceName) localStorage.setItem('logi-control.selected-device', selectedDeviceName);
  updateSelectedDevice();
});
async function copyReport() {
  if (!latestResult) return;
  await navigator.clipboard.writeText(await window.logi.diagnosticText(latestResult));
  for (const button of document.querySelectorAll('#copy-report, #copy-report-top')) {
    button.textContent = 'Report copied';
    setTimeout(() => { button.textContent = button.id === 'copy-report-top' ? 'Copy report' : 'Diagnostics'; }, 1800);
  }
}
document.querySelector('#copy-report').addEventListener('click', copyReport);
document.querySelector('#copy-report-top').addEventListener('click', copyReport);
document.querySelector('#onboarding-dismiss').addEventListener('click', markOnboardingComplete);
document.querySelector('#onboarding-refresh').addEventListener('click', async () => {
  await refresh();
  if (latestResult?.devices?.length) markOnboardingComplete();
});
document.querySelector('#onboarding-copy-command').addEventListener('click', async () => {
  const command = document.querySelector('#onboarding-command').textContent;
  await navigator.clipboard.writeText(command);
  const button = document.querySelector('#onboarding-copy-command');
  button.textContent = 'Install command copied';
  setTimeout(() => { button.textContent = 'Copy install command'; }, 1800);
});
for (const action of ['scan', 'pair', 'connect', 'disconnect', 'remove']) {
  document.querySelector(`#bluetooth-${action}`).addEventListener('click', () => runBluetoothAction(action));
}
window.addEventListener('focus', () => refresh());
setInterval(() => refresh(), 60000);

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
