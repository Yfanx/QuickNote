// Real per-user NSIS install/upgrade using a separate appId and isolated data.
const fs=require('fs'),path=require('path'),cp=require('child_process'),asar=require('@electron/asar'),assert=require('assert');
const repo=path.resolve(__dirname,'..'),version=require('../package.json').version,id=process.argv[2]||'qnqa'+Date.now();assert(/^qnqa\d+$/.test(id));const root=path.join(repo,'.qa',id),data=path.join(root,'data'),install=path.join(root,'installed'),appId='local.quicknote.validation.'+id;assert(fs.existsSync(path.join(repo,'release',version,'win-unpacked/resources/app.asar')),'Build the current production package before running Windows acceptance');
fs.mkdirSync(data,{recursive:true});fs.writeFileSync(path.join(data,'notes.json'),JSON.stringify({notes:[{id:'old-note',text:'升级保留任务',done:false,created:1,category:'原分类',dueDate:'2026-12-30',deadlineDate:'2027-01-20'},{id:'done-note',text:'完成记录',done:true,created:2,completedAt:3}],background:true,notificationsEnabled:false,hideOnBlur:false,shortcut:'Control+Alt+Shift+F23',tasksShortcut:'Control+Alt+Shift+F24'}));
function run(file,args,options={}){return new Promise((resolve,reject)=>{const child=cp.spawn(file,args,{cwd:repo,windowsHide:true,stdio:'inherit',...options});const timeout=setTimeout(()=>{child.kill();reject(Error('Timeout: '+file))},180000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timeout);code===0?resolve():reject(Error(path.basename(file)+' exit '+code))})})}
async function build(label,sourceVersion){
 const stage=path.join(root,'stage-'+label),output=path.join(root,'output-'+label),cached=path.join(output,`QuickNote-Setup-${sourceVersion}-x64.exe`);if(label==='before'&&fs.existsSync(cached))return cached;asar.extractAll(path.join(repo,'release',sourceVersion,'win-unpacked/resources/app.asar'),stage);
 const pkgPath=path.join(stage,'package.json'),pkg=JSON.parse(fs.readFileSync(pkgPath));pkg.name=id;pkg.version=sourceVersion;
 const build=JSON.parse(JSON.stringify(require('../package.json').build));build.appId=appId;build.productName='QuickNote QA '+id;build.directories={output};build.electronDist=path.join(repo,'node_modules/electron/dist');build.electronVersion=require('electron/package.json').version;build.npmRebuild=false;build.win.icon=path.join(repo,'assets/app.ico');build.nsis={...build.nsis,installerIcon:path.join(repo,'assets/app.ico'),uninstallerIcon:path.join(repo,'assets/app.ico'),runAfterFinish:false};delete build.publish;build.files.push('electron/qa-driver.cjs','electron/qa-config.json');pkg.build=build;
 fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2));fs.copyFileSync(path.join(__dirname,'windows-qa-driver.cjs'),path.join(stage,'electron/qa-driver.cjs'));fs.writeFileSync(path.join(stage,'electron/qa-config.json'),JSON.stringify({root,data,appId}));
 const main=path.join(stage,'electron/main.cjs');let text=fs.readFileSync(main,'utf8').replaceAll('local.quicknote.desktop',appId);text=text.replace("const fs=require('fs')","require('./qa-driver.cjs').prepare(app);\nconst fs=require('fs')");fs.writeFileSync(main,text);
 await run(process.execPath,[path.join(repo,'node_modules/electron-builder/cli.js'),'--projectDir',stage,'--win','nsis','--publish','never']);
 return path.join(output,`QuickNote-Setup-${sourceVersion}-x64.exe`);
}
async function launch(phase,args=[]){await run(path.join(install,'QuickNote QA '+id+'.exe'),['--qa-phase='+phase,...args]);const report=JSON.parse(fs.readFileSync(path.join(root,phase+'.json')));assert(report.ok,report.error);return report}
async function main(){
 let installed=false;const reports=[];
 try{
  const before=await build('before','4.4.2');await run(before,['/S','/currentuser','/D='+install]);installed=true;reports.push(await launch('before'));
  const after=await build('after',version);await run(after,['/S','/currentuser','/D='+install]);const upgraded=await launch('after');reports.push(upgraded);
  const entry=upgraded.loginItem.launchItems.find(i=>i.path===path.join(install,'QuickNote QA '+id+'.exe'));assert(entry);assert.deepEqual(upgraded.startupArgs,['--background']);await run(entry.path,[...upgraded.startupArgs,'--qa-phase=background']);const background=JSON.parse(fs.readFileSync(path.join(root,'background.json')));assert(background.ok,background.error);reports.push(background);
  for(const scale of [1,1.25,1.5,2]){const report=await launch('dpi'+scale,['--force-device-scale-factor='+scale]);assert(Math.abs(report.ui.dpr-scale)<0.01);reports.push(report)}
  fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify({version,appId,root,reports},null,2));console.log('WINDOWS ACCEPTANCE PASSED: '+path.join(root,'summary.json'));
 }finally{
  if(installed){const uninstaller=fs.readdirSync(install).find(name=>/^Uninstall.*\.exe$/i.test(name));if(uninstaller)await run(path.join(install,uninstaller),['/S'])}
  try{cp.execFileSync('reg.exe',['delete','HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run','/v',appId,'/f'],{stdio:'ignore'})}catch{}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
