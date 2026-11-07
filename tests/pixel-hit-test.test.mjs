import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {extractAlpha,hitTestAlpha} from '../src/renderer/alpha-hit-test.mjs';
test('alpha mask maps visible and clear pixels to their precise on-screen positions',()=>{
 const w=4,h=4;
 const rgba=new Uint8ClampedArray(w*h*4);
 rgba[(1*w+1)*4+3]=255;
 rgba[(2*w+2)*4+3]=80;
 const mask=extractAlpha(rgba,w,h);
 const rect={left:100,top:50,width:40,height:40};
 assert.equal(hitTestAlpha(mask,rect,115,65),true);
 assert.equal(hitTestAlpha(mask,rect,125,75),true);
 assert.equal(hitTestAlpha(mask,rect,105,55),false);
 assert.equal(hitTestAlpha(mask,rect,135,85),false);
 assert.equal(hitTestAlpha(mask,rect,99,65),false);
});
test('object-fit contain letterbox is not clickable',()=>{
 const rgba=new Uint8Array(2*4*4);
 for(let i=3;i<rgba.length;i+=4)rgba[i]=255;
 const mask=extractAlpha(rgba,2,4);
 const rect={left:0,top:0,width:100,height:100};
 assert.equal(hitTestAlpha(mask,10,10,10),false); // Invalid rect fails closed.
 assert.equal(hitTestAlpha(mask,rect,10,50),false);
 assert.equal(hitTestAlpha(mask,rect,30,50),true);
 assert.equal(hitTestAlpha(mask,rect,80,50),false);
});
test('almost-transparent halo should pass through but soft effect remains clickable above threshold',()=>{
 const rgba=new Uint8ClampedArray(2*2*4);
 rgba[3]=7;rgba[7]=25;rgba[11]=24;rgba[15]=0;
 const mask=extractAlpha(rgba,2,2);
 const rect={left:0,top:0,width:20,height:20};
 assert.equal(hitTestAlpha(mask,rect,5,5),false);
 assert.equal(hitTestAlpha(mask,rect,15,5),true);
 assert.equal(hitTestAlpha(mask,rect,5,15),true);
 assert.equal(hitTestAlpha(mask,rect,15,15),false);
});
test('mouse handling is DOM driven and native drag capture is removed',async()=>{
 const css=await (await import('node:fs/promises')).readFile(new URL('../src/style.css',import.meta.url),'utf8');
 const runtime=await (await import('node:fs/promises')).readFile(new URL('../src/renderer/mouse-interaction.ts',import.meta.url),'utf8');
 const main=await (await import('node:fs/promises')).readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 assert(!css.includes('-webkit-app-region:drag'));
 assert(runtime.includes('contextmenu'));
 assert(runtime.includes('hitTestAlpha'));
 assert(main.includes("setIgnoreMouseEvents(ignore,ignore?{forward:true}:{})"));
 assert(!main.includes("win.webContents.on('context-menu'"));
});
