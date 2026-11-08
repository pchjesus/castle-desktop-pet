export function playFrames(frames: string[], duration: number, show: (frame: string) => void, mode: 'loop' | 'hold' | 'once' = 'loop', complete: () => void = () => {}, reduceToFirst = false): () => void {
  let index = 0; let timer: ReturnType<typeof setTimeout> | undefined; let stopped = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => { clear(); if (stopped || document.hidden) return; timer = setTimeout(next, motion.matches ? 1000 : duration); };
  const next = () => { if (reduceToFirst && motion.matches) { if(mode === 'once') complete(); return; } if (index + 1 < frames.length) { show(frames[++index]); schedule(); } else if (mode === 'once') { complete(); } else if (mode === 'loop') { index = 0; show(frames[index]); schedule(); } };
  const update = () => { if (reduceToFirst && motion.matches && index !== 0) { index = 0; show(frames[0]); } if (document.hidden) clear(); else if (mode !== 'hold' || index < frames.length - 1) schedule(); };
  document.addEventListener('visibilitychange', update); motion.addEventListener('change', update);
  show(frames[0]); if (frames.length > 1 || mode === 'once') schedule();
  return () => { stopped = true; clear(); document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); };
}
