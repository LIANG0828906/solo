import type { Character, Skill, SkillResult, BattleState, CombatLogEntry } from '@/types';

export const calculateDamage = (
  attacker: Character,
  defender: Character,
  skill: Skill,
): { damage: number; shieldAbsorbed: number; reductionApplied: number } => {
  const buffMultiplier = 1 + (attacker.statuses.find(s => s.type === 'buff')?.value || 0);
  const baseDamage = skill.damage + attacker.attack * buffMultiplier;
  const defenseReduction = defender.defenseReduction * (defender.statuses.find(s => s.type === 'shield') ? 1.5 : 1);
  const reducedDamage = Math.floor(baseDamage * (1 - Math.min(defenseReduction, 0.8)));
  let finalDamage = Math.max(1, reducedDamage);

  let shieldAbsorbed = 0;
  const shieldStatus = defender.statuses.find(s => s.type === 'shield');
  if (shieldStatus && shieldStatus.value > 0) {
    shieldAbsorbed = Math.min(shieldStatus.value, finalDamage);
    finalDamage -= shieldAbsorbed;
  }

  return {
    damage: finalDamage,
    shieldAbsorbed,
    reductionApplied: baseDamage - reducedDamage,
  };
};

export const applySkill = (
  caster: Character,
  target: Character,
  skill: Skill,
): { updatedCaster: Character; updatedTarget: Character; result: SkillResult } => {
  const result: SkillResult = {
    damage: 0,
    heal: 0,
    shield: 0,
    buff: 0,
    logs: [],
    targetAffected: false,
  };

  const updatedCaster: Character = {
    ...caster,
    skills: caster.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown } : s,
    ),
    currentMp: Math.max(0, caster.currentMp - skill.manaCost),
    statuses: [...caster.statuses],
  };

  const updatedTarget: Character = {
    ...target,
    statuses: [...target.statuses],
  };

  result.logs.push(`【${caster.name}】施放了 【${skill.name}】！`);

  switch (skill.type) {
    case 'attack': {
      const damageCalc = calculateDamage(updatedCaster, updatedTarget, skill);
      result.damage = damageCalc.damage;
      result.targetAffected = true;

      if (damageCalc.shieldAbsorbed > 0) {
        result.logs.push(`🛡️ 护盾吸收了 ${damageCalc.shieldAbsorbed} 点伤害`);
        const shieldIdx = updatedTarget.statuses.findIndex(s => s.type === 'shield');
        if (shieldIdx >= 0) {
          updatedTarget.statuses[shieldIdx] = {
            ...updatedTarget.statuses[shieldIdx],
            value: updatedTarget.statuses[shieldIdx].value - damageCalc.shieldAbsorbed,
          };
          if (updatedTarget.statuses[shieldIdx].value <= 0) {
            updatedTarget.statuses.splice(shieldIdx, 1);
            result.logs.push(`💥 ${target.name} 的护盾被击破！`);
          }
        }
      }

      if (damageCalc.reductionApplied > 0) {
        result.logs.push(`🛡️ 防御减免了 ${damageCalc.reductionApplied} 点伤害`);
      }

      updatedTarget.currentHp = Math.max(0, updatedTarget.currentHp - result.damage);
      result.logs.push(`⚔️ 对 【${target.name}】造成 ${result.damage} 点${skill.element || ''}伤害`);

      if (skill.id === 'undead_drain' && skill.healAmount) {
        result.heal = result.damage;
        updatedCaster.currentHp = Math.min(updatedCaster.maxHp, updatedCaster.currentHp + result.heal);
        result.logs.push(`💚 吸取生命，恢复了 ${result.heal} 点生命值`);
      }
      break;
    }

    case 'defense': {
      if (skill.shieldAmount) {
        result.shield = Math.floor(caster.maxHp * skill.shieldAmount);
        result.targetAffected = true;
        const existingShield = updatedCaster.statuses.find(s => s.type === 'shield');
        if (existingShield) {
          existingShield.value += result.shield;
          existingShield.duration = Math.max(existingShield.duration, 2);
        } else {
          updatedCaster.statuses.push({
            type: 'shield',
            duration: 2,
            value: result.shield,
          });
        }
        result.logs.push(`🛡️ 获得 ${result.shield} 点护盾值！`);
      }
      break;
    }

    case 'heal': {
      if (skill.healAmount) {
        result.heal = Math.floor(caster.maxHp * skill.healAmount);
        updatedCaster.currentHp = Math.min(updatedCaster.maxHp, updatedCaster.currentHp + result.heal);
        result.logs.push(`💚 恢复了 ${result.heal} 点生命值`);
      }
      break;
    }

    case 'buff': {
      if (skill.buffAmount) {
        result.buff = skill.buffAmount;
        result.targetAffected = true;
        const existingBuff = updatedCaster.statuses.find(s => s.type === 'buff');
        if (existingBuff) {
          existingBuff.value = Math.max(existingBuff.value, skill.buffAmount);
          existingBuff.duration = Math.max(existingBuff.duration, 3);
        } else {
          updatedCaster.statuses.push({
            type: 'buff',
            duration: 3,
            value: skill.buffAmount,
          });
        }
        result.logs.push(`✨ 攻击力提升 ${Math.floor(skill.buffAmount * 100)}%，持续3回合`);
      }
      break;
    }
  }

  return { updatedCaster, updatedTarget, result };
};

