// Browser compositor evidence, explicitly not a Windows/native GUI test.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {headBounds} from '../electron/head-geometry.mjs';
import {speechBounds} from '../electron/speech-bounds.mjs';
const output='artifacts/b13-1';await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const report={environment:'Chromium browser + simulated desktop; NOT Windows',passed:false,checks:[],errors:[],timing:{},captures:[]};
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM||undefined});
 const page=await browser.newPage({viewport:{width:1100,height:720}});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{
  window.pet={onAction:fn=>{window.__manual=fn;return()=>{}},showSpeech:text=>parent.postMessage({kind:'pet-speech',text},'*'),setPassthrough:value=>{window.__passthrough=value},dragStart:()=>{},dragMove:()=>{},dragEnd:()=>{},showMenu:()=>{}};
  window.castleSpeech={onText:fn=>{window.__text=fn;return()=>{}},measure:height=>parent.postMessage({kind:'speech-measure',height},'*')};
 });
 let size=180,pet={x:460,y:450,width:180,height:225},height=180;
 let speechFrame,petFrame;
 const layout=async()=>{
  const bounds=speechBounds(pet,{x:0,y:0,width:1100,height:720},height);
  assert.notEqual(bounds.placement,'unavailable');
  await page.locator('#speech-surface').evaluate((el,b)=>Object.assign(el.style,{left:b.x+'px',top:b.y+'px',width:b.width+'px',height:b.height+'px'}),bounds);
  return bounds;
 };
 await page.exposeFunction('measureSpeech',async h=>{if(height!==h){height=h;await layout();}});
 await page.exposeFunction('speechFromPet',async text=>{if(speechFrame){await speechFrame.evaluate(text=>window.__text(text),text);await page.locator('#speech-surface').evaluate((el,show)=>el.style.visibility=show?'visible':'hidden',!!text);}});
 await page.setContent(`<style>body{margin:0;background:#f5f5f5}iframe{position:absolute;border:0;background:transparent}#label{position:absolute;top:16px;left:20px;font:14px system-ui;color:#737373}</style><div id="label">B-13.1 browser composition (not Windows)</div><iframe id="pet-surface" src="${origin}/?autonomy=false"></iframe><iframe id="speech-surface" src="${origin}/electron/pet-speech.html"></iframe>`);
 await page.evaluate(()=>window.addEventListener('message',event=>{if(event.data?.kind==='pet-speech')window.speechFromPet(event.data.text);if(event.data?.kind==='speech-measure')window.measureSpeech(event.data.height);}));
 const pf=page.locator('#pet-surface'),sf=page.locator('#speech-surface');
 petFrame=await (await pf.elementHandle()).contentFrame();speechFrame=await(await sf.elementHandle()).contentFrame();
 await petFrame.waitForFunction(()=>window.__manual&&document.querySelector('.b-presentation img')?.complete);
 await speechFrame.waitForFunction(()=>window.__text);
 const current='.pet-stage:not([data-exiting]) img';
 const line='너까지 움직일 필요도 없다. 이 간격 안에선 하나님이 온다 한들 못 피하니까.';
 for(size of [120,180,240,360]){
  pet={x:Math.round((1100-size)/2),y:704-size*1.25,width:size,height:size*1.25};
  await pf.evaluate((el,p)=>Object.assign(el.style,{left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.height+'px'}),pet);await layout();
  await petFrame.evaluate(()=>window.__manual('smoking'));
  for(const [name,background] of [['light','#f5f5f5'],['dark','#151922'],['checker','repeating-conic-gradient(#ddd 0% 25%,#999 0% 50%) 0 0 / 24px 24px']]){
   await page.evaluate(background=>document.body.style.background=background,background);
   await speechFrame.evaluate(text=>window.__text(text),line);await sf.evaluate(el=>el.style.visibility='visible');
   await page.waitForTimeout(220);const bounds=await layout();
   const content=await speechFrame.locator('#speech').boundingBox();
   assert(content.width<=bounds.width&&content.height<=bounds.height);
   const image=await petFrame.locator(current).boundingBox();assert(image.height>0);
   const head=headBounds(pet);assert(content.x+content.width<=head.x||content.x>=head.x+head.width||content.y+content.height<=head.y||content.y>=head.y+head.height);
   assert.equal(await speechFrame.locator('#speech').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
   const nameOut=`${size}-${name}.png`;await page.screenshot({path:`${output}/${nameOut}`});report.captures.push(nameOut);
  }
 }
 report.checks.push('12 browser compositions: 120/180/240/360px × light/dark/checker; long speech stays clear of the protected head; pointer-events none');
 // Native-sized pet capture with its background omitted preserves PNG alpha.
 await sf.evaluate(el=>el.style.visibility='hidden');await page.evaluate(()=>document.body.style.background='transparent');
 await pf.screenshot({path:`${output}/pet-alpha.png`,omitBackground:true});
 const alpha=await petFrame.locator(current).evaluate(im=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);return [g.getImageData(0,0,1,1).data[3],getComputedStyle(document.body).backgroundColor,getComputedStyle(document.documentElement).backgroundColor];});
 assert.deepEqual(alpha,[0,'rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);report.checks.push('approved image and live HTML/body have clear alpha');
 for(const pose of ['idle','smoking','sitting','drawing','firing','dual_firing','firing_dynamic','speaking','working']){
  await petFrame.evaluate(p=>window.__manual(p),pose);
  await petFrame.waitForFunction(p=>document.querySelector('.pet-stage:not([data-exiting])')?.dataset.pose===p,pose,{timeout:2500});
  assert(await petFrame.locator(current).evaluate(im=>im.complete&&im.naturalWidth>0));
 }
 report.checks.push('all nine approved runtime poses load');
 await petFrame.evaluate(()=>{window.__frames=[];new MutationObserver(()=>{const src=document.querySelector('.pet-stage:not([data-exiting]) img')?.getAttribute('src');if(src?.includes('speaking-')&&!window.__frames.includes(src))window.__frames.push(src);}).observe(document.querySelector('#app'),{subtree:true,childList:true,attributes:true,attributeFilter:['src']});window.__manual('speaking');});
 await petFrame.waitForFunction(()=>window.__frames.length===7,null,{timeout:4500});
 const frames=await petFrame.evaluate(()=>window.__frames);assert.deepEqual(frames.map(s=>s.match(/speaking-(\d+)/)[1]),['01','02','03','04','05','06','07']);report.checks.push('approved seven Speaking frames retain their order');
 await petFrame.evaluate(()=>{window.__manual('settings:'+JSON.stringify({base:'smoking',autonomy:false,autoFire:false}));window.__timeline=[];document.querySelector('#app').addEventListener('pet-state',e=>window.__timeline.push([e.detail,performance.now()]));window.__start=performance.now();window.__manual('firing_dynamic');});
 await speechFrame.waitForFunction(()=>document.querySelector('#speech')?.textContent==='그런 건 중요한 게 아니다, 애송아.');
 await petFrame.waitForFunction(()=>window.__timeline.some(([p])=>p==='firing_dynamic'),null,{timeout:2000});
 assert(await speechFrame.locator('#speech').evaluate(el=>el.classList.contains('visible')));
 await petFrame.waitForFunction(()=>window.__timeline.some(([p,t])=>p==='smoking'&&t>(window.__timeline.find(([p])=>p==='firing_dynamic')?.[1]??Infinity)),null,{timeout:4000});
 report.timing=await petFrame.evaluate(()=>{const shot=window.__timeline.find(([p])=>p==='firing_dynamic')[1];const end=window.__timeline.find(([p,t])=>p==='smoking'&&t>shot)[1];return {startDelayMs:shot-window.__start,returnAfterShotMs:end-shot-1500};});
 assert(report.timing.startDelayMs>=800&&report.timing.startDelayMs<=1200);assert(report.timing.returnAfterShotMs>=700&&report.timing.returnAfterShotMs<=1000);
 report.checks.push('real browser Dynamic timeline and independent visible speech');
 await petFrame.evaluate(()=>{window.__manual('firing_dynamic');window.__manual('working');});await page.waitForTimeout(4200);
 assert.equal(await petFrame.locator('.pet-stage:not([data-exiting])').getAttribute('data-pose'),'working');
 assert.equal(await petFrame.locator('[data-exiting]').count(),0);assert.equal(await speechFrame.locator('#speech').evaluate(el=>el.classList.contains('visible')),false);report.checks.push('manual interruption removes stale transitions/timers');
 await page.emulateMedia({reducedMotion:'reduce'});await petFrame.evaluate(()=>window.__manual('speaking'));await page.waitForTimeout(180);
 assert.equal(await petFrame.locator(current).evaluate(im=>getComputedStyle(im).animationName),'none');
 assert.equal(await petFrame.locator('[data-exiting]').count(),0);assert((await petFrame.locator(current).getAttribute('src')).includes('speaking-01'));
 await page.waitForTimeout(1250);assert(!(await petFrame.locator(current).getAttribute('src')).includes('speaking-02'));report.checks.push('Reduced Motion keeps approved still and dialogue; no crossfade/recoil');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.errors.push(String(error));process.exitCode=1;}finally{await browser?.close();await server.close();await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log(report);}
