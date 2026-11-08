const fs=require('fs'),path=require('path');const seen=new Set(),sections=[];
function visit(name,from=process.cwd()){
  const file=require.resolve(name+'/package.json',{paths:[from]}),dir=path.dirname(file);if(seen.has(dir))return;seen.add(dir);
  const p=JSON.parse(fs.readFileSync(file)),license=fs.readdirSync(dir).find(f=>/^licen[cs]e(?:[._-]|$)/i.test(f));
  sections.push(`${p.name} ${p.version} — ${p.license}\n${license?fs.readFileSync(path.join(dir,license),'utf8'):'License declared in package.json: '+p.license+'\nAuthor: '+(typeof p.author==='string'?p.author:JSON.stringify(p.author))+'\nSource: '+JSON.stringify(p.repository)}`);
  for(const dep of Object.keys(p.dependencies||{}))visit(dep,dir);
}
visit('electron-updater');const marker='\n\n## Software update runtime dependencies\n\n';
const base=fs.readFileSync('THIRD_PARTY_NOTICES.md','utf8').split(marker)[0];const text=base+marker+sections.join('\n\n');
fs.writeFileSync('THIRD_PARTY_NOTICES.md',text);fs.writeFileSync('assets/THIRD_PARTY_NOTICES.txt',text);console.log('Updated notices for '+seen.size+' updater runtime packages');
