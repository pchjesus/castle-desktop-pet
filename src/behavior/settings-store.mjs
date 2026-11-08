import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeSettings} from './controller.mjs';
export function loadSettings(path){try{return normalizeSettings(JSON.parse(readFileSync(path,'utf8')));}catch{return normalizeSettings(null);}}
export function saveSettings(path,value){const settings=normalizeSettings(value);writeFileSync(path,JSON.stringify(settings));return settings;}
