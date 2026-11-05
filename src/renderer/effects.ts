export function startEffects(container: HTMLElement, mode: 'idle' | 'smoking') {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let effectTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const clear = () => { clearTimeout(timer); clearTimeout(effectTimer); container.classList.remove('breathing', 'puff'); };
  const schedule = () => {
    clear();
    if (disposed || document.hidden || motion.matches) return;
    container.classList.add('breathing');
    timer = setTimeout(() => {
      container.classList.add('puff');
      effectTimer = setTimeout(() => { container.classList.remove('puff'); schedule(); }, 2600);
    }, mode === 'idle' ? 30000 + Math.random() * 30000 : 4000);
  };
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  schedule();
  return () => { disposed = true; clear(); document.removeEventListener('visibilitychange', schedule); motion.removeEventListener('change', schedule); };
}
