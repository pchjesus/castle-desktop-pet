import {dialogues,codexEvents} from './dialogues.mjs';
import {EXTERNAL_EVENTS} from './external-events.mjs';
import {defaults,normalizeSettings,cadence,frequencies,DEFAULT_ACTION_WEIGHTS} from './cadence.mjs';
export {defaults,normalizeSettings} from './cadence.mjs';
export const shots=new Set(['firing','dual_firing','firing_dynamic']);
export function actionWeights(settings,cooldown=false){
 // Preserve old first-action ordering for default settings and allow Working.
 const base=settings.base;
 const poses=[base==='smoking'?'idle':'smoking','sitting','speaking','drawing','firing','dual_firing','firing_dynamic','working'];
 if(base==='sitting')poses.splice(1,0,'idle');
 const weights=settings.actionWeights||DEFAULT_ACTION_WEIGHTS;
 const rows=poses.filter((pose,i)=>poses.indexOf(pose)===i&&pose!==base&&(!shots.has(pose)||(settings.autoFire&&!cooldown)))
  .map(pose=>[pose,weights[pose]??DEFAULT_ACTION_WEIGHTS[pose]])
  .filter(([,w])=>w>0);
 const total=rows.reduce((n,[,w])=>n+w,0);
 return total>0?rows.map(([pose,w])=>[pose,w/total]):[];
}
export function choose(rows,random){let cursor=random();for(const [pose,w] of rows){cursor-=w;if(cursor<0)return pose;}return rows.at(-1)[0];}
export const readableMs=text=>Math.min(16000,Math.max(4000,Array.from(text).length*110+1600));
export function createBehavior({render,speak,settings:initial,random=Math.random,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,reduced=()=>false}){
 let settings=normalizeSettings(initial),generation=0,mode='base',hidden=false,disposed=false,cooldown=0;
 let dragGeneration=-1,keepDragPose=false,dragHold=0,heldUntil=0;
 let clicks=[],warning=false,locked=false,autoShot=false,currentEvent='',pose=settings.base;
 const timers=new Set(),used=new Map();
 let speechRevision=0;const scheduleRevision={movement:0,dialogue:0};
 let movementTimer,dialogueTimer,speechTimer,nextMovement=0,nextDialogue=0,speechUntil=0,lastAutoSpeech=-Infinity;
 const lastExternal=new Map();
 const range=(a,b)=>a+random()*(b-a);
 const cooldownDelay=()=>settings.shotCooldownMin?settings.shotCooldownMin*60000:range(180000,300000);
 const show=value=>{pose=value;render(value,{source:mode});};
 function cancel(id){if(id!==undefined){clearTimer(id);timers.delete(id);}}
 function later(fn,ms){
  const version=generation,due=now()+ms;
  const id=setTimer(()=>{timers.delete(id);if(disposed||hidden||version!==generation)return;if(now()>due+5000){visibility(false,true);return;}fn();},ms);
  timers.add(id);return id;
 }
 function schedule(kind,fn){
  const minutes=kind==='movement'?settings.movementIntervalMin:settings.dialogueIntervalMin;
  const delay=minutes?minutes*60000:cadence(kind,kind==='movement'?settings.movementFrequency:settings.dialogueFrequency,random);
  // Scheduler handles are deliberately outside action generation/timers.
  const revision=++scheduleRevision[kind];
  const due=now()+delay,id=setTimer(()=>{
   if(revision!==scheduleRevision[kind])return;
   if(kind==='movement'){movementTimer=undefined;nextMovement=0;}else{dialogueTimer=undefined;nextDialogue=0;}
   if(disposed||hidden)return;
   if(now()>due+5000){visibility(false,true);return;}fn();
  },delay);
  if(kind==='movement'){movementTimer=id;nextMovement=due;}else{dialogueTimer=id;nextDialogue=due;}
 }
 function stopMovement(){scheduleRevision.movement++;cancel(movementTimer);movementTimer=undefined;nextMovement=0;}
 function stopDialogue(){scheduleRevision.dialogue++;cancel(dialogueTimer);dialogueTimer=undefined;nextDialogue=0;}
 function armMovement(){if(!disposed&&!hidden&&settings.autonomy&&mode==='base'&&movementTimer===undefined)schedule('movement',auto);}
 function armDialogue(){if(!disposed&&!hidden&&settings.dialogueEnabled&&dialogueTimer===undefined)schedule('dialogue',autoDialogue);}
 function clearSpeech(){speechRevision++;cancel(speechTimer);speechTimer=undefined;speechUntil=0;speak('');}
 function clear(keepSpeech=false){
  if(mode==='auto'&&autoShot){cooldown=now()+cooldownDelay();autoShot=false;}
  generation++;heldUntil=0;for(const id of timers)clearTimer(id);timers.clear();stopMovement();
  if(!keepSpeech)clearSpeech();
 }
 function resetClicks(){clicks=[];warning=false;locked=false;}
 function holdManual(ms){heldUntil=now()+ms;later(()=>base(true),ms);}
 function base(preserveSpeech=false){if(disposed)return;clear(preserveSpeech);currentEvent='';resetClicks();mode='base';show(settings.base);armMovement();armDialogue();}
 function say(record,automatic=false){
  if(!record)return 0;clearSpeech();used.set(record.id,now());speak(record.text,record);const ms=readableMs(record.text);speechUntil=now()+ms;
  if(automatic)lastAutoSpeech=now();
  // Separate speech clock survives a normal pose completion, not interruption.
  const revision=speechRevision;
  speechTimer=setTimer(()=>{if(!disposed&&revision===speechRevision){speechTimer=undefined;speechUntil=0;speak('');}},ms);
  return ms;
 }
 function line(value,trigger='autonomous'){
  let eligible=dialogues.filter(d=>d.random&&d.triggers.includes(trigger)&&(trigger==='click'||d.poses.includes(value))&&now()-(used.get(d.id)??-Infinity)>=d.cooldownMs);
  if(!eligible.length)return;
  const original=random()<.3;
  const group=eligible.filter(d=>d.origin.startsWith('original')&&d.origin!=='original creative'||d.origin==='user-supplied comic line');
  const creative=eligible.filter(d=>d.origin==='original creative');
  eligible=(original?group:creative).length?(original?group:creative):eligible;
  // Rare candidates are ten times less likely within their source group.
  const weights=eligible.map(d=>[d,d.rarity==='rare'?.1:1]),total=weights.reduce((sum,[,w])=>sum+w,0);
  let cursor=random()*total;for(const [record,weight] of weights){cursor-=weight;if(cursor<0)return record;}return eligible.at(-1);
 }
 // One roll per new Sitting/Drawing action: 25% silent, 50% existing pool, 25% dedicated line.
 // Keep these entry lines separate from the independent automatic-dialogue scheduler.
 function poseEntryLine(value,source){
  if(value!=='sitting'&&value!=='drawing')return;
  if(source==='auto'&&(!settings.dialogueEnabled||now()<speechUntil))return;
  const roll=random();
  if(roll<.25)return;
  if(roll<.75)return line(value);
  return dialogues.find(d=>d.id===(value==='sitting'?'B14-SIT-01':'B14-DRAW-01'));
 }
 function autoDialogue(){
  const compatible=mode==='base'||mode==='auto'&&['idle','smoking','sitting','speaking'].includes(pose);
  if(compatible&&now()>=speechUntil&&now()-lastAutoSpeech>=(settings.dialogueIntervalMin?settings.dialogueIntervalMin*60000:frequencies.dialogue[settings.dialogueFrequency][0]))say(line(pose)||line('speaking'),true);
  // Busy/manual/event slots are discarded. Never queue a burst behind the user.
  armDialogue();
 }
 function duration(value){return ['sitting','idle','smoking'].includes(value)?range(10000,20000):value==='drawing'?range(3000,6000):value==='speaking'?(reduced()?1000:3500):value==='dual_firing'?2400:value==='working'?15000:1500;}
 function action(value,source,forced){
  // Movement never truncates a line from its independently running scheduler.
  clear(source==='auto');resetClicks();mode=source;
  const probability={idle:.25,smoking:.35,sitting:.25,speaking:1,drawing:.5,firing:.3,dual_firing:.2,working:0};
  let record=forced||(value==='firing_dynamic'?(source!=='auto'||settings.dialogueEnabled?dialogues.find(d=>d.id==='O-01'):undefined):value==='sitting'||value==='drawing'?poseEntryLine(value,source):source!=='auto'&&random()<(probability[value]||0)?line(value):undefined);
  if(!record&&source==='manual'&&value==='speaking')record=dialogues.find(d=>d.id==='C-02');
  const speech=say(record,source==='auto');
  const endShot=()=>{if(source==='auto'&&shots.has(value)){cooldown=now()+cooldownDelay();autoShot=false;}};
  const start=()=>{
   autoShot=source==='auto'&&shots.has(value);show(value);
   if(value==='firing_dynamic')later(()=>{endShot();later(()=>base(true),850);},1500);
   else later(()=>{endShot();base(true);},shots.has(value)?duration(value):Math.max(duration(value),speech));
  };
  if(value==='firing_dynamic'){
   // Preserve the *current* visible pose during the 1s lead-in. Never
   // insert Smoking/Idle as a fake intermediate between selected actions.
   later(start,1000);
  }else start();
 }
 function auto(){
  if(mode!=='base'){armMovement();return;}
  const available=actionWeights(settings,now()<cooldown);
  if(!available.length){armMovement();return;} // all weights zero / fire cooldown
  action(choose(available,random),'auto');
 }
 function manual(value){
  if(disposed||hidden||!['idle','smoking','sitting','speaking','drawing','firing','dual_firing','firing_dynamic','working'].includes(value))return false;
  resetClicks();if(value===settings.base){base();return true;}
  if(['idle','smoking','sitting','working'].includes(value)){
   clear();mode='manual';const speech=value==='sitting'?say(poseEntryLine(value,'manual')):0;show(value);
   // Menu action is finite. The configured base stays persistent via base() above.
   holdManual(Math.max(duration(value),speech));
  }else action(value,'manual');return true;
 }
 const retainedPose=()=>['sitting','working'].includes(pose)||mode==='manual'&&['idle','smoking'].includes(pose);
 function click(){
  if(disposed||hidden||locked)return;
  if(warning){clear();mode='manual';warning=true;locked=true;later(base,say(dialogues.find(d=>d.id==='CLICK-06')));return;}
  clicks=clicks.filter(t=>now()-t<=3000);clicks.push(now());
  if(clicks.length>=5){clear();mode='manual';warning=true;show('drawing');later(base,6000);return;}
  const retain=retainedPose(),remaining=Math.max(0,heldUntil-now());
  const restingPose=retain?pose:settings.base;
  const history=clicks;clear();mode='manual';show(restingPose);clicks=history;
  const ms=say(random()<.5?line(restingPose,'click'):undefined);
  if(retain)holdManual(Math.max(remaining||duration(restingPose),ms));
  else later(()=>{const history=clicks.filter(t=>now()-t<=3000);base();clicks=history;},ms||800);
 }
 function drag(){
  if(disposed||hidden)return;
  keepDragPose=retainedPose();const target=keepDragPose?pose:settings.base;
  dragHold=keepDragPose?Math.max(0,heldUntil-now())||duration(target):0;
  clear();resetClicks();mode='manual';show(target);dragGeneration=generation;
 }
 function dragEnd(){
  const current=dragGeneration===generation;dragGeneration=-1;
  if(current&&mode==='manual'&&!warning){if(keepDragPose)holdManual(dragHold);else base();}
  dragHold=0;keepDragPose=false;
 }
 function configure(value){
  if(disposed)return;
  const previous=settings,next=normalizeSettings(value);settings=next;
  // Weight tuning is purely a future random-selection preference. Do not
  // interrupt an active pose, spoken line or event to update a slider.
  const controlKeys=['base','autonomy','autoFire','movementFrequency','dialogueEnabled','dialogueFrequency'];
  if(controlKeys.every(k=>previous[k]===next[k])){
   // A timing adjustment must not interrupt a manually selected pose,
   // event animation or its speech. Rearm only the relevant scheduler.
   if(previous.movementIntervalMin!==next.movementIntervalMin){stopMovement();armMovement();}
   if(previous.dialogueIntervalMin!==next.dialogueIntervalMin){stopDialogue();armDialogue();}
   return;
  }
  stopDialogue();base();
 }
 function visibility(value,force=false){
  if(disposed||!force&&hidden===value)return;hidden=value;clear();stopDialogue();resetClicks();mode='base';show(settings.base);
  if(!hidden){armMovement();armDialogue();}
 }
 function event(name){
  if(disposed||hidden||mode==='manual')return false;
  const spec=Object.hasOwn(codexEvents,name)?codexEvents[name]:undefined;if(!spec)return false;
  const priorities={jobStart:1,testPassed:2,deploymentComplete:3};if(mode==='event'&&priorities[name]<priorities[currentEvent])return false;
  currentEvent=name;clear();resetClicks();mode='event';
  // Wait for the established 800ms lead-in without showing a forced
  // Smoking frame. The actual action starts from the existing pose.
  later(()=>action(spec.sequence.at(-1),'event',dialogues.find(d=>d.id===spec.dialogue)),spec.sequence.length>1?800:0);return true;
 }
 function externalNotification(name){
  if(!Object.hasOwn(EXTERNAL_EVENTS,name)||disposed||hidden||mode!=='base'||now()<speechUntil)return false;
  if(now()-(lastExternal.get(name)??-Infinity)<20000)return false;
  lastExternal.set(name,now());
  const entry=EXTERNAL_EVENTS[name];
  say({id:'external-'+name,text:entry.text},false);
  return true;
 }
 function dispose(){disposed=true;clear();stopDialogue();resetClicks();}
 base();
 return {manual,click,drag,dragEnd,configure,visibility,event,externalNotification,dispose,snapshot:()=>({settings:{...settings},mode,pose,hidden,cooldown,pending:timers.size+Number(movementTimer!==undefined)+Number(dialogueTimer!==undefined)+Number(speechTimer!==undefined),nextMovement,nextDialogue,speechUntil,warning,locked})};
}
