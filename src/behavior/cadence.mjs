// Milliseconds. Autonomy retains its legacy name for movement settings migration.
export const frequencies=Object.freeze({
 movement:Object.freeze({quiet:[300000,600000],default:[120000,180000],active:[60000,120000]}),
 dialogue:Object.freeze({quiet:[480000,720000],default:[240000,360000],active:[120000,180000]})
});
export const defaults=Object.freeze({base:'smoking',autonomy:true,autoFire:true,movementFrequency:'default',dialogueEnabled:true,dialogueFrequency:'default'});
const preset=value=>['quiet','default','active'].includes(value)?value:'default';
export function normalizeSettings(value){
 const autonomy=typeof value?.autonomy==='boolean'?value.autonomy:true;
 return {base:value?.base==='idle'?'idle':'smoking',autonomy,autoFire:typeof value?.autoFire==='boolean'?value.autoFire:true,
  movementFrequency:preset(value?.movementFrequency),dialogueEnabled:typeof value?.dialogueEnabled==='boolean'?value.dialogueEnabled:autonomy,
  dialogueFrequency:preset(value?.dialogueFrequency)};
}
export function cadence(kind,preset,random){const [min,max]=frequencies[kind][preset];return min+(max-min)*random();}
