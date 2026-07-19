const ids = ['solaar', 'bluetooth', 'settings', 'input'];
let latestResult;

function update(result) {
  latestResult = result;
  for (const id of ids) {
    const item = result[id];
    document.querySelector(`#${id}-state`).textContent = item.ok ? 'Available' : 'Needs attention';
    document.querySelector(`#${id}-state`).className = item.ok ? 'good' : 'bad';
    document.querySelector(`#${id}-output`).textContent = `$ ${item.command}\n\n${item.output}`;
  }
  const settings = result.settings.output;
  setFromOutput(settings, 'dpi', /dpi = (\d+)/, Number);
  setFromOutput(settings, 'smart-shift', /smart-shift = (\d+)/, Number);
  setFromOutput(settings, 'scroll-ratchet', /scroll-ratchet = (Ratcheted|Freespinning)/, String);
  for (const name of ['hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert']) {
    const match = settings.match(new RegExp(`${name} = (True|False)`));
    if (match) document.querySelector(`#${name}`).checked = match[1] === 'True';
  }
  const battery = result.solaar.output.match(/Battery:\s*(\d+%)/i);
  document.querySelector('#battery').textContent = battery ? battery[1] : '—';
  document.querySelector('#connection').textContent = /Bolt Receiver/.test(result.solaar.output) ? 'Connected' : 'Not found';
  document.querySelector('#active-dpi').textContent = document.querySelector('#dpi').value;
  document.querySelector('#active-smart-shift').textContent = document.querySelector('#smart-shift').value;
}

function setFromOutput(output, id, pattern, transform) {
  const match = output.match(pattern);
  if (!match) return;
  const element = document.querySelector(`#${id}`);
  element.value = transform(match[1]);
  const label = document.querySelector(`#${id}-value`);
  if (label) label.value = element.value;
}

async function save(setting, value) {
  const status = document.querySelector('#save-status');
  status.textContent = 'Saving…';
  const result = await window.logi.setSetting(setting, value);
  status.textContent = result.ok ? 'Saved to mouse' : `Could not save: ${result.output}`;
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
document.querySelector('#copy-report').addEventListener('click', async () => {
  if (!latestResult) return;
  await navigator.clipboard.writeText(await window.logi.diagnosticText(latestResult));
  const button = document.querySelector('#copy-report');
  button.textContent = 'Report copied';
  setTimeout(() => { button.textContent = 'Copy report'; }, 1800);
});
for (const id of ['dpi', 'smart-shift']) {
  const element = document.querySelector(`#${id}`);
  element.addEventListener('input', () => { document.querySelector(`#${id}-value`).value = element.value; document.querySelector(`#active-${id}`).textContent = element.value; });
  element.addEventListener('change', () => save(id, element.value));
}
document.querySelector('#scroll-ratchet').addEventListener('change', (event) => save('scroll-ratchet', event.target.value));
for (const id of ['hires-smooth-invert', 'hires-smooth-resolution', 'thumb-scroll-invert']) {
  document.querySelector(`#${id}`).addEventListener('change', (event) => save(id, String(event.target.checked)));
}
refresh();
