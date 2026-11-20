import { findApprovedFriendLinks } from '../../repositories/friend-link.repository'

/** GET /api/friend-links：返回已通过的友链 */
export default defineEventHandler(async () => ok(await findApprovedFriendLinks()))
