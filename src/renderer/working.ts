// The only animated pixels in Working are two fingers: the approved pose stays
// completely still when reduced motion is requested.
export function startWorking(stage: HTMLElement, approvedFrame?: string) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    stage.classList.toggle('working-active', !document.hidden && !reduced.matches);
    if (reduced.matches && approvedFrame) {
      const image = stage.querySelector('img');
      if (image) image.src = approvedFrame;
    }
  };
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  update();
  return () => {
    stage.classList.remove('working-active');
    document.removeEventListener('visibilitychange', update);
    reduced.removeEventListener('change', update);
  };
}
