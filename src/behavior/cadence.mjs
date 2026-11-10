// Milliseconds. Autonomy retains its legacy name for movement settings migration.
export const frequencies=Object.freeze({
 movement:Object.freeze({quiet:[300000,600000],default:[120000,180000],active:[60000,120000]}),
 dialogue:Object.freeze({quiet:[480000,720000],default:[240000,360000],active:[120000,180000]})
});
export const defaults=Object.freeze({base:'smoking',autonomy:true,autoFire:true,movementFrequency:'default',dialogueEnabled:true,dialogueFrequency:'default'});
// Relative selection weights, not a separate timer. A zero disables this action.
// Keep old behavior when legacy settings have no actionWeights field.
export const DEFAULT_ACTION_WEIGHTS=Object.freeze({idle:10,smoking:10,sitting:18,speaking:30,drawing:12,firing:18,dual_firing:6,firing_dynamic:6,working:12});
export const ACTION_WEIGHT_LIMIT=40;
export const INTERVAL_MIN=1,INTERVAL_MAX=15;
export const DEFAULT_INTERVALS=Object.freeze({movementIntervalMin:3,dialogueIntervalMin:5,shotCooldownMin:4});
export const validInterval=value=>Number.isInteger(value)&&value>=INTERVAL_MIN&&value<=INTERVAL_MAX;

const preset=value=>['quiet','default','active'].includes(value)?value:'default';
export function normalizeSettings(value){
 const autonomy=typeof value?.autonomy==='boolean'?value.autonomy:true;
 const result={base:['idle','smoking','sitting'].includes(value?.base)?value.base:'smoking',autonomy,autoFire:typeof value?.autoFire==='boolean'?value.autoFire:true,
  movementFrequency:preset(value?.movementFrequency),dialogueEnabled:typeof value?.dialogueEnabled==='boolean'?value.dialogueEnabled:autonomy,
  dialogueFrequency:preset(value?.dialogueFrequency)};
 for(const key of Object.keys(DEFAULT_INTERVALS))if(validInterval(value?.[key]))result[key]=value[key];
 const candidate=value?.actionWeights;
 if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate)){
  const actionWeights={...DEFAULT_ACTION_WEIGHTS};
  for(const pose of Object.keys(DEFAULT_ACTION_WEIGHTS)){
   const weight=candidate[pose];
   if(Number.isInteger(weight)&&weight>=0&&weight<=ACTION_WEIGHT_LIMIT)actionWeights[pose]=weight;
  }
  result.actionWeights=actionWeights;
 }
 return result;
}
export function cadence(kind,preset,random){const [min,max]=frequencies[kind][preset];return min+(max-min)*random();}
