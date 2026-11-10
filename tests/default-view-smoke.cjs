const {app,BrowserWindow,Tray,globalShortcut}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert');const {Store,validate}=require('../electron/store.cjs');
const dir=path.join(app.getPath('temp'),'qn-default-view-'+Date.now());fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);
fs.writeFileSync(path.join(dir,'notes.json'),JSON.stringify({notes:[{id:'old',text:'旧数据',created:1,done:false}],background:true,notificationsEnabled:false,shortcut:'Control+Alt+Shift+F7',tasksShortcut:'Control+Alt+Shift+F8'}));
let tray;const click=Tray.prototype.on;Tray.prototype.on=function(event,fn){if(event==='click')tray=fn;return click.call(this,event,fn)};
const shortcuts=new Map(),register=globalShortcut.register.bind(globalShortcut);globalShortcut.register=(key,fn)=>{shortcuts.set(key,fn);return register(key,fn)};app.setLoginItemSettings=()=>{};require('../electron/main.cjs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(()=>setTimeout(async()=>{try{
 const w=BrowserWindow.getAllWindows()[0],js=s=>w.webContents.executeJavaScript(s),call=(a,p)=>js(`window.quicknote.call(${JSON.stringify(a)},${JSON.stringify(p)??'null'})`);
 let preparedFrames=0;const capture=w.webContents.capturePage.bind(w.webContents);w.webContents.capturePage=async(rect,opts)=>{if(opts?.stayHidden){assert.equal(w.getOpacity(),0,'Preparing frame must be invisible');assert(await js(`document.querySelector('main').className`));const frame=await capture(rect,opts);assert(!frame.isEmpty());preparedFrames++;return frame}return capture(rect,opts)};
 const waitVisible=async()=>{const end=Date.now()+1500;while((!w.isVisible()||w.getOpacity()!==1)&&Date.now()<end)await sleep(10);assert(w.isVisible());assert.equal(w.getOpacity(),1);assert(preparedFrames>0)};const taskbarChanges=[],setSkip=w.setSkipTaskbar.bind(w);w.setSkipTaskbar=skip=>{assert.equal(w.isVisible(),false,'Taskbar style changes must happen while hidden');taskbarChanges.push(skip);setSkip(skip)};
 assert.equal((await call('get')).defaultView,'tasks');tray();await waitVisible();assert.equal((await call('get')).view,'tasks');
 for(let i=0;i<3;i++){w.close();await sleep(220);assert.equal(w.isVisible(),false);assert.equal(taskbarChanges.length,1,'Closing must not rewrite native window styles');tray();await waitVisible();assert(w.isVisible());assert.equal(taskbarChanges.length,1,'Same-view reopen must retain native styles')}
 shortcuts.get('Control+Alt+Shift+F8')();await sleep(220);assert.equal(w.isVisible(),false);shortcuts.get('Control+Alt+Shift+F8')();await waitVisible();assert(w.isVisible());assert.equal(taskbarChanges.length,1);
 await call('show','settings');await js(`Array.from(document.querySelectorAll('nav button')).find(b=>b.textContent==='行为').click()`);
 await js(`const el=document.querySelector('[aria-label="默认打开"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,'capture');el.dispatchEvent(new Event('change',{bubbles:true}))`);await sleep(100);
 assert.equal(new Store(dir).data.defaultView,'capture');tray();await waitVisible();assert.equal((await call('get')).view,'capture');
 shortcuts.get('Control+Alt+Shift+F8')();assert.equal((await call('get')).view,'tasks');app.emit('second-instance');assert.equal((await call('get')).view,'capture');
 await call('settings',{...await call('get'),defaultView:'tasks'});assert.equal(new Store(dir).data.defaultView,'tasks');tray();assert.equal((await call('get')).view,'tasks');
 shortcuts.get('Control+Alt+Shift+F7')();assert.equal((await call('get')).view,'capture');
 assert.throws(()=>validate({notes:[],defaultView:'other'}));assert.equal(new Store(dir).data.notes[0].text,'旧数据');
 for(let i=0;i<8;i++){tray();await call('hide');await sleep(60);assert.equal(w.isVisible(),false,'A cancelled reveal must never reopen the window')}
 tray();await waitVisible();assert(w.isVisible());assert.equal(await js(`getComputedStyle(document.querySelector('main')).opacity`),'1');assert.equal(await js(`getComputedStyle(document.querySelector('main')).transform`),'none');
 await call('show','settings');await sleep(100);fs.writeFileSync('docs/images/behavior.png',(await w.capturePage()).toPNG());
 console.log('PASS default-page selector persists, tray and second-instance honor preference, explicit shortcuts stay independent, old notes preserved');
}catch(e){console.error(e);process.exitCode=1}finally{for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(process.exitCode||0)}},1100));
