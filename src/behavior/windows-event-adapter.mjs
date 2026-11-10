// Platform event adapter for testable Electron powerMonitor integration.
// Lock suspends all pet activity; unlock resumes and can then speak if enabled.
export function watchWindowsEvents(monitor,{suspend,resume,emit}){
 const handlers={
  'on-ac':()=>emit('powerAC'),
  'on-battery':()=>emit('powerBattery'),
  'lock-screen':()=>suspend(),
  'unlock-screen':()=>{resume();emit('unlock');}
 };
 for(const [key,handler] of Object.entries(handlers))monitor.on(key,handler);
 return ()=>{for(const [key,handler] of Object.entries(handlers))monitor.off(key,handler);};
}
