import {akila,type PetState} from './characters/akila';
import {mountPet} from './renderer/pet';
import {installPetMouse} from './renderer/mouse-interaction';
import {createBehavior,normalizeSettings} from './behavior/controller.mjs';
import './style.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
const params=new URL(location.href).searchParams;
let queryWeights;
try{const value=JSON.parse(params.get('weights')||'null');if(value&&typeof value==='object'&&!Array.isArray(value))queryWeights=value;}catch{}
const settings=normalizeSettings({base:params.get('base'),autonomy:params.get('autonomy')!=='false',autoFire:params.get('autoFire')!=='false',movementFrequency:params.get('movementFrequency'),dialogueEnabled:params.has('dialogueEnabled')?params.get('dialogueEnabled')!=='false':undefined,dialogueFrequency:params.get('dialogueFrequency'),actionWeights:queryWeights});
const livePet=mountPet(root,akila,()=>1,{managed:true,initialState:settings.base});
const bubble=document.createElement('div');bubble.id='pet-speech';bubble.hidden=true;bubble.setAttribute('role','status');document.body.append(bubble);
// Native speech has its own transparent bounds; the pet's saved bounds never grow.
const nativeSpeech=typeof window.pet?.showSpeech==='function';
bubble.dataset.native=String(nativeSpeech);
document.body.style.visibility='visible';
let manualId=0,manualCallActive=false,renderContext={source:'base',commandId:0};
const pendingRenders=new Map<number,typeof renderContext>();
function trace(value:Record<string,unknown>){window.pet?.reportAction?.(value);root.dispatchEvent(new CustomEvent('pet-qa',{detail:value}));}
root.addEventListener('pet-render',((event:CustomEvent)=>{
 const value=event.detail;
 if(value.phase==='requested'){pendingRenders.set(value.version,{...renderContext});if(pendingRenders.size>32)pendingRenders.delete(pendingRenders.keys().next().value!);}
 const context=pendingRenders.get(value.version)||{source:'base',commandId:0};
 trace({...value,...context});
}) as EventListener);
const behavior=createBehavior({settings,render:(pose,context)=>{renderContext={source:context?.source||'base',commandId:manualCallActive||context?.source==='manual'?manualId:0};livePet.set(pose)},speak:(text,record)=>{bubble.textContent=text;bubble.hidden=!text||nativeSpeech;bubble.dataset.dialogue=record?.id||'';if(nativeSpeech)window.pet!.showSpeech!(text);},reduced:()=>matchMedia('(prefers-reduced-motion: reduce)').matches});
installPetMouse(root,{click:()=>{manualId=0;behavior.click()},dragStart:()=>{manualId=0;behavior.drag()},dragEnd:behavior.dragEnd});
const permitted=new Set<PetState>(['idle','smoking','working','drawing','firing','sitting','dual_firing','firing_dynamic','speaking']);
let suspended=false;
const nativeWindow=window.pet?.nativeWindow===true;
const effectivelyHidden=()=>suspended||(!nativeWindow&&document.hidden);
function updateVisibility(){const hidden=effectivelyHidden();root.dispatchEvent(new CustomEvent('pet-visibility',{detail:hidden}));behavior.visibility(hidden);}
function manual(pose:PetState,id=0){manualId=id;trace({phase:'received',pose,commandId:id,documentHidden:document.hidden,suspended});manualCallActive=true;let accepted;try{accepted=behavior.manual(pose);}finally{manualCallActive=false;}trace({phase:accepted?'accepted':'blocked',pose,commandId:id,hidden:behavior.snapshot().hidden});}
const unsubscribe=window.pet?.onAction((state)=>{
 if(typeof state==='object'&&state?.kind==='windows-event'){
  behavior.windowsNotification?.(state.name);return;
 }
 if(typeof state==='object'&&state?.kind==='manual'&&Number.isSafeInteger(state.id)&&permitted.has(state.pose as PetState)){manual(state.pose as PetState,state.id);return;}
 if(typeof state!=='string')return;
 if(state==='system:suspend'){suspended=true;updateVisibility();return;}
 if(state==='system:resume'){suspended=false;updateVisibility();return;}
 if(state.startsWith('settings:')){try{behavior.configure(JSON.parse(state.slice(9)));}catch{}return;}
 if(permitted.has(state as PetState)) manual(state as PetState);
});
document.addEventListener('visibilitychange',updateVisibility);
window.addEventListener('pagehide',()=>{behavior.dispose();livePet.dispose();unsubscribe?.();});
