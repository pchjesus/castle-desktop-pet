import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const root='src/characters/candidates/b-mustang-20261107/proportions-v07/';
const report=JSON.parse(await readFile(root+'manifest.json','utf8'));
test('B07 review images preserve provenance, encoded size and unapproved status', async()=>{
  for(const [key,item] of Object.entries(report.images)){
    const path=key.endsWith('-candidate')?root:'design/canonical/b-mustang-20261107/approved_visual_sources/';
    const bytes=await readFile(path+item.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
    assert.equal(bytes.readUInt32BE(16),item.width);assert.equal(bytes.readUInt32BE(20),item.height);
    assert(item.head_box[2]>item.head_box[0]);assert(item.foot_y<item.height);
  }
  for(const pose of ['idle','smoking','sitting']){
    assert.equal(report.poses[pose].approved,false);
    assert.notEqual(report.images[pose+'-candidate'].sha256,report.images[pose+'-original'].sha256);
    assert(report.poses[pose].limitations.length>20);
  }
});
test('B07 images cannot replace the registered desktop outfit',async()=>{
  for(const path of ['src/characters/outfits.ts','src/characters/akila.ts','src/main.ts','electron/main.ts']){
    assert.doesNotMatch(await readFile(path,'utf8'),/proportions-v07|b-proportions-v07/);
  }
});
