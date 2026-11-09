import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,appendFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {codexEventNames,parseCodexEvent,watchCodexEvents} from '../src/behavior/codex-bridge.mjs';

test('Codex event schema accepts only exact three named events',()=>{
 assert.deepEqual(codexEventNames,['jobStart','testPassed','deploymentComplete']);
 for(const event of codexEventNames)assert.equal(parseCodexEvent(JSON.stringify({event})),event);
 for(const line of ['{"event":"shell"}','not json','[]','{}','{"event":1}',JSON.stringify({event:'testPassed'+'x'}),'x'.repeat(5000)])
  assert.equal(parseCodexEvent(line),null);
});
test('local file bridge ignores history, consumes only complete lines, drops invalid rows and stops',()=>{
 const dir=mkdtempSync(join(tmpdir(),'castle-codex-')),file=join(dir,'events.jsonl'),received=[];
 let poll,stopped=false;
 try{
  writeFileSync(file,'{"event":"jobStart"}\n');
  const bridge=watchCodexEvents(file,event=>received.push(event),{setIntervalFn:fn=>(poll=fn,1),clearIntervalFn:()=>{stopped=true;}});
  bridge.poll();assert.deepEqual(received,[]);
  appendFileSync(file,'{"event":"testPassed"}\n{"event":"shell"}\n{"event":"deploy');
  poll();assert.deepEqual(received,['testPassed']);
  appendFileSync(file,'mentComplete"}\n');
  bridge.poll();assert.deepEqual(received,['testPassed','deploymentComplete']);
  bridge.stop();assert(stopped);
  appendFileSync(file,'{"event":"jobStart"}\n');bridge.poll();assert.equal(received.length,2);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
