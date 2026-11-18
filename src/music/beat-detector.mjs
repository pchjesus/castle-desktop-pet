// A deliberately conservative bass transient gate, not a tempo estimator.
// No sustained-volume firing; soft music produces no visual shot.
export function createBeatDetector({cooldownMs=620,minimum=54,ratio=1.33}={}){
 let baseline=0,lastBeat=-Infinity;
 return {
  sample(bins,now){
   if(!bins||bins.length<8||!Number.isFinite(now))return false;
   let sum=0;
   for(let i=2;i<Math.min(14,bins.length);i++)sum+=bins[i];
   const level=sum/(Math.min(14,bins.length)-2);
   if(baseline===0)baseline=level;
   const threshold=Math.max(minimum,baseline*ratio);
   const beat=level>threshold&&now-lastBeat>=cooldownMs;
   baseline=baseline*.94+level*.06;
   if(beat)lastBeat=now;
   return beat;
  },
  reset(){baseline=0;lastBeat=-Infinity;}
 };
}
