#!/usr/bin/env node
/**
 * verify-push-safety.cjs — 推送安全校验（防隐私泄露）
 *
 * 用途：扫描「将被推送到远程仓库」的文件（git 跟踪 / 暂存区），
 * 拦截本机路径、用户名、会话 ID、密钥等敏感内容。
 *
 * 触发方式：
 *   1. .githooks/pre-commit 提交前自动运行（只扫本次暂存文件）
 *   2. 手动：node scripts/verify-push-safety.cjs（扫全部跟踪文件）
 *
 * 敏感模式设计原则：
 *   - 只匹配「高置信度」模式，避免误报（如 base64 字体文件中偶然出现的
 *     "AKID" 字符组合——因此 AKID 要求 20+ 位字母数字的真实密钥长度）
 *   - 新增敏感模式：改 SENSITIVE_PATTERNS 数组即可
 */
const { execSync } = require('child_process')

// 扫描范围：argv[2] 传 'staged' 扫暂存区（pre-commit 用），否则扫全部跟踪文件
const STAGED_ONLY = process.argv[2] === 'staged'

// 排除文件（这些是随项目发布的二进制/base64 资产，字符偶然命中属正常）
const EXCLUDE = [
  /src\/assets\/fonts\/.*base64.*\.(txt|js)$/i,
  /\.(png|jpg|jpeg|gif|webp|ttf|woff2?|ico|mp4)$/i,
  // 本校验脚本自身：其 SENSITIVE_PATTERNS 定义必然包含敏感词（如"WorkBuddyWorkspaces"/用户名），
  // 扫描自身会自伤。此文件即敏感词规则的唯一定义处，属可信文件。
  /scripts\/verify-push-safety\.cjs$/
]

// 敏感模式：{ name, regex }（命中即拦截）
const SENSITIVE_PATTERNS = [
  // 本机绝对路径（Windows 盘符 + Users/WorkBuddyWorkspaces，及 Git Bash 盘符写法）
  { name: '本机绝对路径(Windows)', regex: /[A-Za-z]:[\\/](Users|WorkBuddyWorkspaces|Program\s?Files|Windows|npm-global|PythonSystem|Nodejs)/i },
  { name: '本机绝对路径(GitBash)', regex: /[\\/][A-Za-z]:[\\/]|\/d\/WorkBuddyWorkspaces|\/c\/Users\//i },
  { name: '本机工作区目录名', regex: /WorkBuddyWorkspaces/i },
  // 本机用户名
  { name: '本机用户名', regex: /黄文路|huangwenlu|huangwl/i },
  // AI 会话 ID（历史交接文档常见）
  { name: 'AI会话ID', regex: /codex:\/\/threads|threads\/[0-9a-f]{8,}/i },
  // 云厂商密钥（严格长度，避免 base64 误报）
  { name: '腾讯云AKID密钥', regex: /AKID[A-Za-z0-9]{20,}/ },
  // AppSecret / 各种密钥值
  { name: 'AppSecret', regex: /app\s?secret\s*[:=]\s*["']?[A-Za-z0-9]{16,}/i },
  { name: '私钥块', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  // 访问令牌（长短组合，避免误报）
  { name: '访问令牌', regex: /(ghp|github_pat_|glpat-|xox[baprs]-)[A-Za-z0-9_-]{10,}/ },
  // 临时签名 URL（腾讯云 COS 带 q-signature 的完整链接）
  { name: 'COS临时签名链接', regex: /q-sign-algorithm=sha1&[^"\s]{30,}/ }
]

function getFiles() {
  if (STAGED_ONLY) {
    // pre-commit：本次暂存文件
    return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(Boolean)
  }
  // 全量：所有被 git 跟踪的文件
  return execSync('git ls-files', { encoding: 'utf8' })
    .split('\n').map(s => s.trim()).filter(Boolean)
}

function isExcluded(file) {
  return EXCLUDE.some(re => re.test(file))
}

function main() {
  const files = getFiles()
  const hits = []
  for (const file of files) {
    if (isExcluded(file)) continue
    let content
    try {
      content = require('fs').readFileSync(file, 'utf8')
    } catch {
      continue // 二进制或不可读
    }
    for (const { name, regex } of SENSITIVE_PATTERNS) {
      for (const m of content.matchAll(new RegExp(regex, 'gi'))) {
        // 内容级排除：npm package-lock 的 "integrity" 行是 base64 hash，
        // 其中随机出现 gh*/GHP/ghP 等字符组合属正常（非 GitHub token）
        const lineStart = content.lastIndexOf('\n', m.index) + 1
        const lineEnd = content.indexOf('\n', m.index)
        const line = content.slice(lineStart, lineEnd < 0 ? undefined : lineEnd)
        if (/integrity/.test(line)) continue
        const lineNo = content.slice(0, m.index).split('\n').length
        hits.push({ file, lineNo, name, snippet: m[0].slice(0, 60) })
      }
    }
  }

  if (hits.length > 0) {
    console.error(`\n❌ 推送安全校验未通过：发现 ${hits.length} 处敏感内容（可能泄露本机路径/身份/密钥）：\n`)
    for (const h of hits) {
      console.error(`  [${h.name}] ${h.file}:${h.lineNo}  → ${h.snippet}…`)
    }
    console.error(`
处理方式：
  1. 本机路径 → 改为相对定位（如 os.path.dirname(__file__)、$(dirname "$0")、env 变量）
  2. 确认是误报 → 在 scripts/verify-push-safety.cjs 的 EXCLUDE 或 SENSITIVE_PATTERNS 中处理
  3. 确认不应推送 → 加入 .gitignore 并 git rm --cached
`)
    process.exit(1)
  }
  const scope = STAGED_ONLY ? `暂存区 ${files.length} 个文件` : `全部 ${files.length} 个跟踪文件`
  console.log(`✅ 推送安全校验通过（${scope}，零敏感内容）`)
}

main()
