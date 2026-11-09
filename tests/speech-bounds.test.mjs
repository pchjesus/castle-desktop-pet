import test from 'node:test';
import assert from 'node:assert/strict';
import {headBounds} from '../electron/head-geometry.mjs';
import {speechBounds} from '../electron/speech-bounds.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
test('speech remains on the pet monitor and clear of the head, all sizes and edges',()=>{
 for(const area of [{x:0,y:0,width:1920,height:1080},{x:-1366,y:-100,width:1366,height:768},{x:1920,y:200,width:1280,height:720}]){
  for(const width of [120,140,180,240,360])for(const fraction of [0,.5,1])for(const vertical of [0,.5,1])for(const height of [44,120,228]){
   const pet={x:Math.round(area.x+(area.width-width)*fraction),y:Math.round(area.y+(area.height-width*1.25)*vertical),width,height:width*1.25};
   const copy={...pet},result=speechBounds(pet,area,height);
   const body={...result,height:result.height-14};
   assert(!overlap(headBounds(pet),body),JSON.stringify({pet,result}));assert.deepEqual(pet,copy);
   assert(result.x>=area.x&&result.y>=area.y);assert(result.x+result.width<=area.x+area.width);assert(result.y+result.height<=area.y+area.height);
  }
 }
});
test('normal room prefers upper-left, follows Sitting head and adapts short text width',()=>{const area={x:0,y:0,width:1920,height:1080},pet={x:800,y:700,width:180,height:225};const normal=speechBounds(pet,area,70,'smoking',220);assert.equal(normal.placement,'upper-left');assert(normal.y<pet.y);const short=speechBounds(pet,area,60,'smoking',80);assert.equal(short.width,80);assert(short.x>normal.x);assert(speechBounds(pet,area,70,'sitting').y>normal.y);});
test('speech HTML CSP covers its exact inline script and uses textContent',async()=>{
 const html=await readFile(new URL('../electron/pet-speech.html',import.meta.url),'utf8');
 // HTML input preprocessing normalizes CRLF to LF, including on Windows.
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\r\n?/g,'\n');
 assert(html.includes('sha256-'+createHash('sha256').update(script).digest('base64')));
 assert(script.includes('speech.textContent=text'));assert(!script.includes('innerHTML'));
});
test('physically insufficient screen space is explicit, and every approved head stays protected',()=>{assert.equal(speechBounds({x:0,y:0,width:180,height:80},{x:0,y:0,width:180,height:80},70).placement,'unavailable');for(const pose of ['idle','smoking','speaking','sitting','working','drawing','firing','dual_firing','firing_dynamic'])for(const width of [120,180,240,360]){const pet={x:600,y:500,width,height:width*1.25},result=speechBounds(pet,{x:0,y:0,width:1920,height:1080},80,pose);assert(!overlap({...result,height:result.height-14},headBounds(pet,pose)));}});
