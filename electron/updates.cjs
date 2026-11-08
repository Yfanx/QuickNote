// No task data is sent: electron-updater reads only the public release feed.
class Updates {
  constructor(updater,{enabled=true,onState=()=>{},onAvailable=()=>{}}={}) {
    this.updater=updater;this.enabled=enabled;this.onState=onState;this.onAvailable=onAvailable;
    this.state={status:enabled?'idle':'disabled',version:null,percent:0,error:null};this.listeners=[];this.stopped=false;
    if(!enabled)return;
    updater.disableWebInstaller=true;updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;
    const on=(event,fn)=>{updater.on(event,fn);this.listeners.push([event,fn])};
    on('checking-for-update',()=>this.set({status:'checking',error:null}));
    on('update-available',info=>{this.set({status:'available',version:info.version,percent:0,error:null});onAvailable(info.version)});
    on('update-not-available',()=>this.set({status:'current',version:null,percent:0,error:null}));
    on('download-progress',p=>this.set({status:'downloading',percent:Math.max(0,Math.min(100,Math.round(p.percent)))}));
    on('update-downloaded',info=>this.set({status:'downloaded',version:info.version,percent:100,error:null}));
    on('error',()=>this.fail());
  }
  set(patch){if(this.stopped)return;this.state={...this.state,...patch};this.onState({...this.state})}
  fail(){this.set({status:'error',error:'暂时无法完成更新，请检查网络后重试。'})}
  start(){if(!this.enabled)return;this.startTimer=setTimeout(()=>this.check(),20000);this.interval=setInterval(()=>this.check(),6*60*60*1000);this.startTimer.unref?.();this.interval.unref?.()}
  async check(){
    if(!this.enabled||this.stopped||['checking','available','downloading','downloaded','installing'].includes(this.state.status))return this.state;
    this.set({status:'checking',error:null});
    try{const result=await this.updater.checkForUpdates();if(!result&&this.state.status==='checking')this.fail()}catch{this.fail()}
    return this.state;
  }
  async download(){
    if(!this.enabled||this.state.status!=='available')throw Error('请先检查可用更新');
    this.set({status:'downloading',percent:0,error:null});
    try{await this.updater.downloadUpdate()}catch{this.fail()}
    return this.state;
  }
  install(){if(!this.enabled||this.state.status!=='downloaded')throw Error('更新尚未下载完成');this.set({status:'installing'});try{this.updater.quitAndInstall(false,true)}catch(e){this.fail();throw e}}
  stop(){this.stopped=true;clearTimeout(this.startTimer);clearInterval(this.interval);for(const [event,fn]of this.listeners)this.updater.removeListener(event,fn)}
}
module.exports={Updates};
