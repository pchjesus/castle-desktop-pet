import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// These are candidate QA guards, not approval of B outfit art.
const source = new URL('../src/characters/candidates/akila_mustang/idle-gate1b-unapproved.png', import.meta.url);
const clean = new URL('../src/characters/candidates/akila_mustang/idle-gate1b-alpha-cleanup-unapproved.png', import.meta.url);
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function imageInfo(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Not a PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}
test('original Gate 1B art remains bit-for-bit unchanged', async () => {
  const bytes = await readFile(source);
  assert.equal(sha256(bytes), '012043303e590db54a6e58efbd1dba37dcac074a6331e0fbda44a288e045ac1d');
  assert.deepEqual(imageInfo(bytes), {width:1024,height:1536,colorType:6});
});
test('alpha-cleanup exists as an isolated 1024x1600 RGBA candidate', async () => {
  const bytes = await readFile(clean);
  assert.equal(sha256(bytes), 'decddd8730165cb0c6c75376565b933c3cca19a7bf9ba928dab2d7b3500422c1');
  assert.deepEqual(imageInfo(bytes), {width:1024,height:1600,colorType:6});
});
test('technical cleanup is not registered as active Mustang runtime art', async () => {
  const {readFile} = await import('node:fs/promises');
  const registry = await readFile(new URL('../src/characters/outfits.ts', import.meta.url), 'utf8');
  assert.match(registry, /targetDefault:\s*'mustang'/);
  assert.match(registry, /active:\s*'blouson'/);
  assert.match(registry, /mustang:\s*\{\s*assetRoot:\s*'derived\/akila_mustang',\s*ready:\s*false/);
});
