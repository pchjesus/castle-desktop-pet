const input=document.querySelector('#pairing'),enabled=document.querySelector('#enabled'),state=document.querySelector('#state');
chrome.storage.local.get(['pairingToken','enabled']).then(data=>{
 input.value=data.pairingToken||'';enabled.checked=!!data.enabled;
});
document.querySelector('#save').addEventListener('click',async()=>{
 const token=input.value.trim().toLowerCase();
 if(!/^[0-9a-f]{64}$/.test(token)){state.textContent='연결 토큰은 64자리 영문/숫자여야 해요.';return;}
 await chrome.storage.local.set({pairingToken:token,enabled:enabled.checked});
 state.textContent='저장 완료. 아킬라 앱에서 Brave 다운로드 연결도 켜 주세요.';
});
