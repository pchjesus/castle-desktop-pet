import {createServer} from 'vite';import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const output='artifacts/b13-2';await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();
const report={passed:false,environment:'Chromium, native-window bridge simulated; Windows QA is separate',checks:[],errors:[],smokeCoordinates:[],commands:[]};let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM||undefined});const page=await browser.newPage({viewport:{width:180,height:225}});
 await page.addInitScript(()=>{window.__trace=[];window.pet={nativeWindow:true,reportAction:value=>window.__trace.push(value),onAction:fn=>{window.__manual=fn;return()=>{}},setPassthrough:()=>{},dragStart:()=>{},dragMove:()=>{},dragEnd:()=>{},showMenu:()=>{}};});
 page.on('pageerror',error=>report.errors.push(String(error)));
 const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 await page.goto(origin+'/?autonomy=false&dialogueEnabled=false');
 const stage='.pet-stage:not([data-exiting])';await page.waitForSelector(stage+' .b-smoking-anchor',{state:'attached'});
 for(const width of [120,180,240,360]){
  await page.setViewportSize({width,height:width*1.25});await page.waitForTimeout(50);
  const metrics=await page.locator(stage).evaluate(stage=>{const image=stage.querySelector('img'),anchor=stage.querySelector('.b-smoking-anchor'),layer=stage.querySelector('.b-smoking-layer');const a=image.getBoundingClientRect(),b=anchor.getBoundingClientRect(),scale=Math.min(a.width/image.naturalWidth,a.height/image.naturalHeight);const x=a.left+(a.width-image.naturalWidth*scale)/2+597*scale,y=a.top+(a.height-image.naturalHeight*scale)/2+282*scale;return {error:Math.hypot(b.x-x,b.y-y),duration:getComputedStyle(anchor.firstElementChild).animationDuration,iterations:getComputedStyle(anchor.firstElementChild).animationIterationCount,strands:anchor.children.length,pointer:getComputedStyle(layer).pointerEvents};});
  assert(metrics.error<1);assert.equal(metrics.duration,'2s');assert.equal(metrics.iterations,'infinite');assert.equal(metrics.strands,2);assert.equal(metrics.pointer,'none');report.smokeCoordinates.push({width,...metrics});
 }
 const animation=await page.locator(stage+' .b-smoke-strand').first().evaluate(el=>el.getAnimations()[0].currentTime);await page.waitForTimeout(2200);assert(await page.locator(stage+' .b-smoke-strand').first().evaluate((el,t)=>el.getAnimations()[0].currentTime>t+2000,animation));
 for(const time of [0,1999]){const opacity=await page.locator(stage+' .b-smoke-strand').first().evaluate((el,t)=>{el.getAnimations()[0].pause();el.getAnimations()[0].currentTime=t;return Number(getComputedStyle(el).opacity)},time);assert(opacity<.01);}
 await page.screenshot({path:output+'/smoking.png'});report.checks.push('two seamless 2s strands; cigarette source coordinates survive all four sizes');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);assert.equal(await page.locator('.b-smoking-layer').count(),0);await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForSelector('.b-smoking-layer');
 // Reproduce occlusion without falsely equating it to actual native hide.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 let id=0;
 for(const pose of ['idle','smoking','sitting','working','drawing','speaking','firing','dual_firing','firing_dynamic'])for(let repeat=0;repeat<2;repeat++){
  const commandId=++id;await page.evaluate(request=>window.__manual(request),{kind:'manual',id:commandId,pose});
  // Duplicate native show/resume signals must not reset the user action.
  await page.evaluate(()=>window.__manual('system:resume'));
  await page.waitForFunction(({id,pose})=>window.__trace.some(t=>t.commandId===id&&t.pose===pose&&['rendered','reused'].includes(t.phase)),{id:commandId,pose},{timeout:2500});
  const trace=await page.evaluate(id=>window.__trace.filter(t=>t.commandId===id),commandId);assert(trace.some(t=>t.phase==='accepted'));assert(!trace.some(t=>t.phase==='blocked'));if(['drawing','speaking','firing','dual_firing','firing_dynamic'].includes(pose))assert(trace.some(t=>t.phase==='rendered'&&t.pose===pose));report.commands.push({pose,repeat,trace});
 }
 report.checks.push('nine manual poses repeated under simulated menu occlusion and duplicate resume; render acknowledgements match each ID');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.__manual('system:suspend');window.__manual({kind:'manual',id:100,pose:'firing'});});assert(await page.evaluate(()=>window.__trace.some(t=>t.commandId===100&&t.phase==='blocked')));assert.equal(await page.locator('.b-smoking-layer').count(),0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});window.__manual('system:resume');document.dispatchEvent(new Event('visibilitychange'));window.__manual({kind:'manual',id:101,pose:'working'});});
 await page.waitForTimeout(4300);assert.equal(await page.locator(stage).getAttribute('data-pose'),'working');assert.equal(await page.locator('.b-smoking-layer').count(),0);report.checks.push('true native suspension blocks actions; resume clears old work; manual Working survives stale shot timers');
 await page.goto(origin+'/electron/pet-menu.html?autonomy=false&dialogueEnabled=true&movementFrequency=quiet&dialogueFrequency=active');await page.evaluate(()=>window.castleMenu={invoke:command=>window.__command=command,dismiss:()=>{}});
 assert.equal(await page.locator('#autonomy-setting').innerText(),'자율 움직임 OFF');assert.equal(await page.locator('#dialogue-setting').innerText(),'자율 대사 ON');assert.equal(await page.locator('[data-action="setting:movementFrequency:quiet"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-action="setting:dialogueFrequency:active"]').getAttribute('aria-pressed'),'true');await page.locator('[data-action="setting:dialogueFrequency:quiet"]').click();assert.equal(await page.evaluate(()=>window.__command),'setting:dialogueFrequency:quiet');await page.screenshot({path:output+'/menu.png'});report.checks.push('independent settings and frequency controls reflect restored values and route commands');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.errors.push(String(error));process.exitCode=1;}finally{await browser?.close();await server.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2));console.log({...report,commands:report.commands.map(({pose,repeat})=>({pose,repeat}))});}
