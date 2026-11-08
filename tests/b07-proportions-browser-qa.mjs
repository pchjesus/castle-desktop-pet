import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname.slice(1)||'preview.html';
  if(path==='favicon.ico'){res.writeHead(204);res.end();return;}
  if(!/^(preview\.html|preview-assets\/[\w.-]+)$/.test(path)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',path.endsWith('.html')?'text/html':path.endsWith('.jpg')?'image/jpeg':'image/png');
  createReadStream(path).on('error',()=>res.destroy()).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
await mkdir('artifacts/b07-review',{recursive:true});
let browser;const result={passed:false,checks:[],errors:[]};
try{
  browser=await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM||undefined});
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  page.on('pageerror',error=>result.errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const pose of ['idle','smoking','sitting']){
    await page.selectOption('#b07-pose',pose);
    await page.waitForFunction(()=>[...document.querySelectorAll('.b07-content img')].length===5&&[...document.querySelectorAll('.b07-content img')].every(im=>im.complete&&im.naturalWidth>0));
    const sources=await page.locator('.b07-content img').evaluateAll(images=>images.map(im=>im.src));
    assert.notEqual(sources[0],sources[1]);
    for(const size of ['180','240','360']){
      await page.selectOption('#b07-size',size);
      const widths=await page.locator('.b07-stage').evaluateAll(stages=>stages.map(el=>el.getBoundingClientRect().width));
      assert(widths.every(width=>Math.abs(width-Number(size))<1));
      assert.equal(await page.locator('.b07-head').count(),5);
      result.checks.push(`${pose} original/candidate/references load at ${size}px`);
    }
    await page.selectOption('#b07-size','180');
    await page.locator('.b07-review').screenshot({path:`artifacts/b07-review/${pose}.png`});
  }
  await page.uncheck('#b07-guides');assert(await page.locator('.b07-panels').evaluate(el=>el.classList.contains('b07-hide-guides')));
  await page.selectOption('#b07-bg','dark');assert.equal(await page.locator('.b07-panels').getAttribute('data-background'),'dark');
  for(const pose of ['dual_firing','firing_dynamic','speaking_reference']){
    await page.selectOption('#canonical-action',pose);
    await page.waitForFunction(()=>{const im=document.querySelector('#canonical-original');return im.complete&&im.naturalWidth>0});
  }
  await page.selectOption('#user-review-action','b07/sitting');
  await page.fill('#user-review-note','07 후보 목 연결 검수');
  await page.selectOption('#user-review-action','sitting');
  assert.equal(await page.inputValue('#user-review-note'),'');
  await page.selectOption('#user-review-action','b07/sitting');
  assert.equal(await page.inputValue('#user-review-note'),'07 후보 목 연결 검수');
  const downloaded=page.waitForEvent('download');await page.click('#user-review-export');
  const {readFile}=await import('node:fs/promises');
  const payload=JSON.parse(await readFile(await (await downloaded).path(),'utf8'));
  assert.equal(payload.items['b07/sitting'].note,'07 후보 목 연결 검수');
  assert.equal(payload.items.sitting,undefined);
  assert.deepEqual(result.errors,[]);result.passed=true;
}catch(error){result.errors.push(String(error));process.exitCode=1;}
finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile('artifacts/b07-review/report.json',JSON.stringify(result,null,2));console.log(result);}
