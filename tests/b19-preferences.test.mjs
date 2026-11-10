import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {normalizeFavorites,toggleFavorite,favoriteDialogueAllowed} from '../src/behavior/favorites.mjs';
import {normalizePositionLock,loadPositionLock,savePositionLock,positionFor} from '../electron/position-lock.mjs';
import {normalizeSettings,createBehavior} from '../src/behavior/controller.mjs';
test('favorites enforce whitelisted unique poses/lines and protect Easter eggs',()=>{
 const saved=normalizeFavorites({poses:['working','working','unknown','idle'],dialogues:['O-02','O-02','CLICK-06','bad']});
 assert.deepEqual(saved,{poses:['working','idle'],dialogues:['O-02']});
 assert(!favoriteDialogueAllowed('CLICK-06'));assert.equal(toggleFavorite(saved,'dialogue','CLICK-06'),null);
 assert.deepEqual(toggleFavorite(saved,'pose','idle').poses,['working']);
 assert.deepEqual(toggleFavorite(saved,'pose','sitting').poses,['working','idle','sitting']);
 assert.deepEqual(toggleFavorite(saved,'dialogue','O-02').dialogues,[]);
});
test('position lock preserves original anchor across monitor disconnect and reconnect',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'castle-b19-'));const path=join(dir,'lock.json');
 try{
  const anchor={x:1800,y:750,width:180,height:225};
  const saved=savePositionLock(path,{enabled:true,anchor,displayId:2});
  assert.deepEqual(loadPositionLock(path),saved);
  const main={id:1,workArea:{x:0,y:0,width:1280,height:720}},second={id:2,workArea:{x:1280,y:0,width:1920,height:1080}};
  assert.deepEqual(positionFor(saved,[main,second],anchor),anchor);
  const fallback=positionFor(saved,[main],anchor);
  assert(fallback.x>=0&&fallback.x+fallback.width<=1280);
  assert.deepEqual(loadPositionLock(path).anchor,anchor);
  assert.deepEqual(positionFor(saved,[main,second],fallback),anchor);
  await readFile(path,'utf8');
  assert.equal(normalizePositionLock({enabled:true,anchor:{x:NaN},displayId:2}).enabled,false);
 }finally{await rm(dir,{recursive:true});}
});
test('dialogue style validates choices without changing legacy baseline',()=>{
 assert.equal(normalizeSettings(null).dialogueStyle,undefined);
 assert.equal(normalizeSettings({dialogueStyle:'original'}).dialogueStyle,'original');
 assert.equal(normalizeSettings({dialogueStyle:'creative'}).dialogueStyle,'creative');
 assert.equal(normalizeSettings({dialogueStyle:'bad'}).dialogueStyle,undefined);
});
test('manual favorite dialogue respects explicit whitelist and returns to base without triggering a shot',()=>{
 let time=0,serial=0,poses=[],lines=[];const tasks=new Map();
 const b=createBehavior({settings:{autonomy:false,dialogueEnabled:false},random:()=>0,now:()=>time,
  render:pose=>poses.push(pose),speak:(text,record)=>lines.push([text,record?.id]),
  setTimer:(fn,ms)=>{const id=++serial;tasks.set(id,{fn,at:time+ms});return id;},clearTimer:id=>tasks.delete(id)});
 assert.equal(b.favoriteDialogue('CLICK-06'),false);
 assert.equal(b.favoriteDialogue('O-02'),true);
 assert.equal(poses.at(-1),'speaking');assert.equal(lines.at(-1)[1],'O-02');
 for(let i=0;i<20;i++){const entries=[...tasks].filter(([,t])=>t.at<=time+20000);if(!entries.length)break;
  const due=Math.min(...entries.map(([,t])=>t.at));time=due;for(const [id,t] of entries)if(t.at===due&&tasks.has(id)){tasks.delete(id);t.fn();}}
 assert.equal(poses.at(-1),'smoking');assert(!poses.includes('firing'));
 b.dispose();
});
