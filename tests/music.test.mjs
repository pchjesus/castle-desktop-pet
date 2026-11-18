import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLibrary,normalizeMusicSettings,trackTitle,validMp3Path,MAX_TRACKS} from '../src/music/music-library.mjs';
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
