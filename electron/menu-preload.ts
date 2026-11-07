import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('castleMenu',{
 invoke:(action:string)=>ipcRenderer.send('pet-menu:command',action),
 dismiss:()=>ipcRenderer.send('pet-menu:dismiss')
});
