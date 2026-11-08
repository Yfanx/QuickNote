const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {deadlineGroup,deadlineHeading,deadlineRemaining}=require('../src/deadline-display.ts'),{inView}=require('../src/deadline.ts');
test('Deadline groups chronological months and overdue; countdown uses local calendar days',()=>{
 const now=new Date(2026,10,8,12),note={id:'a',text:'a',created:1,done:false,deadlineDate:'2026-11-10'};
 assert.equal(deadlineGroup(note,now),'2026-11');assert.equal(deadlineHeading('2026-11',now),'November');assert.equal(deadlineHeading('2027-01',now),'January 2027');
 assert.equal(deadlineRemaining(note,now),'2 days left');assert.equal(deadlineRemaining({...note,deadlineDate:'2026-11-07'},now),'1 day past');
 assert.equal(deadlineGroup({...note,deadlineDate:'2026-11-07'},now),'overdue');
 assert.equal(deadlineRemaining({...note,deadlineDate:'2026-11-08'},now),'0 days left');
 assert.equal(deadlineRemaining({...note,deadlineDate:'2026-11-08',deadlineTime:'11:00'},now),'1 day past');
 assert.equal(deadlineRemaining({...note,deadlineDate:'2027-01-01'},new Date(2026,11,31,23,59)),'1 day left');
});
test('Anytime includes every unfinished task without changing stored schedule',()=>{
 for(const fields of [{},{schedule:'anytime'},{schedule:'later'},{dueDate:'2026-11-08'},{dueDate:'2099-01-01'},{deadlineDate:'2026-11-07'}]){
 const n={id:'a',text:'a',done:false,created:1,...fields};assert(inView(n,'任意时间'));assert(!inView({...n,done:true},'任意时间'));
 }
});
