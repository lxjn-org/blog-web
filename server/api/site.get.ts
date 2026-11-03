import { site } from '../mock/site'

/** GET /api/site：返回站点公开配置 */
export default defineEventHandler(() => ok(site))
