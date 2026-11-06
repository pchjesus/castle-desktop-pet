import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '../design/canonical/b-mustang-20261107');
const expected = {
 'idle.png':'42859af6776986e70122ecc908dd8c34fa420056b3811d0f81e6efb0363a0976',
 'sitting.png':'b15e58f192ff9d69ad943f2a15fe8b6815fc892bb3c4ff62f9ecd85d8f8c36f3',
 'drawing.png':'9f80fee63573dfc45802ea1eec75a3eb09e36af3b42e1f1a0ebfb3433855cf96',
 'firing.png':'4689c13e9fd992cc77d7ced3c94ee181e1fda25d963adca0880b4fdbb716288b',
 'firing_dynamic.jpg':'182235a157ea96df141fdc14794a715a96720647cabcd4f69de8b1a9f4448c9c',
 'smoking.png':'6ad98b1b5abec2315a7a4e3fbf78e95ebac68136a79f15c3da4a0ad37de0cf5c',
 'speaking_reference.jpg':'c91601262eb7c8ec3a8af7c3df904c000d05d8247229855ef2564d62c649c42d',
 'working.png':'5b437481adf4df8e3e2cc43f3f53af1fc85bc3b9f2fed7b9479d3a2ba0f4d7c4',
 'dual_firing.jpg':'9256480c510ac8b7b1de6a56b64a8a8bec7362e5b5fc4e20faa0afc353c147a7',
};
const hash = b => createHash('sha256').update(b).digest('hex');
function info(b) {
 if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
  if (b.length < 33 || b.toString('ascii',12,16) !== 'IHDR' || b.readUInt32BE(8)!==13) throw Error('invalid PNG IHDR');
  return {format:'PNG',width:b.readUInt32BE(16),height:b.readUInt32BE(20),mode:b[25]===6?'RGBA':`PNG color type ${b[25]}`};
 }
 if (b[0]!==255 || b[1]!==216) throw Error('invalid PNG/JPEG signature');
 let i=2;
 while (i+4<=b.length) {
  if (b[i++]!==255) throw Error('invalid JPEG marker');
  while (b[i]===255) i++;
  const marker=b[i++]; if (marker===0xd9 || marker===0xda) break;
  if (marker===1 || (marker>=0xd0 && marker<=0xd7)) continue;
  if (i+2>b.length) break; const length=b.readUInt16BE(i);
  if (length<2 || i+length>b.length) throw Error('invalid JPEG segment');
  if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
   if (length<8) throw Error('invalid JPEG SOF');
   return {format:'JPEG',width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3),mode:b[i+7]===3?'RGB':`JPEG components ${b[i+7]}`};
  }
  i+=length;
 }
 throw Error('JPEG dimensions not found');
}
async function main() {
 const args=process.argv.slice(2);
 if (args.length) {
  if (args.length!==2 || args[0]!=='--zip') throw Error('Usage: node scripts/verify-b-mustang-canonical.mjs [--zip ZIP]');
  const actual=hash(await readFile(args[1])); if (actual!=='d2f7a6853ef7c1eb8e453678fa502a7b22da872381c8c46d6192ff1c6172a93e') throw Error(`ZIP SHA-256 mismatch: ${actual}`);
  console.log('ZIP SHA-256 OK');
 }
 const manifest=JSON.parse(await readFile(join(root,'ASSET_MANIFEST.json'),'utf8'));
 if (!Array.isArray(manifest.assets) || manifest.assets.length!==9) throw Error('manifest: expected exactly 9 assets');
 const names=Object.keys(expected).sort(), seen=new Set();
 const entries=await readdir(join(root,'approved_visual_sources'),{withFileTypes:true});
 const actualNames=entries.map(x=>x.name).sort();
 if (entries.some(x=>!x.isFile()) || JSON.stringify(actualNames)!==JSON.stringify(names)) throw Error(`asset directory mismatch: ${actualNames.join(', ')}`);
 for (const item of manifest.assets) {
  const path=item.canonical_archive_path;
  if (typeof path!=='string' || !path.startsWith('approved_visual_sources/')) throw Error(`manifest invalid path: ${path}`);
  const name=path.slice('approved_visual_sources/'.length);
  if (!Object.hasOwn(expected,name) || path!==`approved_visual_sources/${name}` || seen.has(name)) throw Error(`manifest unexpected or duplicate path: ${path}`);
  seen.add(name);
  if (item.sha256!==expected[name]) throw Error(`${name}: manifest SHA-256 differs from approved value`);
  const b=await readFile(join(root,path));
  if (hash(b)!==expected[name]) throw Error(`${name}: SHA-256 mismatch`);
  if (b.length!==item.size_bytes) throw Error(`${name}: size mismatch`);
  const parsed=info(b); const ext=name.endsWith('.png')?'PNG':'JPEG';
  if (parsed.format!==ext || parsed.format!==item.actual_format || parsed.mode!==item.mode || parsed.width!==item.dimensions?.[0] || parsed.height!==item.dimensions?.[1]) throw Error(`${name}: format/dimensions/mode mismatch: ${JSON.stringify(parsed)}`);
  console.log(`${name}: SHA-256, size, ${parsed.format} ${parsed.width}x${parsed.height} ${parsed.mode} OK`);
 }
 if (seen.size!==9) throw Error('manifest missing assets');
}
main().catch(error=>{ console.error('Canonical verification FAILED:',error.message); process.exitCode=1; });
