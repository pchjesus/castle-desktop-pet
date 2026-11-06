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
    const frames = (state === 'smoking' && isAkilaEffect || isWorking) && !animation.frames.length ? character.animations.idle.frames : isWorking ? animation.frames.slice(0, 1) : animation.frames;
    const placeholder = () => { const el = document.createElement('div'); el.className = 'placeholder'; el.textContent = `${character.name}\n${state} 이미지 준비 중`; root.replaceChildren(el); };
    if (!frames.length) { placeholder(); return; }
    const image = document.createElement('img'); image.alt = character.name;
    image.onerror = placeholder;
    const stage = document.createElement('div'); stage.className = 'pet-stage'; stage.append(image);
    if (isAkilaEffect) { const ember = document.createElement('span'); ember.className = 'ember'; const smoke = document.createElement('span'); smoke.className = 'smoke'; stage.append(ember, smoke); }
    if (isWorking && !animation.frames.length) { const laptop = document.createElement('div'); laptop.className = 'laptop'; laptop.setAttribute('aria-label', '노트북 작업 표시'); laptop.innerHTML = '<span class="laptop-screen"></span><span class="laptop-base"></span><span class="laptop-indicator"></span>'; stage.append(laptop); }
    root.append(stage);
    const mode = state === 'firing' || state === 'dual_firing' ? 'once' : state === 'drawing' ? 'hold' : 'loop';
    const stopFrames = playFrames(frames, (state === 'working' ? 3000 : animation.frameDurationMs) / getSpeed(), frame => { image.src = frame; }, mode, () => { stateController.set('idle'); });
    const stopWorking = isWorking ? startWorking(stage) : () => {};
    const stopEffects = isAkilaEffect ? startEffects(stage, state as 'idle' | 'smoking') : () => {};
    stop = () => { stopFrames(); stopEffects(); stopWorking(); };
  };
  const transition = createTransition(render, () => {
    const stage = root.querySelector<HTMLElement>('.pet-stage');
    if (!stage || !stage.querySelector('.laptop') || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    stage.classList.remove('working-active'); stage.classList.add('working-exit');
    return true;
  });
  const stateController = createState(character.initialState, transition); transition(stateController.get());
  return stateController;
}
