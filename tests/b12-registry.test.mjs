import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('nine approved B poses resolve to exact recorded image bytes',async()=>{
 const root='src/characters/candidates/b-mustang-20261107/';const registry=JSON.parse(await readFile(root+'approved-runtime.json','utf8'));
 assert.deepEqual(Object.keys(registry.assets).sort(),['drawing','dual_firing','firing','firing_dynamic','idle','sitting','smoking','speaking','working']);
 for(const [pose,item] of Object.entries(registry.assets))for(const entry of item.frames||[item]){const bytes=await readFile(root+entry.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,pose);}
 assert.equal(registry.assets.speaking.frames.length,7);
});
