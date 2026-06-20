import type { PetStats, StatKey, AnimationType } from '../data/PetState';

export type SkillId = 'dance' | 'roll' | 'sing';

export interface Skill {
  id: SkillId;
  name: string;
  icon: string;
  unlockThreshold: { stat: StatKey; value: number };
  duration: number;
  animationType: AnimationType;
}

export const SKILLS: Skill[] = [
  {
    id: 'dance',
    name: '跳舞',
    icon: '💃',
    unlockThreshold: { stat: 'happiness', value: 80 },
    duration: 1500,
    animationType: 'dance',
  },
  {
    id: 'roll',
    name: '翻滚',
    icon: '🔄',
    unlockThreshold: { stat: 'cleanliness', value: 80 },
    duration: 1200,
    animationType: 'roll',
  },
  {
    id: 'sing',
    name: '唱歌',
    icon: '🎵',
    unlockThreshold: { stat: 'hunger', value: 80 },
    duration: 1800,
    animationType: 'sing',
  },
];

export function getSkillById(id: SkillId): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function checkSkillUnlock(
  stats: PetStats,
  learnedSkills: SkillId[]
): Skill | null {
  for (const skill of SKILLS) {
    if (learnedSkills.includes(skill.id)) continue;
    const statValue = stats[skill.unlockThreshold.stat];
    if (statValue >= skill.unlockThreshold.value) {
      return skill;
    }
  }
  return null;
}
