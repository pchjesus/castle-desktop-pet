import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('castleSpeech',{
 onText:(callback:(text:string)=>void)=>{
  const listener=(_event:Electron.IpcRendererEvent,text:string)=>callback(text);
  ipcRenderer.on('speech:text',listener);
  return ()=>ipcRenderer.removeListener('speech:text',listener);
 },
 measure:(height:number)=>ipcRenderer.send('speech:measure',height)
});
