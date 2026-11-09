const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {calendarOccasion,calendarDayTitle}=require('../src/chinese-calendar.ts');
// 2026 solar-term reference: https://www.hko.gov.hk/tc/gts/time/calendar/pdf/files/2026.pdf
test('traditional festivals and winter solstice use local Y/M/D; ordinary days stay visually empty',()=>{
 assert.equal(calendarOccasion(new Date(2024,1,10)).label,'春节');assert.equal(calendarOccasion(new Date(2026,1,17)).label,'春节');assert.equal(calendarOccasion(new Date(2026,11,22)).label,'冬至');assert.equal(calendarOccasion(new Date(2026,11,7)).label,'大雪');assert.equal(calendarOccasion(new Date(2026,11,20)).label,'');assert.equal(calendarOccasion(new Date(2026,11,22,23,59)).label,'冬至');
 assert(calendarDayTitle(new Date(2026,11,22)).includes('农历'));assert.equal(calendarOccasion(new Date(2023,1,21)).label,'龙抬头');assert.notEqual(calendarOccasion(new Date(2023,2,23)).label,'龙抬头');
});
test('coincident festivals use one compact label and retain full hover information',()=>{
 const day=calendarOccasion(new Date(2020,9,1));assert.equal(day.label,'中秋节');assert(day.all.includes('中秋节'));assert(day.all.includes('国庆节'));assert.equal(day.kind,'festival');
});
