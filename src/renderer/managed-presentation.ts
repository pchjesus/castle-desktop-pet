import type {Character,PetState} from '../characters/akila';
import {playFrames} from './animation';
import {smokingLayer} from './smoking';

// Approved B images only. Retain the previous layer until the replacement is
// decoded; never introduce an opaque placeholder or a blank replacement frame.
export function mountManagedPet(root:HTMLElement,character:Character,initial:PetState){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const decoded=new Map<string,Promise<HTMLImageElement>>();
 const load=(url:string)=>{
  if(!decoded.has(url)){
   const image=new Image();image.alt=character.name;image.src=url;
   decoded.set(url,image.decode().then(()=>image));
  }
  return decoded.get(url)!;
 };
 for(const animation of Object.values(character.animations))for(const url of animation.frames)load(url).catch(()=>{});
 let state=initial,version=0,disposed=false,stopFrames=()=>{},stopLayout=()=>{};
 let stage:HTMLDivElement|undefined,exitTimer:ReturnType<typeof setTimeout>|undefined;
 let lifecycleHidden=false;
 let frameVersion=0,stopSmoke=()=>{};
 const report=(phase:string,pose:PetState,version:number)=>root.dispatchEvent(new CustomEvent('pet-render',{detail:{phase,pose,version}}));
 const syncSmoke=()=>{stopSmoke();stopSmoke=()=>{};if(stage?.dataset.pose==='smoking'&&!document.hidden&&!lifecycleHidden){const image=stage.querySelector('img');if(image)stopSmoke=smokingLayer(stage,image);}};
 const muzzlePoints:Partial<Record<PetState,number[][]>>={
  // Barrel/embedded flash coordinates in the approved source PNGs.
  firing:[[754/1024,490/1600]],dual_firing:[[92/1024,183/1536],[948/1024,299/1536]],
  firing_dynamic:[[672/1004,637/1567]]
 };
 function set(next:PetState){
  if(disposed)return;
  if(next===state&&stage?.dataset.pose===next&&!['speaking','firing','dual_firing','firing_dynamic','drawing'].includes(next)){const token=++version;report('requested',next,token);report('reused',next,token);syncSmoke();return;}
  state=next;const token=++version;++frameVersion;stopFrames();stopLayout();stopSmoke();
  report('requested',next,token);
  clearTimeout(exitTimer);for(const old of Array.from(root.querySelectorAll('[data-exiting]')))old.remove();
  root.dispatchEvent(new CustomEvent('pet-state',{detail:next}));
  const frames=character.animations[next].frames;
  if(!frames.length){report('failed',next,token);console.error('Approved B pose unavailable',next);return;}
  load(frames[0]).then(first=>{
   if(disposed||token!==version){report('superseded',next,token);return;}
   const previous=stage;
   const current=document.createElement('div');current.className='pet-stage b-presentation';current.dataset.pose=next;
   const image=first.cloneNode() as HTMLImageElement;current.append(image);
   if(previous){previous.dataset.exiting='true';previous.removeAttribute('data-pose');}
   stage=current;root.append(current);syncSmoke();report('rendered',next,token);
   // Preserve B-12 contain geometry and its bottom anchor.
   if(previous&&!motion.matches){current.classList.add('b-enter');previous.classList.add('b-exit');exitTimer=setTimeout(()=>previous.remove(),160);}
   else previous?.remove();
   const glows=(muzzlePoints[next]||[]).map(([x,y])=>{
    const glow=document.createElement('span');glow.className='b-muzzle-glow';glow.dataset.x=String(x);glow.dataset.y=String(y);current.append(glow);return glow;
   });
   const layout=()=>{
    const w=current.clientWidth,h=current.clientHeight,scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);
    const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
    for(const glow of glows){glow.style.left=`${(w-iw)/2+Number(glow.dataset.x)*iw}px`;glow.style.top=`${(h-ih)/2+Number(glow.dataset.y)*ih}px`;}
   };
   const observer=new ResizeObserver(layout);observer.observe(current);image.addEventListener('load',layout);layout();stopLayout=()=>{observer.disconnect();image.removeEventListener('load',layout);};
   const mode=next==='speaking'||muzzlePoints[next]?'once':'hold';
   const duration=next==='dual_firing'?2400:next==='speaking'?500:1500;
   stopFrames=playFrames(frames,duration,url=>{
    const fv=++frameVersion;
    load(url).then(ready=>{if(!disposed&&token===version&&fv===frameVersion)if(image.src!==ready.src)image.src=ready.src;}).catch(()=>{report('failed',next,token);console.error('Approved frame decode failed',next);});
   },mode,()=>{},next==='speaking');
  }).catch(()=>{report('failed',next,token);console.error('Approved pose decode failed',next);});
 }
 const visibility=()=>{root.classList.toggle('presentation-paused',document.hidden||lifecycleHidden);syncSmoke();};
 const reduce=()=>{syncSmoke();for(const old of Array.from(root.querySelectorAll('[data-exiting]')))old.remove();};
 const nativeVisibility=((event:CustomEvent)=>{lifecycleHidden=event.detail===true;visibility();}) as EventListener;
 root.addEventListener('pet-visibility',nativeVisibility);
 document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',reduce);
 set(initial);
 return {set,get:()=>state,dispose(){disposed=true;++version;++frameVersion;stopFrames();stopLayout();stopSmoke();clearTimeout(exitTimer);root.removeEventListener('pet-visibility',nativeVisibility);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',reduce);root.replaceChildren();}};
}
