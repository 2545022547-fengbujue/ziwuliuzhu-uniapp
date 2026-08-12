import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve as pathResolve } from 'path'
import { readFileSync } from 'fs'

const root = pathResolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const abs = pathResolve(root, 'src', specifier.slice(2))
    return { url: pathToFileURL(abs).href, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}

// Node 24 要求 JSON 导入带 import attribute；此处直接以 json 格式加载 .json
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = readFileSync(new URL(url), 'utf8')
    return { format: 'json', source, shortCircuit: true }
  }
  return nextLoad(url, context)
}
