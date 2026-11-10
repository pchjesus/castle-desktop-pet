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
test('working exit chooses latest firing action without overlapping exits', async () => {
  const shown = []; let exits = 0;
  const set = createTransition(state => shown.push(state), () => { exits++; return true; }, 10);
  set('working'); set('firing'); set('dual_firing');
  await new Promise(resolve => setTimeout(resolve, 30));
  deepStrictEqual(shown, ['working', 'dual_firing']); deepStrictEqual(exits, 1);
});
test('drawing can transition to firing', () => {
  const shown = []; const set = createTransition(state => shown.push(state), () => false);
  set('drawing'); set('firing'); deepStrictEqual(shown, ['drawing', 'firing']);
});

test('reselecting working cancels the exit rather than applying a stale firing request', async () => {
  const shown = []; let exits = 0;
  const set = createTransition(state => shown.push(state), () => { exits++; return true; }, 20);
  set('working');
  set('firing');
  set('working');
  deepStrictEqual(shown, ['working', 'working']); // active pose is restored immediately
  await new Promise(resolve => setTimeout(resolve, 45));
  deepStrictEqual(shown, ['working', 'working']); // no delayed stale firing or Idle
  deepStrictEqual(exits, 1);
});

test('working can exit again after a cancelled exit and latest request still wins', async () => {
  const shown = [];
  const set = createTransition(state => shown.push(state), () => true, 20);
  set('working');
  set('firing');
  set('working');
  set('drawing');
  set('dual_firing');
  await new Promise(resolve => setTimeout(resolve, 45));
  deepStrictEqual(shown, ['working', 'working', 'dual_firing']);
});

test('custom Working exit duration is respected before latest pending state renders', async () => {
  const shown = [];
  const set = createTransition(state => shown.push(state), () => 35, 5);
  set('working');
  set('drawing');
  await new Promise(resolve => setTimeout(resolve, 12));
  deepStrictEqual(shown, ['working']);
  set('firing');
  await new Promise(resolve => setTimeout(resolve, 35));
  deepStrictEqual(shown, ['working', 'firing']);
});

test('Working reselect cancels a customized exit timer and future actions', async () => {
  const shown = [];
  const set = createTransition(state => shown.push(state), () => 30, 5);
  set('working');
  set('firing');
  set('working');
  await new Promise(resolve => setTimeout(resolve, 45));
  deepStrictEqual(shown, ['working', 'working']);
});
test('repeated Speaking requests do not restart or overlap the active state', () => {
  const shown = []; const set = createTransition(state => shown.push(state), () => false);
  set('idle'); set('speaking'); set('speaking'); set('firing_dynamic'); set('idle');
  deepStrictEqual(shown, ['idle','speaking','firing_dynamic','idle']);
});
