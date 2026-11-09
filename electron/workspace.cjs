const filters=['收件箱','今天','即将到来','任意时间','以后','日历','Deadline'];
function mergeWorkspace(current={},patch={}){
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('待办浏览状态无效');
  const next={...current,scroll:{...current.scroll}};
  for(const [key,value]of Object.entries(patch)){
    if(key==='filter'){if(!filters.includes(value))throw Error('待办分类无效');next.filter=value}
    else if(key==='returnFilter'){if(!filters.includes(value)||value==='日历')throw Error('返回分类无效');next.returnFilter=value}
    else if(key==='calendarDate'){const d=new Date(value+'T12:00:00');if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(d.getTime())||`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`!==value)throw Error('日历日期无效');next.calendarDate=value}
    else if(key==='month'){if(typeof value!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))throw Error('日历月份无效');next.month=value}
    else if(key==='scroll'){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>filters.length)throw Error('滚动位置无效');for(const [view,top]of Object.entries(value)){if(!filters.includes(view)||!Number.isFinite(top)||top<0||top>1e7)throw Error('滚动位置无效');next.scroll[view]=top}}
    else throw Error('未知浏览状态');
  }
  return next;
}
module.exports={mergeWorkspace,filters};
