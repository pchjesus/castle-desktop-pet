// Minimal, privacy-preserving event contract. No filenames, URLs, titles or
// browsing data are ever forwarded to the desktop pet.
export const EXTERNAL_EVENTS=Object.freeze({
 downloadComplete:Object.freeze({text:'받을 건 다 받았군.',source:'brave'}),
 powerAC:Object.freeze({text:'전원은 확보됐나.',source:'windows'}),
 powerBattery:Object.freeze({text:'전력은 아껴 쓰도록.',source:'windows'}),
 unlock:Object.freeze({text:'다시 시작하지.',source:'windows'})
});
export const DEFAULT_EXTERNAL_SETTINGS=Object.freeze({
 braveDownload:false,powerAC:true,powerBattery:true,unlock:true
});
export function normalizeExternalSettings(input){
 const result={...DEFAULT_EXTERNAL_SETTINGS};
 for(const key of Object.keys(result))if(typeof input?.[key]==='boolean')result[key]=input[key];
 return result;
}
export function enabledForEvent(settings,name){
 const key=name==='downloadComplete'?'braveDownload':name;
 return Object.hasOwn(EXTERNAL_EVENTS,name)&&normalizeExternalSettings(settings)[key]===true;
}
