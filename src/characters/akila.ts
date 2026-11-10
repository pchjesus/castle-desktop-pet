import dynamicApproved from './candidates/b-mustang-20261107/cleanup-v11/firing_dynamic.png';
import dualFiringApproved from './candidates/b-mustang-20261107/dual-firing-approved/dual_firing.png';
import idleApproved from './candidates/b-mustang-20261107/proportions-v07/idle.png';
import smokingApproved from './candidates/b-mustang-20261107/proportions-v07/smoking.png';
import sittingApproved from './candidates/b-mustang-20261107/proportions-v08/sitting.png';
import { outfitPolicy } from './outfits';
import { outfitFrames } from './outfit-loader.mjs';
export type PetState = 'idle' | 'smoking' | 'speaking' | 'drawing' | 'firing' | 'working' | 'dual_firing' | 'sitting' | 'firing_dynamic';
export const states: PetState[] = ['idle','smoking','speaking','drawing','firing','working','dual_firing','sitting','firing_dynamic'];
export interface Character { id:string; name:string; initialState:PetState; animations:Record<PetState,{frames:string[];frameDurationMs:number}>; dialogues:Record<string,string[]>; }
// The B pack is a technical derivative of the 2026-11-07 nine immutable canonical images.
const approvedB=import.meta.glob('./candidates/b-mustang-20261107/action-pack-v04/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const speakingB=import.meta.glob('./candidates/b-mustang-20261107/cleanup-v11/speaking-*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const sourceB=import.meta.glob('../../design/canonical/b-mustang-20261107/approved_visual_sources/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const get=(set:Record<string,string>,file:string)=>Object.entries(set).find(([path])=>path.endsWith('/'+file))?.[1];
const B:Record<PetState,string[]>={idle:[],smoking:[],speaking:[],drawing:[],firing:[],working:[],dual_firing:[],sitting:[],firing_dynamic:[]};
for(const state of ['drawing','firing','working'] as PetState[]) {
 const url=get(approvedB,state+'.png');if(url) B[state]=[url];
}
B.firing_dynamic=[dynamicApproved]; B.speaking=Array.from({length:7},(_,i)=>{const name='speaking-'+String(i+1).padStart(2,'0')+'.png';const url=get(speakingB,name);if(!url)throw new Error('Missing approved B speaking frame '+name);return url;}); B.dual_firing=[dualFiringApproved]; B.idle=[idleApproved]; B.smoking=[smokingApproved]; B.sitting=[sittingApproved];
// Seven full-body B-11 frames are user-approved; face-only original remains diagnostic.
// Firing Dynamic and Speaking B-11 are user-approved; dual firing retains its casing correction.
// Do not silently substitute legacy A-type frames for missing B motions.
export const outfitRegistry:Record<string,Record<string,string[]>>={
 blouson:Object.fromEntries(states.map(state=>[state,[]])),
 mustang:B,
};
export const originalFrames=(state:PetState)=>{const u=get(sourceB,state+'.png');return u?[u]:[];};
export const workingExitFrames:string[]=[];
export const revolverActionFrames:string[]=[];
const animation=(state:PetState)=>({frames:outfitFrames(outfitRegistry,outfitPolicy.active,state),frameDurationMs:500});
export const akila:Character={id:'akila',name:'아킬라',initialState:'smoking',animations:Object.fromEntries(states.map(state=>[state,animation(state)])) as Character['animations'],dialogues:{testPassed:['코딩 실력은 인정하지. 감탄했다, 오픈AI.'],jobStart:['남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.'],deploymentComplete:['여러모로... 나쁘지 않았다. 신입.']}};
