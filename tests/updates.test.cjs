const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('events'),{Updates,releaseNotes}=require('../electron/updates.cjs');
class Fake extends EventEmitter {
  async checkForUpdates(){this.checks=(this.checks||0)+1;this.emit('checking-for-update');if(this.broken)throw Error('offline');this.emit(this.current?'update-not-available':'update-available',{version:'4.5.0'});return {}}
  async downloadUpdate(){this.downloads=(this.downloads||0)+1;this.emit('download-progress',{percent:52.6});this.emit('update-downloaded',{version:'4.5.0'})}
  quitAndInstall(...args){this.installs=args}
}
test('updates require explicit download and install; background check never installs',async()=>{
 const fake=new Fake(),seen=[],u=new Updates(fake,{onState:s=>seen.push(s.status)});assert.equal(fake.autoDownload,false);assert.equal(fake.autoInstallOnAppQuit,false);
 await u.check();assert.equal(u.state.status,'available');assert(!fake.downloads);await u.check();assert.equal(fake.checks,1);
 await u.download();assert.equal(u.state.status,'downloaded');assert.equal(u.state.percent,100);assert(!fake.installs);
 u.install();assert.deepEqual(fake.installs,[false,true]);u.stop();assert.equal(fake.listenerCount('update-available'),0);assert(seen.includes('downloading'));
});
class Deferred extends Fake {
 downloadUpdate(token){this.downloads=(this.downloads||0)+1;this.token=token;return token.createPromise((resolve,reject,onCancel)=>{this.finish=()=>{this.emit('update-downloaded',{version:'4.7.0'});resolve([])};this.failDownload=()=>{const e=Object.assign(Error('offline'),{code:'ECONNRESET'});this.emit('error',e);reject(e)};onCancel(()=>this.emit('update-cancelled',{version:'4.7.0'}));this.emit('download-progress',{percent:25,total:400,transferred:100,bytesPerSecond:50})})}
}
const tick=()=>new Promise(r=>setImmediate(r));
test('cancel waits for request teardown; retry downloads without checking again; stale events are ignored',async()=>{
 const fake=new Deferred(),u=new Updates(fake);await u.check();const first=u.download();assert.equal(u.state.status,'downloading');assert.equal(u.state.transferred,100);
 await u.cancel();await first;assert(fake.token.cancelled);assert.equal(u.state.status,'cancelled');assert.equal(u.state.error,null);assert(!u.canInstall());
 fake.emit('download-progress',{percent:90});fake.emit('update-downloaded',{version:'4.7.0'});assert.equal(u.state.status,'cancelled');
 const retry=u.retry();await tick();assert.equal(fake.downloads,2);assert.equal(fake.checks,1);fake.finish();await retry;assert.equal(u.state.status,'downloaded');u.stop();
});
test('download failures retry directly and keep release metadata',async()=>{
 const fake=new Deferred(),u=new Updates(fake);await u.check();const first=u.download();fake.failDownload();await first;assert.equal(u.state.errorStage,'download');assert(u.state.version);assert.match(u.state.error,/连接/);
 const retry=u.retry();await tick();fake.finish();await retry;assert.equal(fake.checks,1);assert.equal(u.state.status,'downloaded');u.stop();
});
test('completed download wins cancel race; installation errors require explicit install retry',async()=>{
 const fake=new Deferred(),u=new Updates(fake);await u.check();const p=u.download();fake.finish();await u.cancel();await p;assert.equal(u.state.status,'downloaded');
 fake.quitAndInstall=()=>{throw Error('failed')};assert.throws(()=>u.install());assert.equal(u.state.errorStage,'install');await assert.rejects(()=>u.retry());fake.quitAndInstall=()=>{};assert(u.canInstall());u.install();assert.equal(u.state.status,'installing');u.stop();
});
test('release notes are bounded plain text, including version-specific changelogs',()=>{
 assert.deepEqual(releaseNotes('<h3>更新内容</h3><ul><li>取消 &amp; 重试</li><li><b>简洁界面</b></li></ul><script>alert(1)</script>','4.7.0'),['取消 & 重试','简洁界面']);
 assert.deepEqual(releaseNotes([{version:'4.6.0',note:'old'},{version:'4.7.0',note:'- new'}],'4.7.0'),['new']);assert.equal(releaseNotes('x'.repeat(20000),'').length,1);assert.equal(releaseNotes('x'.repeat(20000),'')[0].length,140);assert.deepEqual(releaseNotes(null,''),[]);
});
test('updates handle offline retry, concurrent actions, current and disabled development',async()=>{
 const fake=new Fake(),u=new Updates(fake);fake.broken=true;await u.check();assert.equal(u.state.status,'error');assert(u.state.error);fake.broken=false;fake.current=true;
 await u.check();assert.equal(u.state.status,'current');await assert.rejects(()=>u.download());assert.throws(()=>u.install());u.stop();
 const off=new Updates(null,{enabled:false});await off.check();assert.equal(off.state.status,'disabled');off.start();off.stop();
});
