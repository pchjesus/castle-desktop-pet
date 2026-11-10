import {closeSync,openSync,readSync,statSync} from 'node:fs';
import {TextDecoder} from 'node:util';

// Deliberately accepts only the three exact event names; no code, commands,
// arbitrary paths, transcript text or untrusted JSON properties are executed.
export const codexEventNames=Object.freeze(['jobStart','testPassed','deploymentComplete']);
const valid=new Set(codexEventNames);
export function parseCodexEvent(line){
 if(typeof line!=='string'||line.length>4096)return null;
 try{
  const data=JSON.parse(line);
  if(!data||typeof data!=='object'||Array.isArray(data)||!valid.has(data.event))return null;
  return data.event;
 }catch{return null;}
}

// Never replay old events at launch. Read only newly appended complete lines.
export function watchCodexEvents(file,onEvent,{intervalMs=750,setIntervalFn=setInterval,clearIntervalFn=clearInterval}={}){
 let position=0,rest='',lastSize=0,closed=false;
 try{position=lastSize=statSync(file).size;}catch{}
 const decoder=new TextDecoder('utf-8',{fatal:true});
 function poll(){
  if(closed)return;
  let stat;
  try{stat=statSync(file);}catch{position=0;lastSize=0;rest='';return;}
  if(stat.size<position){position=stat.size;lastSize=stat.size;rest='';return;}
  if(stat.size===position)return;
  if(stat.size-position>65536){position=stat.size;lastSize=stat.size;rest='';return;}
  const amount=stat.size-position,bytes=Buffer.alloc(amount);
  let handle;
  try{
   handle=openSync(file,'r');let read=0;
   while(read<amount){const count=readSync(handle,bytes,read,amount-read,position+read);if(count===0)break;read+=count;}
   if(read!==amount)return;
  }catch{return;}finally{if(handle!==undefined)closeSync(handle);}
  position=stat.size;lastSize=stat.size;
  let text;try{text=decoder.decode(bytes);}catch{rest='';return;}
  const all=rest+text,lines=all.split('\n');
  rest=lines.pop()||'';if(rest.length>4096)rest='';
  for(const raw of lines){
   const event=parseCodexEvent(raw.trim());
   if(event)onEvent(event);
  }
 }
 const timer=setIntervalFn(poll,intervalMs);timer?.unref?.();
 return {poll,stop(){closed=true;clearIntervalFn(timer);},path:file};
}
