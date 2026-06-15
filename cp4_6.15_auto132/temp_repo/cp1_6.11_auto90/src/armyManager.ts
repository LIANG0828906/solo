import type {
  Unit,
  UnitTemplate,
  Race,
  ArmyState,
  Resources,
  Skill
} from './types.js';

const UNIT_TEMPLATES: Record<Race, UnitTemplate[]> = {
  human: [
    {
      id: 'human_knight',
      name: '骑士',
      race: 'human',
      icon: '🛡️',
      color: '#FFD700',
      baseStats: { hp: 120, attack: 28, defense: 35, speed: 12 },
      skill: { type: 'shield_wall', name: '盾墙', description: '受到攻击时有30%概率减免50%伤害', value: 0.3 },
      recruitCost: { gold: 30, mana: 5 }
    },
    {
      id: 'human_paladin',
      name: '圣骑士',
      race: 'human',
      icon: '⚔️',
      color: '#FFF176',
      baseStats: { hp: 100, attack: 32, defense: 28, speed: 14 },
      skill: { type: 'defense_aura', name: '防御光环', description: '提升全队防御10%', value: 0.1 },
      recruitCost: { gold: 40, mana: 15 }
    },
    {
      id: 'human_archer',
      name: '长弓手',
      race: 'human',
      icon: '🏹',
      color: '#BCAAA4',
      baseStats: { hp: 75, attack: 38, defense: 14, speed: 20 },
      skill: { type: 'double_strike', name: '双重射击', description: '20%概率攻击两次', value: 0.2 },
      recruitCost: { gold: 25, mana: 8 }
    },
    {
      id: 'human_mage',
      name: '法师',
      race: 'human',
      icon: '🔮',
      color: '#64B5F6',
      baseStats: { hp: 65, attack: 45, defense: 10, speed: 16 },
      skill: { type: 'heal', name: '治愈术', description: '每回合治疗最虚弱队友15%生命', value: 0.15 },
      recruitCost: { gold: 35, mana: 20 }
    },
    {
      id: 'human_general',
      name: '将军',
      race: 'human',
      icon: '👑',
      color: '#FFB74D',
      baseStats: { hp: 150, attack: 40, defense: 30, speed: 10 },
      skill: { type: 'defense_aura', name: '指挥光环', description: '提升全队攻击10%和防御5%', value: 0.1 },
      recruitCost: { gold: 60, mana: 25 }
    }
  ],
  elf: [
    {
      id: 'elf_warrior',
      name: '森林战士',
      race: 'elf',
      icon: '🍃',
      color: '#81C784',
      baseStats: { hp: 85, attack: 30, defense: 20, speed: 24 },
      skill: { type: 'evasion', name: '疾风步', description: '25%概率闪避攻击', value: 0.25 },
      recruitCost: { gold: 28, mana: 10 }
    },
    {
      id: 'elf_ranger',
      name: '游侠',
      race: 'elf',
      icon: '🏹',
      color: '#A5D6A7',
      baseStats: { hp: 70, attack: 42, defense: 15, speed: 28 },
      skill: { type: 'ranged_first', name: '远程先手', description: '战斗开始时优先攻击一次', value: 1 },
      recruitCost: { gold: 32, mana: 12 }
    },
    {
      id: 'elf_mage',
      name: '元素法师',
      race: 'elf',
      icon: '✨',
      color: '#80DEEA',
      baseStats: { hp: 60, attack: 48, defense: 10, speed: 22 },
      skill: { type: 'double_strike', name: '元素风暴', description: '30%概率造成双倍伤害', value: 0.3 },
      recruitCost: { gold: 40, mana: 22 }
    },
    {
      id: 'elf_priest',
      name: '月光祭司',
      race: 'elf',
      icon: '🌙',
      color: '#CE93D8',
      baseStats: { hp: 75, attack: 22, defense: 18, speed: 18 },
      skill: { type: 'heal', name: '月光祝福', description: '每回合治疗全队8%生命', value: 0.08 },
      recruitCost: { gold: 38, mana: 25 }
    },
    {
      id: 'elf_druid',
      name: '德鲁伊',
      race: 'elf',
      icon: '🌿',
      color: '#4CAF50',
      baseStats: { hp: 110, attack: 28, defense: 25, speed: 16 },
      skill: { type: 'evasion', name: '自然守护', description: '受到致命伤害时35%概率保留1点生命', value: 0.35 },
      recruitCost: { gold: 55, mana: 20 }
    }
  ],
  undead: [
    {
      id: 'undead_ghoul',
      name: '食尸鬼',
      race: 'undead',
      icon: '👹',
      color: '#AB47BC',
      baseStats: { hp: 90, attack: 35, defense: 16, speed: 18 },
      skill: { type: 'lifesteal', name: '吞噬', description: '攻击时回复造成伤害的25%生命', value: 0.25 },
      recruitCost: { gold: 26, mana: 8 }
    },
    {
      id: 'undead_skeleton',
      name: '骷髅法师',
      race: 'undead',
      icon: '💀',
      color: '#B39DDB',
      baseStats: { hp: 60, attack: 46, defense: 12, speed: 20 },
      skill: { type: 'poison', name: '剧毒', description: '攻击附加持续3回合的毒伤害', value: 10 },
      recruitCost: { gold: 30, mana: 15 }
    },
    {
      id: 'undead_vampire',
      name: '吸血鬼',
      race: 'undead',
      icon: '🦇',
      color: '#BA68C8',
      baseStats: { hp: 95, attack: 38, defense: 20, speed: 22 },
      skill: { type: 'lifesteal', name: '吸血', description: '攻击时回复造成伤害的30%生命', value: 0.3 },
      recruitCost: { gold: 42, mana: 18 }
    },
    {
      id: 'undead_necromancer',
      name: '死灵法师',
      race: 'undead',
      icon: '☠️',
      color: '#9575CD',
      baseStats: { hp: 70, attack: 40, defense: 15, speed: 16 },
      skill: { type: 'revive', name: '亡灵复活', description: '队友死亡时25%概率复活并恢复30%生命', value: 0.25 },
      recruitCost: { gold: 48, mana: 28 }
    },
    {
      id: 'undead_lich',
      name: '巫妖王',
      race: 'undead',
      icon: '🔱',
      color: '#7E57C2',
      baseStats: { hp: 120, attack: 50, defense: 22, speed: 12 },
      skill: { type: 'curse', name: '死亡诅咒', description: '攻击降低目标20%攻击力持续2回合', value: 0.2 },
      recruitCost: { gold: 65, mana: 30 }
    }
  ]
};

