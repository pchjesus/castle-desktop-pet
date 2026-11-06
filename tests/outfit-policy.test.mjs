import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
const file = await readFile(new URL('../src/characters/outfits.ts', import.meta.url), 'utf8');
const {code} = await transform(file, {loader:'ts', format:'esm'});
const {outfitPolicy} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('unapproved B outfit is not the active runtime outfit', () => { assert.equal(outfitPolicy.targetDefault,'mustang'); assert.equal(outfitPolicy.active,'blouson'); assert.equal(outfitPolicy.outfits.mustang.ready,false); assert.notEqual(outfitPolicy.outfits.blouson.assetRoot,outfitPolicy.outfits.mustang.assetRoot); });
test('approved original idle is unchanged', async () => { const bytes=await readFile(new URL('../src/characters/assets/akila/idle/000.png',import.meta.url)); assert.equal(createHash('sha256').update(bytes).digest('hex'),'76db768dbdc64db00a96b0ac8bceaa7f9424cc19d6248895f1521acb0d2dcd30'); });
test('unapproved candidate is a transparent RGBA PNG and isolated from runtime', async () => {
  const bytes = await readFile(new URL('../src/characters/candidates/akila_mustang/idle-unapproved.png', import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1024); assert.equal(bytes.readUInt32BE(20), 1536); assert.equal(bytes[25], 6);
  assert.equal(outfitPolicy.outfits.mustang.ready, false);
});
