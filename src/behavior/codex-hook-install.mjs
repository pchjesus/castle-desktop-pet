import {existsSync,readFileSync,mkdirSync,writeFileSync,copyFileSync,renameSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {homedir} from 'node:os';

export const HOOK_LABEL='Castle Desktop Pet — local job-start event';
const ownGroup=group=>!!group&&typeof group==='object'&&Array.isArray(group.hooks)&&
 group.hooks.some(h=>h?.type==='command'&&h?.statusMessage===HOOK_LABEL);
export function codexIntegrationPaths({home=homedir(),codexHome=process.env.CODEX_HOME,appData=process.env.APPDATA,platform=process.platform}={}){
 const codexDir=codexHome?resolve(codexHome):join(home,'.codex');
 const appDir=platform==='win32'?(appData||join(home,'AppData','Roaming')):(process.env.XDG_CONFIG_HOME||join(home,'.config'));
 return {config:join(codexDir,'hooks.json'),script:join(appDir,'castle-desktop-pet','integration','codex-hook.mjs')};
}
function readConfig(file){
 if(!existsSync(file))return {hooks:{}};
 const value=JSON.parse(readFileSync(file,'utf8'));
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Codex hooks.json must be an object; no changes made');
 if(value.hooks!==undefined&&(!value.hooks||typeof value.hooks!=='object'||Array.isArray(value.hooks)))throw Error('Invalid Codex hooks table; no changes made');
 if(value.hooks?.UserPromptSubmit!==undefined&&!Array.isArray(value.hooks.UserPromptSubmit))throw Error('Invalid UserPromptSubmit hooks; no changes made');
 return value;
}
export function inspectCodexIntegration(options={}){
 const paths=codexIntegrationPaths(options);
 try{
  const cfg=readConfig(paths.config),groups=cfg.hooks?.UserPromptSubmit||[];
  return {configured:groups.some(ownGroup),configPath:paths.config,scriptPath:paths.script,scriptPresent:existsSync(paths.script),error:null};
 }catch(error){return {configured:false,configPath:paths.config,scriptPath:paths.script,scriptPresent:existsSync(paths.script),error:String(error)};}
}
function saveConfig(file,data){
 mkdirSync(dirname(file),{recursive:true});
 if(existsSync(file)){
  const backup=file+'.castle-pet-backup';
  if(!existsSync(backup))copyFileSync(file,backup);
 }
 const temp=file+'.castle-pet-'+process.pid+'.tmp';
 writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{encoding:'utf8',mode:0o600});
 renameSync(temp,file);
}
export function configureCodexIntegration(command,{hookSource=null,...options}={}){
 if(!['install','uninstall','status'].includes(command))throw Error('Expected install, uninstall or status');
 const paths=codexIntegrationPaths(options);
 const current=inspectCodexIntegration(options);
 if(command==='status')return {command,changed:false,...current};
 const cfg=readConfig(paths.config);
 cfg.hooks=cfg.hooks||{};
 const groups=cfg.hooks.UserPromptSubmit||[];
 const owned=groups.filter(ownGroup),others=groups.filter(g=>!ownGroup(g));
 if(command==='uninstall'){
  if(!owned.length)return {command,changed:false,...current};
  if(others.length)cfg.hooks.UserPromptSubmit=others;else delete cfg.hooks.UserPromptSubmit;
  saveConfig(paths.config,cfg);
  // The standalone script can remain safely; never delete user files.
  return {command,changed:true,...inspectCodexIntegration(options)};
 }
 // Install is opt-in only; no automatic mutation at app startup.
 if(typeof hookSource!=='string'||!existsSync(hookSource))throw Error('Missing local Codex hook source: '+hookSource);
 mkdirSync(dirname(paths.script),{recursive:true});
 copyFileSync(hookSource,paths.script);
 const quoted='node "'+paths.script.replaceAll('"','')+'"';
 const handler={type:'command',command:quoted,commandWindows:quoted,timeout:10,async:true,statusMessage:HOOK_LABEL};
 const next={hooks:[handler]};
 const previous=owned[0]?.hooks?.[0];
 if(owned.length===1&&JSON.stringify(previous)===JSON.stringify(handler)){
  return {command,changed:false,...inspectCodexIntegration(options)};
 }
 cfg.hooks.UserPromptSubmit=[...others,next];
 saveConfig(paths.config,cfg);
 return {command,changed:true,...inspectCodexIntegration(options)};
}
