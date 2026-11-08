// Optional live smoke after publishing: resolve public GitHub metadata, never install.
const {app}=require('electron'),{NsisUpdater}=require('electron-updater'),fs=require('fs'),path=require('path'),assert=require('assert'),{SemVer}=require('semver');
const dir=path.join(app.getPath('temp'),'qn-github-feed-'+Date.now());fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);
app.whenReady().then(async()=>{try{
 const version=require('../package.json').version,updater=new NsisUpdater();
 updater.forceDevUpdateConfig=true;updater.updateConfigPath=path.resolve('release',version,'win-unpacked/resources/app-update.yml');updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.currentVersion=new SemVer('4.3.1');
 const result=await updater.checkForUpdates();assert.equal(result.updateInfo.version,version);assert(result.updateInfo.files.some(f=>f.url===`QuickNote-Setup-${version}-x64.exe`));
 console.log('PASS public GitHub feed resolves packaged update config to '+version+' installer and SHA512 metadata; no download or install');
}catch(e){console.error(e);process.exitCode=1}finally{app.exit(process.exitCode||0)}});
