import test from 'node:test';
import assert from 'node:assert/strict';
import {createFocusChromeRepair} from '../electron/focus-chrome-repair.mjs';
function fixture(init={}){
 const calls=[],w={
  bounds:{x:1500,y:760,width:180,height:225},
  resizable:false,visible:true,minimized:false,destroyed:false,
  isDestroyed(){return this.destroyed},isVisible(){return this.visible},isMinimized(){return this.minimized},
  getBounds(){return {...this.bounds}},isResizable(){return this.resizable},
  setResizable(v){this.resizable=v;calls.push(['resizable',v])},
  setBounds(b){if(!this.resizable)throw Error('must be resizable');this.bounds={...b};calls.push(['bounds',{...b}])},
  ...init
 };
 return {w,calls};
}
test('Windows native blur repair performs bounded 1px nudge then restores exactly',()=>{
 const {w,calls}=fixture();const reports=[];
 const repair=createFocusChromeRepair(w,{platform:'win32',workArea:()=>({x:0,y:0,width:1920,height:1080}),onRepair:e=>reports.push(e)});
 assert(repair.perform('blur'));assert.deepEqual(w.bounds,{x:1500,y:760,width:180,height:225});
 assert.equal(w.resizable,false);assert.deepEqual(calls,[['resizable',true],['bounds',{x:1500,y:760,width:180,height:226}],['bounds',{x:1500,y:760,width:180,height:225}],['resizable',false]]);
 assert.equal(repair.stats().successes,1);assert.equal(reports[0].reason,'blur');repair.dispose();
});
test('at display bottom edge, compensation shrinks then restores without crossing display',()=>{
 const {w,calls}=fixture({bounds:{x:50,y:855,width:180,height:225}});
 const repair=createFocusChromeRepair(w,{platform:'win32',workArea:()=>({x:0,y:0,width:1920,height:1080})});
 assert(repair.perform('blur'));assert.equal(calls[1][1].height,224);
 assert.equal(w.getBounds().height,225);assert.equal(w.isResizable(),false);repair.dispose();
});
test('focus and blur scheduling coalesces; never refocuses, hides or replaces the character',()=>{
 const {w,calls}=fixture();
 let pending=new Map(),serial=0;const fired=[];
 const repair=createFocusChromeRepair(w,{platform:'win32',setTimer:fn=>{const id=++serial;pending.set(id,fn);return id},clearTimer:id=>pending.delete(id),onRepair:x=>fired.push(x)});
 assert(repair.schedule('focus'));assert(repair.schedule('blur'));assert.equal(pending.size,1);
 for(const fn of pending.values())fn();
 assert.deepEqual(fired.map(x=>x.reason),['blur']);assert.equal(w.bounds.height,225);
 assert(calls.every(([method])=>method==='bounds'||method==='resizable'));repair.dispose();
});
test('other platforms, hidden/minimized and destroyed windows never trigger a repair',()=>{
 for(const initial of [{platform:'linux'},{visible:false},{minimized:true},{destroyed:true}]){
  const {w,calls}=fixture(initial);
  const repair=createFocusChromeRepair(w,{platform:initial.platform||'win32'});
  assert.equal(repair.schedule('blur'),false);assert.equal(repair.perform('blur'),false);
  assert.deepEqual(calls,[]);repair.dispose();
 }
});
test('repair errors cannot strand the window in resizable state',()=>{
 const {w}=fixture({setBounds(b){if(b.height!==225)throw Error('DWM failure');this.bounds={...b}}});
 let error;const repair=createFocusChromeRepair(w,{platform:'win32',onError:e=>error=String(e)});
 assert.equal(repair.perform('blur'),false);assert.match(error,/DWM failure/);
 assert.equal(w.resizable,false);assert.equal(w.bounds.height,225);repair.dispose();
});

test('drag suppresses native 1px DWM nudge even if a focus repair was queued',()=>{
 const {w,calls}=fixture();
 let dragging=false,serial=0;const pending=new Map();
 const repair=createFocusChromeRepair(w,{platform:'win32',isDragging:()=>dragging,
  setTimer:fn=>{const id=++serial;pending.set(id,fn);return id},
  clearTimer:id=>pending.delete(id)});
 assert.equal(repair.schedule('focus'),true);
 dragging=true;repair.cancelPending();
 assert.equal(pending.size,0);
 assert.equal(repair.schedule('blur'),false);
 assert.equal(repair.perform('drag'),false);
 assert.deepEqual(calls,[]);
 dragging=false;
 assert.equal(repair.perform('blur'),true);
 assert.equal(w.getBounds().height,225);
 assert.equal(w.isResizable(),false);
 repair.dispose();
});
