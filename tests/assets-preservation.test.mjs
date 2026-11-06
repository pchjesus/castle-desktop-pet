import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// All original frames used at the beginning of v0.3C must remain present.
// New approved intermediate frames may be added without changing this inventory.
const originalFrames = [
  'idle/000.png',
  'working/000.png', 'working/001.png',
  'drawing/000.png', 'drawing/001.png',
  'firing/000.png', 'firing/001.png', 'firing/002.png',
  'dual_firing/000.png', 'dual_firing/001.png', 'dual_firing/002.png'
];
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');

test('all eleven existing source pose PNGs remain readable and preserved', async () => {
  for (const path of originalFrames) {
    const bytes = await readFile(new URL('../src/characters/assets/akila/' + path, import.meta.url));
    assert(bytes.length > 1000, 'Unexpected empty original pose: ' + path);
    assert(bytes.subarray(0, 8).equals(pngSignature), 'Bad PNG signature: ' + path);
  }
});

test('approved A-type Idle source retains its exact original content', async () => {
  const bytes = await readFile(new URL('../src/characters/assets/akila/idle/000.png', import.meta.url));
  const prefix = Buffer.from('blob ' + bytes.length + '\0');
  const sha = createHash('sha1').update(prefix).update(bytes).digest('hex');
  assert.equal(sha, 'cbb82c0eb6848b330aee5a1912c4d49eb45fca05',
    'Approved A-type Idle PNG changed; do not replace without explicit art approval');
});

test('all eleven aligned renderer pose files remain present', async () => {
  const aligned = await Promise.all(originalFrames.map(path =>
    readFile(new URL('../src/characters/derived/akila/' + path, import.meta.url))
  ));
  for (const [i, bytes] of aligned.entries()) {
    assert(bytes.subarray(0, 8).equals(pngSignature), 'Missing or invalid aligned PNG: ' + originalFrames[i]);
    assert.equal(bytes.readUInt32BE(16), 1024, 'Incorrect aligned width: ' + originalFrames[i]);
    assert.equal(bytes.readUInt32BE(20), 1600, 'Incorrect aligned height: ' + originalFrames[i]);
  }
});
