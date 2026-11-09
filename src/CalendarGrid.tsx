import React from 'react';
import {calendarOccasion,calendarDayTitle} from './chinese-calendar';
import {DeadlineIcon} from './DeadlineIcon';
import {day,Note} from './timeline';

export default function CalendarGrid({dates,selected,month,now,notes,onSelect}:{dates:Date[];selected:string;month:number;now:Date;notes:Note[];onSelect:(value:string)=>void}){
 return <div className="calendar-grid chinese-calendar-grid">{dates.map(date=>{
   const value=day(date),occasion=calendarOccasion(date),inMonth=date.getMonth()===month;
   const plan=notes.some(n=>n.dueDate===value),deadline=notes.some(n=>n.deadlineDate===value);
   return <button key={value} data-calendar-date={value} aria-label={calendarDayTitle(date)} title={calendarDayTitle(date)} className={(selected===value?'selected ':'')+(!inMonth?'other-month':'')} onClick={()=>onSelect(value)}>
    <span className="calendar-number">{value===day(now)?<span className="today-star" aria-label="今天">★</span>:date.getDate()}</span>
    <small className={'calendar-occasion '+occasion.kind}>{occasion.label||'\u00a0'}</small>
    <div className="calendar-markers">{plan&&<i className="plan-dot"/>}{deadline&&<DeadlineIcon/>}</div>
   </button>;
 })}</div>;
}
