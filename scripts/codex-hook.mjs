// An opt-in project hook. Only records a minimal jobStart event, never prompts,
// credentials, model responses, or other private Codex session content.
import {appendFileSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname,join} from 'node:path';
let raw='';
process.stdin.setEncoding('utf8');
for await(const chunk of process.stdin){raw+=chunk;if(raw.length>16384)process.exit(0);}
try{
 const input=JSON.parse(raw);
 if(input?.hook_event_name!=='UserPromptSubmit')process.exit(0);
 const base=process.platform==='win32'?(process.env.APPDATA||join(homedir(),'AppData','Roaming')):(process.env.XDG_CONFIG_HOME||join(homedir(),'.config'));
 const file=process.env.CASTLE_PET_EVENTS_FILE||join(base,'castle-desktop-pet','codex-events.jsonl');
 mkdirSync(dirname(file),{recursive:true});
 appendFileSync(file,JSON.stringify({event:'jobStart',createdAt:new Date().toISOString()})+'\n',{encoding:'utf8',mode:0o600});
}catch{/* A notification must never block a Codex turn. */}
