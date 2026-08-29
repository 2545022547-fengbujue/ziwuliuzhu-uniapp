@echo off
rem ============================================================
rem 子午流注取穴 uni-app x 蒸汽模式 —— Android 云端打包一键脚本
rem
rem 前置条件（必须）：
rem   1. HBuilderX 未运行时本脚本会自动启动它（cli 会拉起主程序）。
rem   2. HBuilderX 需已登录 DCloud 账号（打包用）。
rem   3. PATH 最前面注入 HBuilderX 内置 node22 —— 违反会复现
rem      「Invalid or incompatible cached data (cachedDataRejected)」。
rem
rem 已知限制：
rem   - 本地字节码开发编译（launch --compile）要求项目路径不含中文；
rem     云端打包在 DCloud 服务器编译，不受中文路径影响。
rem   - 本脚本不携带本机绝对路径；HBuilderX 目录通过 HBX_DIR 覆盖
rem   - 包名 com.chaihu.zwlz 当前为"测试包名"（--ignoreWarnings 自动登记），
rem     正式发布前需到 dev.dcloud.net.cn 应用详情-各平台信息 里正式录入。
rem ============================================================

rem 项目目录 = 本脚本所在目录的上一级（scripts\ 的上级）
set PROJECT_DIR=%~dp0..
rem HBuilderX 安装目录，可用环境变量 HBX_DIR 覆盖
if "%HBX_DIR%"=="" set HBX_DIR=D:\HBuilderX

set PATH=%HBX_DIR%\plugins\node;%PATH%

"%HBX_DIR%\cli.exe" pack ^
  --project "%PROJECT_DIR%" ^
  --platform android ^
  --android.packagename com.chaihu.zwlz ^
  --android.androidpacktype 1 ^
  --isCustom false ^
  --ignoreWarnings true

echo.
echo 打包完成后 APK 下载地址见上方输出（app.liuyingyong.cn 开头）。
pause
