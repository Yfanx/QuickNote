import React from 'react';
import {RefreshCw,Download,RotateCcw,Check,ArrowUpRight,X,AlertCircle} from 'lucide-react';
export type UpdateState={status:string;version?:string|null;percent?:number;error?:string|null;errorStage?:string|null;releaseNotes?:string[];releaseDate?:string|null;transferred?:number;total?:number;bytesPerSecond?:number};
const bytes=(value=0)=>value>=1048576?`${(value/1048576).toFixed(1)} MB`:`${Math.round(value/1024)} KB`;
export function UpdateCard({state,run}:{state:UpdateState;run:(action:string)=>void}){
 const s=state.status,busy=['checking','downloading','cancelling','installing'].includes(s),hasVersion=!!state.version;
 const title=s==='current'?'已是最新版本':s==='checking'?'正在检查…':s==='available'?'有新版本':s==='downloading'?'正在下载':s==='cancelling'?'正在取消…':s==='cancelled'?'下载已取消':s==='downloaded'?'已准备就绪':s==='installing'?'正在启动安装…':s==='error'?state.error:s==='disabled'?'开发模式':'软件更新';
 const Icon=s==='current'||s==='downloaded'?Check:s==='error'?AlertCircle:hasVersion?ArrowUpRight:RefreshCw;
 const action=s==='available'||s==='cancelled'?'update-download':s==='downloaded'||s==='error'&&state.errorStage==='install'?'update-install':s==='error'?'update-retry':'update-check';
 const label=s==='available'?'下载更新':s==='cancelled'?'重新下载':s==='downloaded'?'重启并安装':s==='error'?(state.errorStage==='download'?'重试下载':state.errorStage==='install'?'重试安装':'重新检查'):s==='checking'?'正在检查…':s==='installing'?'正在安装…':'检查更新';
 const date=state.releaseDate?new Date(state.releaseDate):null;
 return <section className={'update-card update-'+s} aria-label="软件更新"><div className="update-heading"><span className="update-symbol"><Icon className={s==='checking'?'update-spin':''}/></span><div className="update-title"><b aria-live="polite">{title}</b>{hasVersion&&date&&Number.isFinite(date.getTime())&&<span>{date.toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}</span>}</div>{hasVersion&&<span className="update-version">v{state.version}</span>}</div>
 {!!state.releaseNotes?.length&&<div className="update-notes"><h4>更新内容</h4><ul>{state.releaseNotes.map((line,index)=><li key={index}>{line}</li>)}</ul></div>}
 {['downloading','cancelling'].includes(s)&&<div className="update-download"><div className="update-progress-meta"><b>{state.percent||0}%</b><span>{(state.total||0)>0?`${bytes(state.transferred)} / ${bytes(state.total)}`:''}{(state.bytesPerSecond||0)>0?` · ${bytes(state.bytesPerSecond)}/s`:''}</span></div><progress aria-label="更新下载进度" max={100} value={state.percent||0}/></div>}
 {s!=='disabled'&&<div className="update-actions">{['downloading','cancelling'].includes(s)?<button className="update-secondary" data-update-action="cancel" disabled={s==='cancelling'} onClick={()=>run('update-cancel')}><X/>{s==='cancelling'?'正在取消…':'取消下载'}</button>:<><button className={hasVersion?'update-primary':'update-secondary'} data-update-action="primary" disabled={busy} onClick={()=>run(action)}>{action==='update-install'?<RotateCcw/>:action==='update-download'||action==='update-retry'&&state.errorStage==='download'?<Download/>:<RefreshCw/>}{label}</button>{hasVersion&&!busy&&s!=='downloaded'&&<button className="update-refresh" title="重新检查更新" data-update-action="check" onClick={()=>run('update-check')}><RefreshCw/></button>}</>}</div>}
 </section>;
}
