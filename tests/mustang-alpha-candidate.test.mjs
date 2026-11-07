import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const root=new URL('../src/characters/candidates/b-mustang-20261107/action-pack-v04/',import.meta.url);
test('later B alpha candidates are reproducible and linked to canonical source',async()=>{
 const m=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 for(const name of ['idle','drawing','firing','working','smoking','sitting']){
  const a=m.assets[name],b=await readFile(new URL(name+'.png',root));
  assert.equal(b.readUInt32BE(16),1024);assert.equal(b.readUInt32BE(20),1600);assert.equal(b[25],6);
  assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);
 }
});
test('manual masked JPEG candidates remain unapproved rather than replacing source',async()=>{
 const m=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(m.assets.dual_firing.status,'blocked');
 assert.notEqual(m.assets.firing_dynamic.status,'visual_approved');
});