const COUNTER_TABLE: Record<Race, Race> = {
  human: 'undead',
  undead: 'elf',
  elf: 'human'
};

const COUNTER_DAMAGE_BONUS = 1.3;
const MAX_LEVEL = 5;
const STAT_GROWTH_RATE = 0.1;
const COST_GROWTH_RATE = 1.5;
const MAX_FORMATION_SIZE = 6;

export class ArmyManager {
  private state: ArmyState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      resources: { gold: 100, mana: 50 },
      recruitedUnits: [],
      formation: new Array(9).fill(null)
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  getState(): ArmyState {
    return { ...this.state };
  }

  getResources(): Resources {
    return { ...this.state.resources };
  }

  getTemplatesByRace(race: Race): UnitTemplate[] {
    return UNIT_TEMPLATES[race];
  }

  getAllTemplates(): UnitTemplate[] {
    return [...UNIT_TEMPLATES.human, ...UNIT_TEMPLATES.elf, ...UNIT_TEMPLATES.undead];
  }

  getTemplate(templateId: string): UnitTemplate | undefined {
    return this.getAllTemplates().find(t => t.id === templateId);
  }

  getRecruitedUnits(): Unit[] {
    return [...this.state.recruitedUnits];
  }

  getFormation(): (Unit | null)[] {
    return [...this.state.formation];
  }

  getFormationCount(): number {
    return this.state.formation.filter(u => u !== null).length;
  }

  getRecruitCost(template: UnitTemplate): { gold: number; mana: number } {
    return { ...template.recruitCost };
  }

  getUpgradeCost(unit: Unit): { gold: number; mana: number } {
    const template = this.getTemplate(unit.templateId);
    if (!template) return { gold: 0, mana: 0 };
    const multiplier = Math.pow(COST_GROWTH_RATE, unit.level);
    return {
      gold: Math.round(template.recruitCost.gold * multiplier),
      mana: Math.round(template.recruitCost.mana * multiplier)
    };
  }

  canRecruit(template: UnitTemplate): boolean {
    const cost = this.getRecruitCost(template);
    return this.state.resources.gold >= cost.gold &&
           this.state.resources.mana >= cost.mana;
  }

  canUpgrade(unit: Unit): boolean {
    if (unit.level >= MAX_LEVEL) return false;
    const cost = this.getUpgradeCost(unit);
    return this.state.resources.gold >= cost.gold &&
           this.state.resources.mana >= cost.mana;
  }

  recruitUnit(templateId: string): { success: boolean; message: string; unit?: Unit } {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { success: false, message: '兵种模板不存在' };
    }

    if (!this.canRecruit(template)) {
      return { success: false, message: '资源不足，无法招募' };
    }

    const cost = this.getRecruitCost(template);
    this.state.resources.gold -= cost.gold;
    this.state.resources.mana -= cost.mana;

    const unit: Unit = this.createUnitFromTemplate(template);
    this.state.recruitedUnits.push(unit);

