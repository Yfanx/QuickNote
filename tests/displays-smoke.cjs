// Simulated monitor topology on real BrowserWindows; does not change Windows displays.
const {app,BrowserWindow,screen}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert');const dir=path.join(app.getPath('temp'),'qn-displays-'+Date.now());fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);app.setLoginItemSettings=()=>{};
fs.writeFileSync(path.join(dir,'notes.json'),JSON.stringify({notes:[],background:true,hideOnBlur:false,notificationsEnabled:false,shortcut:'Control+Alt+Shift+F7',tasksShortcut:'Control+Alt+Shift+F8'}));require('../electron/main.cjs');
app.whenReady().then(()=>setTimeout(async()=>{const nearest=screen.getDisplayNearestPoint,matching=screen.getDisplayMatching;try{
 const w=BrowserWindow.getAllWindows()[0],call=(a,p)=>w.webContents.executeJavaScript(`window.quicknote.call(${JSON.stringify(a)},${JSON.stringify(p)??'null'})`);
 let area;screen.getDisplayNearestPoint=()=>({workArea:area});screen.getDisplayMatching=()=>({workArea:area});
 for(area of [{x:-1920,y:-200,width:1872,height:1080},{x:0,y:-1600,width:1080,height:1552},{x:0,y:0,width:520,height:400}]){
  for(const mode of ['tasks','capture','settings']){await call('show',mode);const b=w.getBounds();assert(b.x>=area.x&&b.y>=area.y&&b.x+b.width<=area.x+area.width&&b.y+b.height<=area.y+area.height,JSON.stringify({area,b}));}
 }
 await new Promise(r=>setTimeout(r,200));console.log('PASS simulated negative-coordinate / portrait / small work-area monitors, native window bounds stay within work area on reopen');
}catch(e){console.error(e);process.exitCode=1}finally{screen.getDisplayNearestPoint=nearest;screen.getDisplayMatching=matching;for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(process.exitCode||0)}},1100));
