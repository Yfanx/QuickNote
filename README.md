# QuickNote 4.0

Windows 本地 Quick Capture + 时间轴待办。基于原项目升级，用户 public 粉色小龙素材已接入，无账号和云同步。

## 运行

```powershell
npm install
npm run dev
npm run build
npm run dist
```

默认 Ctrl+Shift+Space 快速记录、Ctrl+Shift+G 待办，再次按同一快捷键隐藏。Esc / 失焦隐藏。旧自定义快捷键保留，拒绝 Alt+Space。开机启动后台运行。

## 功能

- 统一石墨与柔粉深浅/系统主题；快速记录、时间轴、分组设置、原生托盘。
- 350ms 草稿防抖，隐藏刷新，重启恢复；成功提交与草稿清除原子写入。
- 最近三条记录、连续输入、IME 组合保护、防重复提交。
- 收件箱/今天（含逾期）/明天/本周/以后/已完成，本地日期；周日为本周结束。
- 计划日期、分组内置顶、编辑复制删除搜索、完成与可点击撤销，Ctrl+Z 单层快照。
- 每日最多一份自动备份、保留七份；导入合并、确认恢复、版本校验、恢复前备份。
- 真实全局快捷键注册状态与重新注册；设置即时生效。

## 数据

沿用 Electron userData 下 notes.json（通常 %APPDATA%/quicknote）。Store 层统一处理，保留旧字段与记录。升级备份 .pre4-backup，滚动备份 .bak，导入/恢复前分别 .before-import/.before-restore。每日 backups/YYYY-MM-DD.json。先写临时文件/fsync 再重命名；主/备份均损坏则提示并保留原文件。无数据库清空。

恢复会替换任务、设置、草稿，导入只合并任务；确认前显示数量。备份失败在设置数据页提示。

## 图标与许可

用户素材位于 public，品牌整理在 assets/mascot；assets/app/app.svg 含嵌入 PNG；assets/tray/tray.svg 为头像矢量；assets/icons 为统一 Lucide SVG/PNG。PNG/ICO 有 16/24/32/48/64/128/256 尺寸。运行 node assets/build4.cjs 重建。个人非官方二创素材，请按用户素材授权范围使用。依赖文本见 THIRD_PARTY_NOTICES.md 与设置“关于”。

## 测试

node --test electron/store.test.cjs
node_modules/.bin/electron electron/smoke4.cjs
node_modules/.bin/electron electron/smoke4.cjs --restart

实际使用独立临时目录，测试草稿/提交、旧数据、备份/恢复验证、日期跨年跨周、撤销完整元数据、快捷键回调与注册状态。electron/screenshots4.cjs 生成桌面配图。真实输入法、多屏/高 DPI、开机登录和安装流程仍需人工验收；当前背景采用高不透明度回退，未启用 Acrylic。

## 交付

安装包 release/4.0.0/QuickNote Setup 4.0.0.exe，免安装目录 win-unpacked 需完整保留。未签名。完整使用文档：QuickNote-功能全览.md（桌面副本已同步）。旧源码 .pre4 为本次重构前快照，不参与打包。

## 浅色优化 4.0.1
暖白窗口和淡粉侧栏，修正旧版灰色叠层，统一浅色卡片/搜索/输入/勾选/Toast。应用标题栏、关于页和原生窗口图标随主题切换。浅色图标 assets/app/app-light.svg、assets/app-light.ico、assets/app-light-*.png，执行 node assets/build-light.cjs 重建。4.0.1 安装包位于 release/4.0.1；浅色实机截图已同步桌面文档。


4.0.2：统一托盘菜单行和图标列，开机启动以状态文字代替 checkbox。安装包 release/4.0.2。

4.0.3：修复时间分类新增不继承日期，今天/明天/本周/以后默认按当前视图安排，编辑保留日期。Electron electron/schedule-smoke.cjs 已验证五个视图实际输入保存。

## 4.1.0 Deadline 与日历
旧 dueDate 仍为计划日期，新增截止日期/可选时间/绝对提醒时间戳，dataVersion5，升级前 .pre5-backup。时间轴新增逾期待安排，未来任务按具体日期分组；Deadline 智能视图与月历引用同一条记录。统一编辑面板，首页快捷安排，日期草稿。应用运行时 Windows 通知，退出不发送，恢复后补发待触发提醒并持久化去重。

测试：node --test electron/deadline.test.cjs electron/reminders.test.cjs electron/store.test.cjs；Electron electron/deadline-smoke.cjs、electron/schedule-smoke.cjs。截图 electron/deadline-screenshots.cjs。测试目录隔离，未改写用户数据。真实通知、输入法、多屏与开机流程需人工验收。

安装包 release/4.1.0/QuickNote Setup 4.1.0.exe，完整说明及截图已同步桌面功能文档。

4.1.1：统一 Deadline 小龙图标与深浅色日期控件/细滚动条，主页只保留一层滚动。待办 Enter 或加号打开完整新建面板，继承当前分类日期，确认保存后创建；主页仍直接保存。安装包 release/4.1.1。
