import {createBeatDetector} from './beat-detector.mjs';
import {createVolumeDialogue} from './volume-dialogue.mjs';

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
 * The main process exposes only ticketed local MP3 byte-range streams (no
 * disk paths or full-file IPC copies). CORS-enabled local media lets the WebAudio
 * analyser hear the track. No HTTP server, upload, or external network.
 */
export function createLocalMusicPlayer(bridge:Bridge|undefined,{
 onBeat=()=>{},onLine=(_text:string)=>{}
}:{onBeat?:()=>void;onLine?:(text:string)=>void}={}){
 const audio=new Audio();
 audio.crossOrigin='anonymous'; // Enables WebAudio analysis of the local ticketed scheme.
 audio.preload='metadata';
 let tracks:string[]=[],index=0,volume=65,rhythmFire=false,repeat=false;
 let loadToken=0;
 let analyser:AnalyserNode|null=null,ctx:AudioContext|null=null;
 let bins:Uint8Array<ArrayBuffer>|null=null,frame=0;
 let lastShotAt=0;
 const volumeDialogue=createVolumeDialogue();
 let error='';
 const beat=createBeatDetector();
 const snapshot=():MusicStatus=>({index,playing:!audio.paused&&!audio.ended,
  time:Number.isFinite(audio.currentTime)?Math.max(0,audio.currentTime):0,
  duration:Number.isFinite(audio.duration)?Math.max(0,audio.duration):0,
  volume,rhythmFire,repeat,error});
 const publish=()=>bridge?.musicStatus?.(snapshot());
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
    // Local protocol responses include explicit CORS headers for WebAudio.
    // Without these, cross-origin media source analysis may yield silence.
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
  const previous=volume;
  volume=Math.max(0,Math.min(100,Math.round(value)));
  audio.volume=volume/100;
  // Initialization and decreases never trigger speech. Each band has an
  // independent 60-second cooldown; 80% takes precedence over 50%.
  const reaction=userChange?volumeDialogue(previous,volume):null;
  if(reaction)onLine(reaction);
  publish();
 }
 async function loadSong(selected:number,autoPlay=true){
  if(selected<0||selected>=tracks.length){error='MP3 파일을 먼저 추가해 줘.';publish();return;}
  const token=++loadToken;
  index=selected;
  stopBeatLoop();audio.pause();audio.removeAttribute('src');audio.load();
  beat.reset();error='';publish();
  try{
   const mediaUrl=await bridge?.musicUrl?.(selected);
   if(token!==loadToken)return;
   if(typeof mediaUrl!=='string'||!/^castle-mp3:\/\/track\/[a-f0-9]{48}$/.test(mediaUrl))throw Error('invalid local MP3 ticket');
   audio.src=mediaUrl;audio.load();
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
   index=0;stopBeatLoop();beat.reset();
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
  loadToken++;stopBeatLoop();audio.pause();audio.removeAttribute('src');audio.load();
  if(ctx)void ctx.close();
 }};
}
