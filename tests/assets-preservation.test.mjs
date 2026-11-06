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

test('Working finger-tap frames are aligned and distinct while approved frame 000 is fixed', async () => {
  const folder = '../src/characters/derived/akila/working/';
  const approved = await readFile(new URL(folder + '000.png', import.meta.url));
  const blobSha = createHash('sha1')
    .update(Buffer.from('blob ' + approved.length + '\0'))
    .update(approved).digest('hex');
  assert.equal(blobSha, '6db61ee9ddabb6640c62202d05a6ababa579f86d',
    'Approved Working 000 changed; do not regenerate the face, laptop, or outfit.');
  const variants = await Promise.all(['002.png', '003.png'].map(name =>
    readFile(new URL(folder + name, import.meta.url))));
  const originalHash = createHash('sha256').update(approved).digest('hex');
  const variantHashes = variants.map(buf => {
    assert(buf.subarray(0, 8).equals(pngSignature), 'Invalid typing PNG');
    assert.equal(buf.readUInt32BE(16), 1024, 'Width changed from approved Working');
    assert.equal(buf.readUInt32BE(20), 1600, 'Height changed from approved Working');
    return createHash('sha256').update(buf).digest('hex');
  });
  assert.notEqual(variantHashes[0], variantHashes[1], 'Two typing frames are identical');
  assert.notEqual(variantHashes[0], originalHash, 'First typing frame is identical to 000');
  assert.notEqual(variantHashes[1], originalHash, 'Second typing frame is identical to 000');
});

test('all seven Working close-and-tidy sprites are valid, aligned PNGs', async () => {
  const paths = Array.from({ length: 7 }, (_, i) =>
    '../src/characters/derived/akila/working_exit/' + String(i).padStart(3, '0') + '.png');
  const hashes = new Set();
  for (const path of paths) {
    const bytes = await readFile(new URL(path, import.meta.url));
    assert(bytes.length > 100000, 'Unexpected small or missing Working exit sprite: ' + path);
    assert(bytes.subarray(0, 8).equals(pngSignature), 'Invalid Working exit PNG: ' + path);
    assert.equal(bytes.readUInt32BE(16), 1024, 'Wrong PNG width: ' + path);
    assert.equal(bytes.readUInt32BE(20), 1600, 'Wrong PNG height: ' + path);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(hashes.size, 7, 'All exit frames should be distinct encoded assets');
});

test('seven approved-source single-revolver frames preserve exact key art and alignment', async () => {
  // Git blob SHA checks both the generated sequence and immutable originals.
  // A changed direction or substituted weapon must not silently pass asset QA.
  const expected = [
    '2399e228fe1231fe798853070630609446c7e079', // approved idle
    'f32bfd4d864c3d3c00123a5a948cb90751cd3a81', // approved draw
    'd636e902ea865cceb51239e8fb5d3365eea75a32', // approved aim right
    '5eec85c1e7c46fd79fd62c8fcdcbf9f93d23432e', // local recoil
    'd636e902ea865cceb51239e8fb5d3365eea75a32', // aim recovery
    'f32bfd4d864c3d3c00123a5a948cb90751cd3a81', // return to holster
    '2399e228fe1231fe798853070630609446c7e079', // approved idle
  ];
  for (let i = 0; i < expected.length; i++) {
    const path = '../src/characters/derived/akila/revolver_action/' +
      String(i).padStart(3, '0') + '.png';
    const bytes = await readFile(new URL(path, import.meta.url));
    assert(bytes.length > 500000, 'Revolver pose too small/missing: ' + path);
    assert(bytes.subarray(0, 8).equals(pngSignature), 'Invalid revolver PNG: ' + path);
    assert.equal(bytes.readUInt32BE(16), 1024, 'Incorrect width: ' + path);
    assert.equal(bytes.readUInt32BE(20), 1600, 'Incorrect height: ' + path);
    const blob = createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0'))
      .update(bytes).digest('hex');
    assert.equal(blob, expected[i], 'Approved revolver action pose drift at frame ' + i);
  }
  assert.notEqual(expected[2], expected[3], 'Recoil must actually change the arm');
});
