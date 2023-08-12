import fs from 'fs'
import path from 'path'
import { OUT_DIR, asyncReadFile } from './index.js'

/**
 * 将页面内容写入文件
 * 先将整个目录清空，再将页面内容写入文件
 * @param pageList 页面列表
 */
export async function generatorPage(pageList) {
  clearOutDir()
  pageList.forEach(page => {
    generatorSinglePage(page)
  })
}

/**
 * 单独生成一个页面
 * 从page.routerAddress中提取出目录和文件名：/about/index.html => /about 和 index.html
 * @param page 页面
 */
export async function generatorSinglePage(page) {
  const pageDir = path.join(OUT_DIR, path.dirname(page.routerAddress))
  const pageFile = path.basename(page.routerAddress) + ('.html')
  checkAndMkdir(pageDir)
  fs.writeFileSync(path.join(pageDir, pageFile), page.content)
}

/**
 * 清空`OUT_DIR`目录
 */
export function clearOutDir() {
  if (checkAndMkdir(OUT_DIR)) {
    fs.rmdirSync(OUT_DIR, { recursive: true })
  }
}

/**
 * 清除指定文件
 */
export function clearFile(filePath) {
  if (checkAndMkdir(OUT_DIR)) {
    fs.unlinkSync(path.join(OUT_DIR, `${filePath}.html`))
  }
}

/**
 * 公共方法，检查是否存在目录，不存在则创建目录
 * @param dirname 目录名
 * @returns
 */
export function checkAndMkdir(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (checkAndMkdir(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

// 从文件中读取模板
export async function loadFromFile(filePath) {
  const paths = path.join(".", filePath)
  const templateFiles = await asyncReadFile(paths, 'utf-8')
  return templateFiles
}
