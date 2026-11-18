import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLibrary,normalizeMusicSettings,trackTitle,validMp3Path,MAX_TRACKS,MAX_MP3_BYTES} from '../src/music/music-library.mjs';
import {parseMp3Range,streamSelectedMp3} from '../src/music/mp3-stream.mjs';
import {mkdtemp,writeFile,truncate,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBeatDetector} from '../src/music/beat-detector.mjs';
import {createVolumeDialogue} from '../src/music/volume-dialogue.mjs';
test('local music accepts MP3 only, deduplicates paths and never uses URLs',()=>{
 const files=['C:\\Music\\Castle.mp3','C:\\Music\\Castle.MP3','C:\\Music\\Ignore.exe','https://example.com/music.mp3','D:\\Tracks\\Second.mp3'];
 const result=normalizeLibrary(files);
 assert(!validMp3Path('C:/music/a.wav'));
 assert.equal(result.filter(x=>x.toLowerCase().includes('castle')).length,1);
 assert.equal(result.length<=MAX_TRACKS,true);
 assert.equal(trackTitle('/my path/아킬라.mp3'),'아킬라');
});
test('volumes are bounded, music shooting is opt-in, repeat off',()=>{
 assert.deepEqual(normalizeMusicSettings({volume:999,rhythmFire:'yes',repeat:1}),{volume:65,rhythmFire:false,repeat:false});
 assert.deepEqual(normalizeMusicSettings({volume:0,rhythmFire:true,repeat:true}),{volume:0,rhythmFire:true,repeat:true});
});
test('bass transients trigger rarely, silence and sustained notes never spam',()=>{
 const detector=createBeatDetector({cooldownMs:500,minimum:50,ratio:1.3});
 const soft=Uint8Array.from({length:32},()=>12);
 const burst=Uint8Array.from({length:32},(_,i)=>i>=2&&i<14?190:12);
 assert.equal(detector.sample(soft,0),false);
 assert.equal(detector.sample(burst,700),true);
 assert.equal(detector.sample(burst,800),false);
 assert.equal(detector.sample(soft,1000),false);
 detector.reset();
 assert.equal(detector.sample(soft,0),false);
});

import {QA_MP3_BASE64} from '../electron/music-qa-tone.mjs';
test('offline QA MP3 fixture contains exactly the generated original audio bytes',()=>{
 const b=Buffer.from(QA_MP3_BASE64,'base64');
 assert.equal(b.byteLength,404);
 assert.equal(b.subarray(0,3).toString(),'ID3');
});


test('volume reacts at 50% and 80%, only when raised manually, per-band cooldown',()=>{
 const speak=createVolumeDialogue();
 const t0=100000;
 assert.equal(speak(45,49,t0),null);
 assert.equal(speak(49,50,t0),'시끄럽군.');
 assert.equal(speak(50,79,t0+1000),null,'same middle band cannot spam');
 assert.equal(speak(79,80,t0+2000),'네놈 고막은 티타늄이라도 되나?','high tier is allowed after 50% line');
 assert.equal(speak(80,100,t0+3000),null,'high band cannot spam');
 assert.equal(speak(100,40,t0+4000),null,'turning down never speaks');
 assert.equal(speak(40,55,t0+5000),null,'50% tier still in cooldown');
 assert.equal(speak(55,85,t0+6000),null,'80% tier still in cooldown');
 assert.equal(speak(85,90,t0+62000),'네놈 고막은 티타늄이라도 되나?');
 assert.equal(speak(90,20,t0+63000),null);
 assert.equal(speak(20,50,t0+64000),'시끄럽군.');
 const direct=createVolumeDialogue();
 assert.equal(direct(65,95,t0),'네놈 고막은 티타늄이라도 되나?','jumping straight to 80%+ prefers high tier');
 assert.equal(direct(95,95,t0+1000),null);
});


test('1GiB streaming limit accommodates 2+ hours even at 320kbps',()=>{
 assert.equal(MAX_MP3_BYTES,1024*1024*1024);
 const twoHours320kbps=2*60*60*320000/8;
 assert(twoHours320kbps<MAX_MP3_BYTES);
 const sixHours320kbps=6*60*60*320000/8;
 assert(sixHours320kbps<MAX_MP3_BYTES);
});

test('MP3 range parser handles bounded, suffix and invalid seeks',()=>{
 assert.deepEqual(parseMp3Range(null,100),{start:0,end:99,status:200});
 assert.deepEqual(parseMp3Range('bytes=0-',100),{start:0,end:99,status:206});
 assert.deepEqual(parseMp3Range('bytes=5-14',100),{start:5,end:14,status:206});
 assert.deepEqual(parseMp3Range('bytes=-10',100),{start:90,end:99,status:206});
 assert.deepEqual(parseMp3Range('bytes=95-150',100),{start:95,end:99,status:206});
 for(const range of ['bytes=100-','bytes=10-5','bytes=','bytes=-0','bytes=1-2,4-5','bytes=-999999999999999999999'])
  assert.throws(()=>parseMp3Range(range,100),RangeError,range);
});

test('MP3 byte ranges stream a 350 MiB sparse file without copying 350 MiB into memory',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'castle-music-range-'));
 const filename=join(dir,'two-hour-song.mp3');
 try{
  await writeFile(filename,Buffer.from([0x49,0x44,0x33,0x04]));
  await truncate(filename,350*1024*1024); // sparse fixture; no 350 MiB buffer
  const head=await streamSelectedMp3(filename,'bytes=0-3');
  assert.equal(head.status,206);
  assert.equal(head.headers.get('content-type'),'audio/mpeg');
  assert.equal(head.headers.get('content-length'),'4');
  assert.equal(head.headers.get('accept-ranges'),'bytes');
  assert.equal(head.headers.get('access-control-allow-origin'),'*');
  assert.deepEqual(new Uint8Array(await head.arrayBuffer()),Uint8Array.from([0x49,0x44,0x33,0x04]));
  const last=await streamSelectedMp3(filename,'bytes=-24');
  assert.equal(last.status,206);
  assert.match(last.headers.get('content-range'),/^bytes \d+-\d+\/367001600$/);
  assert.equal((await last.arrayBuffer()).byteLength,24);
  const bad=await streamSelectedMp3(filename,'bytes=400000000-');
  assert.equal(bad.status,416);
  const options=await streamSelectedMp3(filename,null,undefined,'OPTIONS');
  assert.equal(options.status,204);
  const headOnly=await streamSelectedMp3(filename,'bytes=0-10',undefined,'HEAD');
  assert.equal(headOnly.status,206);
  assert.equal((await headOnly.arrayBuffer()).byteLength,0);
  const forbidden=await streamSelectedMp3(join(dir,'not-mp3.txt'));
  assert.equal(forbidden.status,403);
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
});
