import {Note, day} from './timeline';
import {deadlineAt} from './deadline';

export function deadlineGroup(note:Note, now=new Date()) {
  return (deadlineAt(note)??Infinity)<now.getTime() ? 'overdue' : note.deadlineDate!.slice(0,7);
}
export function deadlineHeading(key:string, now=new Date()) {
  if(key==='overdue')return '逾期';
  const d=new Date(key+'-01T12:00:00');
  return d.toLocaleDateString('en-US',{month:'long',...(d.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})});
}
export function deadlineRemaining(note:Note, now=new Date()) {
  const ordinal=(value:string)=>{const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)};
  const diff=Math.round((ordinal(note.deadlineDate!)-ordinal(day(now)))/86400000);
  if((deadlineAt(note)??Infinity)<now.getTime()) {
    const past=Math.max(1,-diff);
    return `${past} ${past===1?'day':'days'} past`;
  }
  return `${diff} ${diff===1?'day':'days'} left`;
}
