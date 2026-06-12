import type { Rune, SpellEffect, StatusEffect, ElementType } from './types';

const ELEMENT_BASE_DAMAGE: Record<ElementType, number> = {
  fire: 25,
  ice: 20,
  thunder: 30,
  shadow: 22,
  guard: 10,
  heal: 15,
  wind: 18,
  rock: 28,
  ghost: 24,
  light: 26,
  poison: 20,
  time: 23,
};

const WEIGHTS = [0.6, 0.25, 0.1, 0.05];

function getRuneElements(runes: Rune[]): ElementType[] {
  return runes.map((r) => r.element);
}

function matchesPattern(elements: ElementType[], pattern: ElementType[]): boolean {
  if (elements.length !== pattern.length) return false;
  return elements.every((el, i) => el === pattern[i]);
}

function createStatusEffect(
  type: StatusEffect['type'],
  value: number,
  duration: number
): StatusEffect {
  return { type, value, duration };
}

function chaosStorm(): SpellEffect {
  return {
    name: '混乱风暴',
    damage: 120,
    type: 'aoe',
    description: '四元素融合的毁灭风暴，对所有敌人造成大量伤害并减速',
    element: 'shadow',
    statusEffects: [createStatusEffect('slow', 40, 3)],
    particleType: 'chaos',
  };
}

function purifyLightning(): SpellEffect {
  return {
    name: '净化闪电',
    damage: 200,
    type: 'single',
    description: '神圣的雷霆一击，造成极高单体伤害并清除目标负面效果',
    element: 'thunder',
    statusEffects: [createStatusEffect('cleanse', 100, 1)],
    particleType: 'purify',
  };
}

function divineShield(): SpellEffect {
  return {
    name: '神圣护盾',
    damage: 0,
    type: 'aoe',
    description: '神圣能量形成的护盾，为全队提供护盾并持续治疗',
    element: 'light',
    statusEffects: [
      createStatusEffect('shield', 80, 5),
      createStatusEffect('heal', 20, 3),
    ],
    particleType: 'divine',
  };
}

function flameBurst(): SpellEffect {
  return {
    name: '烈焰爆发',
    damage: 180,
    type: 'single',
    description: '四团火焰凝聚的爆裂攻击，造成超高单体伤害并灼烧目标',
    element: 'fire',
    statusEffects: [createStatusEffect('burn', 15, 4)],
    particleType: 'flame',
  };
}

function absoluteZero(): SpellEffect {
  return {
    name: '绝对零度',
    damage: 90,
    type: 'aoe',
    description: '极寒之力冻结全场，造成群体伤害并冰冻眩晕敌人',
    element: 'ice',
    statusEffects: [createStatusEffect('stun', 100, 2)],
    particleType: 'frost',
  };
}

function corrosionTouch(): SpellEffect {
  return {
    name: '腐蚀之触',
    damage: 70,
    type: 'single',
    description: '幽冥与毒液的结合，持续腐蚀目标造成大量持续伤害',
    element: 'poison',
    statusEffects: [createStatusEffect('poison', 25, 5)],
    particleType: 'corrosion',
  };
}

function thunderStorm(): SpellEffect {
  return {
    name: '雷暴风暴',
    damage: 100,
    type: 'aoe',
    description: '风雷交织的雷暴，造成群体伤害并有概率眩晕敌人',
    element: 'thunder',
    statusEffects: [createStatusEffect('stun', 30, 1)],
    particleType: 'storm',
  };
}

function rockFortress(): SpellEffect {
  return {
    name: '岩石堡垒',
    damage: 40,
    type: 'aoe',
    description: '坚固的岩石壁垒，提供高额护盾并反弹部分伤害',
    element: 'rock',
    statusEffects: [createStatusEffect('shield', 120, 6)],
    particleType: 'rock',
  };
}

