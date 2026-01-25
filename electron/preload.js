/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory')
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron Preload Initialized');
});