export const updateCooldowns = (character: Character): Character => {
  return {
    ...character,
    skills: character.skills.map(skill => ({
      ...skill,
      currentCooldown: Math.max(0, skill.currentCooldown - 1),
    })),
  };
};

export const updateStatuses = (character: Character): { char: Character; logs: string[] } => {
  const logs: string[] = [];
  const newStatuses = character.statuses
    .map(status => ({ ...status, duration: status.duration - 1 }))
    .filter(status => {
      if (status.duration <= 0) {
        const names: Record<string, string> = {
          shield: '护盾',
          buff: '增益效果',
          poison: '中毒效果',
          stun: '眩晕效果',
        };
        logs.push(`⏳ ${character.name} 的${names[status.type] || '状态效果'}已消散`);
        return false;
      }
      return true;
    });

  return {
    char: { ...character, statuses: newStatuses },
    logs,
  };
};

export const regenerateMana = (character: Character, amount: number = 10): Character => {
  return {
    ...character,
    currentMp: Math.min(character.maxMp, character.currentMp + amount),
  };
};

export const chooseAISkill = (enemy: Character): Skill | null => {
  const availableSkills = enemy.skills.filter(
    s => s.currentCooldown === 0 && enemy.currentMp >= s.manaCost,
  );

  if (availableSkills.length === 0) return null;

  const attackSkills = availableSkills.filter(s => s.type === 'attack');
  if (attackSkills.length > 0) {
    attackSkills.sort((a, b) => b.damage - a.damage);
    return attackSkills[0];
  }

  const hpRatio = enemy.currentHp / enemy.maxHp;
  if (hpRatio < 0.4) {
    const healSkill = availableSkills.find(s => s.type === 'heal');
    if (healSkill) return healSkill;
  }

  if (!enemy.statuses.find(s => s.type === 'shield')) {
    const defenseSkill = availableSkills.find(s => s.type === 'defense');
    if (defenseSkill) return defenseSkill;
  }

  const buffSkill = availableSkills.find(s => s.type === 'buff');
  if (buffSkill && !enemy.statuses.find(s => s.type === 'buff')) {
    return buffSkill;
  }

  return availableSkills[Math.floor(Math.random() * availableSkills.length)];
};

export const checkBattleEnd = (state: BattleState): BattleState['winner'] => {
  if (state.player.currentHp <= 0 && state.enemy.currentHp <= 0) {
    return 'draw';
  }
  if (state.player.currentHp <= 0) {
    return 'enemy';
  }
  if (state.enemy.currentHp <= 0) {
    return 'player';
  }
  if (state.currentTurn >= state.maxTurns) {
    if (state.player.currentHp > state.enemy.currentHp) return 'player';
    if (state.enemy.currentHp > state.player.currentHp) return 'enemy';
    return 'draw';
  }
  return null;
};

export const createLogEntry = (
  turn: number,
  message: string,
  type: CombatLogEntry['type'],
): CombatLogEntry => ({
  id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  turn,
  message,
  type,
  timestamp: Date.now(),
});