function timeRift(): SpellEffect {
  return {
    name: '时空裂隙',
    damage: 150,
    type: 'single',
    description: '撕裂时空的神秘力量，造成真实伤害并触发随机效果',
    element: 'time',
    statusEffects: [
      createStatusEffect('slow', 50, 2),
      createStatusEffect('burn', 10, 3),
    ],
    particleType: 'rift',
  };
}

function calculateDefaultSpell(runes: Rune[]): SpellEffect {
  const elements = getRuneElements(runes);
  const primaryElement = elements[0] || 'fire';
  const elementNames: Record<ElementType, string> = {
    fire: '火焰',
    ice: '冰霜',
    thunder: '雷电',
    shadow: '暗影',
    guard: '守护',
    heal: '治愈',
    wind: '风暴',
    rock: '岩石',
    ghost: '幽冥',
    light: '光芒',
    poison: '毒液',
    time: '时空',
  };

  let totalDamage = 0;
  runes.forEach((rune, index) => {
    const weight = WEIGHTS[index] || 0.05;
    const baseDamage = ELEMENT_BASE_DAMAGE[rune.element] || 20;
    totalDamage += baseDamage * weight * 4;
  });

  const hasMultipleElements = new Set(elements).size > 1;
  const damageType: 'single' | 'aoe' = hasMultipleElements ? 'aoe' : 'single';

  const statusEffects: StatusEffect[] = [];
  if (elements.includes('fire')) {
    statusEffects.push(createStatusEffect('burn', 8, 2));
  }
  if (elements.includes('ice')) {
    statusEffects.push(createStatusEffect('slow', 20, 2));
  }
  if (elements.includes('thunder') && Math.random() > 0.7) {
    statusEffects.push(createStatusEffect('stun', 100, 1));
  }
  if (elements.includes('heal')) {
    statusEffects.push(createStatusEffect('heal', 10, 2));
  }
  if (elements.includes('guard')) {
    statusEffects.push(createStatusEffect('shield', 30, 3));
  }
  if (elements.includes('poison')) {
    statusEffects.push(createStatusEffect('poison', 10, 3));
  }

  const runeNames = runes.map((r) => r.name).join('+');

  return {
    name: `${runeNames} 组合术`,
    damage: Math.round(totalDamage),
    type: damageType,
    description: `由 ${runeNames} 组合而成的法术`,
    element: primaryElement,
    statusEffects,
    particleType: elementNames[primaryElement],
  };
}

export function combineRunes(runes: Rune[]): SpellEffect {
  if (runes.length === 0) {
    return {
      name: '无符文',
      damage: 0,
      type: 'single',
      description: '没有选择任何符文',
      element: 'fire',
      statusEffects: [],
      particleType: 'none',
    };
  }

  const elements = getRuneElements(runes);

  if (matchesPattern(elements, ['fire', 'ice', 'thunder', 'shadow'])) {
    return chaosStorm();
  }

  if (matchesPattern(elements, ['thunder', 'fire', 'ice', 'light'])) {
    return purifyLightning();
  }

  if (matchesPattern(elements, ['guard', 'heal', 'light', 'guard'])) {
    return divineShield();
  }

  if (matchesPattern(elements, ['fire', 'fire', 'fire', 'fire'])) {
    return flameBurst();
  }

  if (matchesPattern(elements, ['ice', 'ice', 'ice', 'ice'])) {
    return absoluteZero();
  }

  if (matchesPattern(elements, ['poison', 'shadow', 'ghost', 'poison'])) {
    return corrosionTouch();
  }

  if (matchesPattern(elements, ['wind', 'thunder', 'wind', 'thunder'])) {
    return thunderStorm();
  }

  if (matchesPattern(elements, ['rock', 'rock', 'guard', 'rock'])) {
    return rockFortress();
  }

  if (matchesPattern(elements, ['time', 'light', 'shadow', 'time'])) {
    return timeRift();
  }

  return calculateDefaultSpell(runes);
}
