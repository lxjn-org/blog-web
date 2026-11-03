import { experiences } from '../mock/experiences'

/** GET /api/experiences：返回按时间倒序的工作经历 */
export default defineEventHandler(() => ok(experiences))
