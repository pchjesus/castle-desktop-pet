const ENDPOINT='http://127.0.0.1:47183/v1/download-complete';
chrome.downloads.onChanged.addListener(async delta=>{
 if(delta?.state?.current!=='complete'||!Number.isInteger(delta.id))return;
 try{
  const {pairingToken,enabled}=await chrome.storage.local.get(['pairingToken','enabled']);
  if(!enabled||typeof pairingToken!=='string'||!/^[0-9a-f]{64}$/.test(pairingToken))return;
  await fetch(ENDPOINT,{
   method:'POST',headers:{'Content-Type':'application/json','X-Castle-Token':pairingToken},
   body:JSON.stringify({event:'downloadComplete',id:delta.id})
  });
 }catch{
  // Pet might be closed or browser offline; download itself must never be affected.
 }
});
chrome.action.onClicked.addListener(()=>chrome.runtime.openOptionsPage());
