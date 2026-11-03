import { friendLinks } from '../../mock/friend-links'

/** GET /api/friend-links：返回已通过的友链 */
export default defineEventHandler(() => ok(friendLinks))
