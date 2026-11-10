import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {EventEmitter} from 'node:events';
import {createBehavior} from '../src/behavior/controller.mjs';
import {normalizeExternalSettings,enabledForEvent,DEFAULT_EXTERNAL_SETTINGS} from '../src/behavior/external-events.mjs';
import {loadExternalSettings,saveExternalSettings} from '../src/behavior/external-settings-store.mjs';
import {watchWindowsEvents} from '../src/behavior/windows-event-adapter.mjs';
import {readOrCreateBraveToken,createBraveDownloadServer} from '../src/behavior/brave-download-server.mjs';

test('only four boolean external toggles are allowed; settings persist and migrate',()=>{
 const x=normalizeExternalSettings({braveDownload:true,unlock:false,other:true,powerAC:'true'});
 assert.deepEqual(x,{braveDownload:true,powerAC:true,powerBattery:true,unlock:false});
 assert(enabledForEvent(x,'downloadComplete')&&!enabledForEvent(x,'unlock'));
 assert(!enabledForEvent(x,'untrusted'));
 const dir=mkdtempSync(join(tmpdir(),'castle-external-')),file=join(dir,'prefs.json');
 try{
  assert.deepEqual(loadExternalSettings(file),DEFAULT_EXTERNAL_SETTINGS);
  saveExternalSettings(file,x);assert.deepEqual(loadExternalSettings(file),x);
  writeFileSync(file,'{broken');assert.deepEqual(loadExternalSettings(file),DEFAULT_EXTERNAL_SETTINGS);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Windows power and lock adapter emits only expected names, suspends, resumes and disposes',()=>{
 const monitor=new EventEmitter(),trace=[];
 const stop=watchWindowsEvents(monitor,{suspend:()=>trace.push('suspend'),resume:()=>trace.push('resume'),emit:x=>trace.push(x)});
 monitor.emit('on-ac');monitor.emit('on-battery');monitor.emit('lock-screen');monitor.emit('unlock-screen');
 assert.deepEqual(trace,['powerAC','powerBattery','suspend','resume','unlock']);
 stop();monitor.emit('on-ac');assert.equal(trace.length,5);
});
test('notifications never override manual pose, Codex action, current speech or duplicate events',()=>{
 let time=0,seq=0;const jobs=new Map(),poses=[],speeches=[];
 const timer=(fn,ms)=>{const id=++seq;jobs.set(id,{fn,at:time+ms});return id};
 const clear=id=>jobs.delete(id);
 const behavior=createBehavior({settings:{autonomy:false,dialogueEnabled:false},random:()=>0,now:()=>time,setTimer:timer,clearTimer:clear,render:p=>poses.push(p),speak:s=>speeches.push(s)});
 assert.equal(behavior.externalNotification('downloadComplete'),true);
 assert.equal(speeches.at(-1),'받을 건 다 받았군.');
 assert.equal(behavior.externalNotification('downloadComplete'),false);
 assert.equal(behavior.externalNotification('evil'),false);
 behavior.manual('working');assert.equal(behavior.externalNotification('powerBattery'),false);
 behavior.visibility(true);assert.equal(behavior.externalNotification('unlock'),false);
 behavior.visibility(false);
 assert.equal(behavior.externalNotification('unlock'),true);
 assert.equal(poses.at(-1),'smoking');
 behavior.dispose();
});
test('Brave token persists privately and rejects invalid storage',()=>{
 const dir=mkdtempSync(join(tmpdir(),'castle-brave-key-')),file=join(dir,'private','pairing.key');
 try{
  const token=readOrCreateBraveToken(file);assert.match(token,/^[0-9a-f]{64}$/);
  assert.equal(readOrCreateBraveToken(file),token);
  writeFileSync(file,'bad-token');assert.throws(()=>readOrCreateBraveToken(file));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('only an authenticated browser extension can report a completed download, once',async()=>{
 const seen=[],token='a'.repeat(64),bridge=createBraveDownloadServer({token,port:0,onDownload:kind=>seen.push(kind)});
 const address=await bridge.start(),url='http://127.0.0.1:'+address.port+'/v1/download-complete';
 const origin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
 const post=(payload,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,...headers},body:JSON.stringify(payload)});
 try{
  assert.equal((await post({event:'downloadComplete',id:1})).status,401);
  assert.equal((await post({event:'downloadComplete',id:1},{'X-Castle-Token':'wrong'})).status,401);
  assert.equal((await post({event:'downloadComplete',id:1},{Origin:'https://example.com','X-Castle-Token':token})).status,403);
  assert.equal((await post({event:'other',id:1},{'X-Castle-Token':token})).status,400);
  assert.equal((await post({event:'downloadComplete',id:1,filename:'private.pdf'},{'X-Castle-Token':token})).status,200);
  assert.equal((await post({event:'downloadComplete',id:1},{'X-Castle-Token':token})).status,200);
  assert.equal((await post({event:'downloadComplete',id:2},{'X-Castle-Token':token})).status,200);
  assert.deepEqual(seen,['downloadComplete','downloadComplete']);
  assert.equal((await fetch(url,{method:'GET',headers:{Origin:origin}})).status,404);
 }finally{await bridge.stop();}
});
test('Brave extension has download-only permission and never forwards private download details',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../brave-extension/manifest.json',import.meta.url),'utf8'));
 const source=readFileSync(new URL('../brave-extension/service-worker.js',import.meta.url),'utf8');
 assert.deepEqual(manifest.permissions,['downloads','storage']);
 assert.deepEqual(manifest.host_permissions,['http://127.0.0.1:47183/*']);
 assert(source.includes("delta?.state?.current!=='complete'"));
 assert(!source.includes('delta.filename')&&!source.includes('delta.url')&&!source.includes('delta.referrer'));
 assert(!source.includes('history')&&!source.includes('tabs'));
});
