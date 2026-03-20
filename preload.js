const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  computeHash: (filePath, algorithm) => ipcRenderer.invoke('compute-hash', filePath, algorithm),
  onHashProgress: (callback) => ipcRenderer.on('hash-progress', (event, progress) => callback(progress))
});
