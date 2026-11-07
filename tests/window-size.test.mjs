import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {PET_WIDTH_PRESETS,DEFAULT_PET_WIDTH,dimensionsFor,resizeAroundFeet,restoreWindowBounds,nextWidth} from '../electron/window-size.mjs';
test('default desktop pet is compact and offers nine sizes',()=>{
 assert.equal(DEFAULT_PET_WIDTH,180);
 assert.deepEqual(PET_WIDTH_PRESETS,[120,140,160,180,200,240,280,320,360]);
 assert.deepEqual(dimensionsFor(120),{width:120,height:150});
 assert.deepEqual(dimensionsFor(180),{width:180,height:225});
 assert.throws(()=>dimensionsFor(100),RangeError);
});
test('resize preserves character bottom and horizontal center',()=>{
 assert.deepEqual(resizeAroundFeet({x:1400,y:600,width:240,height:300},180),{x:1430,y:675,width:180,height:225});
});
test('migration shrinks only old default; explicit size persists',()=>{
 assert.deepEqual(restoreWindowBounds({x:1400,y:600,width:240,height:300}),{x:1430,y:675,width:180,height:225});
 assert.deepEqual(restoreWindowBounds({settingsVersion:2,x:1400,y:600,width:240,height:300}),{x:1400,y:600,width:240,height:300});
 assert.deepEqual(restoreWindowBounds({x:1400,y:600,width:360,height:450}),{x:1400,y:600,width:360,height:450});
 assert.equal(restoreWindowBounds({x:'bad',y:0,width:240,height:300}),null);
});
test('adjacent sizes clamp at limits',()=>{
 assert.equal(nextWidth(180,-1),160);assert.equal(nextWidth(180,1),200);
 assert.equal(nextWidth(120,-1),120);assert.equal(nextWidth(360,1),360);
});
test('desktop window has frame off and native chrome QA',async()=>{
 const entry=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 for(const value of ['transparent:true','frame:false','titleBarOverlay:false','setMenuBarVisibility(false)','nativeFrameless','PET_WIDTH_PRESETS']) assert(entry.includes(value),value);
});
