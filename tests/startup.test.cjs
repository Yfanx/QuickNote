const {test}=require('node:test'),assert=require('node:assert/strict'),{createStartup}=require('../electron/startup.cjs');
test('startup reads the exact path and background args used to register',()=>{
 let entry=null,enabled=true;const app={getLoginItemSettings(options){const match=entry&&options.path===entry.path&&JSON.stringify(options.args)===JSON.stringify(entry.args);return {openAtLogin:!!match,executableWillLaunchAtLogin:!!match&&enabled}},setLoginItemSettings(options){entry=options.openAtLogin?options:null;enabled=options.enabled}};
 const startup=createStartup(app,'C:/Apps/QuickNote.exe');assert(!startup.read());startup.set(true);assert(startup.read());assert.deepEqual(entry.args,['--background']);assert.equal(entry.path,'C:/Apps/QuickNote.exe');
 assert(!app.getLoginItemSettings({path:'C:/Apps/QuickNote.exe',args:[]}).openAtLogin);enabled=false;assert(!startup.read());startup.set(true);assert(startup.read());startup.set(false);assert(!startup.read());
});
test('startup reports Windows write/readback failure rather than claiming success',()=>{
 const app={getLoginItemSettings:()=>({openAtLogin:false}),setLoginItemSettings(){}};assert.throws(()=>createStartup(app).set(true),/未生效/);assert.throws(()=>createStartup(app).set('true'),/无效/);
});
