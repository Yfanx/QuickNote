// Injected only into isolated QA packages, never into production builds.
const fs=require('fs'),path=require('path'),assert=require('assert');
exports.prepare=function(app){
 const config=require('./qa-config.json');app.setPath('userData',config.data);
 const phase=process.argv.find(v=>v.startsWith('--qa-phase='))?.split('=')[1];
 if(!phase){app.whenReady().then(()=>app.exit(0));return}
 app.whenReady().then(async()=>{const {BrowserWindow,screen}=require('electron'),sleep=ms=>new Promise(r=>setTimeout(r,ms));let report;
 try{
  for(let i=0;i<100&&!BrowserWindow.getAllWindows().length;i++)await sleep(50);const w=BrowserWindow.getAllWindows()[0];assert(w,'QA window did not start');if(w.webContents.isLoading())await new Promise(r=>w.webContents.once('did-finish-load',r));await sleep(350);
  const call=(a,p)=>w.webContents.executeJavaScript(`window.quicknote.call(${JSON.stringify(a)},${JSON.stringify(p)??'null'})`),state=await call('get');
  report={phase,version:app.getVersion(),exe:process.execPath,userData:app.getPath('userData'),packaged:app.isPackaged,initiallyVisible:w.isVisible(),displays:screen.getAllDisplays().map(d=>({id:d.id,bounds:d.bounds,workArea:d.workArea,scaleFactor:d.scaleFactor}))};
  assert(app.isPackaged);assert.equal(app.getPath('userData'),config.data);
  if(phase==='before'){
   assert.equal(state.notes.length,2);await call('commit',{text:'NSIS升级前新增',dueDate:'2027-01-15',deadlineDate:'2027-01-20'});
   const before=await call('get');await call('settings',{...before,theme:'light',defaultView:'tasks',background:false,hideOnBlur:false});
   fs.writeFileSync(path.join(config.root,'before-data.json'),JSON.stringify(await call('get'),null,2));
  }else{
   const before=JSON.parse(fs.readFileSync(path.join(config.root,'before-data.json')));assert.deepEqual(state.notes,before.notes);assert.equal(state.theme,'light');assert.equal(state.defaultView,'tasks');report.dataPreserved=true;
   if(phase==='after'){
    try{await call('settings',{...state,startup:true});assert.equal((await call('get')).startup,true);report.loginItem=app.getLoginItemSettings({path:'"'+process.execPath+'"',args:['--background']});assert(report.loginItem.launchItems.some(i=>i.path===process.execPath),'Windows startup path parsed incorrectly');const raw=require('child_process').execFileSync('reg.exe',['query','HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','/v',config.appId],{encoding:'utf8'});report.startupCommand=raw.match(/REG_SZ\s+([^\r\n]+)/)[1].trim();assert.equal(report.startupCommand,'"'+process.execPath+'" --background');report.startupArgs=['--background'];report.startupEnabled=true}
    finally{await call('settings',{...await call('get'),startup:false})}
    assert.equal((await call('get')).startup,false);report.startupCleaned=true;
   }
   if(phase==='background'){assert.equal(w.isVisible(),false);report.backgroundLaunchVerified=true}
  }
  if(phase!=='background'){
   await call('show','tasks');await sleep(150);await w.webContents.executeJavaScript(`Array.from(document.querySelectorAll('nav button')).find(b=>b.textContent.startsWith('任意时间')).click()`);await sleep(250);const b=w.getBounds(),area=screen.getDisplayMatching(b).workArea;assert(b.x>=area.x&&b.y>=area.y&&b.x+b.width<=area.x+area.width&&b.y+b.height<=area.y+area.height);
   report.bounds=b;report.ui=await w.webContents.executeJavaScript(`({dpr:devicePixelRatio,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,taskRows:document.querySelectorAll('[data-task]').length})`);assert(!report.ui.overflow);assert(report.ui.taskRows>=1);
   fs.writeFileSync(path.join(config.root,phase+'.png'),(await w.capturePage()).toPNG());
  }
  report.ok=true;
 }catch(e){report={...report,phase,ok:false,error:e.stack};process.exitCode=1}
 finally{fs.writeFileSync(path.join(config.root,phase+'.json'),JSON.stringify(report,null,2));for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(process.exitCode||0)}
 });
};
