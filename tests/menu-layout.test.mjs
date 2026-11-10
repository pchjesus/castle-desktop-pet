import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_MENU,placeMenu,clampMenu,menuSize,overlapArea,resizeMenuFromCorner} from '../electron/menu-layout.mjs';
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

test('default settings panel is spacious, screen centered, and migrates to safe off-pet position',()=>{
 const work={x:0,y:0,width:1920,height:1080},pet={x:90,y:700,width:180,height:250};
 const center=placeMenu(pet,work,{x:135,y:800},DEFAULT_MENU);
 assert.deepEqual(center,{x:680,y:235,width:560,height:610});
 const inCenter={x:780,y:350,width:180,height:250};
 const side=placeMenu(inCenter,work,{x:800,y:470},DEFAULT_MENU);
 assert.equal(overlapArea(side,inCenter),0);
 assert(Math.abs(side.x-680)<680||Math.abs(side.y-235)<235);
});
test('large resizable panels remain onscreen on compact laptop work areas',()=>{
 const work={x:0,y:0,width:1280,height:680};
 assert.deepEqual(menuSize({width:960,height:920},work),{width:960,height:680});
 const result=placeMenu({x:10,y:380,width:180,height:250},work,{x:90,y:510},{width:560,height:610});
 assert(result.width===560&&result.height===610);
 assert(result.x>=0&&result.y>=0&&result.y+result.height<=680);
});

test('each menu corner resizes independently and anchors the opposite corner',()=>{
 const work={x:0,y:0,width:1600,height:900};
 const start={x:500,y:300,width:560,height:460};
 const expected={
  nw:{x:430,y:255,width:630,height:505},
  ne:{x:500,y:255,width:630,height:505},
  sw:{x:430,y:300,width:630,height:505},
  se:{x:500,y:300,width:630,height:505}
 };
 for(const corner of ['nw','ne','sw','se']){
  const dx=corner.includes('w')?-70:70,dy=corner.includes('n')?-45:45;
  const actual=resizeMenuFromCorner(start,dx,dy,corner,work);
  assert.deepEqual(actual,expected[corner],corner);
  assert.equal(corner.includes('w')?actual.x+actual.width:actual.x,corner.includes('w')?start.x+start.width:start.x);
  assert.equal(corner.includes('n')?actual.y+actual.height:actual.y,corner.includes('n')?start.y+start.height:start.y);
 }
});
test('resizing has no artificial 960px/920px ceiling even on high-resolution desktops',()=>{
 const work={x:0,y:0,width:3840,height:2160};
 assert.deepEqual(menuSize({width:3000,height:1700},work),{width:3000,height:1700});
 const wide=resizeMenuFromCorner({x:100,y:100,width:560,height:610},2200,1100,'se',work);
 assert.deepEqual(wide,{x:100,y:100,width:2760,height:1710});
 const full=resizeMenuFromCorner(wide,9999,9999,'se',work);
 assert.deepEqual(full,{x:100,y:100,width:3740,height:2060});
});
test('corner drags clamp independently to screen edges and usable minimum size',()=>{
 const work={x:-1280,y:0,width:1280,height:720},start={x:-700,y:200,width:550,height:430};
 assert.deepEqual(resizeMenuFromCorner(start,-2000,-1500,'nw',work),{x:-1280,y:0,width:1130,height:630});
 assert.deepEqual(resizeMenuFromCorner(start,2000,2000,'se',work),{x:-700,y:200,width:700,height:520});
 const small=resizeMenuFromCorner(start,-9999,-9999,'se',work);
 assert(small.width>0&&small.height>0);
 assert.equal(small.x,start.x);assert.equal(small.y,start.y);
});
