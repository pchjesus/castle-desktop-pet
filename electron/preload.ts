import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('pet',{
 showSpeech:(text:string)=>ipcRenderer.send('pet:speech',text),
 showMenu:()=>ipcRenderer.send('show-menu'),
 onAction:(callback:(state:string)=>void)=>{
  const listener=(_event:Electron.IpcRendererEvent,state:string)=>callback(state);
  ipcRenderer.on('pet:action',listener);
  return ()=>ipcRenderer.removeListener('pet:action',listener);
 },
 setPassthrough:(ignore:boolean)=>ipcRenderer.send('pet:passthrough',ignore),
 dragStart:()=>ipcRenderer.send('pet:drag-start'),
 dragMove:()=>ipcRenderer.send('pet:drag-move'),
 dragEnd:()=>ipcRenderer.send('pet:drag-end')
});
