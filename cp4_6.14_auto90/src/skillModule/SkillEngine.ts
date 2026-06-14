import { Attributes, SkillNode, CombatStats, NodeState } from '../shared/types';
import { SKILL_DATA } from './data';

export function getSkillsForClass(classId: string): SkillNode[] {
  return SKILL_DATA.filter((s) => s.classId === classId);
}

export function getNodeState(
  node: SkillNode,
  activatedSkills: string[],
  skillPoints: number
): NodeState {
  if (activatedSkills.includes(node.id)) return 'activated';

  const prereqsMet = node.prerequisites.every((p) => activatedSkills.includes(p));
  const hasSomePrereq = node.prerequisites.length === 0 || node.prerequisites.some((p) => activatedSkills.includes(p));

  if (prereqsMet && skillPoints > 0) return 'learnable';
  if (hasSomePrereq || node.prerequisites.length === 0) return 'inactive';
  return 'unavailable';
}

export function calculateDPS(totalAttrs: Attributes, activatedSkills: string[]): number {
  const baseDamage = 10 + totalAttrs.strength * 2 + totalAttrs.intelligence * 0.5;
  let multiplierSum = 1;
  let skillCount = 0;

  activatedSkills.forEach((skillId) => {
    const skill = SKILL_DATA.find((s) => s.id === skillId);
    if (skill && skill.effect.damageMultiplier > 0) {
      multiplierSum += skill.effect.damageMultiplier * 0.15;
      skillCount++;
    }
  });

  const attackSpeed = 1 + totalAttrs.agility * 0.02;
  return Math.round(baseDamage * multiplierSum * attackSpeed * 10) / 10;
}

export function calculateHitRate(totalAttrs: Attributes, activatedSkills: string[]): number {
  let hitRate = 0.7 + totalAttrs.agility * 0.015 + totalAttrs.spirit * 0.005;

  activatedSkills.forEach((skillId) => {
    const skill = SKILL_DATA.find((s) => s.id === skillId);
    if (skill) {
      hitRate += skill.effect.hitBonus;
    }
  });

  return Math.min(Math.round(hitRate * 1000) / 10, 100);
}

export function calculateCritRate(totalAttrs: Attributes, activatedSkills: string[]): number {
  let critRate = 0.05 + totalAttrs.agility * 0.008;

  activatedSkills.forEach((skillId) => {
    const skill = SKILL_DATA.find((s) => s.id === skillId);
    if (skill) {
      critRate += skill.effect.critBonus;
    }
  });

  return Math.min(Math.round(critRate * 1000) / 10, 100);
}

export function getSkillSequence(activatedSkills: string[]): CombatStats['skillSequence'] {
  const skills = activatedSkills
    .map((id) => SKILL_DATA.find((s) => s.id === id))
    .filter((s): s is SkillNode => s !== undefined && s.effect.damageMultiplier > 0)
    .sort((a, b) => a.effect.cooldown - b.effect.cooldown);

  return skills.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.effect.icon,
    cooldown: s.effect.cooldown,
  }));
}

export function calculateCombatStats(totalAttrs: Attributes, activatedSkills: string[]): CombatStats {
  return {
    dps: calculateDPS(totalAttrs, activatedSkills),
    hitRate: calculateHitRate(totalAttrs, activatedSkills),
    critRate: calculateCritRate(totalAttrs, activatedSkills),
    skillSequence: getSkillSequence(activatedSkills),
  };
}
