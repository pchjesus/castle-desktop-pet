import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {MAX_MP3_BYTES,validMp3Path} from './music-library.mjs';

// Range requests let Chromium seek long MP3 files without materializing the
// whole file in memory. We stream only a path selected in the native picker.
export function parseMp3Range(value,size){
 if(!Number.isSafeInteger(size)||size<=0)throw new RangeError('Empty media');
 if(value==null||value==='')return {start:0,end:size-1,status:200};
 const match=/^bytes=(\d*)-(\d*)$/.exec(value.trim());
 if(!match||(match[1]===''&&match[2]===''))throw new RangeError('Invalid range');
 const first=match[1],last=match[2];
 const n=Number(first),m=Number(last);
 if((first!==''&&!Number.isSafeInteger(n))||(last!==''&&!Number.isSafeInteger(m)))throw new RangeError('Invalid offset');
 let start,end;
 if(first===''){
  if(m<1)throw new RangeError('Invalid suffix');
  start=Math.max(0,size-m);end=size-1;
 }else{
  start=n;end=last===''?size-1:Math.min(size-1,m);
 }
 if(start>=size||end<start)throw new RangeError('Unsatisfiable range');
 return {start,end,status:206};
}

export async function streamSelectedMp3(filename,range=null,signal=undefined,method='GET'){
 if(!validMp3Path(filename))return new Response(null,{status:403});
 let size;
 try{
  const file=await stat(filename);
  if(!file.isFile()||file.size<=0||file.size>MAX_MP3_BYTES)return new Response(null,{status:413});
  size=file.size;
 }catch{return new Response(null,{status:404});}
 const headers={
  'Content-Type':'audio/mpeg',
  'Accept-Ranges':'bytes',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':'Range',
  'Cache-Control':'no-store'
 };
 if(method==='OPTIONS')return new Response(null,{status:204,headers});
 if(method!=='GET'&&method!=='HEAD')return new Response(null,{status:405,headers});
 let section;
 try{section=parseMp3Range(range,size);}
 catch{return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+size}});}
 headers['Content-Length']=String(section.end-section.start+1);
 if(section.status===206)headers['Content-Range']='bytes '+section.start+'-'+section.end+'/'+size;
 if(method==='HEAD')return new Response(null,{status:section.status,headers});
 // Readable.toWeb exposes stream backpressure to Chromium. Node fs limits
 // in-flight buffering; request abort cancels file reads on track change.
 const nodeStream=createReadStream(filename,{start:section.start,end:section.end,highWaterMark:64*1024,signal});
 return new Response(Readable.toWeb(nodeStream),{status:section.status,headers});
}
