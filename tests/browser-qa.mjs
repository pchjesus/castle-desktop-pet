import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {createReadStream,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hashes={idle:'c95006e4e7c05151839bd6f42d35b02b0a24df023ac9014e7c33494645a73b78',smoking:'b5977a66edc65b4d669e3a2f416e35c37fcb6248bdaefb0512fb0bb67ca86391',sitting:'002f75af76599a91e93f911581d1a78117119d1c05c5be7a5d62df29c345cfe5'};
const output=resolve('artifacts/visual-qa');mkdirSync(output,{recursive:true});
const errors=[],checks=[];
const record=(label)=>checks.push({name:label,passed:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname.slice(1)||'preview.html';
 if(p==='favicon.ico'){res.writeHead(204);res.end();return;}
 if(!/^(preview\.html|preview-assets\/[\w.-]+)$/.test(p)){res.writeHead(404);res.end('Not found');return;}
 res.setHeader('Content-Type',p.endsWith('.html')?'text/html;charset=utf8':p.endsWith('.jpg')?'image/jpeg':'image/png');
 createReadStream(p).on('error',()=>{res.destroy()}).pipe(res);
});
await new Promise(resolveServer=>server.listen(0,'127.0.0.1',resolveServer));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CASTLE_CHROMIUM||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1024},acceptDownloads:true});
 page.on('pageerror',e=>errors.push('pageerror '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 page.on('requestfailed',r=>errors.push('requestfailed '+r.url()+' '+r.failure()?.errorText));
 await page.goto('http://127.0.0.1:'+server.address().port+'/preview.html',{waitUntil:'load'});
 await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===956;});
 const first=await page.locator('#pet .pet-stage img').getAttribute('src');
 assert(/idle[-.]/.test(first),'Desktop must display B idle candidate');
 const checkHash=async pose=>{await page.waitForFunction(name=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth>0&&im.currentSrc.includes('/'+name+'-');},pose);const url=await page.locator('#pet .pet-stage img').evaluate(im=>im.currentSrc);const response=await page.request.get(url);assert(response.ok());assert.equal(createHash('sha256').update(await response.body()).digest('hex'),hashes[pose]);record('approved '+pose+' bytes');};
 await checkHash('idle');
 record('later B is the actual desktop default, not a legacy source');
 for(const width of [180,240,360]){
  await page.locator('#size').selectOption(String(width));
  await page.locator('#state').selectOption('idle');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===956;});
  const bounding=await page.locator('#pet').boundingBox();assert(Math.abs(bounding.width-width)<2);record('real B desktop idle size '+width);
  await page.locator('#desktop').screenshot({path:resolve(output,'desktop-b-idle-'+width+'.png')});
  await page.locator('#state').selectOption('working');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===1024;});record('B working load '+width);
  await page.locator('#state').selectOption('drawing');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===1024;});record('B drawing load '+width);
  await page.locator('#state').selectOption('firing');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===1024;});record('B firing load '+width);
  await page.waitForFunction(()=>document.querySelector('#state')?.value==='idle',null,{timeout:5000});record('B firing returns idle '+width);
  await page.locator('#state').selectOption('smoking');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===1003;});record('B smoking load '+width);await checkHash('smoking');
  await page.locator('#state').selectOption('sitting');
  await page.waitForFunction(()=>{const im=document.querySelector('#pet .pet-stage img');return im?.complete&&im.naturalWidth===1003;});record('B sitting load '+width);await checkHash('sitting');
  await page.locator('#state').selectOption('idle');
 }
 for(const name of ['speaking','dual_firing','firing_dynamic']) {
  await page.locator('#state').selectOption(name);
  await page.locator('#pet .placeholder').waitFor();
  assert((await page.locator('#pet').innerText()).includes(name));record('unapproved B state does not substitute legacy '+name);
 }
 await page.locator('#state').selectOption('idle');
 assert.equal(await page.locator('#canonical-action option').count(),9);record('nine official B sources in visual review');
 for(const width of [180,240,360]){
  await page.locator('#canonical-size').selectOption(String(width));
  for(const name of ['idle','sitting','drawing','firing','smoking','working','firing_dynamic','dual_firing','speaking_reference']){
   await page.locator('#canonical-action').selectOption(name);
   await page.waitForFunction(()=>[...document.querySelectorAll('#canonical-original,#canonical-candidate')].every(im=>im.complete&&im.naturalWidth>0),null,{timeout:20000});record('canonical B '+name+' '+width);
  }
  await page.locator('.canonical-review').screenshot({path:resolve(output,'canonical-b-'+width+'.png')});
 }
 for(const bg of ['light','dark','checker']){
  await page.locator('#canonical-bg').selectOption(bg);record('canonical background '+bg);
 }
 for(const version of ['clean','aligned','revised']){
  await page.locator('#canonical-version').selectOption(version);
  await page.locator('#canonical-action').selectOption('idle');
  await page.waitForFunction(()=>document.querySelector('#canonical-candidate')?.naturalWidth>0);
  record('canonical B version '+version);
 }
 await page.locator('#canonical-action').selectOption('speaking_reference');
 await page.locator('#canonical-version').selectOption('revised');
 for(let i=0;i<7;i++){
  await page.locator('#canonical-speaking').selectOption(String(i));
  await page.waitForFunction(()=>document.querySelector('#canonical-candidate')?.complete&&document.querySelector('#canonical-candidate')?.naturalWidth>0);
  record('speaking head frame '+(i+1));
 }
 for(const width of [180,240,360]){
  await page.locator('#b-size').selectOption(String(width));
  await page.locator('#b-action').selectOption('firing');await page.locator('#b-start').click();
  await page.waitForFunction(()=>document.querySelector('#b-action-image')?.dataset.pose==='firing',null,{timeout:8000});
  await page.waitForFunction(()=>document.querySelector('#b-action-image')?.dataset.pose==='idle',null,{timeout:8000});
  record('B isolated firing complete '+width);
 }
 await page.locator('#b-action').selectOption('working');await page.locator('#b-start').click();await page.locator('#b-cancel').click();
 assert.equal(await page.locator('#b-action-image').getAttribute('data-pose'),'idle');record('B review cancellation');
 await page.locator('#user-review-action').selectOption('dual_firing');
 await page.locator('#user-review-decision').selectOption('needs_revision');await page.locator('#user-review-note').fill('추가 마스크 정제 필요');
 const downloadPromise=page.waitForEvent('download');await page.locator('#user-review-export').click();const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'castle-b-review.json');record('review JSON exported');
 assert.deepEqual(errors,[],'Browser console/resource errors: '+errors.join('\n'));
 record('zero browser console errors');
 writeFileSync(resolve(output,'report.json'),JSON.stringify({passed:true,checks,errors},null,2));
 console.log('B canonical visual browser QA PASS:',checks.length,'checks');
}catch(e){
 errors.push(String(e));writeFileSync(resolve(output,'report.json'),JSON.stringify({passed:false,checks,errors},null,2));
 console.error('B canonical visual browser QA FAIL',e);process.exitCode=1;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
