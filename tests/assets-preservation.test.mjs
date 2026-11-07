import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../design/canonical/b-mustang-20261107/',import.meta.url);
const m=JSON.parse(await readFile(new URL('ASSET_MANIFEST.json',root),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('only the nine final approved B source images are in the official source folder',async()=>{
 const files=(await readdir(new URL('approved_visual_sources/',root))).sort();
 assert.deepEqual(files,['drawing.png','dual_firing.jpg','firing.png','firing_dynamic.jpg','idle.png','sitting.png','smoking.png','speaking_reference.jpg','working.png']);
 assert.equal(m.assets.length,9);
 for(const asset of m.assets){
  const b=await readFile(new URL(asset.canonical_archive_path,root));
  assert.equal(sha(b),asset.sha256,asset.action+' altered');
 }
});
test('initial prototype does not remain in current runtime source folders',async()=>{
 const r=await readFile(new URL('../src/characters/akila.ts',import.meta.url),'utf8');
 assert(!r.includes("derived/akila/"));
 assert(!r.includes("assets/akila/"));
 assert(r.includes("action-pack-v04/"));
});
test('post-prototype A design remains separate from B originals',async()=>{
 const a=await readFile(new URL('../design/references/akila-sheet-02.png',import.meta.url));
 assert(a.length>1000000);
 const runtime=await readFile(new URL('../src/characters/outfits.ts',import.meta.url),'utf8');
 assert(runtime.includes("akila-sheet-02.png"));
});
test('B QA pack has complete standalone frame inventory with no A fallback',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/characters/candidates/b-mustang-20261107/action-pack-v04/manifest.json',import.meta.url),'utf8'));
 for(const state of ['idle','smoking','drawing','firing','working','sitting']) {
  const a=manifest.assets[state];assert(a&&a.file===state+'.png');
  assert.equal(sha(await readFile(new URL('../src/characters/candidates/b-mustang-20261107/action-pack-v04/'+a.file,import.meta.url))),a.sha256);
 }
 assert.equal(manifest.assets.dual_firing.status,'blocked');
});
