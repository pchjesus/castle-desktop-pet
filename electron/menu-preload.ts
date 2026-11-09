import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('castleMenu',{
 invoke:(action:string)=>ipcRenderer.send('pet-menu:command',action),
 dismiss:()=>ipcRenderer.send('pet-menu:dismiss'),
 getInfo:()=>ipcRenderer.invoke('pet-menu:get-info'),
 testEvent:(name:string)=>ipcRenderer.invoke('pet-menu:test-event',name)
});
