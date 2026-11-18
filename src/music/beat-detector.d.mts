export function createBeatDetector(options?:{cooldownMs?:number;minimum?:number;ratio?:number}):{
 sample:(bins:ArrayLike<number>,now:number)=>boolean;
 reset:()=>void;
};
