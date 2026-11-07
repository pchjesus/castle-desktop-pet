import { outfitPolicy } from './outfits';
import { outfitFrames } from './outfit-loader.mjs';
export type PetState = 'idle' | 'smoking' | 'speaking' | 'drawing' | 'firing' | 'working' | 'dual_firing' | 'sitting' | 'firing_dynamic';
export const states: PetState[] = ['idle','smoking','speaking','drawing','firing','working','dual_firing','sitting','firing_dynamic'];
export interface Character { id:string; name:string; initialState:PetState; animations:Record<PetState,{frames:string[];frameDurationMs:number}>; dialogues:Record<string,string[]>; }
// The B pack is a technical derivative of the 2026-11-07 nine immutable canonical images.
const approvedB=import.meta.glob('./candidates/b-mustang-20261107/action-pack-v04/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const sourceB=import.meta.glob('../../design/canonical/b-mustang-20261107/approved_visual_sources/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const get=(set:Record<string,string>,file:string)=>Object.entries(set).find(([path])=>path.endsWith('/'+file))?.[1];
const B:Record<PetState,string[]>=Object.fromEntries(states.map(state=>[state,[]])) as Record<PetState,string[]>;
for(const state of ['idle','smoking','drawing','firing','working','sitting'] as PetState[]) {
 const url=get(approvedB,state+'.png');if(url) B[state]=[url];
}
// Speaking face-only crops are not valid full-body desktop sprites.
// The two JPEG-derived action poses remain visually blocked or unapproved.
// Do not silently substitute legacy A-type frames for missing B motions.
export const outfitRegistry:Record<string,Record<string,string[]>>={
 blouson:Object.fromEntries(states.map(state=>[state,[]])),
 mustang:B,
};
export const originalFrames=(state:PetState)=>{const u=get(sourceB,state+'.png');return u?[u]:[];};
export const workingExitFrames:string[]=[];
export const revolverActionFrames:string[]=[];
const animation=(state:PetState)=>({frames:outfitFrames(outfitRegistry,outfitPolicy.active,state),frameDurationMs:500});
export const akila:Character={id:'akila',name:'아킬라',initialState:'idle',animations:Object.fromEntries(states.map(state=>[state,animation(state)])) as Character['animations'],dialogues:{testPassed:['코딩 실력은 인정하지. 감탄했다, 오픈AI.'],deploymentComplete:['남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.']}};
