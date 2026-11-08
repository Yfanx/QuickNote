// Reuses Git Credential Manager. Credentials are never printed, saved, or bundled.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),yaml=require('js-yaml');
async function digest(file,algorithm){const hash=crypto.createHash(algorithm);for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest(algorithm==='sha512'?'base64':'hex')}
async function main(){
  const version=process.argv[2],installer=process.argv[3];
  if(!/^\d+\.\d+\.\d+$/.test(version||'')||!installer||!fs.existsSync(installer))throw Error('Usage: node scripts/publish-release.cjs VERSION INSTALLER');
  const dir=path.dirname(installer),metadata=path.join(dir,'latest.yml'),blockmap=installer+'.blockmap';
  const info=yaml.load(fs.readFileSync(metadata,'utf8'));
  if(info.version!==version||info.path!==path.basename(installer)||info.sha512!==await digest(installer,'sha512')||!fs.existsSync(blockmap))throw Error('Release metadata / installer mismatch');
  const cred=cp.execFileSync('git',['-c','credential.helper=','-c','credential.helper=manager','credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',stdio:['pipe','pipe','pipe']});
  const fields=Object.fromEntries(cred.trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
  if(!fields.password)throw Error('GitHub login unavailable');
  const headers={Authorization:'Bearer '+fields.password,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'QuickNote-Release'},base='https://api.github.com/repos/Yfanx/QuickNote';
  async function request(url,method='GET',body){const r=await fetch(url,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('GitHub API '+r.status);return r.status===204?null:r.json()}
  const releases=await request(base+'/releases?per_page=100');let release=releases.find(r=>r.tag_name==='v'+version);
  if(!release)release=await request(base+'/releases','POST',{tag_name:'v'+version,name:'QuickNote '+version,draft:true,prerelease:false,body:'精简外观与关于页面：移除占位文字保存提示、产品介绍、素材说明和更新说明小字；保留版本、实时更新状态、操作按钮与许可证入口。行为设置新增默认打开页面，支持托盘点击打开待办事项或快速记录。\n\n新增软件内更新：启动后后台检查，设置→关于可手动检查、下载与重启安装，保留任务和设置。4.3.x 及更早版本需先手动安装本版一次。\n\nWindows x64 安装包：QuickNote-Setup-'+version+'-x64.exe。latest.yml 与 blockmap 用于自动更新。'});
  // Publish only after every asset is ready, so clients never see an incomplete update.
  for(const file of [installer,blockmap,metadata]){
    const name=path.basename(file),existing=release.assets.find(a=>a.name===name);
    if(existing){if(existing.size!==fs.statSync(file).size||(existing.digest?.startsWith('sha256:')&&existing.digest!=='sha256:'+await digest(file,'sha256')))throw Error('Asset differs; refusing overwrite: '+name);continue}
    const r=await fetch(release.upload_url.split('{')[0]+'?name='+encodeURIComponent(name),{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(fs.statSync(file).size)},body:await fs.openAsBlob(file)});
    if(!r.ok)throw Error('Upload failed: '+name+' ('+r.status+')');console.log('Uploaded '+name);
  }
  if(release.draft)release=await request(base+'/releases/'+release.id,'PATCH',{draft:false,make_latest:'true'});
  console.log(release.html_url);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
