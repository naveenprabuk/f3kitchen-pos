const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('f3', { printHtml: (html, silent = false) => ipcRenderer.invoke('print-html', html, silent) });
