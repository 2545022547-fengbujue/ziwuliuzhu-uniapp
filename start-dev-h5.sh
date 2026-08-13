#!/usr/bin/env bash
# 启动 / 重启 ziwuliuzhu H5 dev server（端口 5174）
# 用法：bash start-dev-h5.sh
set -e

PORT=5174
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "==> 检查端口 $PORT ..."
PID=$(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTEN | awk '{print $5}' | head -1)

if [ -n "$PID" ]; then
  echo "==> 端口已被 PID $PID 占用，结束旧进程"
  kill -9 "$PID" 2>/dev/null || taskkill /PID "$PID" /F >/dev/null 2>&1 || true
  sleep 1
fi

echo "==> 清空 vite 缓存 (如不可用则跳过)"
rm -rf node_modules/.vite 2>/dev/null || true

echo "==> 启动 dev:h5 (后台)"
nohup npm run dev:h5 > /tmp/ziwu-dev.log 2>&1 &
SRV_PID=$!

echo "==> 等待服务就绪 (PID $SRV_PID) ..."
for i in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || true)
  if [ "$CODE" = "200" ]; then
    echo ""
    echo "==> 就绪: http://localhost:$PORT/   (日志: /tmp/ziwu-dev.log)"
    exit 0
  fi
  sleep 1
done

echo "==> 等待超时，最近日志:"
tail -n 20 /tmp/ziwu-dev.log 2>/dev/null || true
exit 1
