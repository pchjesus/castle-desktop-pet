import {dialogues,codexEvents} from './dialogues.mjs';
export const defaults=Object.freeze({base:'smoking',autonomy:true,autoFire:true});
export function normalizeSettings(value){return {base:value?.base==='idle'?'idle':'smoking',autonomy:typeof value?.autonomy==='boolean'?value.autonomy:true,autoFire:typeof value?.autoFire==='boolean'?value.autoFire:true};}
export const shots=new Set(['firing','dual_firing','firing_dynamic']);
export function actionWeights(settings,cooldown=false){const rows=[[settings.base==='smoking'?'idle':'smoking',10],['sitting',18],['speaking',30],['drawing',12],['firing',18],['dual_firing',6],['firing_dynamic',6]].filter(([pose])=>!shots.has(pose)||(settings.autoFire&&!cooldown));const total=rows.reduce((n,[,w])=>n+w,0);return rows.map(([pose,w])=>[pose,w/total]);}
export function choose(rows,random){let cursor=random();for(const [pose,w] of rows){cursor-=w;if(cursor<0)return pose;}return rows.at(-1)[0];}
export const readableMs=text=>Math.min(16000,Math.max(4000,Array.from(text).length*110+1600));
export function createBehavior({render,speak,settings:initial,random=Math.random,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,reduced=()=>false}){
 let settings=normalizeSettings(initial),timers=new Set(),generation=0,mode='base',hidden=false,disposed=false,cooldown=0,clicks=[],warning=false,locked=false,autoShot=false,currentEvent='';
 const used=new Map();const range=(a,b)=>a+random()*(b-a);
 function later(fn,ms){const version=generation,due=now()+ms;const id=setTimer(()=>{timers.delete(id);if(!disposed&&!hidden&&version===generation){if(now()>due+5000)base();else fn();}},ms);timers.add(id);return id;}
 function clear(){if(mode==='auto'&&autoShot){cooldown=now()+range(180000,300000);autoShot=false;}generation++;for(const id of timers)clearTimer(id);timers.clear();speak('');}
 function resetClicks(){clicks=[];warning=false;locked=false;}
 function idleWait(){if(!disposed&&!hidden&&settings.autonomy&&mode==='base')later(auto,range(120000,180000));}
 function base(){if(disposed)return;clear();currentEvent='';resetClicks();mode='base';render(settings.base);idleWait();}
 function say(record){if(!record)return 0;used.set(record.id,now());speak(record.text,record);return readableMs(record.text);}
 function line(pose,trigger='autonomous'){
  let eligible=dialogues.filter(d=>d.random&&d.triggers.includes(trigger)&&(trigger==='click'||d.poses.includes(pose))&&now()-(used.get(d.id)??-Infinity)>=d.cooldownMs);
  if(!eligible.length)return;
  const original=random()<.3;const group=eligible.filter(d=>d.origin.startsWith('original')&&d.origin!=='original creative'||d.origin==='user-supplied comic line');const creative=eligible.filter(d=>d.origin==='original creative');eligible=(original?group:creative).length?(original?group:creative):eligible;
  return eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))];
 }
 function duration(pose){return pose==='sitting'||pose==='idle'||pose==='smoking'?range(10000,20000):pose==='drawing'?range(3000,6000):pose==='speaking'?(reduced()?1000:3500):pose==='dual_firing'?2400:pose==='working'?15000:1500;}
 function action(pose,source,forced){clear();resetClicks();mode=source;const probability={idle:.25,smoking:.35,sitting:.25,speaking:1,drawing:.5,firing:.3,dual_firing:.2,working:0};const record=forced||(pose==='firing_dynamic'?dialogues.find(d=>d.id==='O-01'):random()<(probability[pose]||0)?line(pose):undefined);const speech=say(record);const start=()=>{autoShot=source==='auto'&&shots.has(pose);render(pose);const hold=Math.max(duration(pose),pose==='firing_dynamic'?0:speech);later(()=>{if(source==='auto'&&shots.has(pose)){cooldown=now()+range(180000,300000);autoShot=false;}base();},hold);};if(pose==='firing_dynamic'){render(settings.base);later(start,speech);}else start();}
 function auto(){action(choose(actionWeights(settings,now()<cooldown),random),'auto');}
 function manual(pose){if(disposed||hidden)return;resetClicks();if(pose===settings.base){base();return;}if(['idle','smoking','sitting','working'].includes(pose)){clear();mode='manual';render(pose);}else action(pose,'manual');}
 function click(){if(disposed||hidden||locked)return;if(warning){clear();mode='manual';warning=true;locked=true;const ms=say(dialogues.find(d=>d.id==='CLICK-06'));later(base,ms);return;}
  clicks=clicks.filter(t=>now()-t<=3000);clicks.push(now());if(clicks.length>=5){clear();mode='manual';warning=true;render('drawing');later(base,6000);return;}
  // Ordinary click preempts an autonomous/event action, without resetting combo count.
  const history=clicks;clear();mode='manual';render(settings.base);clicks=history;const record=random()<.5?line(settings.base,'click'):undefined;const ms=say(record);later(()=>{const history=clicks.filter(t=>now()-t<=3000);base();clicks=history;},ms||800);
 }
 function drag(){if(disposed||hidden)return;clear();resetClicks();mode='manual';render(settings.base);}
 function dragEnd(){if(mode==='manual'&&!warning)base();}
 function configure(value){if(disposed)return;settings=normalizeSettings(value);base();}
 function visibility(value){if(disposed)return;hidden=value;clear();resetClicks();mode='base';render(settings.base);if(!hidden)idleWait();}
 function event(name){if(disposed||hidden||mode==='manual')return false;const spec=Object.hasOwn(codexEvents,name)?codexEvents[name]:undefined;if(!spec)return false;const priorities={jobStart:1,testPassed:2,deploymentComplete:3};if(mode==='event'&&priorities[name]<priorities[currentEvent])return false;currentEvent=name;clear();resetClicks();mode='event';render(spec.sequence[0]);later(()=>action(spec.sequence.at(-1),'event',dialogues.find(d=>d.id===spec.dialogue)),spec.sequence.length>1?800:0);return true;}
 function dispose(){disposed=true;clear();resetClicks();}
 base();return {manual,click,drag,dragEnd,configure,visibility,event,dispose,snapshot:()=>({settings:{...settings},mode,cooldown,pending:timers.size,warning,locked})};
}
