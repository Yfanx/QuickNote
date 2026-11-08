const {app,BrowserWindow,Tray,globalShortcut}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert');const {Store,validate}=require('../electron/store.cjs');
const dir=path.join(app.getPath('temp'),'qn-default-view-'+Date.now());fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);
fs.writeFileSync(path.join(dir,'notes.json'),JSON.stringify({notes:[{id:'old',text:'旧数据',created:1,done:false}],background:true,notificationsEnabled:false,shortcut:'Control+Alt+Shift+F7',tasksShortcut:'Control+Alt+Shift+F8'}));
let tray;const click=Tray.prototype.on;Tray.prototype.on=function(event,fn){if(event==='click')tray=fn;return click.call(this,event,fn)};
const shortcuts=new Map(),register=globalShortcut.register.bind(globalShortcut);globalShortcut.register=(key,fn)=>{shortcuts.set(key,fn);return register(key,fn)};app.setLoginItemSettings=()=>{};require('../electron/main.cjs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(()=>setTimeout(async()=>{try{
 const w=BrowserWindow.getAllWindows()[0],js=s=>w.webContents.executeJavaScript(s),call=(a,p)=>js(`window.quicknote.call(${JSON.stringify(a)},${JSON.stringify(p)??'null'})`);
 assert.equal((await call('get')).defaultView,'tasks');tray();await sleep(100);assert.equal((await call('get')).view,'tasks');
 await call('show','settings');await js(`Array.from(document.querySelectorAll('nav button')).find(b=>b.textContent==='行为').click()`);
 await js(`const el=document.querySelector('[aria-label="默认打开"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,'capture');el.dispatchEvent(new Event('change',{bubbles:true}))`);await sleep(100);
 assert.equal(new Store(dir).data.defaultView,'capture');tray();await sleep(100);assert.equal((await call('get')).view,'capture');
 shortcuts.get('Control+Alt+Shift+F8')();assert.equal((await call('get')).view,'tasks');app.emit('second-instance');assert.equal((await call('get')).view,'capture');
 await call('settings',{...await call('get'),defaultView:'tasks'});assert.equal(new Store(dir).data.defaultView,'tasks');tray();assert.equal((await call('get')).view,'tasks');
 shortcuts.get('Control+Alt+Shift+F7')();assert.equal((await call('get')).view,'capture');
 assert.throws(()=>validate({notes:[],defaultView:'other'}));assert.equal(new Store(dir).data.notes[0].text,'旧数据');
 await call('show','settings');await sleep(100);fs.writeFileSync('docs/images/behavior.png',(await w.capturePage()).toPNG());
 console.log('PASS default-page selector persists, tray and second-instance honor preference, explicit shortcuts stay independent, old notes preserved');
}catch(e){console.error(e);process.exitCode=1}finally{for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(process.exitCode||0)}},1100));
