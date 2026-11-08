const {CancellationToken}=require('builder-util-runtime');

// Release text is always rendered as plain text, never as HTML.
function releaseNotes(value,version){
  if(Array.isArray(value))value=(value.find(v=>v.version===version)||value[0])?.note;
  if(typeof value!=='string')return [];
  return value.slice(0,20000).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<hr\b[^>]*>/gi,'\n---\n')
    .replace(/<\/?(?:p|div|li|h[1-6])\b[^>]*>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[s])
    .split(/\r?\n/).map(s=>s.replace(/^\s*(?:#{1,6}\s+|[-*•]\s+)/,'').trim()).filter(Boolean).join('\n').split(/\n-{3,}(?:\n|$)/)[0].split('\n').filter(s=>!/^更新内容[:：]?$/.test(s)).slice(0,5).map(s=>s.slice(0,140));
}
function errorMessage(error,stage){
  const text=String(error?.code||'')+' '+String(error?.message||'');
  if(/checksum|sha512|signature/i.test(text))return '安装包校验失败，请重新下载';
  if(/timed?\s*out|ETIMEDOUT/i.test(text))return '连接超时，请重试';
  if(/ENOTFOUND|ECONN|ERR_INTERNET|network|offline/i.test(text))return '连接失败，请检查网络';
  return stage==='download'?'下载失败，请重试':stage==='install'?'无法启动安装程序，请重试':'检查更新失败，请重试';
}
// The installed updater version rejects its promise on cancellation but may leave
// Electron's HTTP request open. Bind the same token to requests (including redirects).
function bindTransportCancellation(updater,token){
  const executor=updater.httpExecutor;if(!executor||typeof executor.createRequest!=='function')return()=>{};
  const original=executor.createRequest,pending=new Set();
  // ClientRequest.close can precede the response body; keep tracking until response.end.
  function wrapped(options,callback){let request;request=original.call(this,options,response=>{response.once('end',()=>pending.delete(request));callback(response)});pending.add(request);if(token.cancelled)request.abort();return request}
  executor.createRequest=wrapped;
  const cancel=()=>{for(const request of pending)try{request.abort()}catch{}};token.onCancel(cancel);
  return()=>{if(executor.createRequest===wrapped)executor.createRequest=original;token.removeListener('cancel',cancel);pending.clear()};
}
class Updates {
  constructor(updater,{enabled=true,onState=()=>{},onAvailable=()=>{}}={}){
    this.updater=updater;this.enabled=enabled;this.onState=onState;this.stopped=false;this.active=null;this.announced=new Set();this.listeners=[];
    this.state={status:enabled?'idle':'disabled',version:null,releaseNotes:[],releaseDate:null,percent:0,transferred:0,total:0,bytesPerSecond:0,error:null,errorStage:null};
    if(!enabled)return;
    updater.disableWebInstaller=true;updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;
    const on=(event,fn)=>{updater.on(event,fn);this.listeners.push([event,fn])};
    on('checking-for-update',()=>this.set({status:'checking',error:null,errorStage:null}));
    on('update-available',info=>{this.set({status:'available',version:info.version,releaseNotes:releaseNotes(info.releaseNotes,info.version),releaseDate:typeof info.releaseDate==='string'?info.releaseDate:null,percent:0,error:null,errorStage:null});if(!this.announced.has(info.version)){this.announced.add(info.version);onAvailable(info.version)}});
    on('update-not-available',()=>this.set({status:'current',version:null,releaseNotes:[],releaseDate:null,percent:0,error:null,errorStage:null}));
    on('download-progress',p=>{if(this.active&&!this.active.cancelRequested&&this.state.status==='downloading')this.set({percent:Math.max(0,Math.min(100,Math.round(p.percent)||0)),transferred:Math.max(0,p.transferred||0),total:Math.max(0,p.total||0),bytesPerSecond:Math.max(0,p.bytesPerSecond||0)})});
    on('update-downloaded',info=>{if(this.active&&!this.active.cancelRequested)this.set({status:'downloaded',version:info.version,percent:100,bytesPerSecond:0,error:null,errorStage:null})});
    on('update-cancelled',()=>{if(this.active){this.active.cancelRequested=true;this.set({status:'cancelling'})}});
    on('error',error=>{if(this.active?.cancelRequested||this.state.status==='cancelled')return;this.fail(error,this.state.status==='installing'?'install':this.active?'download':'check')});
  }
  set(patch){if(this.stopped)return;this.state={...this.state,...patch};this.onState({...this.state})}
  fail(error,stage){this.set({status:'error',errorStage:stage,error:errorMessage(error,stage),bytesPerSecond:0})}
  start(){if(!this.enabled)return;this.startTimer=setTimeout(()=>this.check(),20000);this.interval=setInterval(()=>this.check(),6*60*60*1000);this.startTimer.unref?.();this.interval.unref?.()}
  async check(manual=false){
    if(!this.enabled||this.stopped||this.active||['checking','downloading','cancelling','downloaded','installing'].includes(this.state.status)||(!manual&&(['available','cancelled'].includes(this.state.status)||this.state.status==='error'&&this.state.errorStage!=='check')))return this.state;
    this.set({status:'checking',version:null,releaseNotes:[],releaseDate:null,error:null,errorStage:null});
    try{const result=await this.updater.checkForUpdates();if(!result&&this.state.status==='checking')this.fail(null,'check')}catch(e){this.fail(e,'check')}
    return this.state;
  }
  async download(){
    if(!this.enabled||this.stopped||this.active||!['available','cancelled'].includes(this.state.status)&&!(this.state.status==='error'&&this.state.errorStage==='download'))throw Error('请先检查可用更新');
    const attempt={token:new CancellationToken(),cancelRequested:false,done:null};this.active=attempt;
    this.set({status:'downloading',percent:0,transferred:0,total:0,bytesPerSecond:0,error:null,errorStage:null});
    attempt.done=this.performDownload(attempt);return attempt.done;
  }
  async performDownload(attempt){
    const unbind=bindTransportCancellation(this.updater,attempt.token);
    try{await this.updater.downloadUpdate(attempt.token)}catch(e){if(attempt.cancelRequested||attempt.token.cancelled){if(this.state.status!=='downloaded')this.set({status:'cancelled',percent:0,transferred:0,total:0,bytesPerSecond:0,error:null,errorStage:null})}else this.fail(e,'download')}
    finally{unbind();if(attempt.cancelRequested&&this.state.status!=='downloaded')this.set({status:'cancelled',percent:0,transferred:0,total:0,bytesPerSecond:0,error:null,errorStage:null});if(this.active===attempt)this.active=null;attempt.token.dispose()}
    return this.state;
  }
  async cancel(){
    const attempt=this.active;if(!attempt||this.state.status==='downloaded')return this.state;
    attempt.cancelRequested=true;this.set({status:'cancelling',bytesPerSecond:0});attempt.token.cancel();await attempt.done;return this.state;
  }
  async retry(){
    if(this.active)await this.active.done;
    if(this.state.status==='error'&&this.state.errorStage==='download'||this.state.status==='cancelled')return this.download();
    if(this.state.status==='error'&&this.state.errorStage==='install')throw Error('请确认重新安装');
    return this.check(true);
  }
  canInstall(){return this.enabled&&(this.state.status==='downloaded'||this.state.status==='error'&&this.state.errorStage==='install')}
  install(){if(!this.canInstall())throw Error('更新尚未下载完成');this.set({status:'installing',error:null,errorStage:null});try{this.updater.quitAndInstall(false,true)}catch(e){this.fail(e,'install');throw e}}
  stop(){this.stopped=true;this.active?.token.cancel();clearTimeout(this.startTimer);clearInterval(this.interval);for(const [event,fn]of this.listeners)this.updater.removeListener(event,fn)}
}
module.exports={Updates,releaseNotes};
