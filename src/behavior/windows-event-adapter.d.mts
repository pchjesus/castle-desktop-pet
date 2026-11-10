import type {ExternalEventName} from './external-events.mjs';
export function watchWindowsEvents(monitor:{on:(key:string,listener:()=>void)=>unknown;off:(key:string,listener:()=>void)=>unknown},actions:{suspend:()=>void;resume:()=>void;emit:(name:ExternalEventName)=>void}):()=>void;
