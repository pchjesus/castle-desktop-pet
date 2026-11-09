import {cp,mkdir,readFile,writeFile,access,rm} from 'node:fs/promises';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
if(process.platform!=='win32')throw Error('Windows QA packaging must run on Windows with the pinned Electron runtime');
const p=JSON.parse(await readFile('package.json','utf8'));const dest='dist-qa/CastlePetQA';
await access('node_modules/electron/dist/electron.exe');await access('preview-assets');await access('dist-electron/main.cjs');await access('dist-electron/menu-preload.cjs');await access('dist-electron/pet-menu.html');await access('dist-electron/pet-speech.html');await access('dist-electron/speech-preload.cjs');
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});const runtimeRoot=join(dest,'runtime');await cp('node_modules/electron/dist',runtimeRoot,{recursive:true});
await rm(join(runtimeRoot,'resources/default_app.asar'),{force:true});
const runtime=JSON.parse(await readFile('node_modules/electron/package.json','utf8'));
await writeFile(join(dest,'QA_BUILD.json'),JSON.stringify({electron:runtime.version,sourceCommit:process.env.GITHUB_SHA||'local-build',status:'unapproved-qa',defaultOutfit:'mustang'},null,2));
const app=join(runtimeRoot,'resources/app');await mkdir(app,{recursive:true});
for(const dir of ['dist','dist-electron','preview-assets'])await cp(dir,join(app,dir),{recursive:true});
await cp('preview.html',join(app,'preview.html'));await writeFile(join(app,'package.json'),JSON.stringify({name:p.name,version:p.version,main:p.main}));
await writeFile(join(app,'castle-runtime.json'),JSON.stringify({family:'CastleDesktopPet.Runtime',version:'B-13.3',mainSha256:createHash('sha256').update(await readFile(join(app,'dist-electron/main.cjs'))).digest('hex'),htmlSha256:createHash('sha256').update(await readFile(join(app,'dist/index.html'))).digest('hex')},null,2));
const compiler=join(process.env.SystemRoot||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
try{const output=execFileSync(compiler,['/nologo','/target:winexe','/platform:x64','/codepage:65001','/reference:System.Windows.Forms.dll','/out:'+join(dest,'CastlePet.exe'),'electron/portable-launcher.cs'],{encoding:'utf8'});if(output)console.log(output);}catch(error){console.error('::error::Portable launcher compiler: '+String(error.stdout||error.stderr||error.message).replaceAll('\r','').replaceAll('\n','%0A'));throw error;}
await writeFile(join(dest,'먼저 읽어주세요.txt'),'B-13.3 사용자 검수용 Windows 포터블\r\n\r\n1. ZIP 전체를 새 폴더에 압축 풀기 합니다. ZIP 안에서 실행하지 마세요.\r\n2. 기존 펫은 우클릭 → 펫 종료로 닫습니다.\r\n3. 최상위 CastlePet.exe를 실행합니다. runtime 폴더의 electron.exe나 HTML은 직접 실행하지 마세요.\r\n\r\n투명 펫 / 말풍선 / 메뉴는 제목 표시줄이 없습니다. 이미지 검수는 메뉴의 더보기에서 여는 별도 도구이며 배경과 제목 표시줄이 있습니다.\r\nSmoking은 약 2초 연기 반복을 표시하며, 동작 줄이기에서는 이동 없는 완만한 표시를 사용합니다. 앉기·작업 중 일반 클릭은 자세를 유지합니다. 5·6회 연속 클릭 경고는 그대로입니다.\r\n기본·빈도·동작·더보기 탭에 모든 기존 설정과 9포즈가 있습니다. 설정은 로컬에 저장됩니다. Ctrl+- / Ctrl++ 크기 조절 유지.\r\n승인 이미지 및 SHA-256은 변경하지 않았습니다. 검수 패키지이며 정식 배포가 아닙니다.\r\n');
await writeFile(join(dest,'READ_ME.txt'),'B-13.3 portable QA. Extract the ENTIRE ZIP into a new folder, close older pet instances, then run CastlePet.exe. Do not run runtime/electron.exe or HTML directly. Runtime main/HTML integrity is validated before launch. Image diagnostics is a separate titled opaque tool. No Release or deployment.\r\n');
console.log(dest);
