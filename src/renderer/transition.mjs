// The most recent requested state wins, including while the laptop exits.
// Reselecting Working cancels the fade immediately; a stale pending action must
// never fire afterward. Re-rendering restores the existing approved Working pose.
export function createTransition(render, leave, delay = 700) {
  let current;
  let pending;
  let timer;
  return function set(next) {
    if (timer) {
      pending = next;
      if (next === current) {
        clearTimeout(timer);
        timer = undefined;
        pending = undefined;
        render(current);
      }
      return;
    }
    if (current === next) return;
    const exit = current === 'working' && next !== 'working' ? leave() : false;
    if (exit) {
      pending = next;
      const exitDelay = typeof exit === 'number' && Number.isFinite(exit) && exit > 0 ? exit : delay;
      timer = setTimeout(() => {
        timer = undefined;
        const requested = pending;
        pending = undefined;
        if (requested !== current) {
          current = requested;
          render(current);
        }
      }, exitDelay);
      return;
    }
    current = next;
    render(next);
  };
}
