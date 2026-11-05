export function startWorking(stage: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => stage.classList.toggle('working-active', !document.hidden && !reduced.matches);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  update();
  return () => { stage.classList.remove('working-active'); document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); };
}
