export type Note={id:string;text:string;done:boolean;created:number;updatedAt?:number;completedAt?:number;dueDate?:string|null;isPinned?:boolean;schedule?:string;[key:string]:any};
export const day=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function tomorrow(now=new Date()){const d=new Date(now);d.setDate(d.getDate()+1);return day(d)}
export function weekEnd(now=new Date()){const d=new Date(now);d.setDate(d.getDate()+(7-(d.getDay()||7)));return day(d)}
export function group(n:Note,now=new Date()){if(n.done)return '已完成';if(!n.dueDate)return n.schedule==='later'?'以后':'收件箱';if(n.dueDate<=day(now))return '今天';if(n.dueDate===tomorrow(now))return '明天';if(n.dueDate<=weekEnd(now))return '本周';return '以后'}
export function sortNotes(a:Note,b:Note){return Number(!!b.isPinned)-Number(!!a.isPinned)||(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||b.created-a.created||a.id.localeCompare(b.id)}
