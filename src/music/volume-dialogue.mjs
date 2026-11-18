/**
 * Local-only music volume reactions. Only user-initiated increases may speak.
 * The more severe 80% line overrides the 50% line. Each tier has its own
 * cooldown, so increasing from 50% to 80% can still produce the stronger line.
 */
export function createVolumeDialogue({cooldownMs=60000}={}){
 const lastAt={moderate:-Infinity,high:-Infinity};
 return (previous,next,now=Date.now())=>{
  if(!Number.isFinite(previous)||!Number.isFinite(next)||!Number.isFinite(now)||next<=previous)return null;
  const tier=next>=80?'high':next>=50?'moderate':null;
  if(!tier||now-lastAt[tier]<cooldownMs)return null;
  lastAt[tier]=now;
  return tier==='high'?'네놈 고막은 티타늄이라도 되나?':'시끄럽군.';
 };
}
