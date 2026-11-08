import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const raw=await readFile(new URL('../src/characters/outfits.ts',import.meta.url),'utf8');
const {code}=await transform(raw,{loader:'ts',format:'esm'});
const {outfitPolicy}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('only the later B outfit starts by default in QA and later A is not spoofed',()=>{
 assert.equal(outfitPolicy.targetDefault,'mustang');
 assert.equal(outfitPolicy.active,'mustang');
 assert.equal(outfitPolicy.outfits.blouson.ready,false);
 assert.equal(outfitPolicy.outfits.mustang.ready,true); // user-approved B pose pack
 assert.notEqual(outfitPolicy.outfits.blouson.assetRoot,outfitPolicy.outfits.mustang.assetRoot);
});
test('runtime source never imports initial prototype sprites',async()=>{
 const runtime=await readFile(new URL('../src/characters/akila.ts',import.meta.url),'utf8');
 assert(!/['"]\.\/derived\/akila/.test(runtime));
 assert(!/['"]\.\/assets\/akila/.test(runtime));
 assert(runtime.includes("action-pack-v04"));
 assert(runtime.includes("blouson:Object.fromEntries(states.map(state=>[state,[]]))"));
});
test('outfit frame loader is isolated and does not substitute missing A/B poses',async()=>{
 const {outfitFrames}=await import('../src/characters/outfit-loader.mjs');
 const registry={blouson:{idle:[]},mustang:{idle:['b-idle.png'],firing:['b-fire.png']}};
 assert.deepEqual(outfitFrames(registry,'mustang','idle'),['b-idle.png']);
 assert.deepEqual(outfitFrames(registry,'blouson','firing'),[]);
 assert.deepEqual(outfitFrames(registry,'unknown','idle'),[]);
});
test('user comparison controls survive while legacy prototype review panel is removed',async()=>{
 const html=await readFile(new URL('../preview-entry.html',import.meta.url),'utf8');
 for(const id of ['canonical-action','canonical-candidate','canonical-side-03','canonical-side-04','canonical-speaking','canonical-guides','state']){
   assert(html.includes('id="'+id+'"'),id);
 }
 assert(!html.includes('class="mustang-review"'));
 assert(!html.includes('class="frame-review"'));
});
