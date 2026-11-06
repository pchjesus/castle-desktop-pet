import { outfitPolicy } from './outfits';
import { outfitFrames } from './outfit-loader.mjs';
export type PetState = 'idle' | 'smoking' | 'speaking' | 'drawing' | 'firing' | 'working' | 'dual_firing';
export const states: PetState[] = ['idle', 'smoking', 'speaking', 'drawing', 'firing', 'working', 'dual_firing'];
export interface Character { id: string; name: string; initialState: PetState; animations: Record<PetState, { frames: string[]; frameDurationMs: number }>; dialogues: Record<string, string[]>; }
// PNG files placed in assets/akila/<state>/ are included at build time, in filename order.
const assets = import.meta.glob('./assets/akila/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const derived = import.meta.glob('./derived/akila/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const framesFor = (source: Record<string, string>, state: string) => Object.keys(source).filter(path => path.includes(`/${state}/`)).sort().map(path => source[path]);
const mustang = import.meta.glob('./derived/akila_mustang/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const outfitRegistry: Record<string, Record<string, string[]>> = { blouson: Object.fromEntries(states.map(state => [state, framesFor(derived, state)])), mustang: Object.fromEntries(states.map(state => [state, framesFor(mustang, state)])) };
export const originalFrames = (state: PetState) => framesFor(assets, state);
// Dedicated closing animation, separate from the perpetual Working typing loop.
export const workingExitFrames = framesFor(derived, 'working_exit');
// A-type approved-source single-revolver sequence (draw/aim/recoil/holster).
// Keep its key-pose limitations explicit; never replace source art in place.
export const revolverActionFrames = framesFor(derived, 'revolver_action');
const animation = (state: PetState) => ({ frames: outfitFrames(outfitRegistry, outfitPolicy.active, state), frameDurationMs: 500 });
export const akila: Character = { id:'akila', name:'아킬라', initialState:'idle', animations:{idle:animation('idle'), smoking:animation('smoking'), speaking:animation('speaking'), drawing:animation('drawing'), firing:animation('firing'), working:animation('working'), dual_firing:animation('dual_firing')}, dialogues:{testPassed:['코딩 실력은 인정하지. 감탄했다, 오픈AI.'], deploymentComplete:['남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.']} };
