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
    if (current === 'working' && next !== 'working' && leave()) {
      pending = next;
      timer = setTimeout(() => {
        timer = undefined;
        const requested = pending;
        pending = undefined;
        if (requested !== current) {
          current = requested;
          render(current);
        }
      }, delay);
      return;
    }
    current = next;
    render(next);
  };
}
