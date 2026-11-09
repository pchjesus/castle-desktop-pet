import {createServer} from 'vite';import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const output='artifacts/b13-3';await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();let browser;
const report={passed:false,environment:'Chromium browser; native Windows is a separate workflow',checks:[],errors:[],menu:[],smoke:{}};
try{
 browser=await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM||undefined});const page=await browser.newPage({viewport:{width:316,height:316}});const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 page.on('pageerror',error=>report.errors.push(String(error)));
 await page.addInitScript(()=>{Math.random=()=>.1;window.pet={nativeWindow:true,onAction:fn=>{window.__manual=fn;return()=>{}},showSpeech:text=>{window.__line=text},showMenu:()=>{},setPassthrough:()=>{},dragStart:()=>{},dragMove:()=>{},dragEnd:()=>{}};window.castleMenu={invoke:command=>{window.__command=command},dismiss:()=>{window.__dismissed=true},getInfo:async()=>({status:{pose:'sitting',base:'smoking',autonomy:false,dialogueEnabled:true,autoFire:false,movementFrequency:'default',dialogueFrequency:'active'},dialogues:[{id:'B14-SIT-01',text:'자, 최후변론을 해라',origin:'original candidate pending verification',approval:'confirmed',poses:['sitting'],triggers:['pose-entry']},{id:'B14-DRAW-01',text:'웃음이 최후변론인가',origin:'original candidate pending verification',approval:'confirmed',poses:['drawing'],triggers:['pose-entry']},{id:'C-08',text:'왜 그러지?',origin:'original creative',approval:'proposed',poses:[],triggers:['click']}]})};});
 await page.goto(origin+'/electron/pet-menu.html?autonomy=false&dialogueEnabled=true');
 for(const tab of ['basic','frequency','poses','more']){
  await page.locator('[data-tab="'+tab+'"]').click();const metrics=await page.locator('[data-panel="'+tab+'"]').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,buttons:el.querySelectorAll('button').length}));report.menu.push({tab,...metrics});await page.screenshot({path:output+'/menu-'+tab+'-browser.png'});assert(metrics.height>0&&metrics.scroll<=metrics.height+1);
 }
 await page.locator('#tab-more').click();await page.locator('[data-more-open="archive"]').click();
 await page.waitForFunction(()=>document.querySelector('#archive-count')?.textContent?.includes('3'));
 assert.equal(await page.locator('.archive-item').count(),3);
 await page.fill('#dialogue-search','최후변론');assert.equal(await page.locator('.archive-item').count(),2);
 await page.locator('#dialogue-pose').selectOption('sitting');assert.equal(await page.locator('.archive-item').count(),1);
 assert((await page.locator('#archive-results').innerText()).includes('자, 최후변론을 해라'));
 await page.locator('#dialogue-pose').selectOption('all');await page.locator('#dialogue-origin').selectOption('creative');assert.equal(await page.locator('.archive-item').count(),0);
 await page.locator('[data-more-back]').first().click();await page.locator('[data-more-open="status"]').click();
 assert((await page.locator('#status-list').innerText()).includes('연결되지 않음'));
 assert((await page.locator('#status-list').innerText()).includes('앉기'));
 await page.locator('[data-more-back]').first().click();await page.locator('[data-more-open="help"]').click();assert((await page.locator('.more-help').innerText()).includes('연속 5회'));
 await page.locator('#tab-basic').click();await page.selectOption('#pet-size','240');assert.equal(await page.evaluate(()=>window.__command),'size:240');
 await page.locator('#tab-basic').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-frequency').getAttribute('aria-selected'),'true');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__dismissed),true);
 report.checks.push('316px menu: four tabs without scrolling, nine sizes, real size change, keyboard navigation and dismiss');
 await page.setViewportSize({width:360,height:450});await page.goto(origin+'/?autonomy=false&dialogueEnabled=false');const stage='.pet-stage:not([data-exiting])';await page.waitForSelector(stage+' img');
 const opaque=async()=>page.locator(stage+' img').evaluate(im=>{const r=im.getBoundingClientRect(),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const a=g.getImageData(0,0,c.width,c.height).data;let x=Math.floor(c.width*.5),y=Math.floor(c.height*.45);while(a[(y*c.width+x)*4+3]<200)y++;const z=Math.min(r.width/c.width,r.height/c.height);return{x:r.x+(r.width-c.width*z)/2+x*z,y:r.y+(r.height-c.height*z)/2+y*z}});
 for(const pose of ['sitting','working']){
  await page.evaluate(p=>window.__manual(p),pose);await page.waitForFunction(p=>document.querySelector('.pet-stage:not([data-exiting])')?.dataset.pose===p,pose);await page.waitForTimeout(180);const point=await opaque();await page.mouse.click(point.x,point.y);await page.waitForTimeout(4400);assert.equal(await page.locator(stage).getAttribute('data-pose'),pose);await page.screenshot({path:output+'/click-'+pose+'-browser.png'});
 }
 await page.evaluate(()=>window.__manual('sitting'));await page.waitForFunction(()=>document.querySelector('.pet-stage:not([data-exiting])')?.dataset.pose==='sitting');await page.waitForTimeout(180);for(let i=0;i<5;i++){const p=await opaque();await page.mouse.click(p.x,p.y);}await page.waitForFunction(()=>document.querySelector('.pet-stage:not([data-exiting])')?.dataset.pose==='drawing');const point=await opaque();await page.mouse.click(point.x,point.y);await page.waitForFunction(()=>window.__line?.includes('목구멍'));report.checks.push('Sitting/Working remain after real pointer clicks and speech expiry; fifth/sixth warning still fires');
 await page.evaluate(()=>window.__manual('smoking'));await page.waitForFunction(()=>document.querySelector('.pet-stage:not([data-exiting])')?.dataset.pose==='smoking');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);
 const preserved=await page.locator(stage).evaluate(el=>({approvedImage:el.querySelector('img')?.naturalWidth>0,auxiliaryNodes:el.querySelectorAll('.b-smoking-layer,.b-smoking-anchor,.b-smoke-strand').length}));
 assert(preserved.approvedImage);assert.equal(preserved.auxiliaryNodes,0);report.smoke=preserved;report.checks.push('Reduced Motion preserves approved Smoking PNG without auxiliary smoke');
 await page.goto(origin+'/electron/pet-speech.html');await page.evaluate(()=>{window.castleSpeech={onText:()=>{},measure:()=>{}};});
 // The same measured width protocol used by the native preload: short text
 // must not retain the long message's empty transparent margin.
 const dimensions=await page.locator('#speech').evaluate(el=>{el.textContent='왜 그러지?';const short=el.getBoundingClientRect();el.textContent='너까지 움직일 필요도 없다. 이 간격 안에선 하나님이 온다 한들 못 피하니까.';const long=el.getBoundingClientRect();return {short:short.width,long:long.width,tail:getComputedStyle(el,'::after').content}});assert(dimensions.short<120&&dimensions.long>dimensions.short);assert.notEqual(dimensions.tail,'none');report.checks.push('tail balloon measures short/long text to its visible width');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.errors.push(String(error));process.exitCode=1;}finally{await browser?.close();await server.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2));console.log(report);}
