import {copyFile,mkdir} from 'node:fs/promises';
await mkdir('dist-electron',{recursive:true});
await copyFile('electron/pet-menu.html','dist-electron/pet-menu.html');
await copyFile('electron/pet-speech.html','dist-electron/pet-speech.html');
