import {useRef,useState,useCallback} from 'react';
export type Workspace={filter?:string;returnFilter?:string;calendarDate?:string;month?:string;scroll:Record<string,number>};
export function useWorkspace(onError:(message:string)=>void){
  const [workspace,setWorkspace]=useState<Workspace>({scroll:{}}),current=useRef(workspace),hydrated=useRef(false);
  const hydrate=(value:Workspace|undefined)=>{if(hydrated.current)return false;hydrated.current=true;current.current={...value,scroll:value?.scroll||{}};setWorkspace(current.current);return true};
  const save=useCallback((patch:Partial<Workspace>)=>{const next={...current.current,...patch,scroll:{...current.current.scroll,...patch.scroll}};current.current=next;setWorkspace(next);window.quicknote.call('workspace',patch).catch(()=>onError('浏览位置保存失败'));},[]);
  return {workspace,hydrate,save};
}
