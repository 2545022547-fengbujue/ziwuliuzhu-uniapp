#!/bin/sh
# 守护脚本：vite 退出自动重启，不写日志
cd <PROJECT_ROOT>
while true; do
  npm run dev:h5
  sleep 3
done
