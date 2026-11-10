import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('pet',{
 nativeWindow:true,
 reportAction:(value:Record<string,unknown>)=>ipcRenderer.send('pet:action-result',value),
 reportCodexResult:(value:{id:number;name:string;accepted:boolean})=>ipcRenderer.send('pet:codex-event-result',value),
 showSpeech:(text:string)=>ipcRenderer.send('pet:speech',text),
 showMenu:()=>ipcRenderer.send('show-menu'),
 onAction:(callback:(state:string|{kind:'manual';id:number;pose:string}|{kind:'codex-event';id:number;name:string}|{kind:'external-notification';name:string})=>void)=>{
  const listener=(_event:Electron.IpcRendererEvent,state:string|{kind:'manual';id:number;pose:string})=>callback(state);
  ipcRenderer.on('pet:action',listener);
  return ()=>ipcRenderer.removeListener('pet:action',listener);
 },
 setPassthrough:(ignore:boolean)=>ipcRenderer.send('pet:passthrough',ignore),
 dragStart:()=>ipcRenderer.send('pet:drag-start'),
 dragMove:()=>ipcRenderer.send('pet:drag-move'),
 dragEnd:()=>ipcRenderer.send('pet:drag-end')
});
