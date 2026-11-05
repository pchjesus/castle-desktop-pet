import { akila, type PetState } from './characters/akila';
import './style.css';
const root = document.querySelector<HTMLDivElement>('#app')!;
let state: PetState = akila.initialState;
let timer: ReturnType<typeof setInterval> | undefined;
function render() {
  if (timer) clearInterval(timer);
  const animation = akila.animations[state];
  root.replaceChildren();
  if (!animation.frames.length) { const placeholder = document.createElement('div'); placeholder.className = 'placeholder'; placeholder.textContent = `${akila.name}\n이미지 준비 중`; root.append(placeholder); return; }
  const image = document.createElement('img'); image.alt = akila.name; let frame = 0; image.src = animation.frames[frame]; root.append(image);
  if (animation.frames.length > 1) timer = setInterval(() => { frame = (frame + 1) % animation.frames.length; image.src = animation.frames[frame]; }, animation.frameDurationMs);
}
export function setState(next: PetState) { state = next; render(); }
render();
