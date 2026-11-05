import type { Character, PetState } from '../characters/akila';
import { createState } from './state';
import { playFrames } from './animation';
import { startEffects } from './effects';
import { startWorking } from './working';
export function mountPet(root: HTMLElement, character: Character) {
  let stop = () => {};
  const render = (state: PetState) => {
    stop(); root.replaceChildren();
    const animation = character.animations[state];
    const isAkilaEffect = character.id === 'akila' && (state === 'idle' || state === 'smoking');
    const isWorking = character.id === 'akila' && state === 'working';
    const frames = (state === 'smoking' && isAkilaEffect || isWorking) && !animation.frames.length ? character.animations.idle.frames : animation.frames;
    const placeholder = () => { const el = document.createElement('div'); el.className = 'placeholder'; el.textContent = `${character.name}\n이미지 준비 중`; root.replaceChildren(el); };
    if (!frames.length) { placeholder(); return; }
    const image = document.createElement('img'); image.alt = character.name;
    image.onerror = placeholder;
    const stage = document.createElement('div'); stage.className = 'pet-stage'; stage.append(image);
    if (isAkilaEffect) { const ember = document.createElement('span'); ember.className = 'ember'; const smoke = document.createElement('span'); smoke.className = 'smoke'; stage.append(ember, smoke); }
    if (isWorking) { const laptop = document.createElement('div'); laptop.className = 'laptop'; laptop.setAttribute('aria-label', '노트북 작업 표시'); laptop.innerHTML = '<span class="laptop-screen"></span><span class="laptop-base"></span><span class="laptop-indicator"></span>'; stage.append(laptop); }
    root.append(stage);
    const stopFrames = playFrames(frames, animation.frameDurationMs, frame => { image.src = frame; });
    const stopWorking = isWorking ? startWorking(stage) : () => {};
    const stopEffects = isAkilaEffect ? startEffects(stage, state as 'idle' | 'smoking') : () => {};
    stop = () => { stopFrames(); stopEffects(); stopWorking(); };
  };
  const state = createState(character.initialState, render); render(state.get());
  return state;
}
