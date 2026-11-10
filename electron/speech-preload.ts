import {contextBridge,ipcRenderer} from 'electron';
contextBridge.exposeInMainWorld('castleSpeech',{
 onText:(callback:(text:string)=>void)=>{
  const listener=(_event:Electron.IpcRendererEvent,text:string)=>callback(text);
  ipcRenderer.on('speech:text',listener);
  return ()=>ipcRenderer.removeListener('speech:text',listener);
 },
 onPlacement:(callback:(placement:{placement:string;tailX:number})=>void)=>{const listener=(_event:Electron.IpcRendererEvent,placement:{placement:string;tailX:number})=>callback(placement);ipcRenderer.on('speech:placement',listener);return ()=>ipcRenderer.removeListener('speech:placement',listener);},
 measure:(height:number,width:number)=>ipcRenderer.send('speech:measure',height,width)
});
