import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveConfigPath } from '../database/config'
import { maintainDatabase, reloadDatabase, shutdownDatabase, watchDbConfig } from '../database/manager'
import { formatVersion, readWebVersion } from '../database/version'

const defaultBanner = String.raw` __        __
/  |      /  |
$$ |____  $$ |  ______    ______
$$      \ $$ | /      \  /      \
$$$$$$$  |$$ |/$$$$$$  |/$$$$$$  |
$$ |  $$ |$$ |$$ |  $$ |$$ |  $$ |
$$ |__$$ |$$ |$$ \__$$ |$$ \__$$ |
$$    $$/ $$ |$$    $$/ $$    $$ |
$$$$$$$/  $$/  $$$$$$/   $$$$$$$ |
                        /  \__$$ |
                        $$    $$/
                         $$$$$$/`

/** 读取自定义横幅，缺失、空白或读取失败时交由调用方使用默认横幅。 */
async function readCustomBanner(): Promise<string | undefined> {
  const configuredPath = useRuntimeConfig().bannerPath.trim()
  const filename = resolve(configuredPath || 'banner.txt')
  try {
    const content = (await readFile(filename, 'utf8'))
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/^\n+|\n+$/g, '')
    return content.trim() ? content : undefined
  }
  catch (error) {
    if (configuredPath || (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[web] 无法读取自定义启动横幅，使用默认横幅：', (error as Error).message)
    }
    return undefined
  }
}

/** 输出启动横幅和应用版本。 */
async function printStartupBanner() {
  let webVersion = 'unknown'
  try {
    webVersion = formatVersion(await readWebVersion()).slice(1)
  }
  catch (error) {
    console.warn('[web] 无法读取用户端版本：', (error as Error).message)
  }
  const customBanner = await readCustomBanner()
  const indent = '    '
  const content = customBanner ?? (indent + defaultBanner.replaceAll('\n', '\n' + indent))
  // 用零宽字符保留首行缩进，避免控制台裁剪输出开头的空白。
  process.stdout.write(`\n\u200B${content}\n\n${indent}The application has been launched successfully. Version ${webVersion}\n\n`)
}

/**
 * 启动时连接数据库并定期检查连接与版本，服务关闭时释放监听和连接。
 */
export default defineNitroPlugin((nitroApp) => {
  // 监听 data/data.config，内容变化后自动重连
  watchDbConfig(resolveConfigPath())

  // 先打印横幅再连接数据库，两步均在后台执行。
  void printStartupBanner().then(reloadDatabase)
  const maintenanceTimer = setInterval(maintainDatabase, 10_000)
  maintenanceTimer.unref()

  // 服务关闭时释放连接与文件监听
  nitroApp.hooks.hook('close', () => {
    clearInterval(maintenanceTimer)
    return shutdownDatabase()
  })
})
