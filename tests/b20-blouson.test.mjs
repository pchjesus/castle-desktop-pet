import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {outfitFrames} from '../src/characters/outfit-loader.mjs';

const approved={
 idle:'4029afbd4bf8c42e20c715a6d33ea5dda69d46366f83f7f1145c10ef5bffe53e',
 smoking:'a9e40aa02dadb2d726953cb2716ba1765aaee02908747c8a5d787b1809149538',
 sitting:'180b6b7d729ccf99343c2ebabbb22335da9ff9d4ee83b4e3b455c61126d8d780',
 working:'e35267e5b7cb0d53a65eeb15d1f60ccffb22011467671e799fbca58242ceb3fd',
 speaking:'f6d7769f2ffdb7c28eb2a40e2ce47b832ac70b52488b3bf9d8ecfb4470353122',
 drawing:'28ea47c4eb2e4dec77db85ca69e60a8053577a2c279b379bc88f5d4da71d721b',
 firing:'54434c90b0d08f5e5d96bd031d5b54e5bf6d74e03c16ed3d6ce1fa488c2a0f33',
 dual_firing:'f045c43b776b766016d8b3f6e2689346c8ad210ecce9b8d6adab80dd33374414',
 firing_dynamic:'736d13eedbe36e7117ad2991b6a15cf7d53d9eb2074ec422aa07bb056abd7015'
};
test('B20 exact user-approved blouson PNGs are bundled, 1024x1600 and not replaced',async()=>{
 for(const [pose,digest] of Object.entries(approved)){
  const p=join('src','characters','candidates','a-blouson-b20',pose+'.png');
  const data=await readFile(p);
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',pose);
  assert.equal(data.readUInt32BE(16),1024,pose+' width');
  assert.equal(data.readUInt32BE(20),1600,pose+' height');
  assert.equal(createHash('sha256').update(data).digest('hex'),digest,pose+' approved asset');
 }
});
test('skin registry returns isolated copies, never substitutes mustang for blouson',()=>{
 const registry={mustang:{smoking:['b.png']},blouson:{smoking:['a.png']}};
 assert.deepEqual(outfitFrames(registry,'blouson','smoking'),['a.png']);
 assert.deepEqual(outfitFrames(registry,'mustang','smoking'),['b.png']);
 assert.deepEqual(outfitFrames(registry,'blouson','absent'),[]);
 assert.deepEqual(outfitFrames(registry,'invalid','smoking'),[]);
 const frames=outfitFrames(registry,'blouson','smoking');frames.push('bad.png');
 assert.deepEqual(outfitFrames(registry,'blouson','smoking'),['a.png']);
});
test('skin selection does not alter dialogue or cadence implementations',async()=>{
 const entry=await readFile('src/main.ts','utf8');
 const menu=await readFile('electron/pet-menu.html','utf8');
 const native=await readFile('electron/main.ts','utf8');
 assert(entry.includes("state==='skin:mustang'||state==='skin:blouson'"));
 assert(entry.includes('livePet.dispose()'));
 assert(menu.includes('data-skin="mustang"')&&menu.includes('data-skin="blouson"'));
 assert(native.includes("activeSkin=skin"));
 assert(native.includes("'appearance.json'"));
});
