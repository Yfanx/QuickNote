const {app,BrowserWindow,Tray}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert');const dir=path.join(app.getPath('temp'),'qn-startup-'+Date.now());fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);
fs.writeFileSync(path.join(dir,'notes.json'),JSON.stringify({notes:[{id:'old',text:'保留原任务',done:false,created:1}],background:true,notificationsEnabled:false,shortcut:'Control+Alt+Shift+F7',tasksShortcut:'Control+Alt+Shift+F8'}));
let entry=null,menu,writes=0,blocked=false;
app.getLoginItemSettings=(o={})=>({openAtLogin:!!entry&&o.path===entry.path&&JSON.stringify(o.args)===JSON.stringify(entry.args),executableWillLaunchAtLogin:!!entry});
app.setLoginItemSettings=o=>{writes++;if(!blocked)entry=o.openAtLogin?o:null};const setMenu=Tray.prototype.setContextMenu;Tray.prototype.setContextMenu=function(m){menu=m;return setMenu.call(this,m)};
require('../electron/main.cjs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(()=>setTimeout(async()=>{try{
 const w=BrowserWindow.getAllWindows()[0],js=s=>w.webContents.executeJavaScript(s),call=(a,p)=>js(`window.quicknote.call(${JSON.stringify(a)},${JSON.stringify(p)??'null'})`);
 await call('show','settings');await js(`Array.from(document.querySelectorAll('nav button')).find(b=>b.textContent==='行为').click()`);
 await js(`document.querySelector('[aria-label="开机启动"]').click()`);await sleep(120);
 assert.equal((await call('get')).startup,true);assert.equal(await js(`document.querySelector('[aria-label="开机启动"]').getAttribute('aria-checked')`),'true');assert(menu.items.some(i=>i.label==='开机启动 · 已开启'));
 assert.equal(entry.path,process.execPath);assert.deepEqual(entry.args,['--background']);const before=writes;await call('settings',{...await call('get'),theme:'light'});assert.equal(writes,before);
 menu.items.find(i=>i.label.startsWith('开机启动')).click();await sleep(100);assert.equal((await call('get')).startup,false);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'notes.json'))).startup,false);
 blocked=true;await js(`document.querySelector('[aria-label="开机启动"]').click()`);await sleep(120);assert.equal((await call('get')).startup,false);assert.equal(await js(`document.querySelector('[aria-label="开机启动"]').getAttribute('aria-checked')`),'false');assert((await js(`document.querySelector('.toast').textContent`)).includes('未生效'));assert.equal((await call('get')).notes.length,1);
 console.log('PASS startup settings/tray roundtrip with argument-sensitive adapter, no writes on unrelated settings, readback failure visible, original records intact');
}catch(e){console.error(e);process.exitCode=1}finally{for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(process.exitCode||0)}},1100));
