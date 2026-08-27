#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""audit-repo-privacy.py — 仓库隐私审计（防止敏感信息进入公开仓库）

用法:
  python scripts/audit-repo-privacy.py [--scope all|tree|staged] [--json]

范围:
  all    = 全历史(--all 可达提交的 blob/message/文件名) + 当前树
  tree   = 当前工作树（默认，pre-push 用，快）
  staged = 暂存区（pre-commit 用）

模式来源:
  1. 内置通用模式（本脚本可进公开仓库，不含真实敏感词）：
     强信号: GitHub Token / API Key / 私钥 / Authorization / Cookie /
             手机号 / 身份证 / 银行卡(带分隔符) / 公网IP
     弱信号: 盘符路径(正反斜杠) / 用户目录 / 邮箱 / 密钥赋值 / 占位符
  2. 本地扩展精确词（可选）: .privacy-patterns.local.json（gitignore，含真实用户名/路径）

误报排除: URL(://) / base64 / LaTeX / 二进制文件 / ignore_files 名单 / 依赖锁文件

退出码: 0=通过  1=有命中  2=使用或环境错误
"""
import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys

BINARY_EXT = {'.ttf', '.woff', '.woff2', '.otf', '.eot', '.png', '.jpg', '.jpeg',
              '.gif', '.ico', '.webp', '.avif', '.zip', '.gz', '.tar', '.jar',
              '.pdf', '.docx', '.xlsx', '.pptx', '.mp3', '.mp4', '.exe', '.dll',
              '.so', '.dylib', '.pyc', '.map', '.dat'}

# 默认忽略文件（依赖元数据/构建产物，命中多为公开数据或编码误报）
DEFAULT_IGNORE = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
                  '*-base64.txt', '*.min.js', '*.map', 'composer.lock', 'Cargo.lock']

STRONG = [
    ('gh_token',  re.compile(r'ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}')),
    ('api_key',   re.compile(r'\b(?:sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_\-]{20,}|ya29\.[0-9A-Za-z_\-]{20,})')),
    ('priv_key',  re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')),
    ('auth_hdr',  re.compile(r'\b(?:Authorization|X-Api-Key|X-Auth-Token)\s*:\s*\S+', re.I)),
    ('cookie',    re.compile(r'\bCookie\s*:\s*\S+', re.I)),
    ('phone',     re.compile(r'(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)')),
    ('id_card',   re.compile(r'(?<!\d)\d{17}[\dXx](?!\d)')),
    ('bank_card', re.compile(r'\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b')),
    ('pub_ip',    re.compile(r'\b(?!(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.0\.0\.0))\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')),
]
WEAK = [
    ('win_path',  re.compile(r'[A-Za-z]:[\\/][^\s"\'<>|{}]{2,}')),
    ('home_path', re.compile(r'/(?:home|Users)/[^\s"\'<>|]{2,}')),
    ('email',     re.compile(r'[\w.+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*)+')),
    ('pwd_assign',re.compile(r'\b(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?key|appsecret)\s*[:=]\s*["\']?[^\s"\',;]{6,}', re.I)),
    ('placeholder', re.compile(r'<[A-Z][A-Z_]{2,}>')),  # 当前树不应有占位符
]
PLACEHOLDER_ONLY = {'placeholder'}  # 仅当前树/暂存区检查，历史中允许（替换痕迹）
# 常见安全占位符（文档示例等），不视为异常
SAFE_PLACEHOLDERS = {'PID', 'TMP', 'TEMP', 'APPID', 'APP_ID', 'UUID', 'GUID'}

# URL / LaTeX / base64 上下文排除
URL_RX = re.compile(r'\b[a-z][a-z0-9+.-]*://', re.I)
LATEX_RX = re.compile(r'\\[a-zA-Z]{2,}\{')
# 代码正则字面量片段（如 e:\s*[、n:\d+）——是正则表达式，不是路径
REGEX_FRAG_RX = re.compile(r'^[A-Za-z]:\\[A-Za-z][*+?]?[\[(]')

def run(args):
    try:
        return subprocess.run(args, capture_output=True, check=False).stdout
    except FileNotFoundError:
        return b''

def is_binary(data: bytes, path: str) -> bool:
    ext = os.path.splitext(path)[1].lower()
    if ext in BINARY_EXT:
        return True
    if b'\x00' in data[:8000]:
        return True
    try:
        data.decode('utf-8')
        return False
    except UnicodeDecodeError:
        return True

def load_local_config():
    cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            '..', '.privacy-patterns.local.json')
    cfg = {'patterns': [], 'ignore_files': [], 'safe_emails': []}
    try:
        with open(cfg_path, encoding='utf-8') as f:
            data = json.load(f)
        cfg['patterns'] = [str(p) for p in data.get('patterns', [])]
        cfg['ignore_files'] = [str(p) for p in data.get('ignore_files', [])]
        cfg['safe_emails'] = [str(e) for e in data.get('safe_emails', [])]
    except FileNotFoundError:
        pass
    except (json.JSONDecodeError, OSError) as e:
        print(f'[audit-repo-privacy] 本地配置读取失败: {e}', file=sys.stderr)
    return cfg

def ignored_file(path: str, ignore_list) -> bool:
    base = os.path.basename(path)
    return any(fnmatch.fnmatch(base, pat) or fnmatch.fnmatch(path, pat)
               for pat in ignore_list)

def scan_text(txt: str, kind: str, label: str, cfg, results, in_history=False):
    cats = STRONG + WEAK
    for cat, rx in cats:
        if in_history and cat in PLACEHOLDER_ONLY:
            continue  # 历史中的占位符是替换痕迹，允许
        for m in rx.finditer(txt):
            snip = m.group(0).replace('\n', ' ')
            if cat == 'placeholder' and snip.strip('<>') in SAFE_PLACEHOLDERS:
                continue
            # URL 上下文排除
            if cat == 'win_path':
                if REGEX_FRAG_RX.match(snip):
                    continue  # 代码正则字面量
                seg = txt[max(0, m.start() - 40):m.end() + 5]
                if URL_RX.search(seg):
                    continue
                if '\\' in snip and LATEX_RX.search(seg):
                    continue  # LaTeX 转义
            if cat == 'email':
                if snip.endswith(('.example.com', '.example.org', '.example.net',
                                  '@example.invalid', '@local', '@localhost')):
                    continue
                if snip.lower() in [e.lower() for e in cfg['safe_emails']]:
                    continue  # 已知安全邮箱（作者/占位）
            results.append((cat, kind, label, snip[:120]))
    # 本地精确词
    for pat in cfg['patterns']:
        idx = txt.find(pat)
        if idx != -1:
            results.append(('local_pattern', kind, label,
                            txt[max(0, idx - 40):idx + len(pat) + 40].replace('\n', ' ')[:120]))

def scan_bytes(data: bytes, kind: str, label: str, cfg, results, in_history=False):
    if is_binary(data, label):
        return
    try:
        txt = data.decode('utf-8')
    except UnicodeDecodeError:
        return
    scan_text(txt, kind, label, cfg, results, in_history)

def scan_tree(cfg, results):
    """只扫描『会被提交』的文件：已跟踪 + 未跟踪且未被 ignore。
    已 gitignore 的本地文档（AGENTS.md/deliverables 等）不进远程，不扫描。"""
    tracked = run(['git', 'ls-files']).decode('utf-8', 'replace').splitlines()
    untracked = run(['git', 'ls-files', '--others', '--exclude-standard']).decode('utf-8', 'replace').splitlines()
    for path in tracked + untracked:
        if not path:
            continue
        if ignored_file(path, cfg['ignore_files'] + DEFAULT_IGNORE):
            continue
        try:
            with open(path, 'rb') as f:
                data = f.read()
        except OSError:
            continue
        scan_bytes(data, 'tree', path, cfg, results)
        scan_text(path, 'tree-name', path, cfg, results)

def scan_all(cfg, results):
    commits = run(['git', 'rev-list', '--all']).decode('utf-8', 'replace').split()
    if not commits or commits == ['']:
        print('[audit-repo-privacy] 无提交可审计', file=sys.stderr)
        return
    seen = set()
    # commit message + author（块格式: \x1f message \x1e author|... \x1f）
    log = run(['git', 'log', '--format=%x1f%B%x1e%an|%ae|%cn|%ce%x1f', '--all'])
    parts = log.split(b'\x1f')
    blocks = parts[1::2]
    for i, blk in enumerate(blocks):
        sub = blk.split(b'\x1e')
        msg = sub[0].decode('utf-8', 'replace') if sub else ''
        scan_text(msg, 'message', f'commit#{i}', cfg, results, in_history=True)
        if len(sub) > 1:
            scan_text(sub[1].decode('utf-8', 'replace'), 'author', f'commit#{i}', cfg, results, in_history=True)
    # blobs + filenames
    for c in commits:
        tree = run(['git', 'ls-tree', '-r', '-z', c]).decode('utf-8', 'replace')
        for entry in tree.split('\x00'):
            if not entry:
                continue
            try:
                meta, path = entry.split('\t', 1)
                _mode, typ, sha = meta.split(' ')
            except ValueError:
                continue
            if typ != 'blob':
                continue
            if ignored_file(path, cfg['ignore_files'] + DEFAULT_IGNORE):
                continue
            scan_text(path, 'history-name', path, cfg, results, in_history=True)
            if sha in seen:
                continue
            seen.add(sha)
            data = run(['git', 'cat-file', 'blob', sha])
            scan_bytes(data, 'history', path, cfg, results, in_history=True)
    # 当前树也查
    scan_tree(cfg, results)

def scan_staged(cfg, results):
    names = run(['git', 'diff', '--cached', '--name-only', '-z']).decode('utf-8', 'replace').split('\x00')
    for path in names:
        if not path or ignored_file(path, cfg['ignore_files'] + DEFAULT_IGNORE):
            continue
        data = run(['git', 'show', f':{path}'])
        scan_bytes(data, 'staged', path, cfg, results)

def main():
    ap = argparse.ArgumentParser(description='仓库隐私审计')
    ap.add_argument('--scope', choices=['all', 'tree', 'staged'], default='tree')
    ap.add_argument('--json', action='store_true', help='JSON 输出')
    args = ap.parse_args()

    cfg = load_local_config()
    results = []
    if args.scope == 'all':
        scan_all(cfg, results)
    elif args.scope == 'staged':
        scan_staged(cfg, results)
    else:
        scan_tree(cfg, results)

    if args.json:
        import json as _json
        print(_json.dumps([{'cat': r[0], 'kind': r[1], 'label': r[2], 'snip': r[3]}
                           for r in results], ensure_ascii=False, indent=1))
    else:
        if not results:
            print(f'✅ 通过（--scope={args.scope}）：未发现敏感信息')
        else:
            for cat, kind, label, snip in results:
                print(f'❌ [{cat}] ({kind}) {label} :: {snip}')
            print(f'\n共 {len(results)} 处命中。')
            print('提示：请甄别真敏感 vs 误报（URL/base64/LaTeX/版本号/二进制）。')
    return 1 if results else 0

if __name__ == '__main__':
    sys.exit(main())
