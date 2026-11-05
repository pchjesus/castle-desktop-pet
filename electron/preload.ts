import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('pet', { showMenu: () => ipcRenderer.send('show-menu') });
