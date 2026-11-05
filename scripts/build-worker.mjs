import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'web');
const files={};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
function walk(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const abs=path.join(directory,item.name);if(item.isDirectory())walk(abs);else{const route='/'+path.relative(publicDir,abs).replaceAll(path.sep,'/');files[route]={type:mime[path.extname(abs)]||'application/octet-stream',base64:fs.readFileSync(abs).toString('base64')}}}}
walk(publicDir);
const source=fs.readFileSync(path.join(root,'worker/index.js'),'utf8');
const built=source.replace('__ASSET_MANIFEST__',JSON.stringify(files));
const out=path.join(root,'dist/server');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.js'),built);
const manifest={project_id:'appgprj_6aeca7609b848191b16faebd268f6c05'};
fs.mkdirSync(path.join(root,'dist/.openai'),{recursive:true});fs.writeFileSync(path.join(root,'dist/.openai/hosting.json'),JSON.stringify(manifest,null,2));
console.log(`Worker built with ${Object.keys(files).length} protected assets (${Math.round(Buffer.byteLength(built)/1024)} KiB).`);
