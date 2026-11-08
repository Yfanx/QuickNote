import React from 'react';
import {RefreshCw,Download,RotateCcw} from 'lucide-react';
export type UpdateState={status:string;version?:string|null;percent?:number;error?:string|null};
export function UpdateCard({state,run}:{state:UpdateState;run:(action:string)=>void}) {
  const s=state.status,busy=['checking','downloading','installing'].includes(s);
  const message=s==='disabled'?'开发模式':s==='checking'?'正在检查更新…':s==='current'?'已是最新版本':s==='available'?`发现新版本 ${state.version}`:s==='downloading'?`正在下载 ${state.percent||0}%`:s==='downloaded'?`${state.version} 已准备就绪`:s==='installing'?'正在启动安装程序…':s==='error'?state.error:'';
  return <section className="update-card" aria-label="软件更新">{message&&<p aria-live="polite">{message}</p>}{s==='downloading'&&<progress aria-label="更新下载进度" max={100} value={state.percent||0}/>}{s!=='disabled'&&<button className="secondary" disabled={busy} onClick={()=>run(s==='available'?'update-download':s==='downloaded'?'update-install':'update-check')}>{s==='available'?<Download/>:s==='downloaded'?<RotateCcw/>:<RefreshCw/>}{s==='available'?'下载更新':s==='downloaded'?'重启并安装':s==='checking'?'正在检查…':s==='downloading'?'正在下载…':'检查更新'}</button>}</section>;
}
