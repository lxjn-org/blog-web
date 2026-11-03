import { profile } from '../mock/profile'

/** GET /api/profile：返回个人资料与可见的联系方式 */
export default defineEventHandler(() => ok(profile))
