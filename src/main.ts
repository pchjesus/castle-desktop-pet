import {akila,type PetState} from './characters/akila';
import {mountPet} from './renderer/pet';
import {installPetMouse} from './renderer/mouse-interaction';
import {createBehavior,normalizeSettings} from './behavior/controller.mjs';
import './style.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
const params=new URL(location.href).searchParams;
const settings=normalizeSettings({base:params.get('base'),autonomy:params.get('autonomy')!=='false',autoFire:params.get('autoFire')!=='false'});
const livePet=mountPet(root,akila,()=>1,{managed:true,initialState:settings.base});
const bubble=document.createElement('div');bubble.id='pet-speech';bubble.hidden=true;bubble.setAttribute('role','status');document.body.append(bubble);
// Native speech has its own transparent bounds; the pet's saved bounds never grow.
const nativeSpeech=typeof window.pet?.showSpeech==='function';
bubble.dataset.native=String(nativeSpeech);
document.body.style.visibility='visible';
const behavior=createBehavior({settings,render:pose=>livePet.set(pose),speak:(text,record)=>{bubble.textContent=text;bubble.hidden=!text||nativeSpeech;bubble.dataset.dialogue=record?.id||'';if(nativeSpeech)window.pet!.showSpeech!(text);},reduced:()=>matchMedia('(prefers-reduced-motion: reduce)').matches});
installPetMouse(root,{click:behavior.click,dragStart:behavior.drag,dragEnd:behavior.dragEnd});
const permitted=new Set<PetState>(['idle','smoking','working','drawing','firing','sitting','dual_firing','firing_dynamic','speaking']);
let suspended=false;
const unsubscribe=window.pet?.onAction((state:string)=>{
 if(typeof state!=='string')return;
 if(state==='system:suspend'){suspended=true;behavior.visibility(true);return;}
 if(state==='system:resume'){suspended=false;behavior.visibility(document.hidden);return;}
 if(state.startsWith('settings:')){try{behavior.configure(JSON.parse(state.slice(9)));}catch{}return;}
 if(permitted.has(state as PetState)) behavior.manual(state);
});
document.addEventListener('visibilitychange',()=>behavior.visibility(suspended||document.hidden));
window.addEventListener('pagehide',()=>{behavior.dispose();livePet.dispose();unsubscribe?.();});
