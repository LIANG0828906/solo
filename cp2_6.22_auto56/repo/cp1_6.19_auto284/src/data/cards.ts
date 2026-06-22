import { Card, Skill } from '../types';

const skillTemplates: Record<string, Skill> = {
  dash: {
    id: 'dash',
    name: '冲刺',
    description: '移动后顺劈相邻敌人，造成50%攻击力伤害',
    type: 'onMove'
  },
  taunt: {
    id: 'taunt',
    name: '嘲讽',
    description: '敌方单位必须优先攻击此单位',
    type: 'passive'
  },
  lifesteal: {
    id: 'lifesteal',
    name: '吸血',
    description: '攻击造成伤害时，恢复等量生命',
    type: 'onAttack'
  },
  fury: {
    id: 'fury',
    name: '狂暴',
    description: '生命值低于30%时，攻击力提升50%',
    type: 'passive'
  },
  shield: {
    id: 'shield',
    name: '护盾',
    description: '首次受到的伤害减免50%',
    type: 'passive'
  },
  frost: {
    id: 'frost',
    name: '冰霜打击',
    description: '攻击使目标下回合移动力减少1',
    type: 'onAttack'
  },
  burn: {
    id: 'burn',
    name: '灼烧',
    description: '攻击后目标在回合结束受到额外3点伤害',
    type: 'onAttack'
  },
  charge: {
    id: 'charge',
    name: '冲锋',
    description: '召唤当回合可立即攻击',
    type: 'passive'
  }
};

const raritySprites: Record<string, string> = {
  common: '#8B7355',
  rare: '#4169E1',
  epic: '#8A2BE2',
  legendary: '#FF8C00'
};

const generateCards = (): Card[] => {
  const cards: Card[] = [];
  const unitNames = [
    '暗影刺客', '烈焰法师', '寒冰卫士', '森林游侠', '圣光骑士',
    '暗夜巫师', '狂暴战士', '精灵弓手', '石像鬼', '亡灵骑士',
    '龙息术士', '雷霆战神', '深渊恶魔', '凤凰', '冰霜巨人',
    '地狱犬', '角鹰兽', '独角兽', '狮鹫', '九头蛇',
    '元素精灵', '影刃舞者', '圣光牧师', '血月狼人', '钢铁傀儡',
    '风暴元素', '大地泰坦', '虚空行者', '日炎守卫', '月光祭司'
  ];

  const spellNames = [
    '火球术', '寒冰箭', '治疗术', '闪电链', '暗影打击',
    '圣光庇护', '召唤图腾', '时间扭曲', '空间撕裂', '生命汲取',
    '末日审判', '星辰坠落', '冰霜领域', '烈焰风暴', '灵魂收割'
  ];

  const lores = [
    '来自北方冰原的古老战士，誓言守护最后的希望。',
    '在火焰之塔中修行百年的法师，掌握着燃烧灵魂的秘法。',
    '森林深处的神秘守卫，与自然万物心灵相通。',
    '堕落的圣骑士，以黑暗之力践行扭曲的正义。',
    '远古龙族的后裔，一怒之下可焚烧整片大地。',
    '从深渊裂缝中召唤的恶魔，以痛苦为食。',
    '被诅咒的亡灵骑士，永远在寻找失落的王冠。',
    '精灵族的神射手，一箭可射穿星辰。',
    '大地锻造的守护者，永不疲倦的战士。',
    '游走于虚空边缘的行者，窥探命运的秘密。'
  ];

  let idCounter = 1;

  for (let cost = 1; cost <= 10; cost++) {
    const count = cost <= 5 ? 6 : 5;
    for (let i = 0; i < count && cards.length < 210; i++) {
      const rarityRoll = Math.random();
      let rarity: Card['rarity'];
      if (rarityRoll < 0.5) rarity = 'common';
      else if (rarityRoll < 0.8) rarity = 'rare';
      else if (rarityRoll < 0.95) rarity = 'epic';
      else rarity = 'legendary';

      const skillList: Skill[] = [];
      if (cost >= 3 && Math.random() > 0.4) {
        const skillKeys = Object.keys(skillTemplates);
        const s = skillKeys[Math.floor(Math.random() * skillKeys.length)];
        skillList.push(skillTemplates[s]);
      }
      if (cost >= 6 && Math.random() > 0.5) {
        const skillKeys = Object.keys(skillTemplates).filter(k => !skillList.some(s => s.id === k));
        if (skillKeys.length > 0) {
          const s = skillKeys[Math.floor(Math.random() * skillKeys.length)];
          skillList.push(skillTemplates[s]);
        }
      }

      const nameIdx = idCounter % unitNames.length;
      const baseAttack = Math.max(1, Math.floor(cost * 1.5 + Math.random() * cost));
      const baseHealth = Math.max(2, Math.floor(cost * 2 + Math.random() * cost * 1.5));

      cards.push({
        id: `card_${idCounter.toString().padStart(4, '0')}`,
        name: `${unitNames[nameIdx]}${i > 0 ? `·${['贰', '叁', '肆', '伍', '陆'][i - 1] || ''}` : ''}`,
        cost,
        type: 'unit',
        rarity,
        attack: baseAttack,
        health: baseHealth,
        movement: 2,
        skills: skillList,
        description: skillList.length > 0
          ? `${skillList.map(s => s.name + '：' + s.description).join(' ')}`
          : '一名普通的战士，忠诚地执行命令。',
        lore: lores[idCounter % lores.length],
        spriteColor: raritySprites[rarity],
        communityRating: Math.round((3 + Math.random() * 2) * 10) / 10
      });

      idCounter++;
    }
  }

  for (let cost = 1; cost <= 8; cost++) {
    const count = cost <= 4 ? 4 : 3;
    for (let i = 0; i < count && cards.length < 230; i++) {
      const rarityRoll = Math.random();
      let rarity: Card['rarity'];
      if (rarityRoll < 0.45) rarity = 'common';
      else if (rarityRoll < 0.75) rarity = 'rare';
      else if (rarityRoll < 0.92) rarity = 'epic';
      else rarity = 'legendary';

      const nameIdx = idCounter % spellNames.length;

      cards.push({
        id: `card_${idCounter.toString().padStart(4, '0')}`,
        name: `${spellNames[nameIdx]}${i > 0 ? `·强化` : ''}`,
        cost,
        type: 'spell',
        rarity,
        skills: [],
        description: `${spellNames[nameIdx]}：对目标区域${cost >= 4 ? '3x3范围' : '单体'}造成${cost * 3 + Math.floor(Math.random() * 5)}点${rarity === 'legendary' ? '真实' : '魔法'}伤害。`,
        lore: lores[idCounter % lores.length],
        spriteColor: raritySprites[rarity],
        communityRating: Math.round((3 + Math.random() * 2) * 10) / 10
      });

      idCounter++;
    }
  }

  return cards.slice(0, 230);
};

export const ALL_CARDS: Card[] = generateCards();

export const getCardById = (id: string): Card | undefined => {
  return ALL_CARDS.find(c => c.id === id);
};
