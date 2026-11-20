/** 技术栈数据访问 */
import { getDb } from '../database/manager'

/**
 * 读取所有技术栈分组及条目，按分组排序、每组内按条目排序
 */
export async function findSkillGroups() {
  const groups = await getDb()
    .selectFrom('skill_group')
    .select(['id', 'name', 'sort_order'])
    .orderBy('sort_order')
    .orderBy('id')
    .execute()

  const skills = await getDb()
    .selectFrom('skill')
    .select(['id', 'group_id', 'name', 'mark', 'level'])
    .orderBy('sort_order')
    .orderBy('id')
    .execute()

  // 按 group_id 将技能分组
  const skillsByGroup = new Map<number, typeof skills>()
  skills.forEach(skill => {
    if (!skillsByGroup.has(skill.group_id)) {
      skillsByGroup.set(skill.group_id, [])
    }
    skillsByGroup.get(skill.group_id)!.push(skill)
  })

  return groups.map(group => ({
    group: group.name,
    items: (skillsByGroup.get(group.id) ?? []).map(skill => ({
      name: skill.name,
      mark: skill.mark,
      level: skill.level as 'main' | 'familiar',
    })),
  }))
}

/**
 * 读取首页要显示的技能（home_sort 不为空），按 home_sort 升序，最多 8 个
 */
export async function findHomeSkills() {
  const skills = await getDb()
    .selectFrom('skill')
    .select(['name', 'mark', 'home_category'])
    .where('home_sort', 'is not', null)
    .orderBy('home_sort')
    .limit(8)
    .execute()

  return skills.map(skill => ({
    name: skill.name,
    mark: skill.mark,
    category: skill.home_category,
  }))
}
