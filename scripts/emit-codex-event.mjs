// Local-only test emitter for Castle Desktop Pet; does not call Codex or any API.
import {mkdirSync,appendFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,dirname} from 'node:path';
import {codexEventNames} from '../src/behavior/codex-bridge.mjs';

const event=process.argv[2],allowed=new Set(codexEventNames);
if(!allowed.has(event)){console.error('Usage: node scripts/emit-codex-event.mjs jobStart|testPassed|deploymentComplete');process.exitCode=2;}
else{
 const base=process.platform==='win32'?(process.env.APPDATA||join(homedir(),'AppData','Roaming')):(process.env.XDG_CONFIG_HOME||join(homedir(),'.config'));
 const file=process.env.CASTLE_PET_EVENTS_FILE||join(base,'castle-desktop-pet','codex-events.jsonl');
 mkdirSync(dirname(file),{recursive:true});
 appendFileSync(file,JSON.stringify({event,createdAt:new Date().toISOString()})+'\n',{encoding:'utf8',mode:0o600});
 console.log('Local event appended:',event,'to',file);
}
