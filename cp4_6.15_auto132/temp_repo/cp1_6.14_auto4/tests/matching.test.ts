/**
 * 智能匹配算法单元测试
 *
 * 覆盖范围：
 * 1. 位置匹配优先策略 - 根据位置缺口大小排序
 * 2. 段位匹配优先策略 - 根据段位接近度排序
 * 3. 综合权重排序算法 - 位置权重60% + 段位权重40%
 * 4. 排除逻辑 - 创建者和已报名用户不出现在推荐中
 * 5. 推荐理由生成 - 中文理由字符串的正确性
 * 6. 空赛事推荐 - 无报名时位置均衡分布
 * 7. 满员赛事处理 - 人数达到上限返回空
 * 8. 候选池边界情况 - 候选不足时正确返回
 */

import { describe, it, expect } from 'vitest'
import { recommendUsers } from '../api/utils/matching'
import { User, Match, POSITION_REQUIREMENTS } from '../shared/types'

describe('位置匹配优先', () => {
  it('5v5赛事后卫缺口最大时后卫应排名最高', () => {
    const enrolledForward1: User = { id: 'f1', name: '前锋1', position: '前锋', skillLevel: '进阶' }
    const enrolledForward2: User = { id: 'f2', name: '前锋2', position: '前锋', skillLevel: '进阶' }
    const enrolledCenter: User = { id: 'c1', name: '中锋1', position: '中锋', skillLevel: '进阶' }

    const candidateGuard1: User = { id: 'g3', name: '后卫3', position: '后卫', skillLevel: '进阶' }
    const candidateGuard2: User = { id: 'g4', name: '后卫4', position: '后卫', skillLevel: '进阶' }
    const candidateForward3: User = { id: 'f3', name: '前锋3', position: '前锋', skillLevel: '进阶' }
    const candidateForward4: User = { id: 'f4', name: '前锋4', position: '前锋', skillLevel: '进阶' }
    const candidateCenter2: User = { id: 'c2', name: '中锋2', position: '中锋', skillLevel: '进阶' }
    const candidateCenter3: User = { id: 'c3', name: '中锋3', position: '中锋', skillLevel: '进阶' }

    const match: Match = {
      id: 'm1',
      title: '5v5测试赛',
      matchType: '5v5',
      creatorId: 'creator',
      enrolledUserIds: [enrolledForward1.id, enrolledForward2.id, enrolledCenter.id],
    }

    const allUsers: User[] = [
      enrolledForward1, enrolledForward2, enrolledCenter,
      candidateGuard1, candidateGuard2,
      candidateForward3, candidateForward4,
      candidateCenter2, candidateCenter3,
    ]

    const result = recommendUsers(match, allUsers)

    expect(result.length).toBe(6)
    expect(result[0].user.position).toBe('后卫')
    expect(result[1].user.position).toBe('后卫')
    expect(result[0].score).toBeGreaterThan(result[2].score)
  })
})

describe('段位匹配优先', () => {
  it('3v3赛事已有3名进阶，进阶段位候选应排名最高', () => {
    const enrolled1: User = { id: 'e1', name: '队员1', position: '前锋', skillLevel: '进阶' }
    const enrolled2: User = { id: 'e2', name: '队员2', position: '中锋', skillLevel: '进阶' }
    const enrolled3: User = { id: 'e3', name: '队员3', position: '后卫', skillLevel: '进阶' }

    const candidateRookie: User = { id: 'r1', name: '新人后卫', position: '后卫', skillLevel: '新人' }
    const candidateAdvanced: User = { id: 'a1', name: '进阶后卫', position: '后卫', skillLevel: '进阶' }
    const candidateExpert: User = { id: 'ex1', name: '高手后卫', position: '后卫', skillLevel: '高手' }

    const match: Match = {
      id: 'm2',
      title: '3v3测试赛',
      matchType: '3v3',
      creatorId: 'creator',
      enrolledUserIds: [enrolled1.id, enrolled2.id, enrolled3.id],
    }

    const allUsers: User[] = [enrolled1, enrolled2, enrolled3, candidateRookie, candidateAdvanced, candidateExpert]

    const result = recommendUsers(match, allUsers)

    expect(result.length).toBe(3)
    expect(result[0].user.id).toBe(candidateAdvanced.id)
    expect(result[0].score).toBeGreaterThan(result[1].score)
    expect(result[0].score).toBeGreaterThan(result[2].score)
  })
})

