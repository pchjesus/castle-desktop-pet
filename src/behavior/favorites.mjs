import {dialogues} from './dialogues.mjs';
export const FAVORITE_POSES=Object.freeze(['idle','smoking','sitting','working','speaking','drawing','firing','dual_firing','firing_dynamic']);
const allowedLines=new Set(dialogues.filter(line=>line.random||line.triggers.includes('pose-entry')).filter(line=>!line.triggers.includes('click-combo')).map(line=>line.id));
export const favoriteDialogueAllowed=id=>typeof id==='string'&&allowedLines.has(id);
export function normalizeFavorites(value){
 const poses=Array.isArray(value?.poses)?value.poses.filter((pose,i,items)=>FAVORITE_POSES.includes(pose)&&items.indexOf(pose)===i).slice(0,9):[];
 const lines=Array.isArray(value?.dialogues)?value.dialogues.filter((id,i,items)=>favoriteDialogueAllowed(id)&&items.indexOf(id)===i).slice(0,20):[];
 return {poses,dialogues:lines};
}
export function toggleFavorite(current,kind,id){
 const data=normalizeFavorites(current);
 const key=kind==='pose'?'poses':kind==='dialogue'?'dialogues':null;
 if(!key||!(key==='poses'?FAVORITE_POSES.includes(id):favoriteDialogueAllowed(id)))return null;
 const items=data[key],next=items.includes(id)?items.filter(item=>item!==id):items.length<(key==='poses'?9:20)?[...items,id]:items;
 return normalizeFavorites({...data,[key]:next});
}
