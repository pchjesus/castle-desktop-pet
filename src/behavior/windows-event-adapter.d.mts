import type {ExternalEventName} from './external-events.mjs';
export function watchWindowsEvents(monitor:import('electron').PowerMonitor,actions:{suspend:()=>void;resume:()=>void;emit:(name:ExternalEventName)=>void}):()=>void;
