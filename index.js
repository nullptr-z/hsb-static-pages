import handlebars from 'handlebars'
import fs from 'fs'
import path from 'path';
import { env } from 'process'
import { checkAndMkdir, clearOutDir, loadFromFile } from './build.js';
import fsExtra from 'fs-extra';
import { promisify } from 'util';

export const asyncReadDir = promisify(fs.readdir);
export const asyncReadFile = promisify(fs.readFile);
export const asyncWriteFile = promisify(fs.writeFile);
export const asyncCopyFile = promisify(fs.copyFile);

export const OUT_DIR = env.OUT_DIR || 'dist'
const STATIC_DIR = env.STATIC_DIR || "static";
export const MAIN = env.MAIN || "src";
export const PAGES = env.PAGES || "src/pages";
// const COMPONENTS_DIR = env.STATIC_DIR || "pages/components"

// 编译layout
async function buildPages() {
  // 编译layout模板
  const layoutDir = `${MAIN}/layout`
  const [indexTemp, headerTemp, footerTemp] = await Promise.all([
    loadFromFile("index.hbs"),
    loadFromFile(path.join(layoutDir, "header.hbs")),
    loadFromFile(path.join(layoutDir, "footer.hbs"))
  ])
  const compileResult = handlebars.compile(indexTemp)
  const compileHeader = handlebars.compile(headerTemp)
  const compileFooter = handlebars.compile(footerTemp)

  // src/pages 目录下的所有文件
  iteratorPages(PAGES, (pageTemp, route) => {
    const compilePage = handlebars.compile(pageTemp)
    const page = compileResult({ main: compilePage(), header: compileHeader, footer: compileFooter })
    if (route === 'home/index') {
      route = 'index'
    }
    const outdir = `${path.join(OUT_DIR, route)}.html`
    checkAndMkdir(path.dirname(outdir))
    asyncWriteFile(outdir, page)
  })
}

// 根据文件目录创建路由
function iteratorPages(prePath, callback) {
  const pages = fs.readdirSync(prePath)
  pages.forEach(async (page) => {
    const pagePath = path.join(prePath, page)
    const stat = fs.statSync(pagePath)
    if (stat.isDirectory()) {
      iteratorPages(pagePath, callback)
    } else {
      if (!pagePath.endsWith('.hbs')) return
      const route = path.relative(PAGES, pagePath).replace(/\.hbs$/, '')
      const main = await loadFromFile(pagePath)
      callback(main, route)
    }
  })
}

// 注册组件
async function registerComponent(COMPONENTS_DIR) {
  const components = await asyncReadDir(COMPONENTS_DIR);
  // todo: 批量注册
  components.forEach(async (component) => {
    if (!component.endsWith('.hbs')) return
    const componentName = path.basename(component, ".hbs");
    const componentPath = path.join(COMPONENTS_DIR, component);
    const componentTemp = await loadFromFile(componentPath);
    handlebars.registerPartial(componentName, componentTemp);
  })
}

// 处理CSS，把src目录下所有css文件,追加写入到dist/styles.css
async function buildStyles(pagesDir) {
  const pages = await asyncReadDir(pagesDir);
  const cssFiles = pages.filter(page => path.extname(page) === ".css");
  // 处理是否是文件夹，如果是文件夹，递归遍历
  for (const page of pages) {
    const pagePath = path.join(pagesDir, page);
    fs.stat(pagePath, (err, status) => {
      if (status.isDirectory()) {
        buildStyles(pagePath);
      }
    })
  }
  // 处理css文件
  for (const cssFile of cssFiles) {
    const cssPath = path.join(pagesDir, cssFile);
    const cssStat = await asyncReadFile(cssPath);
    // 追加吸入，阻塞IO以免覆写
    fs.appendFileSync(`${OUT_DIR}/styles.css`, cssStat);
  }

}

// 处理静态资源
function buildStatic() {
  const outDir = path.join(OUT_DIR, STATIC_DIR);
  fsExtra.copySync(STATIC_DIR, outDir);
  // 创建styles.css
  fsExtra.copySync("global.css", `${OUT_DIR}/styles.css`)
}

// 清理文件
clearOutDir()
// 创建dist目录
checkAndMkdir(OUT_DIR)
// 处理静态资源
buildStatic()
// 处理css
buildStyles(`${MAIN}`)

handlebars.registerHelper("Tabs", (option) => {
  const tabs = option.hash.data?.split(',');
  let result = ''
  tabs?.forEach((tab, i) => {
    result += `<div class="component-tab"  onclick="openTab('tab${i}')">${tab}</div>`
  })
  return result
})
// todo: 注册一定要完成后再编译页面，否则会找不到组件
await registerComponent(`${MAIN}/components`)
// // 编译界面
buildPages()

