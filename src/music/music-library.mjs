import {basename,extname,normalize,isAbsolute,win32} from 'node:path';
export const MAX_TRACKS=200;
export const MAX_MP3_BYTES=80*1024*1024;
export function validMp3Path(file){return typeof file==='string'&&file.length>0&&file.length<4096&&(isAbsolute(file)||win32.isAbsolute(file))&&!file.startsWith('\\\\')&&extname(file).toLowerCase()==='.mp3';}
export function trackTitle(file){return basename(file).replace(/\.mp3$/i,'').slice(0,130);}
export function normalizeLibrary(source){
 const paths=[];const seen=new Set();
 for(const path of Array.isArray(source)?source:[]){
  if(!validMp3Path(path))continue;
  const key=normalize(path).toLocaleLowerCase('en');
  if(seen.has(key))continue;
  paths.push(path);seen.add(key);
  if(paths.length===MAX_TRACKS)break;
 }
 return paths;
}
export function normalizeMusicSettings(source){
 return {
  volume:Number.isInteger(source?.volume)&&source.volume>=0&&source.volume<=100?source.volume:65,
  rhythmFire:source?.rhythmFire===true,
  repeat:source?.repeat===true
 };
}
