import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const ORIGIN=/^chrome-extension:\/\/[a-p]{32}$/;
export const BRAVE_PORT=47183;
function isToken(auth,expected){
 if(typeof auth!=='string'||auth.length!==expected.length)return false;
 return timingSafeEqual(Buffer.from(auth),Buffer.from(expected));
}
export function readOrCreateBraveToken(file){
 if(existsSync(file)){
  const saved=readFileSync(file,'utf8').trim();
  if(!/^[0-9a-f]{64}$/.test(saved))throw Error('Invalid saved Brave pairing token');
  return saved;
 }
 mkdirSync(dirname(file),{recursive:true});
 const token=randomBytes(32).toString('hex');
 writeFileSync(file,token+'\n',{mode:0o600,flag:'wx'});
 return token;
}
export function createBraveDownloadServer({token,onDownload,host='127.0.0.1',port=BRAVE_PORT}){
 if(!/^[0-9a-f]{64}$/.test(token))throw Error('Invalid pairing token');
 if(typeof onDownload!=='function')throw Error('Missing download callback');
 const seen=new Set();
 const respond=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 const server=createServer((req,res)=>{
  const origin=req.headers.origin;
  if(typeof origin!=='string'||!ORIGIN.test(origin)){respond(res,403,{ok:false});return;}
  res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Castle-Token');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.method!=='POST'||req.url!=='/v1/download-complete'){respond(res,404,{ok:false});return;}
  if(!isToken(req.headers['x-castle-token'],token)){respond(res,401,{ok:false});return;}
  let data='',bytes=0,failed=false;
  req.on('data',chunk=>{
   bytes+=chunk.length;if(bytes>512){failed=true;req.destroy();return;}
   data+=chunk.toString('utf8');
  });
  req.on('end',()=>{
   if(failed)return;
   let value;try{value=JSON.parse(data);}catch{respond(res,400,{ok:false});return;}
   if(value?.event!=='downloadComplete'||!Number.isSafeInteger(value?.id)||value.id<0){respond(res,400,{ok:false});return;}
   if(!seen.has(value.id)){
    seen.add(value.id);if(seen.size>250)seen.delete(seen.values().next().value);
    onDownload('downloadComplete');
   }
   respond(res,200,{ok:true});
  });
 });
 return {
  start:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);resolve(server.address());});}),
  stop:()=>new Promise(resolve=>{if(server.listening)server.close(()=>resolve());else resolve();}),
  server
 };
}
