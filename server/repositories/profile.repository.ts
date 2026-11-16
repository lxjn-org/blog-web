/** 个人资料、联系方式、技术栈、工作经历的数据访问 */
import { getDb } from '../database/manager'

/** 读取个人资料（单行，id = 1），不存在时返回 undefined */
export function findProfile() {
  return getDb()
    .selectFrom('profile')
    .select(['name', 'title', 'avatar', 'city', 'career_start_year', 'home_intro', 'about_md'])
    .where('id', '=', 1)
    .executeTakeFirst()
}

/** 读取公开的联系方式，按后台排序 */
export function findVisibleContacts() {
  return getDb()
    .selectFrom('contact')
    .select(['type', 'label', 'value'])
    .where('visible', '=', 1)
    .orderBy('sort_order')
    .orderBy('id')
    .execute()
}

/** 读取全部技术栈条目及所属分组名，按分组顺序、组内顺序排列 */
export function findSkillsWithGroup() {
  return getDb()
    .selectFrom('skill')
    .innerJoin('skill_group', 'skill_group.id', 'skill.group_id')
    .select([
      'skill_group.id as group_id',
      'skill_group.name as group_name',
      'skill.name',
      'skill.mark',
      'skill.level',
    ])
    .orderBy('skill_group.sort_order')
    .orderBy('skill_group.id')
    .orderBy('skill.sort_order')
    .orderBy('skill.id')
    .execute()
}

/**
 * 读取首页展示的技术栈（home_sort 不为空），按 home_sort 排序。
 * @param limit 最多返回条数
 */
export function findHomeSkills(limit: number) {
  return getDb()
    .selectFrom('skill')
    .select(['name', 'mark', 'home_category'])
    .where('home_sort', 'is not', null)
    .orderBy('home_sort')
    .orderBy('id')
    .limit(limit)
    .execute()
}

/** 读取全部工作经历，按开始月份倒序 */
export function findExperiences() {
  return getDb()
    .selectFrom('experience')
    .select(['id', 'company', 'role', 'start_month', 'end_month', 'items', 'tags'])
    .orderBy('start_month', 'desc')
    .orderBy('id', 'desc')
    .execute()
}
