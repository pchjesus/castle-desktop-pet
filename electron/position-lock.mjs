import {readFileSync,writeFileSync} from 'node:fs';
import {constrain} from './geometry.mjs';
const boundsOk=b=>b&&typeof b==='object'&&['x','y','width','height'].every(key=>Number.isFinite(b[key]))&&b.width>=120&&b.width<=360&&b.height>=150&&b.height<=1000;
export function normalizePositionLock(value){
 const anchor=boundsOk(value?.anchor)?Object.fromEntries(['x','y','width','height'].map(key=>[key,Math.round(value.anchor[key])])):null;
 return {enabled:value?.enabled===true&&!!anchor,anchor,displayId:Number.isSafeInteger(value?.displayId)?value.displayId:null};
}
export function loadPositionLock(path){
 try{return normalizePositionLock(JSON.parse(readFileSync(path,'utf8')));}catch{return normalizePositionLock(null);}
}
export function savePositionLock(path,value){
 const safe=normalizePositionLock(value);writeFileSync(path,JSON.stringify({...safe,settingsVersion:1}));return safe;
}
export function positionFor(lock,displays,fallback){
 const saved=normalizePositionLock(lock);
 if(!saved.enabled||!saved.anchor||!displays?.length)return fallback;
 const target=displays.find(d=>d.id===saved.displayId);
 // A temporarily disconnected monitor must never overwrite the original anchor.
 // Keep the pet visible on a remaining screen; reattach when that monitor returns.
 const areas=target?[target.workArea]:displays.map(d=>d.workArea);
 return constrain(saved.anchor,areas);
}
