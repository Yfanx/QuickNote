import {day,tomorrow} from './timeline';
import type {Dates} from './TaskEditor';
export function resolveDraftDates<T extends {dueDate:string|null;planIntent?:string}>(value:T,now=new Date()):T {
  const dueDate=value.planIntent==='today'?day(now):value.planIntent==='tomorrow'?tomorrow(now):value.dueDate;
  return dueDate===value.dueDate?value:{...value,dueDate};
}
export function contextDates(base:Dates,filter:string,calendarDate:string,now=new Date()):Dates {
  if(filter==='今天')return {...base,dueDate:day(now),planIntent:'today'};
  if(filter==='即将到来')return {...base,dueDate:tomorrow(now),planIntent:'tomorrow'};
  if(filter==='日历')return {...base,dueDate:calendarDate,planIntent:'fixed'};
  return {...base,schedule:filter==='以后'?'later':filter==='任意时间'?'anytime':'inbox',planIntent:'fixed'};
}
