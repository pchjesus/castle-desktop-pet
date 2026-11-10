#!/usr/bin/env node
// Explicit opt-in installer for LOCAL Codex clients. Preserves all unrelated hooks.
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {configureCodexIntegration,inspectCodexIntegration} from '../src/behavior/codex-hook-install.mjs';
const command=process.argv[2]||'status';
if(!['install','uninstall','status'].includes(command)){
 console.error('Usage: node scripts/setup-codex-integration.mjs install|status|uninstall');
 process.exitCode=2;
}else{
 try{
  const hookSource=join(dirname(fileURLToPath(import.meta.url)),'codex-hook.mjs');
  const result=command==='status'?inspectCodexIntegration():configureCodexIntegration(command,{hookSource});
  console.log('Castle Pet Codex local integration: '+command);
  console.log('Codex hooks file: '+result.configPath);
  console.log('Installed hook: '+result.scriptPath);
  console.log('Configured: '+(result.configured?'yes':'no'));
  console.log('Changed: '+(result.changed?'yes':'no'));
  if(result.error){console.error(result.error);process.exitCode=1;}
  else if(command==='install')console.log('Next: open a LOCAL Codex client, inspect/approve the hook via /hooks, then submit one prompt. A cloud sandbox cannot write to your Windows app-data automatically.');
 }catch(error){console.error('No changes to unrelated hooks: '+String(error));process.exitCode=1;}
}
