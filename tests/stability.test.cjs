const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {resolveDraftDates,contextDates}=require('../src/draft-dates.ts'),{mergeWorkspace}=require('../electron/workspace.cjs'),{Store}=require('../electron/store.cjs');
test('relative draft dates roll across midnight/year; explicit and legacy dates stay fixed',()=>{
 const base={dueDate:null,deadlineDate:'2027-01-10',schedule:'inbox',reminderAt:null,isPinned:false,deadlineTime:null},old=new Date(2026,11,31,23,59),now=new Date(2027,0,1);
 const today=contextDates(base,'今天','2026-12-25',old),updated=resolveDraftDates(today,now);assert.equal(updated.dueDate,'2027-01-01');assert.equal(updated.deadlineDate,base.deadlineDate);
 assert.equal(resolveDraftDates({...today,planIntent:'tomorrow'},now).dueDate,'2027-01-02');
 for(const planIntent of ['fixed',undefined])assert.equal(resolveDraftDates({...today,planIntent},now).dueDate,'2026-12-31');
 assert.equal(contextDates(base,'日历','2026-12-25',now).dueDate,'2026-12-25');
});
test('workspace positions merge per category, validate and survive a process restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qn-workspace-')),s=new Store(dir);s.patch({notes:[{id:'keep',text:'legacy',created:1,done:false}]});
 let state=mergeWorkspace(s.data.workspace,{filter:'Deadline',scroll:{Deadline:350},calendarDate:'2027-01-01',month:'2027-01'});state=mergeWorkspace(state,{scroll:{'今天':180}});s.patch({workspace:state});
 const restored=new Store(dir);assert.equal(restored.data.workspace.scroll.Deadline,350);assert.equal(restored.data.workspace.scroll['今天'],180);assert.equal(restored.data.workspace.filter,'Deadline');assert.equal(restored.data.notes[0].text,'legacy');
 for(const invalid of [{filter:'other'},{calendarDate:'2027-02-30'},{month:'2027-13'},{scroll:{Deadline:-1}},{scroll:{other:2}},{scroll:{Deadline:Infinity}},{unexpected:true}])assert.throws(()=>mergeWorkspace(state,invalid));
});
