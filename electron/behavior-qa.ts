import {desktop} from './plain-launch-qa';
import {BrowserWindow,screen} from 'electron';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {constrain} from './geometry.mjs';

// Only invoked by --qa-smoke. Uses the packaged menu, secure IPC and renderer.
export async function behaviorQa(win:BrowserWindow,openMenu:()=>BrowserWindow|undefined,trace:Record<string,any>[],resize:(width:number)=>void,evidence:string){
 mkdirSync(evidence,{recursive:true});
 const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
 const wait=async(predicate:()=>boolean,label:string)=>{for(let i=0;i<120;i++){if(predicate())return;await pause(20);}throw Error('B13.2 timeout: '+label+' '+JSON.stringify(trace.slice(-18)));};
 const menuClick=async(command:string)=>{
  const popup=openMenu();if(!popup)throw Error('QA menu unavailable');
  if(popup.webContents.isLoading())await new Promise<void>(resolve=>popup.webContents.once('did-finish-load',()=>resolve()));
  const pet=win.getBounds(),area=screen.getDisplayMatching(pet).workArea;
  popup.setBounds(constrain({...popup.getBounds(),x:pet.x-20,y:pet.y+pet.height-popup.getBounds().height},[area]));
  popup.show();popup.focus();await pause(70);
  const hidden=await win.webContents.executeJavaScript('document.hidden');
  const point=await popup.webContents.executeJavaScript(`(()=>{const b=Array.from(document.querySelectorAll('[data-action]')).find(b=>b.dataset.action===${JSON.stringify(command)});if(!b)return {missing:true};const panel=b.closest('[data-panel]');if(panel)document.querySelector('[data-tab="'+panel.dataset.panel+'"]').click();b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
  if(point.missing)throw Error('B13.2 QA menu button unavailable: '+command);
  const before=trace.filter(row=>row.phase==='sent').at(-1)?.commandId||0;
  popup.webContents.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});
  popup.webContents.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});
  if(command.startsWith('pose:')){
   const pose=command.slice(5);await wait(()=>trace.some(row=>row.phase==='sent'&&row.pose===pose&&row.commandId>before),'menu IPC '+command);
   const id=trace.find(row=>row.phase==='sent'&&row.pose===pose&&row.commandId>before)!.commandId;
   // Replay the duplicate native show/resume ordering that used to reset actions.
   win.webContents.send('pet:action','system:resume');
   await wait(()=>trace.some(row=>row.commandId===id&&row.phase==='accepted'),'controller accepted '+command);
   await wait(()=>trace.some(row=>row.commandId===id&&row.pose===pose&&['rendered','reused'].includes(row.phase)),'actual pose '+command);
   const entries=trace.filter(row=>row.commandId===id);
   const visible=await win.webContents.executeJavaScript(`(()=>{const s=document.querySelector('.pet-stage:not([data-exiting])'),i=s?.querySelector('img');return s?.dataset.pose===${JSON.stringify(pose)}&&i?.complete&&i.naturalWidth>0})()`);
   if(!visible||entries.some(row=>row.phase==='blocked'))throw Error('Manual command did not render '+command);
   return {commandId:id,pose,documentHiddenWhileMenu:hidden,entries};
  }
  await pause(70);return {command};
 };
 // Exercise a real posture-to-posture menu command and trace every renderer
 // request. User should never see an intermediate Smoking base frame.
 await menuClick('pose:sitting');await pause(180);
 const transitionMark=trace.length;
 await menuClick('pose:working');
 const transient=trace.slice(transitionMark).filter(row=>row.phase==='requested'&&row.pose==='smoking');
 if(transient.length)throw Error('Unexpected intermediate Smoking during manual action: '+JSON.stringify(transient));
 const commands=[];
 for(const pose of ['idle','smoking','sitting','working','drawing','speaking','firing','dual_firing','firing_dynamic'])for(let repeat=0;repeat<2;repeat++)commands.push({...await menuClick('pose:'+pose),repeat});
 for(const pose of ['drawing','speaking','firing','dual_firing','firing_dynamic']){
  const rows=commands.filter(row=>'pose' in row&&row.pose===pose);
  if(rows.some(row=>!('entries' in row)||!row.entries!.some((entry:any)=>entry.phase==='rendered'&&entry.pose===pose)))throw Error('Repeat did not create a fresh action '+pose);
 }
 const uxEvidence=join(evidence,'../windows-b13-3-captures');mkdirSync(uxEvidence,{recursive:true});
 const clicks=[];
 for(const pose of ['sitting','working']){
  await menuClick('pose:'+pose);await pause(180);
  const point=await win.webContents.executeJavaScript(`(()=>{const i=document.querySelector('.pet-stage:not([data-exiting]) img'),r=i.getBoundingClientRect(),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d');g.drawImage(i,0,0);const a=g.getImageData(0,0,c.width,c.height).data;let x=Math.floor(c.width*.5),y=Math.floor(c.height*.45);while(a[(y*c.width+x)*4+3]<200&&y<c.height-2)y++;const z=Math.min(r.width/c.width,r.height/c.height);return{x:Math.round(r.x+(r.width-c.width*z)/2+x*z),y:Math.round(r.y+(r.height-c.height*z)/2+y*z)}})()`);
  win.focus();win.webContents.sendInputEvent({type:'mouseMove',...point});await pause(30);win.webContents.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});win.webContents.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});await pause(450);
  const after=await win.webContents.executeJavaScript(`document.querySelector('.pet-stage:not([data-exiting])').dataset.pose`);
  writeFileSync(join(uxEvidence,`click-${pose}-desktop.png`),(await desktop(win)).image.toPNG());await pause(4300);
  const settled=await win.webContents.executeJavaScript(`document.querySelector('.pet-stage:not([data-exiting])').dataset.pose`);
  if(after!==pose||settled!==pose)throw Error('Click changed held posture '+pose);clicks.push({pose,after,settled});
 }
 for(const command of ['setting:autonomy:false','setting:dialogueEnabled:false','setting:dialogueEnabled:true','setting:autoFire:false'])await menuClick(command);
 const menu=openMenu()!;if(menu.webContents.isLoading())await new Promise<void>(resolve=>menu.webContents.once('did-finish-load',()=>resolve()));
 menu.show();
 await menu.webContents.executeJavaScript(`(()=>{
  document.querySelector('[data-tab="frequency"]').click();
  for(const [key,value] of [['movementIntervalMin',8],['dialogueIntervalMin',2],['shotCooldownMin',15]]){
   const slider=document.querySelector('[data-minute-key="'+key+'"]');
   slider.value=String(value);slider.dispatchEvent(new Event('input',{bubbles:true}));
   slider.dispatchEvent(new Event('change',{bubbles:true}));
  }
 })()`);
 await pause(250);
 if(menu.isDestroyed())throw Error('Time sliders incorrectly closed the settings panel');
 const values=await menu.webContents.executeJavaScript(`window.castleMenu.getInfo().then(info=>({move:info.status.movementIntervalMin,dialogue:info.status.dialogueIntervalMin,shot:info.status.shotCooldownMin}))`);
 if(values.move!==8||values.dialogue!==2||values.shot!==15)throw Error('Native minute settings not saved: '+JSON.stringify(values));
 const settings=await menu.webContents.executeJavaScript(`({movementOff:document.querySelector('#autonomy-setting').textContent,dialogueOn:document.querySelector('#dialogue-setting').textContent})`);
 if(!settings.movementOff.endsWith('꺼짐')||!settings.dialogueOn.endsWith('켜짐'))throw Error('Independent native menu settings not restored: '+JSON.stringify(settings));
 const captureMenu=async(name:string)=>writeFileSync(join(uxEvidence,name),(await menu.webContents.capturePage()).toPNG());
 await captureMenu('menu-minute-sliders.png');
 for(const tab of ['basic','frequency','poses','more']){
  await menu.webContents.executeJavaScript(`document.querySelector('[data-tab="${tab}"]').click()`);
  const fits=await menu.webContents.executeJavaScript(`(()=>{const p=document.querySelector('[data-panel="${tab}"]');return p.scrollHeight<=p.clientHeight+1})()`);
  if(!fits&&tab!=='frequency')throw Error('Roomy menu tab overflow: '+tab);
  await captureMenu('menu-'+tab+'.png');
 }
 await menu.webContents.executeJavaScript(`(()=>{document.querySelector('[data-tab="frequency"]').click();document.querySelector('[data-frequency-open="weights"]').click();const slider=document.querySelector('[data-weight-row="working"] input');slider.value='20';slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
 await pause(220);
 if(menu.isDestroyed())throw Error('Frequency slider incorrectly closed the settings panel');
 const savedWeight=await menu.webContents.executeJavaScript(`window.castleMenu.getInfo().then(info=>info?.status?.actionWeights?.working)`);
 if(savedWeight!==20)throw Error('Native per-action weight was not persisted: '+savedWeight);
 writeFileSync(join(uxEvidence,'menu-action-weights.png'),(await menu.webContents.capturePage()).toPNG());
 await menu.webContents.executeJavaScript(`document.querySelector('#weights-reset').click()`);
 await pause(160);
 const resetWeight=await menu.webContents.executeJavaScript(`window.castleMenu.getInfo().then(info=>info?.status?.actionWeights?.working)`);
 if(resetWeight!==12)throw Error('Native per-action weight reset failed: '+resetWeight);
 await menu.webContents.executeJavaScript(`(()=>{document.querySelector('[data-tab="more"]').click();document.querySelector('[data-more-open="archive"]').click();})()`);
 writeFileSync(join(uxEvidence,'menu-dialogue-archive.png'),(await menu.webContents.capturePage()).toPNG());
 await menu.webContents.executeJavaScript(`(()=>{document.querySelector('[data-more-view="archive"] [data-more-back]').click();document.querySelector('[data-more-open="help"]').click();})()`);
 writeFileSync(join(uxEvidence,'menu-readable-help.png'),(await menu.webContents.capturePage()).toPNG());
 await menu.webContents.executeJavaScript(`document.querySelector('[data-tab="basic"]').click()`);
 writeFileSync(join(evidence,'menu.png'),(await menu.webContents.capturePage()).toPNG());menu.close();
 await menuClick('pose:smoking');await pause(180);
 const smoke=[];
 const originalReducedMotion=await win.webContents.executeJavaScript(`matchMedia('(prefers-reduced-motion: reduce)').matches`);
 win.webContents.debugger.attach('1.3');
 try{
  for(const motionMode of ['no-preference','reduce']){
   await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:motionMode}]});await pause(80);
   for(const width of [120,180,240,360]){
    resize(width);await pause(70);
    const metrics=await win.webContents.executeJavaScript(`(()=>{const stage=document.querySelector('.pet-stage:not([data-exiting])');const image=stage?.querySelector('img');return {pose:stage?.dataset.pose,approvedImage:!!image?.complete&&image.naturalWidth>0,auxiliaryNodes:stage?.querySelectorAll('.b-smoking-layer,.b-smoking-anchor,.b-smoke-strand').length??-1}})()`);
    if(metrics.pose!=='smoking'||!metrics.approvedImage||metrics.auxiliaryNodes!==0)throw Error('Unexpected auxiliary smoke '+JSON.stringify({width,motionMode,...metrics}));
    smoke.push({width,motionMode,...metrics});
    if(motionMode==='no-preference')writeFileSync(join(evidence,`${width}-smoking.png`),(await win.webContents.capturePage()).toPNG());
   }
  }
 }finally{await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});win.webContents.debugger.detach();}
 return {passed:true,commands,settings,smoke,clicks,reducedMotion:true,originalReducedMotion};

}
