import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {configureCodexIntegration,codexIntegrationPaths,inspectCodexIntegration,HOOK_LABEL} from '../src/behavior/codex-hook-install.mjs';

const source=fileURLToPath(new URL('../scripts/codex-hook.mjs',import.meta.url));
function setup(){
 const root=mkdtempSync(join(tmpdir(),'castle-codex-install-'));
 const options={home:root,codexHome:join(root,'codex'),appData:join(root,'roaming'),platform:'win32'};
 const paths=codexIntegrationPaths(options);
 return {root,options,paths,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('explicit opt-in installs stable userData hook and preserves unrelated Codex groups',()=>{
 const f=setup();
 try{
  const other={hooks:[{type:'command',command:'node unrelated.mjs',statusMessage:'Existing hook'}]};
  mkdirSync(dirname(f.paths.config),{recursive:true});
  writeFileSync(f.paths.config,JSON.stringify({foo:{keep:true},hooks:{UserPromptSubmit:[other],SessionStart:[other]}}));
  const result=configureCodexIntegration('install',{...f.options,hookSource:source});
  assert(result.changed&&result.configured&&result.scriptPresent);
  const data=JSON.parse(readFileSync(f.paths.config,'utf8'));
  assert.deepEqual(data.foo,{keep:true});
  assert.deepEqual(data.hooks.SessionStart,[other]);
  assert.deepEqual(data.hooks.UserPromptSubmit[0],other);
  assert.equal(data.hooks.UserPromptSubmit[1].hooks[0].statusMessage,HOOK_LABEL);
  assert(data.hooks.UserPromptSubmit[1].hooks[0].command.includes(f.paths.script));
  assert(existsSync(f.paths.config+'.castle-pet-backup'));
  assert.equal(configureCodexIntegration('install',{...f.options,hookSource:source}).changed,false);
  assert.equal(JSON.parse(readFileSync(f.paths.config,'utf8')).hooks.UserPromptSubmit.length,2);
  assert.equal(configureCodexIntegration('uninstall',{...f.options,hookSource:source}).changed,true);
  assert.deepEqual(JSON.parse(readFileSync(f.paths.config,'utf8')).hooks.UserPromptSubmit,[other]);
  assert.equal(inspectCodexIntegration(f.options).configured,false);
 }finally{f.cleanup();}
});
test('a fresh install needs no preexisting Codex config; uninstall preserves script but disables hook',()=>{
 const f=setup();try{
  assert.equal(inspectCodexIntegration(f.options).configured,false);
  configureCodexIntegration('install',{...f.options,hookSource:source});
  assert.equal(inspectCodexIntegration(f.options).configured,true);
  configureCodexIntegration('uninstall',{...f.options,hookSource:source});
  assert.equal(inspectCodexIntegration(f.options).configured,false);
  assert(existsSync(f.paths.script));
 }finally{f.cleanup();}
});
test('invalid existing Codex config is never overwritten',()=>{
 const f=setup();try{
  mkdirSync(dirname(f.paths.config),{recursive:true});
  writeFileSync(f.paths.config,'{BROKEN');
  assert.throws(()=>configureCodexIntegration('install',{...f.options,hookSource:source}),SyntaxError);
  assert.equal(readFileSync(f.paths.config,'utf8'),'{BROKEN');
  assert.equal(existsSync(f.paths.script),false);
 }finally{f.cleanup();}
});
test('status is non-mutating and paths match the local file receiver',()=>{
 const f=setup();try{
  assert.equal(configureCodexIntegration('status',f.options).changed,false);
  assert(!existsSync(f.paths.config));
  assert(f.paths.script.includes(join('castle-desktop-pet','integration','codex-hook.mjs')));
 }finally{f.cleanup();}
});

test('Windows QA package includes opt-in global hook installer without installing it automatically',async()=>{
 const {readFileSync}=await import('node:fs');
 const file=readFileSync(new URL('../scripts/package-windows-qa.mjs',import.meta.url),'utf8');
 assert(file.includes("join(dest,'scripts','setup-codex-integration.mjs')")||file.includes("for(const name of ['setup-codex-integration.mjs','codex-hook.mjs'])"));
 assert(file.includes("Codex_연동_방법.txt"));
 assert(!file.includes("configureCodexIntegration('install'"));
});