describe('综合权重排序', () => {
  it('候选A(中锋+高手)与候选B(后卫+进阶)评分和理由应合理', () => {
    const enrolledForward: User = { id: 'ef', name: '已有前锋', position: '前锋', skillLevel: '进阶' }

    const candidateA: User = { id: 'ca', name: '候选A', position: '中锋', skillLevel: '高手' }
    const candidateB: User = { id: 'cb', name: '候选B', position: '后卫', skillLevel: '进阶' }

    const match: Match = {
      id: 'm3',
      title: '综合权重测试赛',
      matchType: '3v3',
      creatorId: 'creator',
      enrolledUserIds: [enrolledForward.id],
    }

    const allUsers: User[] = [enrolledForward, candidateA, candidateB]

    const result = recommendUsers(match, allUsers)

    expect(result.length).toBe(2)

    const resultA = result.find((r) => r.user.id === candidateA.id)!
    const resultB = result.find((r) => r.user.id === candidateB.id)!

    expect(resultA.score).toBeGreaterThan(0)
    expect(resultB.score).toBeGreaterThan(0)
    expect(resultA.reasons.length).toBeGreaterThanOrEqual(1)
    expect(resultB.reasons.length).toBeGreaterThanOrEqual(1)

    resultA.reasons.forEach((r) => expect(r).toMatch(/[\u4e00-\u9fa5]/))
    resultB.reasons.forEach((r) => expect(r).toMatch(/[\u4e00-\u9fa5]/))

    expect(resultA.score).toBeGreaterThan(resultB.score)
  })
})

describe('排除已报名和创建者', () => {
  it('创建者和已报名人员不应出现在推荐结果中', () => {
    const creator: User = { id: 'creator1', name: '创建者', position: '前锋', skillLevel: '进阶' }
    const enrolled1: User = { id: 'enrolled1', name: '已报名1', position: '中锋', skillLevel: '进阶' }
    const enrolled2: User = { id: 'enrolled2', name: '已报名2', position: '后卫', skillLevel: '进阶' }

    const candidate1: User = { id: 'can1', name: '候选1', position: '前锋', skillLevel: '新人' }
    const candidate2: User = { id: 'can2', name: '候选2', position: '后卫', skillLevel: '高手' }

    const match: Match = {
      id: 'm4',
      title: '排除测试赛',
      matchType: '5v5',
      creatorId: creator.id,
      enrolledUserIds: [enrolled1.id, enrolled2.id],
    }

    const allUsers: User[] = [creator, enrolled1, enrolled2, candidate1, candidate2]

    const result = recommendUsers(match, allUsers)

    const resultIds = result.map((r) => r.user.id)
    expect(resultIds).not.toContain(creator.id)
    expect(resultIds).not.toContain(enrolled1.id)
    expect(resultIds).not.toContain(enrolled2.id)
    expect(resultIds).toContain(candidate1.id)
    expect(resultIds).toContain(candidate2.id)
  })
})

describe('理由展示', () => {
  it('推荐结果的reasons数组至少包含1条中文理由', () => {
    const enrolled: User = { id: 'enr', name: '已报名', position: '前锋', skillLevel: '进阶' }
    const candidate1: User = { id: 'c1', name: '候选1', position: '后卫', skillLevel: '进阶' }
    const candidate2: User = { id: 'c2', name: '候选2', position: '中锋', skillLevel: '高手' }

    const match: Match = {
      id: 'm5',
      title: '理由测试赛',
      matchType: '3v3',
      creatorId: 'creator',
      enrolledUserIds: [enrolled.id],
    }

    const allUsers: User[] = [enrolled, candidate1, candidate2]

    const result = recommendUsers(match, allUsers)

    expect(result.length).toBeGreaterThan(0)
    result.forEach((r) => {
      expect(r.reasons.length).toBeGreaterThanOrEqual(1)
      r.reasons.forEach((reason) => {
        expect(typeof reason).toBe('string')
        expect(reason.length).toBeGreaterThan(0)
        expect(reason).toMatch(/[\u4e00-\u9fa5]/)
      })
    })
  })
})

