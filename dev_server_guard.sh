#!/bin/sh
# 守护脚本：vite 退出自动重启，不写日志
# 用脚本自身目录定位项目根（避免硬编码本机路径；本脚本位于项目根目录）
cd "$(dirname "$0")"
while true; do
  npm run dev:h5
  sleep 3
done
