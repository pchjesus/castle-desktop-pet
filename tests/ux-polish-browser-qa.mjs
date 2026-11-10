import {createServer} from 'vite';import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const output='artifacts/b13-3';await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();let browser;
const report={passed:false,environment:'Chromium browser; native Windows is a separate workflow',checks:[],errors:[],menu:[],smoke:{}};
try{
 browser=await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM||undefined});const page=await browser.newPage({viewport:{width:560,height:610}});const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 page.on('pageerror',error=>report.errors.push(String(error)));
 await page.addInitScript(()=>{Math.random=()=>.1;window.pet={nativeWindow:true,onAction:fn=>{window.__manual=fn;return()=>{}},showSpeech:text=>{window.__line=text},showMenu:()=>{},setPassthrough:()=>{},dragStart:()=>{},dragMove:()=>{},dragEnd:()=>{}};window.castleMenu={invoke:command=>{window.__command=command},dismiss:()=>{window.__dismissed=true},windowControl:command=>{window.__windowControl=command},getInfo:async()=>({status:{pose:'sitting',base:'smoking',autonomy:false,dialogueEnabled:true,autoFire:false,movementFrequency:'default',dialogueFrequency:'active',movementIntervalMin:3,dialogueIntervalMin:5,shotCooldownMin:4},dialogues:[{id:'B14-SIT-01',text:'자, 최후변론을 해라',origin:'original candidate pending verification',approval:'confirmed',poses:['sitting'],triggers:['pose-entry']},{id:'B14-DRAW-01',text:'웃음이 최후변론인가',origin:'original candidate pending verification',approval:'confirmed',poses:['drawing'],triggers:['pose-entry']},{id:'C-08',text:'왜 그러지?',origin:'original creative',approval:'proposed',poses:[],triggers:['click']}]})};});
 await page.goto(origin+'/electron/pet-menu.html?autonomy=false&dialogueEnabled=true');
 for(const tab of ['basic','frequency','poses','more']){
  await page.locator('[data-tab="'+tab+'"]').click();const metrics=await page.locator('[data-panel="'+tab+'"]').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,buttons:el.querySelectorAll('button').length}));report.menu.push({tab,...metrics});await page.screenshot({path:output+'/menu-'+tab+'-browser.png'});assert(metrics.height>0&&(tab==='frequency'||metrics.scroll<=metrics.height+1));if(tab==='more')assert.equal(await page.locator('[data-more-view="home"] [data-more-open]').count(),6);
 }
 const panel=await page.locator('main').evaluate(el=>{const style=getComputedStyle(el);return {background:style.backgroundColor,radius:style.borderRadius,opacity:parseFloat(style.backgroundColor.split(',').at(-1)),blur:style.backdropFilter}});
 assert(panel.background.includes('rgba('));assert(panel.opacity>=.9);assert.equal(panel.radius,'0px');assert.equal(panel.blur,'none');
 for(const corner of ['nw','ne','sw','se']){
  const el=page.locator('[data-resize-corner="'+corner+'"]');assert.equal(await el.count(),1);
  assert(await el.isVisible());
  const b=await el.boundingBox();assert(b);
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  await page.mouse.down();await page.mouse.move(b.x+b.width/2+(corner.includes('w')?-10:10),b.y+b.height/2+(corner.includes('n')?-10:10),{steps:3});
  await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.__windowControl),'resize:'+corner+':end');
 }
 report.checks.push('near-black square panel and four functional corner drag controls');
 assert((await page.locator('main').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>=14);
 await page.locator('#tab-frequency').click();
 assert.equal(await page.locator('.minute-slider').count(),3);
 // Count alone misses visually hidden sliders: verify track geometry and alignment.
 const minuteLayout=await page.evaluate(()=>{
  const p=document.querySelector('#panel-frequency').getBoundingClientRect();
  const rows=[...document.querySelectorAll('.minute-control')].map(row=>{
   const input=row.querySelector('input[type="range"]'),r=input.getBoundingClientRect(),label=row.querySelector('.minute-heading').getBoundingClientRect(),output=row.querySelector('output').getBoundingClientRect(),style=getComputedStyle(input);
   return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:style.display,visibility:style.visibility,appearance:style.appearance,labelLeft:label.left,outputRight:output.right};
  });
  return {panel:{top:p.top,bottom:p.bottom},rows};
 });
 assert.equal(minuteLayout.rows.length,3);
 for(const row of minuteLayout.rows){
  assert(row.width>=180&&row.height>=20&&row.display!=='none'&&row.visibility!=='hidden'&&row.appearance==='none','minute slider track missing: '+JSON.stringify(row));
  assert(row.top>=minuteLayout.panel.top&&row.bottom<=minuteLayout.panel.bottom+1,'minute slider outside default viewport: '+JSON.stringify(minuteLayout));
 }
 assert(Math.max(...minuteLayout.rows.map(r=>r.labelLeft))-Math.min(...minuteLayout.rows.map(r=>r.labelLeft))<2,'minute labels not aligned');
 assert(Math.max(...minuteLayout.rows.map(r=>r.outputRight))-Math.min(...minuteLayout.rows.map(r=>r.outputRight))<2,'minute values not aligned');
 report.checks.push('all three minute sliders visible, styled and aligned in default menu');
 for(const [key,value] of [['movementIntervalMin','1'],['dialogueIntervalMin','15'],['shotCooldownMin','8']]){
  const slider=page.locator('[data-minute-key="'+key+'"]');
  await slider.evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);
  assert.equal(await page.evaluate(()=>window.__command),'setting:interval:'+key+':'+value);
 }
 await page.screenshot({path:output+'/menu-time-sliders-browser.png'});
 await page.locator('#edit-action-weights').click();
 assert.equal(await page.locator('.action-weight-row').count(),9);
 const working=page.locator('[data-weight-row="working"] input[type="range"]');
 await working.evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await page.evaluate(()=>window.__command),'setting:weight:working:20');
 assert((await page.locator('[data-weight-row="working"] .weight-value').innerText()).includes('20'));
 await page.screenshot({path:output+'/menu-action-weights-browser.png'});
 await page.locator('#weights-reset').click();
 assert.equal(await page.evaluate(()=>window.__command),'setting:weights:reset');
 await page.locator('[data-frequency-back]').click();
 assert(await page.locator('#edit-action-weights').isVisible());
 await page.setViewportSize({width:360,height:450});
 await page.locator('#tab-frequency').click();
 const compact=await page.evaluate(()=>{
  const panel=document.querySelector('#panel-frequency');
  return {overflow:panel.scrollWidth-panel.clientWidth,count:panel.querySelectorAll('.minute-slider').length};
 });
 assert.equal(compact.count,3);
 assert(compact.overflow<=2,'compact frequency tab horizontally overflows: '+JSON.stringify(compact));
 for(const slider of await page.locator('.minute-slider').all()){await slider.scrollIntoViewIfNeeded();assert(await slider.isVisible());}
 await page.screenshot({path:output+'/menu-frequency-compact-browser.png'});
 await page.setViewportSize({width:560,height:610});
 report.checks.push('compact menu scrolls with all three sliders accessible');
 await page.locator('#tab-more').click();
 await page.setViewportSize({width:850,height:790});
 await page.locator('#tab-more').click();
 await page.locator('[data-more-open="personalize"]').click();
 assert(await page.locator('#position-lock-toggle').isVisible());
 await page.locator('#position-lock-toggle').click();
 assert.equal(await page.evaluate(()=>window.__command),'setting:positionLock:true');
 await page.locator('[data-style="original"]').click();
 assert.equal(await page.evaluate(()=>window.__command),'setting:dialogueStyle:original');
 assert.equal(await page.locator('[data-style="original"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-more-back]').first().click();
 await page.locator('[data-more-open="archive"]').click();
 await page.waitForFunction(()=>document.querySelector('#archive-count')?.textContent?.includes('3'));
 assert.equal(await page.locator('.archive-item').count(),3);
 await page.fill('#dialogue-search','최후변론');assert.equal(await page.locator('.archive-item').count(),2);
 await page.locator('.archive-item [data-favorite-type="dialogue"]').first().click();
 assert((await page.evaluate(()=>window.__command)).startsWith('favorite:add:dialogue:'));
 const bookmarked=(await page.evaluate(()=>window.__command)).split(':').at(-1);
 await page.locator('[data-more-back]').first().click();
 await page.locator('[data-more-open="favorites"]').click();
 assert.equal(await page.locator('#favorites-results .favorite-entry').count(),1);
 await page.locator('#favorites-results [data-favorite-play]').click();
 assert.equal(await page.evaluate(()=>window.__command),'favorite:play:dialogue:'+bookmarked);
 await page.locator('#favorites-results [data-favorite-type="dialogue"]').click();
 assert.equal(await page.locator('#favorites-results .favorite-entry').count(),0);
 report.checks.push('B19 position lock, dialogue-style selection and local favorite replay');
 await page.locator('[data-more-back]').first().click();
 await page.locator('#dialogue-pose').selectOption('sitting');assert.equal(await page.locator('.archive-item').count(),1);
 assert((await page.locator('#archive-results').innerText()).includes('자, 최후변론을 해라'));
 await page.locator('#dialogue-pose').selectOption('all');await page.locator('#dialogue-origin').selectOption('creative');assert.equal(await page.locator('.archive-item').count(),0);
 await page.locator('[data-more-view="archive"] [data-more-back]').click();await page.locator('[data-more-open="status"]').click();
 assert((await page.locator('#status-list').innerText()).includes('자동 사격'));
 assert((await page.locator('#status-list').innerText()).includes('앉기'));
 await page.locator('[data-more-view="status"] [data-more-back]').click();await page.locator('[data-more-open="help"]').click();assert((await page.locator('.more-help').innerText()).includes('연속 5회'));
 await page.locator('#tab-basic').click();await page.selectOption('#pet-size','240');assert.equal(await page.evaluate(()=>window.__command),'size:240');
 await page.locator('#tab-basic').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-frequency').getAttribute('aria-selected'),'true');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__dismissed),true);
 report.checks.push('560px roomy glass menu: four tabs, 9 per-action sliders, reset, keyboard, sizing and dialogue readability');
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
