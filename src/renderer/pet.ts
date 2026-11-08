import { outfitPolicy } from '../characters/outfits';
import { workingExitFrames, revolverActionFrames, type Character, type PetState } from '../characters/akila';
import { createState } from './state';
import { playFrames } from './animation';
import { startEffects } from './effects';
import { startWorking } from './working';
import { createTransition } from './transition.mjs';
export function mountPet(root: HTMLElement, character: Character, getSpeed: () => number = () => 1) {
  let stop = () => {};
  let previousRenderedState: PetState | undefined;
  const render = (state: PetState) => {
    const priorState = previousRenderedState;
    // The prior Drawing state may still be taking the gun out. Only skip the
    // draw lead-in when its actual rendered aim pose has been reached.
    const priorDrawingFrame = root.querySelector<HTMLElement>('.pet-stage')?.dataset.drawFrame;
    previousRenderedState = state;
    stop(); root.replaceChildren(); root.dispatchEvent(new CustomEvent('pet-state', {detail: state}));
    const animation = character.animations[state];
    const isAkilaEffect = character.id === 'akila' && outfitPolicy.active !== 'mustang' && (state === 'idle' || state === 'smoking');
    const isWorking = character.id === 'akila' && state === 'working';
    const hasRevolverArt = character.id === 'akila' && outfitPolicy.active !== 'mustang' && revolverActionFrames.length === 7;
    const isRevolverFiring = hasRevolverArt && state === 'firing';
    const isRevolverDrawing = hasRevolverArt && state === 'drawing';
    const fromDrawnAim = isRevolverFiring && priorState === 'drawing' &&
      (priorDrawingFrame === '2' || matchMedia('(prefers-reduced-motion: reduce)').matches);
    const reduced = (isWorking || isRevolverFiring || isRevolverDrawing)
      ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    // The old Working 001 keeps its source/derived PNG but cannot join this loop:
    // it changes laptop orientation. 002 and 003 edit only the typing fingertips
    // of the existing 000, so they can be cycled without moving face or laptop.
    const workingFrames = animation.frames.length >= 4
      ? [animation.frames[0], animation.frames[2], animation.frames[0], animation.frames[3]]
      : animation.frames.slice(0, 1);
    const revolverSequence = fromDrawnAim
      ? revolverActionFrames.slice(2) : revolverActionFrames;
    const frames = (state === 'smoking' && isAkilaEffect || isWorking) && !animation.frames.length
      ? character.animations.idle.frames
      : isWorking ? workingFrames
      : isRevolverFiring
        ? reduced?.matches ? revolverActionFrames.slice(2, 3) : revolverSequence
      : isRevolverDrawing
        ? reduced?.matches ? revolverActionFrames.slice(2, 3) : revolverActionFrames.slice(0, 3)
      : state === 'firing' ? animation.frames.slice(0, 1)
      : state === 'dual_firing' ? animation.frames.slice(outfitPolicy.active === 'mustang' ? 0 : 1, outfitPolicy.active === 'mustang' ? 1 : 2)
      : animation.frames;
    const placeholder = () => { const el = document.createElement('div'); el.className = 'placeholder'; el.textContent = `${character.name}\n${state} 이미지 준비 중`; root.replaceChildren(el); };
    if (!frames.length) { placeholder(); return; }
    const image = document.createElement('img'); image.alt = character.name;
    image.onerror = placeholder;
    const stage = document.createElement('div'); stage.className = 'pet-stage'; stage.append(image);
    if (isWorking && frames.length > 1) stage.dataset.workingMotion = 'fingertips-only';
    if (isRevolverFiring) {
      stage.dataset.actionMode = reduced?.matches ? 'reduced-still' : 'revolver-frames';
      stage.dataset.actionEntry = fromDrawnAim ? 'already-drawn' : 'full';
    }
    if (isRevolverDrawing) stage.dataset.drawMode = 'three-key-poses';
    if (isAkilaEffect) { const ember = document.createElement('span'); ember.className = 'ember'; const smoke = document.createElement('span'); smoke.className = 'smoke'; stage.append(ember, smoke); }
    if (isWorking && !animation.frames.length) { const laptop = document.createElement('div'); laptop.className = 'laptop'; laptop.setAttribute('aria-label', '노트북 작업 표시'); laptop.innerHTML = '<span class="laptop-screen"></span><span class="laptop-base"></span><span class="laptop-indicator"></span>'; stage.append(laptop); }
    if (outfitPolicy.active !== 'mustang' && (state === 'firing' || state === 'dual_firing') && frames.length) {
      stage.classList.add(state === 'firing' ? 'single-action' : 'dual-action');
      const actionSeconds = isRevolverFiring && !reduced?.matches
        ? (frames.length * 0.19) : state === 'firing' ? 1.5 : 2.4;
      stage.style.setProperty('--action-duration', `${actionSeconds / Math.max(getSpeed(), 0.2)}s`);
      for (const side of state === 'firing' ? ['single'] : ['left', 'right']) { const flash = document.createElement('span'); flash.className = `muzzle muzzle-${side}`; stage.append(flash); }
    }
    const visibility = () => stage.classList.toggle('action-paused', document.hidden);
    document.addEventListener('visibilitychange', visibility); visibility();
    root.append(stage);
    const mode = state === 'firing' || state === 'dual_firing' ? 'once' : state === 'drawing' ? 'hold' : 'loop';
    const frameMs = state === 'working' ? (frames.length > 1 ? 300 : 3000)
      : isRevolverFiring ? 190
      : isRevolverDrawing ? 320
      : state === 'firing' ? 1500
      : state === 'dual_firing' ? 2400 : animation.frameDurationMs;
    let actionFrameIndex = 0;
    const stopFrames = playFrames(frames, frameMs / Math.max(getSpeed(), 0.2), frame => {
      image.src = reduced?.matches ? frames[0] : frame;
      if (isRevolverFiring) stage.dataset.actionFrame = String(actionFrameIndex++);
      if (isRevolverDrawing) stage.dataset.drawFrame = String(actionFrameIndex++);
    }, mode, () => { stateController.set('idle'); });
    const stopWorking = isWorking && outfitPolicy.active !== 'mustang' ? startWorking(stage, frames[0]) : () => {};
    const stopEffects = isAkilaEffect ? startEffects(stage, state as 'idle' | 'smoking') : () => {};
    stop = () => { stopFrames(); stopEffects(); stopWorking(); document.removeEventListener('visibilitychange', visibility); };
  };
  const transition = createTransition(render, () => {
    const stage = root.querySelector<HTMLElement>('.pet-stage');
    if (!stage || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const image = stage.querySelector<HTMLImageElement>('img');
    if (character.id === 'akila' && image && workingExitFrames.length === 7) {
      // Cancel the infinite keyboard loop. The working pose itself remains on
      // screen while the dedicated 7-frame exit finishes (including Idle).
      // Any Working re-selection cancels these timers via render()->stop().
      stop();
      stage.classList.remove('working-active');
      stage.classList.add('working-exit');
      stage.dataset.exitMode = 'frames';
      stage.dataset.exitFrame = '0';
      image.src = workingExitFrames[0];
      const duration = 700 / Math.max(getSpeed(), 0.2);
      const timers: ReturnType<typeof setTimeout>[] = [];
      for (let i = 1; i < workingExitFrames.length; i++) {
        timers.push(setTimeout(() => {
          if (!stage.isConnected) return;
          image.src = workingExitFrames[i];
          stage.dataset.exitFrame = String(i);
        }, (duration * i) / workingExitFrames.length));
      }
      stop = () => { for (const timer of timers) clearTimeout(timer); };
      return duration;
    }
    stage.classList.remove('working-active');
    stage.classList.add('working-exit');
    return true;
  });
  const stateController = createState(character.initialState, transition); transition(stateController.get());
  return stateController;
}
