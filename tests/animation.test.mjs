import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const code = await readFile(new URL('../src/renderer/animation.ts', import.meta.url), 'utf8');
const { code: js } = await transform(code, {loader:'ts', format:'esm'});
const { playFrames } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
class Target extends EventTarget { hidden = false; matches = false; }
const doc = new Target(), media = new Target();
globalThis.document = doc; globalThis.matchMedia = () => media;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
test('one-shot finishes once and releases events on cleanup', async () => {
 let count = 0; const shown = [];
 const stop = playFrames(['aim'], 10, f => shown.push(f), 'once', () => count++);
 await wait(30); stop(); doc.dispatchEvent(new Event('visibilitychange')); await wait(20);
 assert.equal(count, 1); assert.deepEqual(shown, ['aim']);
});
test('interrupted playback never completes and hidden playback resumes', async () => {
 let count = 0; doc.hidden = true;
 const stop = playFrames(['aim'], 10, () => {}, 'once', () => count++);
 await wait(20); assert.equal(count, 0); doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
 await wait(25); assert.equal(count, 1); stop();
 const cancel = playFrames(['aim'], 10, () => {}, 'once', () => count++); cancel(); await wait(20); assert.equal(count, 1);
});
test('speaking interruption and reduced motion do not advance stale frames', async () => {
 const shown=[];let completed=0;media.matches=false;
 const stop=playFrames(['one','two','three'],15,f=>shown.push(f),'once',()=>completed++,true);
 await wait(25);assert(shown.includes('two'));
 media.matches=true;media.dispatchEvent(new Event('change'));assert.equal(shown.at(-1),'one');
 await wait(50);assert.equal(shown.at(-1),'one');stop();media.matches=false;media.dispatchEvent(new Event('change'));
 await wait(50);assert.equal(completed,0);
});
