import type { Character, PetState } from '../characters/akila';
import { createState } from './state';
import { playFrames } from './animation';
export function mountPet(root: HTMLElement, character: Character) {
  let stop = () => {};
  const render = (state: PetState) => {
    stop(); root.replaceChildren();
    const animation = character.animations[state];
    const placeholder = () => { const el = document.createElement('div'); el.className = 'placeholder'; el.textContent = `${character.name}\n이미지 준비 중`; root.replaceChildren(el); };
    if (!animation.frames.length) { placeholder(); return; }
    const image = document.createElement('img'); image.alt = character.name;
    image.onerror = placeholder; root.append(image);
    stop = playFrames(animation.frames, animation.frameDurationMs, frame => { image.src = frame; });
  };
  const state = createState(character.initialState, render); render(state.get());
  return state;
}