describe('空赛事推荐', () => {
  it('无任何报名的新赛事推荐结果应均衡分布各位置', () => {
    const match: Match = {
      id: 'm6',
      title: '空赛事',
      matchType: '3v3',
      creatorId: 'creator-outside',
      enrolledUserIds: [],
    }

    const candidateF1: User = { id: 'f1', name: '前锋1', position: '前锋', skillLevel: '进阶' }
    const candidateF2: User = { id: 'f2', name: '前锋2', position: '前锋', skillLevel: '进阶' }
    const candidateC1: User = { id: 'c1', name: '中锋1', position: '中锋', skillLevel: '进阶' }
    const candidateC2: User = { id: 'c2', name: '中锋2', position: '中锋', skillLevel: '进阶' }
    const candidateG1: User = { id: 'g1', name: '后卫1', position: '后卫', skillLevel: '进阶' }
    const candidateG2: User = { id: 'g2', name: '后卫2', position: '后卫', skillLevel: '进阶' }

    const allUsers: User[] = [candidateF1, candidateF2, candidateC1, candidateC2, candidateG1, candidateG2]

    const result = recommendUsers(match, allUsers, 6)

    expect(result.length).toBe(6)

    const positions = result.map((r) => r.user.position)
    const forwardCount = positions.filter((p) => p === '前锋').length
    const centerCount = positions.filter((p) => p === '中锋').length
    const guardCount = positions.filter((p) => p === '后卫').length

    expect(forwardCount).toBeGreaterThanOrEqual(1)
    expect(centerCount).toBeGreaterThanOrEqual(1)
    expect(guardCount).toBeGreaterThanOrEqual(1)

    const scores = result.map((r) => r.score)
    const allSame = scores.every((s) => Math.abs(s - scores[0]) < 0.001)
    expect(allSame).toBe(true)
  })
})

describe('满员赛事', () => {
  it('3v3已有6人报名推荐结果应为空数组', () => {
    const enrolledUsers: User[] = Array.from({ length: 6 }, (_, i) => ({
      id: `enrolled-${i}`,
      name: `队员${i + 1}`,
      position: (['前锋', '中锋', '后卫'] as const)[i % 3],
      skillLevel: '进阶',
    }))

    const candidates: User[] = Array.from({ length: 3 }, (_, i) => ({
      id: `candidate-${i}`,
      name: `候选${i + 1}`,
      position: (['前锋', '中锋', '后卫'] as const)[i % 3],
      skillLevel: '高手',
    }))

    const match: Match = {
      id: 'm7',
      title: '满员赛事',
      matchType: '3v3',
      creatorId: 'creator',
      enrolledUserIds: enrolledUsers.map((u) => u.id),
    }

    const allUsers: User[] = [...enrolledUsers, ...candidates]

    const result = recommendUsers(match, allUsers)

    expect(result).toEqual([])
    expect(result.length).toBe(0)
  })
})

describe('候选池不足', () => {
  it('候选池只有2人时返回2条且排序正确', () => {
    const enrolled: User = { id: 'enr', name: '已报名前锋', position: '前锋', skillLevel: '进阶' }

    const candidateBetter: User = { id: 'cb', name: '优先后卫', position: '后卫', skillLevel: '进阶' }
    const candidateWorse: User = { id: 'cw', name: '次优前锋', position: '前锋', skillLevel: '新人' }

    const match: Match = {
      id: 'm8',
      title: '候选不足赛事',
      matchType: '3v3',
      creatorId: 'creator',
      enrolledUserIds: [enrolled.id],
    }

    const allUsers: User[] = [enrolled, candidateBetter, candidateWorse]

    const result = recommendUsers(match, allUsers, 10)

    expect(result.length).toBe(2)
    expect(result[0].user.id).toBe(candidateBetter.id)
    expect(result[1].user.id).toBe(candidateWorse.id)
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })
})