    this.notify();
    return { success: true, message: `成功招募 ${unit.name}！`, unit };
  }

  upgradeUnit(instanceId: string): { success: boolean; message: string } {
    const unit = this.state.recruitedUnits.find(u => u.instanceId === instanceId);
    if (!unit) {
      return { success: false, message: '单位不存在' };
    }

    if (unit.level >= MAX_LEVEL) {
      return { success: false, message: '已达最高等级' };
    }

    if (!this.canUpgrade(unit)) {
      return { success: false, message: '资源不足，无法升级' };
    }

    const cost = this.getUpgradeCost(unit);
    this.state.resources.gold -= cost.gold;
    this.state.resources.mana -= cost.mana;

    unit.level++;
    unit.stats.hp = Math.round(unit.stats.hp * (1 + STAT_GROWTH_RATE));
    unit.stats.attack = Math.round(unit.stats.attack * (1 + STAT_GROWTH_RATE));
    unit.stats.defense = Math.round(unit.stats.defense * (1 + STAT_GROWTH_RATE));
    unit.stats.speed = Math.round(unit.stats.speed * (1 + STAT_GROWTH_RATE));
    unit.currentHp = unit.stats.hp;

    const formationIndex = this.state.formation.findIndex(u => u?.instanceId === instanceId);
    if (formationIndex !== -1) {
      this.state.formation[formationIndex] = { ...unit };
    }

    this.notify();
    return { success: true, message: `${unit.name} 升级到 ${unit.level} 级！` };
  }

  placeUnit(instanceId: string, slotIndex: number): { success: boolean; message: string } {
    if (slotIndex < 0 || slotIndex > 8) {
      return { success: false, message: '无效的格子位置' };
    }

    const unit = this.state.recruitedUnits.find(u => u.instanceId === instanceId);
    if (!unit) {
      return { success: false, message: '单位不存在' };
    }

    if (this.state.formation[slotIndex] !== null) {
      return { success: false, message: '该位置已被占用' };
    }

    if (this.getFormationCount() >= MAX_FORMATION_SIZE) {
      return { success: false, message: `布阵最多${MAX_FORMATION_SIZE}个单位` };
    }

    const currentIndex = this.state.formation.findIndex(u => u?.instanceId === instanceId);
    if (currentIndex !== -1) {
      this.state.formation[currentIndex] = null;
    }

    unit.position = slotIndex;
    this.state.formation[slotIndex] = { ...unit, currentHp: unit.stats.hp, alive: true, effects: [], hasActed: false };

    this.notify();
    return { success: true, message: `${unit.name} 已布置到战场` };
  }

  removeUnitFromFormation(slotIndex: number): { success: boolean; message: string } {
    if (slotIndex < 0 || slotIndex > 8) {
      return { success: false, message: '无效的格子位置' };
    }

    const unit = this.state.formation[slotIndex];
    if (!unit) {
      return { success: false, message: '该位置没有单位' };
    }

    this.state.formation[slotIndex] = null;

    const recruited = this.state.recruitedUnits.find(u => u.instanceId === unit.instanceId);
    if (recruited) {
      recruited.position = -1;
    }

    this.notify();
    return { success: true, message: `${unit.name} 已移出战场` };
  }

  clearFormation(): void {
    for (let i = 0; i < 9; i++) {
      this.state.formation[i] = null;
    }
    this.state.recruitedUnits.forEach(u => u.position = -1);
    this.notify();
  }

  getActiveFormation(): Unit[] {
    return this.state.formation.filter((u): u is Unit => u !== null);
  }

  private createUnitFromTemplate(template: UnitTemplate): Unit {
    return {
      instanceId: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId: template.id,
      name: template.name,
      race: template.race,
      icon: template.icon,
      color: template.color,
      level: 1,
      stats: { ...template.baseStats },
      currentHp: template.baseStats.hp,
      skill: { ...template.skill },
      alive: true,
      position: -1,
      effects: [],
      hasActed: false
    };
  }

  getCounterTable(): Record<Race, Race> {
    return { ...COUNTER_TABLE };
  }

  getCounterBonus(attackerRace: Race, defenderRace: Race): number {
    if (COUNTER_TABLE[attackerRace] === defenderRace) {
      return COUNTER_DAMAGE_BONUS;
    }
    if (COUNTER_TABLE[defenderRace] === attackerRace) {
      return 1 / COUNTER_DAMAGE_BONUS;
    }
    return 1;
  }

  generateEnemyArmy(difficulty: number = 1): Unit[] {
    const enemyUnits: Unit[] = [];
    const allTemplates = this.getAllTemplates();
    const unitCount = Math.min(6, 3 + Math.floor(difficulty * 0.5));

    for (let i = 0; i < unitCount; i++) {
      const template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
      const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(difficulty * 0.8 + Math.random() * 2)));

      const unit: Unit = this.createUnitFromTemplate(template);
      unit.name = `${template.name}(敌)`;
      unit.position = i;

      for (let l = 1; l < level; l++) {
        unit.level++;
        unit.stats.hp = Math.round(unit.stats.hp * (1 + STAT_GROWTH_RATE));
        unit.stats.attack = Math.round(unit.stats.attack * (1 + STAT_GROWTH_RATE));
        unit.stats.defense = Math.round(unit.stats.defense * (1 + STAT_GROWTH_RATE));
        unit.stats.speed = Math.round(unit.stats.speed * (1 + STAT_GROWTH_RATE));
      }
      unit.currentHp = unit.stats.hp;
      enemyUnits.push(unit);
    }

    return enemyUnits;
  }
}
