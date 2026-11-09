import {Solar} from 'lunar-javascript';
import {day} from './timeline';
export type CalendarOccasion={label:string;kind:'festival'|'term'|'';lunar:string;all:string[]};
const cache=new Map<string,CalendarOccasion>();
const festivals=new Set(['春节','元宵节','龙抬头','端午节','七夕节','中秋节','重阳节','腊八节','除夕']);
const solarFestivals:Record<string,string>={'1-1':'元旦','5-1':'劳动节','10-1':'国庆节'};
export function calendarOccasion(date:Date):CalendarOccasion {
  const key=day(date),cached=cache.get(key);if(cached)return cached;
  let result:CalendarOccasion={label:'',kind:'',lunar:'',all:[]};
  try{
    const lunar=Solar.fromYmd(date.getFullYear(),date.getMonth()+1,date.getDate()).getLunar();
    const traditional=lunar.getFestivals().map(name=>name==='龙头节'?'龙抬头':name).filter(name=>festivals.has(name));
    const solarFestival=solarFestivals[`${date.getMonth()+1}-${date.getDate()}`]||'',festival=traditional[0]||solarFestival,term=lunar.getJieQi();
    const all=Array.from(new Set([...traditional,...(solarFestival?[solarFestival]:[]),...(term?[term]:[])]));
    result={label:festival||term||'',kind:festival?'festival':term?'term':'',lunar:`农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,all};
  }catch{/* Unsupported dates remain ordinary calendar days. */}
  if(cache.size>=512)cache.delete(cache.keys().next().value!);cache.set(key,result);return result;
}
export function calendarDayTitle(date:Date){const info=calendarOccasion(date);return [day(date),info.lunar,...info.all].filter(Boolean).join(' · ')}
