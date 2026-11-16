import { resolveConfigPath } from '../database/config'
import { reloadDatabase, shutdownDatabase, watchDbConfig } from '../database/manager'

/**
 * 数据库生命周期：启动时建立首次连接并监听配置文件，服务关闭时释放连接。
 * 连接失败不阻塞启动——由维护页中间件兜底，manager 会在后台按间隔自动重试。
 */
export default defineNitroPlugin((nitroApp) => {
  // 监听 data/data.config，内容变化后自动重连
  watchDbConfig(resolveConfigPath())

  // 建立首次连接（不 await：连接超时不应拖慢服务启动）
  void reloadDatabase()

  // 服务关闭时释放连接与文件监听
  nitroApp.hooks.hook('close', () => {
    void shutdownDatabase()
  })
})
