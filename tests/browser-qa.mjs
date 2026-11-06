import assert from 'node:assert/strict';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const out = resolve('artifacts/visual-qa');
mkdirSync(out, { recursive: true });
const server = createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/preview.html') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  createReadStream('preview.html').pipe(res);
});
await new Promise(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
const address = server.address();
assert(address && typeof address === 'object');
let browser;
const errors = [];
const results = [];
const record = (name, result) => results.push({ name, ...result });
const pause = ms => new Promise(r => setTimeout(r, ms));
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 950 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('requestfailed', req => errors.push('requestfailed: ' + req.url() + ': ' + req.failure()?.errorText));
  await page.goto('http://127.0.0.1:' + address.port + '/preview.html', { waitUntil: 'load', timeout: 60000 });
  await page.locator('#pet .pet-stage img').waitFor({ timeout: 30000 });

  async function loaded(label) {
    const image = page.locator('#pet .pet-stage img');
    await image.waitFor({ timeout: 8000 });
    await page.waitForFunction(() => {
      const img = document.querySelector('#pet .pet-stage img');
      return img && img.complete && img.naturalWidth > 0;
    }, null, { timeout: 15000 });
    const info = await image.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }));
    assert(info.width > 0 && info.height > 0, label + ' failed image loading');
    return info;
  }

  async function idle() {
    await page.locator('#state').selectOption('idle');
    await loaded('idle');
    await pause(780); // Working has a 700ms exit transition.
  }

  async function snapshot(name) {
    await page.locator('#desktop').screenshot({ path: resolve(out, name + '.png'), animations: 'allow' });
  }

  for (const size of [180, 240, 360]) {
    await page.locator('#size').selectOption(String(size));
    await idle();
    const bounds = await page.locator('#pet').boundingBox();
    const desk = await page.locator('#desktop').boundingBox();
    assert(bounds && desk);
    assert(Math.abs(bounds.width - size) < 2, 'Incorrect width at ' + size);
    assert(bounds.x >= desk.x - 1 && bounds.x + bounds.width <= desk.x + desk.width + 1, 'Horizontal clipping at ' + size);
    assert(bounds.y >= desk.y - 1 && bounds.y + bounds.height <= desk.y + desk.height + 1, 'Vertical clipping at ' + size);
    await snapshot(size + '-idle');
    record(size + '-idle', { passed: true, image: await loaded('idle') });

    await page.locator('#state').selectOption('working');
    const working = await loaded('working');
    await snapshot(size + '-working');
    record(size + '-working', { passed: true, image: working });
    // Compare the browser's actual rendered frame URLs, not merely the files
    // listed in the preview review panel. 000 + 002 + 003 must all display.
    const distinctWorkingFrames = await page.evaluate(async () => {
      const seen = new Set();
      for (let i = 0; i < 65; i++) {
        const img = document.querySelector('#pet .pet-stage img');
        if (img?.complete && img.naturalWidth > 0) seen.add(img.currentSrc);
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      return seen.size;
    });
    assert.equal(distinctWorkingFrames, 3, 'Expected 3 distinct Working frames in subtle typing loop at ' + size);
    await snapshot(size + '-working-typing');
    record(size + '-working-typing-loop', { passed: true, distinctFrames: distinctWorkingFrames });

    // A real seven-frame close should run before the Idle state is rendered.
    await page.locator('#state').selectOption('idle');
    await page.locator('#pet .working-exit[data-exit-mode="frames"]').waitFor({ timeout: 1000 });
    const seenExitFrames = await page.evaluate(async () => {
      const seen = new Set();
      for (let i = 0; i < 38; i++) {
        const el = document.querySelector('#pet .working-exit[data-exit-mode="frames"]');
        if (el?.dataset.exitFrame) seen.add(el.dataset.exitFrame);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      return [...seen].sort();
    });
    for (const required of ['0', '2', '4', '6']) {
      assert(seenExitFrames.includes(required),
        'Working exit skipped frame ' + required + ' at size ' + size + ': ' + seenExitFrames.join(','));
    }
    await page.waitForSelector('#pet .working-exit', { state: 'detached', timeout: 3000 });
    await loaded('Working exit returned to idle');
    record(size + '-working-close-and-idle', { passed: true, observedExitFrames: seenExitFrames });

    // Capture the actual live sprite during exit; the review selector only
    // lists the seven public PetState types, not the internal Working exit pack.
    await page.locator('#state').selectOption('working');
    await loaded('Working before exit screenshot');
    await page.locator('#state').selectOption('idle');
    await page.waitForSelector('#pet .working-exit[data-exit-mode="frames"]', { timeout: 1500 });
    await page.waitForSelector('#pet .working-exit[data-exit-frame="2"]', { timeout: 1200 });
    await snapshot(size + '-working-laptop-folding');
    // Capturing the screenshot can take longer than the 100ms following
    // frame interval. All frames (including 4 and 6) are verified in the
    // separate sampled playback test above; never wait for an already-gone
    // transient frame after taking a screenshot.
    await page.waitForSelector('#pet .working-exit', { state: 'detached', timeout: 2500 });
    record(size + '-working-close-visual-captured', { passed: true });

    await page.locator('#state').selectOption('drawing');
    await loaded('drawing');
    await pause(550);
    await snapshot(size + '-drawing');
    record(size + '-drawing', { passed: true });
    await idle();

    await page.locator('#state').selectOption('firing');
    await loaded('firing');
    assert.equal(await page.locator('.single-action .muzzle-single').count(), 1, 'Single muzzle missing');
    assert.match(await page.locator('.muzzle-single').evaluate(el => getComputedStyle(el).clipPath), /^polygon\(/, 'Muzzle must be a shaped burst, not a round orb');
    await page.waitForFunction(() => {
      const el = document.querySelector('.muzzle-single');
      return el && Number(getComputedStyle(el).opacity) > 0.3;
    }, null, { timeout: 4000 });
    // Freeze the already-active REAL CSS starburst for the capture. Without
    // this, taking a full desktop PNG can outlast the brief animation, giving
    // a misleading "flash" screenshot with no visible flash at all.
    const frozenOpacity = await page.locator('.muzzle-single').evaluate(el => {
      el.style.animationPlayState = 'paused';
      return Number(getComputedStyle(el).opacity);
    });
    assert(frozenOpacity > 0.2, 'Single flash vanished before QA freeze at ' + size);
    await snapshot(size + '-firing-flash');
    const flashEl = page.locator('.muzzle-single');
    if (await flashEl.count()) await flashEl.evaluate(el => { el.style.animationPlayState = ''; });
    await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 4000 });
    await loaded('single firing returned idle');
    record(size + '-firing', { passed: true, returnedIdle: true });

    // Sample the actual production renderer, not the static review panel.
    // The newly generated seven-step Revolver action must reach the key
    // draw/aim/recoil/holster frames before the state is reset to Idle.
    await page.locator('#state').selectOption('firing');
    await page.waitForSelector('#pet .single-action[data-action-mode="revolver-frames"]', { timeout: 1500 });
    const seenRevolverFrames = await page.evaluate(async () => {
      const seen = new Set();
      for (let i = 0; i < 90; i++) {
        const el = document.querySelector('#pet .single-action[data-action-mode="revolver-frames"]');
        if (el?.dataset.actionFrame) seen.add(el.dataset.actionFrame);
        await new Promise(resolve => setTimeout(resolve, 22));
      }
      return [...seen].sort();
    });
    for (const n of ['0', '1', '2', '3', '4', '5', '6']) {
      assert(seenRevolverFrames.includes(n),
        'Revolver action skipped frame ' + n + ' at ' + size + ': ' + seenRevolverFrames.join(','));
    }
    assert.equal(await page.locator('#state').inputValue(), 'idle', 'Revolver sequence must finish Idle');
    record(size + '-full-revolver-sequence', { passed: true, seenFrames: seenRevolverFrames });

    await page.locator('#state').selectOption('dual_firing');
    await loaded('dual_firing');
    assert.equal(await page.locator('.dual-action .muzzle').count(), 2, 'Dual muzzles missing');
    await page.waitForFunction(() => {
      const els = [...document.querySelectorAll('.dual-action .muzzle')];
      return els.length === 2 && els.some(el => Number(getComputedStyle(el).opacity) > 0.3);
    }, null, { timeout: 4500 });
    await snapshot(size + '-dual-flash');
    await page.waitForFunction(() => {
      const el = document.querySelector('.dual-action .muzzle-right');
      return el && Number(getComputedStyle(el).opacity) > 0.3;
    }, null, { timeout: 4000 });
    await snapshot(size + '-dual-right-flash');
    await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 5000 });
    await loaded('dual firing returned idle');
    record(size + '-dual-firing', { passed: true, returnedIdle: true });
  }

  // Inspect every existing pose independently; the live Drawing state advances too quickly
  // to guarantee that an initial-frame screenshot captures frame 000.
  for (const [state, count] of [['idle', 1], ['working', 4], ['drawing', 2], ['firing', 3], ['dual_firing', 3]]) {
    await page.locator('#review-source').selectOption('derived');
    await page.locator('#review-state').selectOption(state);
    const frame = page.locator('#selected-frame');
    await frame.evaluate(img => { img.style.width = '360px'; img.style.height = '563px'; });
    for (let i = 0; i < count; i++) {
      await page.waitForFunction(expected => document.querySelector('#frame-label')?.textContent?.trim() === expected,
        (i + 1) + ' / ' + count, { timeout: 4000 });
      await page.waitForFunction(() => {
        const img = document.querySelector('#selected-frame');
        return img && img.complete && img.naturalWidth > 0;
      }, null, { timeout: 10000 });
      await frame.screenshot({ path: resolve(out, 'pose-' + state + '-' + i + '.png') });
      await page.locator('#frame-next').click();
    }
  }
  record('all-derived-pose-frames-captured', { passed: true, count: 13 });

  await page.locator('#state').selectOption('working');
  await loaded('working transition');
  await page.locator('#state').selectOption('firing');
  await page.locator('#state').selectOption('dual_firing');
  await page.waitForSelector('#pet .dual-action', { timeout: 2500 });
  assert.equal(await page.locator('#pet .single-action').count(), 0, 'Stale firing transition');
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 5000 });
  record('working-to-last-request-dual-to-idle', { passed: true });

  await page.locator('#state').selectOption('working');
  await loaded('working reselect before exit');
  await page.locator('#state').selectOption('firing');
  await page.locator('#pet .working-exit').waitFor({ timeout: 1000 });
  await page.locator('#state').selectOption('working');
  await page.waitForFunction(() =>
    document.querySelector('#state')?.value === 'working' &&
    document.querySelector('#pet .pet-stage') &&
    !document.querySelector('#pet .pet-stage')?.classList.contains('working-exit')
  , null, { timeout: 2000 });
  await pause(850);
  assert.equal(await page.locator('#pet .single-action, #pet .dual-action').count(), 0, 'Stale firing after Working reselect');
  assert.equal(await page.locator('#state').inputValue(), 'working', 'Working should remain active');
  await loaded('restored working');
  record('working-exit-cancelled-by-working-reselect', { passed: true });

  await idle();
  await page.locator('#state').selectOption('firing');
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 4000 });
  await page.locator('#state').selectOption('firing');
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 4000 });
  record('sequential-firing-replay', { passed: true });

  // Drawing is a three-key-pose hold; firing from that held aim skips the
  // redundant idle/draw lead-in and starts directly from the aimed revolver.
  await page.locator('#state').selectOption('drawing');
  await page.waitForSelector('#pet .pet-stage[data-draw-mode="three-key-poses"]', { timeout: 1000 });
  await page.waitForSelector('#pet .pet-stage[data-draw-frame="2"]', { timeout: 1500 });
  await page.locator('#state').selectOption('firing');
  await page.waitForSelector('#pet .single-action[data-action-entry="already-drawn"]', { timeout: 1000 });
  assert.equal(await page.locator('#pet .muzzle-single').evaluate(el => getComputedStyle(el).animationName),
    'shot-from-drawn', 'From-drawn muzzle animation must align with early recoil');
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 3000 });
  record('drawing-held-aim-to-firing-without-redraw', { passed: true });

  // A quick click on Firing while Drawing has *not yet* reached its aim
  // frame must use the full action, not pretend the revolver is already out.
  await page.locator('#state').selectOption('drawing');
  await page.waitForSelector('#pet .pet-stage[data-draw-frame="0"]', { timeout: 1000 });
  await page.locator('#state').selectOption('firing');
  await page.waitForSelector('#pet .single-action[data-action-entry="full"]', { timeout: 1000 });
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 4000 });
  record('drawing-interrupted-before-aim-uses-full-fire-sequence', { passed: true });

  await page.locator('#state').selectOption('firing');
  await page.waitForSelector('#pet .single-action[data-action-mode="revolver-frames"]', { timeout: 1000 });
  await page.locator('#state').selectOption('working');
  await page.waitForSelector('#pet .pet-stage[data-working-motion="fingertips-only"]', { timeout: 1200 });
  await pause(1550);
  assert.equal(await page.locator('#state').inputValue(), 'working', 'Interrupted revolver must not return to Idle later');
  record('revolver-interrupted-by-working-no-stale-idle', { passed: true });
  await idle();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#state').selectOption('working');
  await loaded('working reduced motion');
  const reducedFrameBefore = await page.locator('#pet .pet-stage img').evaluate(img => img.currentSrc);
  await pause(1350);
  const reducedFrameAfter = await page.locator('#pet .pet-stage img').evaluate(img => img.currentSrc);
  assert.equal(reducedFrameAfter, reducedFrameBefore, 'Working must remain still with reduced motion');
  record('reduced-motion-working-still', { passed: true });
  await page.locator('#state').selectOption('firing');
  await page.waitForSelector('#pet .single-action[data-action-mode="reduced-still"]', { timeout: 1200 });
  assert.equal(await page.locator('.single-action .muzzle-single').evaluate(el => getComputedStyle(el).animationName),
    'none', 'Reduced-motion should show no firing flash animation');
  await page.waitForFunction(() => document.querySelector('#state')?.value === 'idle', null, { timeout: 5000 });
  record('reduced-motion-firing-return', { passed: true });

  await page.locator('#state').selectOption('speaking');
  assert.equal(await page.locator('#pet .placeholder').count(), 1, 'Missing expected speaking placeholder');
  record('speaking-placeholder-marked-unimplemented', { passed: true });
  assert.deepEqual(errors, [], 'Browser console/resource errors:\n' + errors.join('\n'));
  record('browser-console-and-assets', { passed: true, errors: [] });
  writeFileSync(resolve(out, 'report.json'), JSON.stringify({ passed: true, results, errors }, null, 2));
  console.log('Visual browser QA PASS: ' + results.length + ' checks, screenshots at 180/240/360px.');
} catch (error) {
  errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  writeFileSync(resolve(out, 'report.json'), JSON.stringify({ passed: false, results, errors }, null, 2));
  console.error('Visual browser QA FAILED:', error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(r => server.close(r));
}
