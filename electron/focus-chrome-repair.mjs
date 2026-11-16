// Windows compositor workaround for Electron frameless/transparent ghost titlebar
// after focus loss (upstream electron/electron #39959, #46882).
// Do not re-create, hide/show or focus the pet; preserve hit-test, sprite,
// overlay speech, geometry and always-on-top state throughout the repair.
export function createFocusChromeRepair(window,{platform=process.platform,workArea=()=>null,delayMs=18,setTimer=setTimeout,clearTimer=clearTimeout,onRepair=()=>{},onError=()=>{},isDragging=()=>false}={}){
 let timer=null,repairing=false,disposed=false;
 let attempts=0,successes=0,lastReason=null,lastError=null;
 const allowed=platform==='win32';
 function usable(){
  return allowed&&!disposed&&!isDragging()&&!window.isDestroyed()&&window.isVisible()&&!window.isMinimized();
 }
 function perform(reason){
  if(!usable()||repairing)return false;
  repairing=true;attempts++;lastReason=reason;
  let bounds,oldResizable,changed=false,restored=false;
  try{
   bounds=window.getBounds();
   oldResizable=window.isResizable();
   const area=workArea(bounds);
   const bottom=area?area.y+area.height:Infinity;
   const direction=bounds.y+bounds.height+1<=bottom?1:-1;
   if(bounds.height+direction<2)return false;
   // Temporarily allow a 1px native resize so DWM recalculates non-client
   // painting; a regular webContents repaint cannot remove native chrome.
   if(!oldResizable)window.setResizable(true);
   window.setBounds({...bounds,height:bounds.height+direction});
   changed=true;
   window.setBounds(bounds);
   restored=true;
   successes++;lastError=null;
   onRepair({reason,bounds,direction});
   return true;
  }catch(error){lastError=String(error);onError(error);return false;}
  finally{
   // Never leave the pet resizable or larger/smaller after a failed repair.
   if(changed&&!restored&&bounds){try{window.setBounds(bounds);}catch(error){onError(error);}}
   if(oldResizable===false){try{window.setResizable(false);}catch(error){onError(error);}}
   repairing=false;
  }
 }
 function cancelPending(){if(timer!==null){clearTimer(timer);timer=null;return true;}return false;}
 function schedule(reason){
  if(!usable())return false;
  if(timer!==null)clearTimer(timer);
  timer=setTimer(()=>{timer=null;perform(reason);},delayMs);
  return true;
 }
 function dispose(){disposed=true;cancelPending();}
 return {schedule,perform,cancelPending,dispose,isRepairing:()=>repairing,stats:()=>({attempts,successes,lastReason,lastError,allowed})};
}
