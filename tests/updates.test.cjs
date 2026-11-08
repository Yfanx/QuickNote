const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('events'),{Updates}=require('../electron/updates.cjs');
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
test('updates handle offline retry, concurrent actions, current and disabled development',async()=>{
 const fake=new Fake(),u=new Updates(fake);fake.broken=true;await u.check();assert.equal(u.state.status,'error');assert(u.state.error);fake.broken=false;fake.current=true;
 await u.check();assert.equal(u.state.status,'current');await assert.rejects(()=>u.download());assert.throws(()=>u.install());u.stop();
 const off=new Updates(null,{enabled:false});await off.check();assert.equal(off.state.status,'disabled');off.start();off.stop();
});
