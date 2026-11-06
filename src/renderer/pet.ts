import type { Character, PetState } from '../characters/akila';
import { createState } from './state';
import { playFrames } from './animation';
import { startEffects } from './effects';
import { startWorking } from './working';
import { createTransition } from './transition.mjs';
export function mountPet(root: HTMLElement, character: Character, getSpeed: () => number = () => 1) {
  let stop = () => {};
  const render = (state: PetState) => {
    stop(); root.replaceChildren(); root.dispatchEvent(new CustomEvent('pet-state', {detail: state}));
    const animation = character.animations[state];
    const isAkilaEffect = character.id === 'akila' && (state === 'idle' || state === 'smoking');
    const isWorking = character.id === 'akila' && state === 'working';
    // The old Working 001 keeps its source/derived PNG but cannot join this loop:
    // it changes laptop orientation. 002 and 003 edit only the typing fingertips
    // of the existing 000, so they can be cycled without moving face or laptop.
    const workingFrames = animation.frames.length >= 4
      ? [animation.frames[0], animation.frames[2], animation.frames[0], animation.frames[3]]
      : animation.frames.slice(0, 1);
    const frames = (state === 'smoking' && isAkilaEffect || isWorking) && !animation.frames.length
      ? character.animations.idle.frames
      : isWorking ? workingFrames
      : state === 'firing' ? animation.frames.slice(0, 1)
      : state === 'dual_firing' ? animation.frames.slice(1, 2)
      : animation.frames;
    const placeholder = () => { const el = document.createElement('div'); el.className = 'placeholder'; el.textContent = `${character.name}\n${state} 이미지 준비 중`; root.replaceChildren(el); };
    if (!frames.length) { placeholder(); return; }
    const image = document.createElement('img'); image.alt = character.name;
    image.onerror = placeholder;
    const stage = document.createElement('div'); stage.className = 'pet-stage'; stage.append(image);
    if (isAkilaEffect) { const ember = document.createElement('span'); ember.className = 'ember'; const smoke = document.createElement('span'); smoke.className = 'smoke'; stage.append(ember, smoke); }
    if (isWorking && !animation.frames.length) { const laptop = document.createElement('div'); laptop.className = 'laptop'; laptop.setAttribute('aria-label', '노트북 작업 표시'); laptop.innerHTML = '<span class="laptop-screen"></span><span class="laptop-base"></span><span class="laptop-indicator"></span>'; stage.append(laptop); }
    if ((state === 'firing' || state === 'dual_firing') && frames.length) {
      stage.classList.add(state === 'firing' ? 'single-action' : 'dual-action');
      stage.style.setProperty('--action-duration', `${(state === 'firing' ? 1.5 : 2.4) / getSpeed()}s`);
      for (const side of state === 'firing' ? ['single'] : ['left', 'right']) { const flash = document.createElement('span'); flash.className = `muzzle muzzle-${side}`; stage.append(flash); }
    }
    const visibility = () => stage.classList.toggle('action-paused', document.hidden);
    document.addEventListener('visibilitychange', visibility); visibility();
    root.append(stage);
    const mode = state === 'firing' || state === 'dual_firing' ? 'once' : state === 'drawing' ? 'hold' : 'loop';
    const reduced = isWorking ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const stopFrames = playFrames(frames, (state === 'working' ? (frames.length > 1 ? 300 : 3000) : state === 'firing' ? 1500 : state === 'dual_firing' ? 2400 : animation.frameDurationMs) / getSpeed(), frame => {
      image.src = reduced?.matches ? frames[0] : frame;
    }, mode, () => { stateController.set('idle'); });
    const stopWorking = isWorking ? startWorking(stage, frames[0]) : () => {};
    const stopEffects = isAkilaEffect ? startEffects(stage, state as 'idle' | 'smoking') : () => {};
    stop = () => { stopFrames(); stopEffects(); stopWorking(); document.removeEventListener('visibilitychange', visibility); };
  };
  const transition = createTransition(render, () => {
    const stage = root.querySelector<HTMLElement>('.pet-stage');
    if (!stage || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    stage.classList.remove('working-active'); stage.classList.add('working-exit');
    return true;
  });
  const stateController = createState(character.initialState, transition); transition(stateController.get());
  return stateController;
}
