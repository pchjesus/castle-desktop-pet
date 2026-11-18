import {createBeatDetector} from './beat-detector.mjs';

export interface MusicCommand {
 action:'init'|'library'|'play'|'pause'|'stop'|'next'|'previous'|'select'|'volume'|'rhythm'|'repeat';
 tracks?:string[];
 index?:number;
 volume?:number;
 rhythmFire?:boolean;
 repeat?:boolean;
}
type MusicStatus={
 index:number;playing:boolean;time:number;duration:number;volume:number;
 rhythmFire:boolean;repeat:boolean;error:string;
};
type Bridge=NonNullable<Window['pet']>;

/** Audio lives in the persistent PET renderer, never in the ephemeral right-click menu.
 * The main process only opens trusted local MP3 files and returns their bytes; blob:
 * media playback remains same-origin so the WebAudio analyser cannot silently mute
 * cross-origin file:// content. No external streams or network URLs are supported.
 */
export function createLocalMusicPlayer(bridge:Bridge|undefined,{
 onBeat=()=>{},onLine=(_text:string)=>{}
}:{onBeat?:()=>void;onLine?:(text:string)=>void}={}){
 const audio=new Audio();
 audio.preload='auto';
 let tracks:string[]=[],index=0,volume=65,rhythmFire=false,repeat=false;
 let fileUrl:string|null=null,loadToken=0;
 let analyser:AnalyserNode|null=null,ctx:AudioContext|null=null;
 let bins:Uint8Array<ArrayBuffer>|null=null,frame=0;
 let lastShotAt=0,lastLoudLineAt=-Infinity;
 let error='';
 const beat=createBeatDetector();
 const snapshot=():MusicStatus=>({index,playing:!audio.paused&&!audio.ended,
  time:Number.isFinite(audio.currentTime)?Math.max(0,audio.currentTime):0,
  duration:Number.isFinite(audio.duration)?Math.max(0,audio.duration):0,
  volume,rhythmFire,repeat,error});
 const publish=()=>bridge?.musicStatus?.(snapshot());
 function revokeFile(){if(fileUrl){URL.revokeObjectURL(fileUrl);fileUrl=null;}}
 function stopBeatLoop(){if(frame)cancelAnimationFrame(frame);frame=0;}
 function beatLoop(){
  frame=0;
  if(audio.paused||!rhythmFire||!analyser||!bins)return;
  analyser.getByteFrequencyData(bins);
  const now=performance.now();
  if(now-lastShotAt>=11000&&beat.sample(bins,now)&&Math.random()<.35){
   lastShotAt=now;
   onBeat();
  }
  frame=requestAnimationFrame(beatLoop);
 }
 async function enableAnalysis(){
  if(!rhythmFire||!audio.src)return;
  try{
   if(!ctx){
    ctx=new AudioContext();
    analyser=ctx.createAnalyser();
    analyser.fftSize=1024;
    analyser.smoothingTimeConstant=.65;
    // Audio was loaded from a same-origin blob: URL. This is essential:
    // MediaElementAudioSourceNode otherwise may yield silence for local file://.
    const source=ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    bins=new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
   }
   if(ctx.state==='suspended')await ctx.resume();
   if(!audio.paused&&!frame)frame=requestAnimationFrame(beatLoop);
  }catch(e){
   rhythmFire=false;
   error='박자 감지를 시작할 수 없어요.';
   publish();
  }
 }
 function updateVolume(value:number,userChange=false){
  if(!Number.isFinite(value))return;
  volume=Math.max(0,Math.min(100,Math.round(value)));
  audio.volume=volume/100;
  if(userChange&&volume>=90&&Date.now()-lastLoudLineAt>60000){
   lastLoudLineAt=Date.now();onLine('시끄럽군.');
  }
  publish();
 }
 async function loadSong(selected:number,autoPlay=true){
  if(selected<0||selected>=tracks.length){error='MP3 파일을 먼저 추가해 줘.';publish();return;}
  const token=++loadToken;
  index=selected;
  stopBeatLoop();audio.pause();audio.removeAttribute('src');audio.load();revokeFile();
  beat.reset();error='';publish();
  try{
   const data=await bridge?.musicFile?.(selected);
   if(token!==loadToken)return;
   const raw=data?.bytes;
   const bytes=raw instanceof Uint8Array?raw:new Uint8Array(Array.isArray(raw)?raw:[]);
   if(!bytes.length)throw Error('empty or missing MP3');
   fileUrl=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'audio/mpeg'}));
   audio.src=fileUrl;audio.load();
   audio.volume=volume/100;
   if(autoPlay)await startPlay();
   else publish();
  }catch(e){
   if(token!==loadToken)return;
   error='이 MP3 파일을 열 수 없어요. 파일 위치와 형식을 확인해 줘.';
   publish();
  }
 }
 async function startPlay(){
  if(!tracks.length){error='MP3 파일을 먼저 추가해 줘.';publish();return;}
  if(!audio.src){await loadSong(Math.min(index,tracks.length-1));return;}
  try{
   error='';
   await audio.play();
   if(rhythmFire)await enableAnalysis();
   publish();
  }catch{
   error='재생을 시작하지 못했어요. MP3 파일을 다시 확인해 줘.';
   publish();
  }
 }
 async function step(delta:number,fromEnd=false){
  if(!tracks.length){publish();return;}
  const next=index+delta;
  if(next>=tracks.length){
   if(fromEnd&&!repeat){audio.pause();stopBeatLoop();publish();onLine('오늘은 여기까지다.');return;}
   await loadSong(0,true);return;
  }
  if(next<0){await loadSong(tracks.length-1,true);return;}
  await loadSong(next,true);
 }
 function setLibrary(next:string[]){
  const previous=tracks[index];
  tracks=Array.isArray(next)?next.filter(x=>typeof x==='string').slice(0,200):[];
  // If the playing item was removed or shifted, never keep its orphaned blob
  // alive under another track's title. Appending tracks preserves playback.
  if(index>=tracks.length||tracks[index]!==previous){
   loadToken++;audio.pause();audio.removeAttribute('src');audio.load();
   revokeFile();index=0;stopBeatLoop();beat.reset();
  }
  publish();
 }
 async function command(value:MusicCommand){
  if(!value||typeof value!=='object')return;
  switch(value.action){
   case 'init':
    setLibrary(value.tracks||[]);
    updateVolume(value.volume??65);
    rhythmFire=value.rhythmFire===true;repeat=value.repeat===true;
    index=Math.min(Math.max(0,value.index||0),Math.max(0,tracks.length-1));
    publish();return;
   case 'library':setLibrary(value.tracks||[]);return;
   case 'play':await startPlay();return;
   case 'pause':audio.pause();stopBeatLoop();publish();return;
   case 'stop':
    audio.pause();audio.currentTime=0;stopBeatLoop();publish();return;
   case 'previous':await step(-1);return;
   case 'next':await step(1);return;
   case 'select':
    if(Number.isInteger(value.index)&&typeof value.index==='number'&&value.index>=0&&value.index<tracks.length)await loadSong(value.index,true);
    return;
   case 'volume':updateVolume(value.volume??volume,true);return;
   case 'rhythm':
    rhythmFire=value.rhythmFire===true;
    beat.reset();
    if(!rhythmFire)stopBeatLoop();
    else if(!audio.paused)await enableAnalysis();
    publish();return;
   case 'repeat':repeat=value.repeat===true;publish();return;
  }
 }
 audio.addEventListener('timeupdate',publish);
 audio.addEventListener('loadedmetadata',publish);
 audio.addEventListener('play',()=>{publish();if(rhythmFire)void enableAnalysis();});
 audio.addEventListener('pause',()=>{stopBeatLoop();publish();});
 audio.addEventListener('ended',()=>{stopBeatLoop();void step(1,true);});
 audio.addEventListener('error',()=>{if(audio.src){error='선택한 MP3를 디코딩할 수 없어요.';publish();}});
 return {command,snapshot,dispose:()=>{
  loadToken++;stopBeatLoop();audio.pause();audio.removeAttribute('src');revokeFile();
  if(ctx)void ctx.close();
 }};
}
