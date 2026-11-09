import test from 'node:test';
import assert from 'node:assert/strict';
import {speechBounds} from '../electron/speech-bounds.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
test('speech remains on the pet monitor and outside its entire rectangle, all sizes and edges',()=>{
 for(const area of [{x:0,y:0,width:1920,height:1080},{x:-1366,y:-100,width:1366,height:768},{x:1920,y:200,width:1280,height:720}]){
  for(const width of [120,140,180,240,360])for(const fraction of [0,.5,1])for(const vertical of [0,.5,1])for(const height of [44,120,228]){
   const pet={x:Math.round(area.x+(area.width-width)*fraction),y:Math.round(area.y+(area.height-width*1.25)*vertical),width,height:width*1.25};
   const copy={...pet},result=speechBounds(pet,area,height);
   assert(!overlap(pet,result),JSON.stringify({pet,result}));assert.deepEqual(pet,copy);
   assert(result.x>=area.x&&result.y>=area.y);assert(result.x+result.width<=area.x+area.width);assert(result.y+result.height<=area.y+area.height);
  }
 }
});
test('narrow screen falls back outside pet and reports physically impossible placement',()=>{
 const area={x:0,y:0,width:400,height:800};const pet={x:20,y:300,width:360,height:450};
 assert.equal(speechBounds(pet,area,100).placement,'above');
 assert.equal(speechBounds({...pet,y:0}, {...area,height:450},100).placement,'unavailable');
});
test('speech HTML CSP covers its exact inline script and uses textContent',async()=>{
 const html=await readFile(new URL('../electron/pet-speech.html',import.meta.url),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 assert(html.includes('sha256-'+createHash('sha256').update(script).digest('base64')));
 assert(script.includes('speech.textContent=text'));assert(!script.includes('innerHTML'));
});
