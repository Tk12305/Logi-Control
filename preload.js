const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('logi', {
  diagnostics: () => ipcRenderer.invoke('diagnostics'),
  diagnosticText: (data) => ipcRenderer.invoke('diagnostic-text', data),
  setSetting: (setting, value) => ipcRenderer.invoke('set-setting', setting, value),
  openSolaar: () => ipcRenderer.invoke('open-solaar'),
  openHelp: () => ipcRenderer.invoke('open-help')
});
