function createStartup(app,executable=process.execPath){
  const options=()=>({path:executable,args:['--background']});
  function read(){const state=app.getLoginItemSettings(options());return !!state.openAtLogin&&state.executableWillLaunchAtLogin!==false}
  function set(enabled){
    if(typeof enabled!=='boolean')throw Error('开机启动设置无效');
    app.setLoginItemSettings({...options(),openAtLogin:enabled,enabled});
    if(read()!==enabled)throw Error('开机启动设置未生效，请检查 Windows 启动应用设置');
    return enabled;
  }
  return {read,set};
}
module.exports={createStartup};
