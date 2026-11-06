// Independent B-only key-pose review sequencer. Owns exactly one cancellable timeout.
export const sequences = {
 idle:[['idle',1200]], drawing:[['idle',300],['drawing',900]],
 firing:[['idle',300],['drawing',600],['firing',220],['drawing',550],['idle',500]],
 working:[['idle',350],['working',2400],['idle',500]],
 smoking:[['idle',350],['smoking',2200],['idle',500]],
 dual_firing:[['idle',350],['dual_firing',2200],['idle',500]],
 sitting:[['sitting',2000],['idle',500]], firing_dynamic:[['firing_dynamic',1800],['idle',500]],
 speaking:Array.from({length:7},(_,i)=>[`speaking-${String(i+1).padStart(2,'0')}`,350]),
};
export function createBReview(show, clock={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}) {
 let timer, steps=[],index=0, paused=false, running=false, repeat=false, speed=1, reduced=false;
 const clear=()=>{if(timer!==undefined)clock.clear(timer);timer=undefined;};
 const schedule=()=>{clear();if(!running||paused)return;timer=clock.set(next,reduced?700:steps[index][1]/speed);};
 function next(){timer=undefined;if(!running)return;index++;if(index>=steps.length){if(repeat)index=0;else{running=false;show('idle');return;}}show(steps[index][0]);schedule();}
 const cancel=()=>{clear();running=false;steps=[];show('idle');};
 return {start(name,options={}){clear();steps=name==='all'?Object.values(sequences).flat():sequences[name];if(!steps)throw Error('Unknown B action: '+name);index=0;running=true;repeat=!!options.repeat;speed=options.speed||1;show(steps[0][0]);schedule();},pause(value){paused=value;if(value)clear();else schedule();},reduced(value){reduced=value;schedule();},cancel,dispose(){clear();running=false;steps=[];},get running(){return running;}};
}
