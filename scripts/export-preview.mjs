import {build} from 'vite';
import {transform} from 'esbuild';
import {readFile,writeFile,rm,mkdir,readdir,copyFile} from 'node:fs/promises';
const single=process.argv.includes('--single');
const out='.preview-build';
await build({configFile:false,base:'./',build:{outDir:out,emptyOutDir:true,assetsInlineLimit:single?Number.MAX_SAFE_INTEGER:0,cssCodeSplit:false,rollupOptions:{input:'preview-entry.html',output:{inlineDynamicImports:true}}}});
let html=await readFile(`${out}/preview-entry.html`,'utf8');
const js=html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);const css=html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!js||!css)throw Error('Preview assets missing');
const path=p=>`${out}/${p.replace(/^\.\//,'')}`;
let source=await readFile(path(js[1]),'utf8');
if(!single)source=source.replaceAll('./assets/','./preview-assets/');
// Inline classic JS avoids file:// module CORS; images remain relative, loaded on demand.
source=source.replaceAll('import.meta.url', 'new URL("./preview-assets/", document.baseURI).href');
const compiled=await transform(source,{format:'iife',target:'es2022'});
html=html.replace(js[0],`<script>document.addEventListener("DOMContentLoaded",()=>{${compiled.code.replaceAll('</script','<\\/script')} });</script>`).replace(css[0],`<style>${await readFile(path(css[1]),'utf8')}</style>`);
if(single){await writeFile('preview-single.html',html);}else{
 await rm('preview-assets',{recursive:true,force:true});await mkdir('preview-assets');
 for(const file of await readdir(`${out}/assets`))if(!/\.(js|css)$/.test(file))await copyFile(`${out}/assets/${file}`,`preview-assets/${file}`);
 await writeFile('preview.html',html);
}
await rm(out,{recursive:true,force:true});
