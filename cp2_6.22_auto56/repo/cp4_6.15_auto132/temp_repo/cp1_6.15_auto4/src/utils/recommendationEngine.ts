export interface Skill {
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
}

export interface Member {
  id: string;
  name: string;
  skills: Skill[];
}

export interface Collaboration {
  memberIdA: string;
  memberIdB: string;
  projectCount: number;
  lastDate: string;
}

export interface RecommendationResult {
  member: Member;
  score: number;
  skillOverlapScore: number;
  collaborationScore: number;
  matchedSkills: string[];
}

export function calculateRecommendations(
  members: Member[],
  collaborations: Collaboration[],
  requiredSkills: string[],
  bonusSkills: string[]
): RecommendationResult[] {
  if (members.length === 0) return [];

  const memberSkillMap = new Map<string, Map<string, number>>();
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const sm = new Map<string, number>();
    for (let j = 0; j < m.skills.length; j++) {
      sm.set(m.skills[j].name, m.skills[j].proficiency);
    }
    memberSkillMap.set(m.id, sm);
  }

  const collabSumMap = new Map<string, number>();
  for (let i = 0; i < collaborations.length; i++) {
    const c = collaborations[i];
    collabSumMap.set(c.memberIdA, (collabSumMap.get(c.memberIdA) ?? 0) + c.projectCount);
    collabSumMap.set(c.memberIdB, (collabSumMap.get(c.memberIdB) ?? 0) + c.projectCount);
  }

  let maxCollabSum = 0;
  for (const v of collabSumMap.values()) {
    if (v > maxCollabSum) maxCollabSum = v;
  }

  const hasRequired = requiredSkills.length > 0;
  const hasBonus = bonusSkills.length > 0;

  const results: RecommendationResult[] = new Array(members.length);

  /**
   * 匹配度算法权重说明（与需求完全一致）：
   * 
   * ┌──────────────────────────────────────────────────────────┐
   * │ 最终得分 = 技能重叠得分 × 60% + 协作历史得分 × 40%        │
   * └──────────────────────────────────────────────────────────┘
   * 
   * 一、技能重叠得分（skillOverlapScore，范围 0-100）
   *    内部归一化逻辑（不影响外部 60/40 比例）：
   *    - 必需技能：完全满足 = 1.0，按熟练度加权（proficiency/5）
   *    - 加分技能：相对必需技能权重为 0.3（即满足所有加分技能
   *      额外贡献 0.3，相当于必需技能的 30% 权重）
   *    - 归一化分母 internalMax = 1.0 + (有加分技能 ? 0.3 : 0)
   *    - 公式：(必需技能得分 + 加分技能得分 × 0.3) / internalMax × 100
   * 
   *    例：全必需 + 无加分 → (1.0 + 0) / 1.0 × 100 = 100
   *        全必需 + 全加分 → (1.0 + 0.3) / 1.3 × 100 ≈ 100
   *        半必需 + 无加分 → (0.5 + 0) / 1.0 × 100 = 50
   * 
   * 二、协作历史得分（collaborationScore，范围 0-100）
   *    - 该成员所有协作记录的 projectCount 求和
   *    - 归一化：除以所有成员中的最大协作项目数，× 100
   * 
   * 注意：0.3 是技能重叠内部的子权重系数，与外部 60/40 权重比例无关，
   *      不改变最终得分中技能重叠占 60%、协作历史占 40% 的整体比例。
   */

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const sm = memberSkillMap.get(member.id)!;

    let skillOverlapScore = 0;
    const matchedSkills: string[] = [];

    if (hasRequired) {
      let requiredSum = 0;
      for (let j = 0; j < requiredSkills.length; j++) {
        const prof = sm.get(requiredSkills[j]);
        if (prof !== undefined) {
          requiredSum += prof / 5;
          matchedSkills.push(requiredSkills[j]);
        }
      }
      const normalizedRequired = requiredSum / requiredSkills.length;

      let bonusSum = 0;
      if (hasBonus) {
        for (let j = 0; j < bonusSkills.length; j++) {
          const prof = sm.get(bonusSkills[j]);
          if (prof !== undefined) {
            bonusSum += prof / 5;
            matchedSkills.push(bonusSkills[j]);
          }
        }
      }
      const normalizedBonus = (bonusSum / Math.max(1, bonusSkills.length)) * 0.3;

      const internalMax = 1.0 + (hasBonus ? 0.3 : 0);
      skillOverlapScore = ((normalizedRequired + normalizedBonus) / internalMax) * 100;
    }

    const collabSum = collabSumMap.get(member.id) ?? 0;
    const collaborationScore = maxCollabSum > 0 ? (collabSum / maxCollabSum) * 100 : 0;

    const score = skillOverlapScore * 0.6 + collaborationScore * 0.4;

    results[i] = {
      member,
      score,
      skillOverlapScore,
      collaborationScore,
      matchedSkills,
    };
  }

  results.sort((a, b) => b.score - a.score);

  return results;
}
