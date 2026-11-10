export type WindowsEventName='powerAC'|'powerBattery'|'unlock';
export function watchWindowsEvents(monitor:import('electron').PowerMonitor,actions:{suspend:()=>void;resume:()=>void;emit:(name:WindowsEventName)=>void}):()=>void;
