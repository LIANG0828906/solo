export type SkillType = 'normal' | 'fire' | 'ice';

export interface Skill {
  name: string;
  damage: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  type: SkillType;
}

export interface FrameInfo {
  skillIndex: number;
  localFrame: number;
  phase: 'startup' | 'active' | 'recovery';
  phaseFrame: number;
  phaseTotalFrames: number;
}

export interface DamageResult {
  totalDamage: number;
  currentDamage: number;
  comboCount: number;
  dps: number;
}

export function createDefaultSkill(): Skill {
  return {
    name: '普通攻击',
    damage: 35,
    startupFrames: 5,
    activeFrames: 3,
    recoveryFrames: 8,
    type: 'normal',
  };
}

export function getSkillTypeLabel(type: SkillType): string {
  switch (type) {
    case 'normal': return '普通';
    case 'fire': return '火焰';
    case 'ice': return '冰冻';
  }
}

export function getTotalFrames(skills: Skill[]): number {
  return skills.reduce(
    (sum, s) => sum + s.startupFrames + s.activeFrames + s.recoveryFrames,
    0
  );
}

export function getFrameInfo(skills: Skill[], globalFrame: number): FrameInfo | null {
  let accumulated = 0;
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const startupEnd = accumulated + skill.startupFrames;
    const activeEnd = startupEnd + skill.activeFrames;
    const recoveryEnd = activeEnd + skill.recoveryFrames;

    if (globalFrame < startupEnd) {
      return {
        skillIndex: i,
        localFrame: globalFrame - accumulated,
        phase: 'startup',
        phaseFrame: globalFrame - accumulated,
        phaseTotalFrames: skill.startupFrames,
      };
    }
    if (globalFrame < activeEnd) {
      return {
        skillIndex: i,
        localFrame: globalFrame - accumulated,
        phase: 'active',
        phaseFrame: globalFrame - startupEnd,
        phaseTotalFrames: skill.activeFrames,
      };
    }
    if (globalFrame < recoveryEnd) {
      return {
        skillIndex: i,
        localFrame: globalFrame - accumulated,
        phase: 'recovery',
        phaseFrame: globalFrame - activeEnd,
        phaseTotalFrames: skill.recoveryFrames,
      };
    }
    accumulated = recoveryEnd;
  }
  return null;
}

export function calculateCombo(skills: Skill[], currentFrame: number): DamageResult {
  if (skills.length === 0) {
    return { totalDamage: 0, currentDamage: 0, comboCount: 0, dps: 0 };
  }

  let totalDamage = 0;
  let comboCount = 0;
  let currentDamage = 0;

  let accumulated = 0;
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const startupEnd = accumulated + skill.startupFrames;
    const activeEnd = startupEnd + skill.activeFrames;
    const recoveryEnd = activeEnd + skill.recoveryFrames;

    if (currentFrame >= startupEnd) {
      comboCount = i + 1;
      totalDamage += skill.damage;
      if (currentFrame < activeEnd) {
        currentDamage = skill.damage;
      }
    }

    accumulated = recoveryEnd;
    if (accumulated > currentFrame) break;
  }

  const secondsElapsed = Math.max(currentFrame / 60, 0.001);
  const dps = Math.round((totalDamage / secondsElapsed) * 10) / 10;

  return { totalDamage, currentDamage, comboCount, dps };
}
