export const codexEventNames:readonly ['jobStart','testPassed','deploymentComplete'];
export function parseCodexEvent(line:string):string|null;
export function watchCodexEvents(
 file:string,
 onEvent:(name:string)=>void,
 options?:{intervalMs?:number;setIntervalFn?:(callback:()=>void,ms:number)=>any;clearIntervalFn?:(handle:any)=>void}
):{poll:()=>void;stop:()=>void;path:string};
