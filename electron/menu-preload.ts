import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('castleMenu',{
 invoke:(action:string)=>ipcRenderer.send('pet-menu:command',action),
 dismiss:()=>ipcRenderer.send('pet-menu:dismiss'),
 windowControl:(command:string)=>ipcRenderer.send('pet-menu:window-control',command),
 getInfo:()=>ipcRenderer.invoke('pet-menu:get-info'),
 testEvent:(name:string)=>ipcRenderer.invoke('pet-menu:test-event',name),
 copyBravePairToken:()=>ipcRenderer.invoke('pet-menu:brave-copy-token'),
 setCodexIntegration:(enabled:boolean)=>ipcRenderer.invoke('pet-menu:codex-toggle',enabled)
});
