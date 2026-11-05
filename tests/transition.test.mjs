import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { createTransition } from '../src/renderer/transition.mjs';
test('latest state wins during working exit', async () => {
  const shown = []; let exits = 0;
  const set = createTransition(state => shown.push(state), () => { exits++; return true; }, 10);
  set('working'); set('idle'); set('smoking');
  await new Promise(resolve => setTimeout(resolve, 30));
  deepStrictEqual(shown, ['working', 'smoking']); deepStrictEqual(exits, 1);
});
test('reduced motion or hidden window switches immediately', () => {
  const shown = []; const set = createTransition(state => shown.push(state), () => false);
  set('working'); set('idle'); deepStrictEqual(shown, ['working', 'idle']);
});
