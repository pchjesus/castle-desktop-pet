import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root=new URL('../src/characters/candidates/b-mustang-20261107/',import.meta.url);
const report=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('candidate manifest covers all nine canonical sources and referenced files',async()=>{
 assert.equal(Object.keys(report.assets).length,9);
 for(const [name,entry] of Object.entries(report.assets)) {
  const ext=['firing_dynamic','dual_firing','speaking_reference'].includes(name)?'jpg':'png';
  const source=await readFile(new URL(`../design/canonical/b-mustang-20261107/approved_visual_sources/${name}.${ext}`,import.meta.url));
  assert.equal(sha(source),entry.source_sha256,name+' source');
  for(const item of entry.frames || [entry]) {
   const bytes=await readFile(new URL(item.candidate,root));
   assert.equal(sha(bytes),item.sha256,item.candidate);
   assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(bytes[25],6,item.candidate+' RGBA');
  }
 }
 assert.equal(report.assets.speaking_reference.frames.length,7);
});
