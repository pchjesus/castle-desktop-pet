import test from 'node:test';import assert from 'node:assert/strict';
import {placeMenu,clampMenu,menuSize,overlapArea} from '../electron/menu-layout.mjs';
test('menu stays off pet even with pet against right, left and bottom screen edges',()=>{
 const work={x:0,y:0,width:1400,height:860};
 for(const pet of [{x:1220,y:250,width:180,height:235},{x:0,y:260,width:180,height:235},{x:540,y:625,width:180,height:235},{x:400,y:0,width:180,height:235}]){
  const b=placeMenu(pet,work,{x:pet.x+90,y:pet.y+110},{width:316,height:316});
  assert.equal(overlapArea(b,pet),0,JSON.stringify({pet,b}));
  assert(b.x>=0&&b.y>=0&&b.x+b.width<=work.width&&b.y+b.height<=work.height);
 }
});
test('menu saved location is honored only if it does not obstruct character',()=>{
 const work={x:100,y:50,width:1300,height:780},pet={x:700,y:300,width:180,height:250};
 const saved={x:120,y:100};
 assert.deepEqual(placeMenu(pet,work,{x:750,y:350},{width:316,height:316},saved),{...saved,width:316,height:316});
 assert.equal(overlapArea(placeMenu(pet,work,{x:750,y:350},{width:316,height:316},{x:710,y:340}),pet),0);
});
test('resize keeps the transparent menu in the display work area',()=>{
 const work={x:100,y:30,width:540,height:460};
 assert.deepEqual(menuSize({width:900,height:900},work),{width:540,height:460});
 const b=clampMenu({x:500,y:350,width:450,height:400},work);
 assert.deepEqual(b,{x:190,y:90,width:450,height:400});
});
