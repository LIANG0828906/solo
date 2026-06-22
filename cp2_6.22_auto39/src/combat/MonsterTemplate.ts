import type { Monster, MonsterSkill, Difficulty } from '../types';

const MONSTER_NAMES: { name: string; type: string }[] = [
  { name: '赛博幽灵', type: 'specter' },
  { name: '突变生化体', type: 'mutant' },
  { name: '量子机械兽', type: 'mech' },
  { name: '虚空掠夺者', type: 'void' },
  { name: '纳米虫群', type: 'swarm' },
  { name: '数据食腐者', type: 'hacker' },
  { name: '星界猎手', type: 'hunter' },
];

const SKILL_POOL: Omit<MonsterSkill, 'currentCd'>[] = [
  { id: 'heavy_strike', name: '重击', desc: '造成150%攻击伤害', cd: 3, mult: 1.5 },
  { id: 'poison', name: '毒雾', desc: '下回合附加持续伤害', cd: 4, mult: 1.2 },
  { id: 'stun', name: '电磁脉冲', desc: '有概率眩晕目标', cd: 5, mult: 1.0 },
  { id: 'heal', name: '自我修复', desc: '回复25%最大生命', cd: 4, mult: 0 },
  { id: 'pierce', name: '穿透', desc: '无视50%防御', cd: 3, mult: 1.3 },
  { id: 'enrage', name: '狂怒', desc: '2回合攻击+40%', cd: 5, mult: 1 },
];

const SCALE: Record<Difficulty, number> = { easy: 0.8, normal: 1, hard: 1.4 };

export class MonsterTemplate {
  static generate(level: number = 1, difficulty: Difficulty = 'normal', count?: number): Monster[] {
    const s = SCALE[difficulty] * (1 + level * 0.15);
    const n = count ?? (1 + Math.floor(Math.random() * 2));
    const monsters: Monster[] = [];

    for (let i = 0; i < n; i++) {
      const base = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
      const chosenSkills = [...SKILL_POOL].sort(() => Math.random() - 0.5).slice(0, 2);

      const m: Monster = {
        id: `mon_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: base.name + (n > 1 ? ` ${i + 1}` : ''),
        type: base.type,
        stats: {
          maxHp: Math.floor((80 + Math.random() * 40) * s),
          hp: 0,
          attack: Math.floor((8 + Math.random() * 6) * s),
          defense: Math.floor((3 + Math.random() * 4) * s),
          critRate: Math.floor(Math.random() * 8 * s * 10) / 10,
        },
        skills: chosenSkills.map((sk) => ({ ...sk, currentCd: 0 })),
      };
      m.stats.hp = m.stats.maxHp;
      monsters.push(m);
    }
    return monsters;
  }

  static cloneForBattle(ms: Monster[]): Monster[] {
    return ms.map((m) => ({
      ...m,
      id: m.id + '_battle_' + Math.random().toString(36).slice(2, 6),
      stats: { ...m.stats, hp: m.stats.maxHp },
      skills: m.skills.map((s) => ({ ...s, currentCd: 0 })),
    }));
  }
}
