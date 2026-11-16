import test from 'node:test';
import assert from 'node:assert/strict';
import {dragPosition,sameSize} from '../electron/drag-geometry.mjs';

test('drag changes screen position but never the 180x225 pet size',()=>{
 const area=[{x:0,y:0,width:1920,height:1080}];
 const anchor={x:400,y:600,width:180,height:225};
 const first={x:480,y:710};
 assert.deepEqual(dragPosition(anchor,first,{x:700,y:760},area),{x:620,y:650,width:180,height:225});
 assert.deepEqual(dragPosition(anchor,first,{x:-1000,y:-500},area),{x:0,y:0,width:180,height:225});
 assert.equal(sameSize(anchor,{x:0,y:0,width:180,height:225}),true);
 assert.equal(sameSize(anchor,{x:0,y:0,width:360,height:450}),false);
});
test('multi-monitor work areas are DIP coordinates, with dimension stability across boundary',()=>{
 const left={x:-1920,y:0,width:1920,height:1080};
 const right={x:0,y:0,width:1920,height:1080};
 const origin={x:-150,y:400,width:240,height:300},pressed={x:-50,y:480};
 const moved=dragPosition(origin,pressed,{x:240,y:500},[left,right]);
 assert.deepEqual(moved,{x:140,y:420,width:240,height:300});
 const constrained=dragPosition(origin,pressed,{x:8000,y:500},[left,right]);
 assert.deepEqual(constrained,{x:1680,y:420,width:240,height:300});
});
test('a DPI-induced 2x native size never changes the drag anchor',()=>{
 const anchor={x:50,y:40,width:160,height:200},areas=[{x:0,y:0,width:1920,height:1080}];
 const resizedNative={x:50,y:40,width:320,height:400};
 assert(!sameSize(anchor,resizedNative));
 const desired=dragPosition(anchor,{x:120,y:110},{x:220,y:210},areas);
 assert.deepEqual(desired,{x:150,y:140,width:160,height:200});
});
