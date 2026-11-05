// The most recent requested state wins, including while the laptop exits.
export function createTransition(render, leave, delay = 700) {
  let current;
  let pending;
  let timer;
  return function set(next) {
    pending = next;
    if (timer) return;
    if (current === 'working' && next !== 'working' && leave()) {
      timer = setTimeout(() => { timer = undefined; current = pending; render(current); }, delay);
      return;
    }
    if (current !== next) { current = next; render(next); }
  };
}
