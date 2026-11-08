const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert'),asar=require('@electron/asar'),yaml=require('js-yaml');
async function main(){
 const version=require('../package.json').version,dir=path.join(__dirname,'../release',version),archive=path.join(dir,'win-unpacked/resources/app.asar');
 assert.equal(JSON.parse(asar.extractFile(archive,'package.json')).version,version);
 for(const file of ['main.cjs','updates.cjs','preload.cjs','store.cjs','startup.cjs','workspace.cjs','time.cjs'])assert(asar.extractFile(archive,'electron/'+file).equals(fs.readFileSync(path.join(__dirname,'../electron',file))),file+' differs from source');
 assert(asar.extractFile(archive,path.join('node_modules','electron-updater','out','main.js')).length>0);
 const config=yaml.load(fs.readFileSync(path.join(dir,'win-unpacked/resources/app-update.yml'),'utf8'));
 assert.equal(config.provider,'github');assert.equal(config.owner,'Yfanx');assert.equal(config.repo,'QuickNote');
 const info=yaml.load(fs.readFileSync(path.join(dir,'latest.yml'),'utf8')),installer=path.join(dir,info.path);assert.equal(info.version,version);assert.equal(info.files[0].url,info.path);
 const hash=crypto.createHash('sha512');for await(const chunk of fs.createReadStream(installer))hash.update(chunk);assert.equal(hash.digest('base64'),info.sha512);assert.equal(info.files[0].size,fs.statSync(installer).size);assert(fs.statSync(installer+'.blockmap').size>0);
 console.log('PASS ASAR source/version/updater dependency, GitHub config, NSIS metadata / SHA512 / blockmap');
}main().catch(e=>{console.error(e);process.exitCode=1});
