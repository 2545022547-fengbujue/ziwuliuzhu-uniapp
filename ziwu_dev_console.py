#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
子午流注 H5 Dev 服务器控制台
--------------------------------
把 start-dev-h5.sh 的重启逻辑套一个桌面 GUI 壳子：
  - 状态灯：实时显示 5174 端口是否可访问
  - 重启服务器：结束占用 5174 的旧进程，启动 `npm run dev:h5`，实时日志
  - 打开浏览器：访问 http://localhost:5174/
  - 停止服务器：结束 dev server 进程
双击运行（或 python ziwu_dev_console.py）。
"""

import os
import sys
import subprocess
import threading
import socket
import time
import webbrowser

import tkinter as tk
from tkinter import scrolledtext, ttk

# 项目根目录：用脚本自身位置定位（不硬编码本机路径——既避免泄露本机目录结构，又可移植到任意机器）
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 5174
# 本机 npm/Node 附加路径：从环境变量 ZIWU_EXTRA_PATHS 读取（分号分隔），默认空。
# 本机用法示例：set ZIWU_EXTRA_PATHS=<你的Nodejs目录>;<你的npm-global目录>
EXTRA_PATHS = [p.strip() for p in os.environ.get('ZIWU_EXTRA_PATHS', '').split(';') if p.strip()]

# Windows 隐藏子进程控制台黑框
CREATE_NO_WINDOW = 0x08000000


def build_env():
    env = os.environ.copy()
    parts = env.get("PATH", "").split(os.pathsep)
    for p in EXTRA_PATHS:
        if p not in parts:
            parts.insert(0, p)
    env["PATH"] = os.pathsep.join(parts)
    return env


def port_open():
    try:
        with socket.create_connection(("127.0.0.1", PORT), timeout=1):
            return True
    except OSError:
        return False


class Console(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("子午流注 Dev 服务器控制台")
        self.geometry("720x520")
        try:
            self.iconbitmap()  # 无图标不报错
        except Exception:
            pass
        self.server_proc = None
        self._working = False

        self._build_ui()
        self.after(500, self._auto_check)
        self.after(3000, self._auto_loop)

    # ---------- UI ----------
    def _build_ui(self):
        f = ("Microsoft YaHei", 10)

        top = ttk.Frame(self, padding=10)
        top.pack(fill=tk.X)
        self.status_light = tk.Label(top, width=2, height=1, bg="#9e9e9e", relief=tk.RAISED)
        self.status_light.pack(side=tk.LEFT, padx=(0, 8))
        self.status_text = ttk.Label(top, text="检测中…", font=f)
        self.status_text.pack(side=tk.LEFT)
        ttk.Label(top, text=f"端口 {PORT}", font=f, foreground="#666").pack(side=tk.RIGHT)

        btns = ttk.Frame(self, padding=(10, 0, 10, 10))
        btns.pack(fill=tk.X)
        ttk.Button(btns, text="重启服务器", command=self.on_restart).pack(side=tk.LEFT, padx=4)
        ttk.Button(btns, text="打开浏览器", command=self.on_open).pack(side=tk.LEFT, padx=4)
        ttk.Button(btns, text="停止服务器", command=self.on_stop).pack(side=tk.LEFT, padx=4)
        ttk.Button(btns, text="退出", command=self.on_exit).pack(side=tk.RIGHT, padx=4)

        log_frame = ttk.Frame(self, padding=(10, 0, 10, 10))
        log_frame.pack(fill=tk.BOTH, expand=True)
        ttk.Label(log_frame, text="日志", font=f).pack(anchor=tk.W)
        self.log_box = scrolledtext.ScrolledText(
            log_frame, font=("Consolas", "Microsoft YaHei", 9), bg="#1e1e1e",
            fg="#d4d4d4", insertbackground="#fff", state=tk.DISABLED
        )
        self.log_box.pack(fill=tk.BOTH, expand=True)

    # ---------- logging ----------
    def log(self, text):
        self.after(0, self._append, str(text))

    def _append(self, text):
        self.log_box.config(state=tk.NORMAL)
        self.log_box.insert(tk.END, text + "\n")
        self.log_box.see(tk.END)
        self.log_box.config(state=tk.DISABLED)

    # ---------- status ----------
    def set_status(self, state):
        self.after(0, self._set_status, state)

    def _set_status(self, state):
        colors = {"up": "#2e7d32", "down": "#c62828", "working": "#f9a825"}
        texts = {
            "up": f"运行中 → http://localhost:{PORT}/",
            "down": "未运行",
            "working": "启动中…",
        }
        self.status_light.config(bg=colors.get(state, "#9e9e9e"))
        self.status_text.config(text=texts.get(state, "未知"))

    # ---------- actions ----------
    def on_restart(self):
        if self._working:
            return
        threading.Thread(target=self.do_restart, daemon=True).start()

    def do_restart(self):
        self._working = True
        self.set_status("working")
        self.log("========================================")
        self.log(f"==> 开始重启 dev server (端口 {PORT})")
        self.kill_old()
        self.start_server()
        for i in range(60):
            if port_open():
                self.set_status("up")
                self.log(f"==> 就绪: http://localhost:{PORT}/")
                self._working = False
                return
            time.sleep(1)
        self.set_status("down")
        self.log("==> 等待超时：服务可能未启动，请查看上方 npm 日志")
        self._working = False

    def kill_old(self):
        try:
            out = subprocess.check_output(
                "netstat -ano", shell=True, text=True, stderr=subprocess.DEVNULL,
                creationflags=CREATE_NO_WINDOW,
            )
        except Exception as e:
            self.log(f"==> 查询端口失败: {e}")
            return
        for line in out.splitlines():
            cols = line.split()
            if len(cols) >= 5 and "LISTENING" in line:
                local = cols[1]
                if local.endswith(f":{PORT}"):
                    pid = cols[-1]
                    try:
                        subprocess.run(
                            f"taskkill /PID {pid} /F", shell=True, capture_output=True,
                            creationflags=CREATE_NO_WINDOW,
                        )
                        self.log(f"==> 结束旧进程 PID {pid}")
                    except Exception as e:
                        self.log(f"==> 结束进程 {pid} 失败: {e}")

    def start_server(self):
        # 先结束已有 Popen 句柄对应的进程
        if self.server_proc and self.server_proc.poll() is None:
            try:
                self.server_proc.terminate()
            except Exception:
                pass
        self.log(f"==> 启动 `npm run dev:h5` (cwd={PROJECT_DIR})")
        try:
            self.server_proc = subprocess.Popen(
                "npm run dev:h5", cwd=PROJECT_DIR, env=build_env(),
                shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, bufsize=1, creationflags=CREATE_NO_WINDOW,
            )
        except Exception as e:
            self.log(f"==> 启动失败: {e}")
            return
        threading.Thread(target=self._reader, daemon=True).start()

    def _reader(self):
        if self.server_proc and self.server_proc.stdout:
            for line in iter(self.server_proc.stdout.readline, ""):
                if not line:
                    break
                self.log(line.rstrip())
            try:
                self.server_proc.stdout.close()
            except Exception:
                pass

    def on_open(self):
        webbrowser.open(f"http://localhost:{PORT}/")
        self.log(f"==> 已尝试打开浏览器: http://localhost:{PORT}/")

    def on_stop(self):
        threading.Thread(target=self.kill_old, daemon=True).start()
        if self.server_proc and self.server_proc.poll() is None:
            try:
                self.server_proc.terminate()
                self.log("==> 已停止 dev server")
            except Exception:
                pass

    def on_exit(self):
        if self.server_proc and self.server_proc.poll() is None:
            try:
                self.server_proc.terminate()
            except Exception:
                pass
        self.destroy()

    # ---------- auto status ----------
    def _auto_check(self):
        if self._working:
            return
        self.set_status("up" if port_open() else "down")

    def _auto_loop(self):
        self._auto_check()
        self.after(3000, self._auto_loop)


def main():
    Console().mainloop()


if __name__ == "__main__":
    main()
