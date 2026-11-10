import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeExternalSettings} from './external-events.mjs';
export function loadExternalSettings(file){
 try{return normalizeExternalSettings(JSON.parse(readFileSync(file,'utf8')));}catch{return normalizeExternalSettings(null);}
}
export function saveExternalSettings(file,settings){
 const normalized=normalizeExternalSettings(settings);
 writeFileSync(file,JSON.stringify({...normalized,version:1}));
 return normalized;
}
