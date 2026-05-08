const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('openStudioDesktop', {
  isDesktop: true,
  storageGet: (key) => ipcRenderer.invoke('desktop:storage:get', key),
  storageSet: (key, value) => ipcRenderer.invoke('desktop:storage:set', key, value),
  storageDel: (key) => ipcRenderer.invoke('desktop:storage:del', key),
  saveBytes: (payload) => ipcRenderer.invoke('desktop:file:save-bytes', payload),
  saveText: (payload) => ipcRenderer.invoke('desktop:file:save-text', payload),
});
