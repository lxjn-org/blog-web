/** 用户信息数据访问 */
import { getDb } from '../database/manager'

/**
 * 读取用户信息（包含联系方式）
 * profile 表中 id 固定为 1，返回该行及其关联的所有联系方式
 */
export async function getUserProfile() {
  // 查询 profile 表
  const profile = await getDb()
    .selectFrom('profile')
    .select([
      'id',
      'name',
      'title',
      'avatar',
      'city',
      'career_start_year',
      'home_intro',
      'about_md',
      'updated_at',
    ])
    .where('id', '=', 1)
    .executeTakeFirst()

  if (!profile) return null

  // 查询联系方式
  const contacts = await getDb()
    .selectFrom('contact')
    .select(['type', 'label', 'value', 'visible', 'sort_order'])
    .where('visible', '=', 1)
    .orderBy('sort_order')
    .orderBy('id')
    .execute()

  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    avatar: profile.avatar,
    city: profile.city,
    years: profile.career_start_year === null ? 0 : new Date().getFullYear() - profile.career_start_year,
    homeIntro: profile.home_intro,
    aboutMd: profile.about_md,
    contacts: contacts.map(c => ({
      type: c.type,
      label: c.label,
      value: c.value,
    })),
    updatedAt: profile.updated_at,
  }
}
