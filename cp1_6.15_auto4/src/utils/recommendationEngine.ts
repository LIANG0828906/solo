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

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const sm = memberSkillMap.get(member.id)!;

    let skillOverlapScore = 0;
    const matchedSkills: string[] = [];

    if (hasRequired) {
      let requiredPart = 0;
      for (let j = 0; j < requiredSkills.length; j++) {
        const prof = sm.get(requiredSkills[j]);
        if (prof !== undefined) {
          requiredPart += prof / 5;
          matchedSkills.push(requiredSkills[j]);
        }
      }
      requiredPart /= requiredSkills.length;

      let bonusPart = 0;
      if (hasBonus) {
        for (let j = 0; j < bonusSkills.length; j++) {
          const prof = sm.get(bonusSkills[j]);
          if (prof !== undefined) {
            bonusPart += prof / 5;
            matchedSkills.push(bonusSkills[j]);
          }
        }
        bonusPart = (bonusPart / bonusSkills.length) * 0.3;
      }

      skillOverlapScore = (requiredPart + bonusPart) * 100;
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
