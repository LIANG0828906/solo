import { v4 as uuidv4 } from 'uuid';
import type { Pet, Skill, ElementType, PlayerState, BattleState, DamageResult, FightRoundResult, FightAction, BattleLogEntry } from './types';

const PET_TEMPLATES: { element: ElementType; name: string; baseHp: number; baseAtk: number; baseDef: number; baseSpd: number }[] = [
  { element: 'fire', name: '炎龙', baseHp: 110, baseAtk: 14, baseDef: 8, baseSpd: 12 },
  { element: 'water', name: '潮豚', baseHp: 130, baseAtk: 10, baseDef: 12, baseSpd: 9 },
  { element: 'grass', name: '叶灵', baseHp: 120, baseAtk: 11, baseDef: 11, baseSpd: 10 },
  { element: 'electric', name: '雷鼠', baseHp: 100, baseAtk: 13, baseDef: 7, baseSpd: 15 },
  { element: 'wind', name: '风隼', baseHp: 95, baseAtk: 12, baseDef: 6, baseSpd: 16 },
  { element: 'earth', name: '岩熊', baseHp: 140, baseAtk: 9, baseDef: 14, baseSpd: 7 },
];

const SKILL_TEMPLATES: Record<ElementType, { name: string; coefficient: number; unlockLevel: number; description: string }[]> = {
  fire: [
    { name: '火花', coefficient: 1.0, unlockLevel: 1, description: '喷射小型火焰' },
    { name: '烈焰冲击', coefficient: 1.3, unlockLevel: 5, description: '猛烈的火焰冲击' },
    { name: '炎爆术', coefficient: 1.7, unlockLevel: 10, description: '引爆烈焰造成大量伤害' },
    { name: '龙息', coefficient: 2.2, unlockLevel: 15, description: '释放龙之吐息' },
  ],
  water: [
    { name: '水弹', coefficient: 1.0, unlockLevel: 1, description: '发射水弹攻击' },
    { name: '潮汐之力', coefficient: 1.3, unlockLevel: 5, description: '召唤潮汐冲击' },
    { name: '深海漩涡', coefficient: 1.7, unlockLevel: 10, description: '制造深海漩涡' },
    { name: '海啸', coefficient: 2.2, unlockLevel: 15, description: '掀起滔天巨浪' },
  ],
  grass: [
    { name: '藤鞭', coefficient: 1.0, unlockLevel: 1, description: '用藤蔓抽打' },
    { name: '叶刃', coefficient: 1.3, unlockLevel: 5, description: '发射锋利叶片' },
    { name: '森林之怒', coefficient: 1.7, unlockLevel: 10, description: '召唤森林之力' },
    { name: '生命绽放', coefficient: 2.2, unlockLevel: 15, description: '释放生命能量爆发' },
  ],
  electric: [
    { name: '电击', coefficient: 1.0, unlockLevel: 1, description: '释放电流攻击' },
    { name: '雷电弹', coefficient: 1.3, unlockLevel: 5, description: '投掷雷电球' },
    { name: '万雷', coefficient: 1.7, unlockLevel: 10, description: '召唤万道雷霆' },
    { name: '雷神降世', coefficient: 2.2, unlockLevel: 15, description: '化身雷神之力' },
  ],
  wind: [
    { name: '风刃', coefficient: 1.0, unlockLevel: 1, description: '斩出锋利风刃' },
    { name: '旋风斩', coefficient: 1.3, unlockLevel: 5, description: '卷起旋风切割' },
    { name: '暴风之翼', coefficient: 1.7, unlockLevel: 10, description: '展开暴风之翼' },
    { name: '天罚风暴', coefficient: 2.2, unlockLevel: 15, description: '召唤毁天灭地风暴' },
  ],
  earth: [
    { name: '落石', coefficient: 1.0, unlockLevel: 1, description: '投掷巨石攻击' },
    { name: '地裂', coefficient: 1.3, unlockLevel: 5, description: '撕裂大地' },
    { name: '山崩', coefficient: 1.7, unlockLevel: 10, description: '引发山崩地裂' },
    { name: '大地之怒', coefficient: 2.2, unlockLevel: 15, description: '释放大地深处的力量' },
  ],
};

function getSkillsForLevel(element: ElementType, level: number): Skill[] {
  return SKILL_TEMPLATES[element]
    .filter((s) => s.unlockLevel <= level)
    .map((s) => ({
      name: s.name,
      coefficient: s.coefficient,
      element,
      unlockLevel: s.unlockLevel,
      description: s.description,
    }));
}

function calcStat(base: number, level: number): number {
  return Math.floor(base + base * (level - 1) * 0.12);
}

export function createPet(element: ElementType, level: number = 1): Pet {
  const template = PET_TEMPLATES.find((t) => t.element === element)!;
  const maxHp = calcStat(template.baseHp, level);
  return {
    id: uuidv4(),
    name: template.name,
    element,
    level,
    exp: 0,
    maxHp,
    currentHp: maxHp,
    attack: calcStat(template.baseAtk, level),
    defense: calcStat(template.baseDef, level),
    speed: calcStat(template.baseSpd, level),
    rage: 0,
    skills: getSkillsForLevel(element, level),
  };
}

export function createAllPets(): Pet[] {
  const elements: ElementType[] = ['fire', 'water', 'grass', 'electric', 'wind', 'earth'];
  return elements.map((e) => createPet(e, 1));
}

export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  skillCoefficient: number
): DamageResult {
  const fluctuation = 0.9 + Math.random() * 0.2;
  const rawDamage = attackerAtk * skillCoefficient * fluctuation - defenderDef * 0.2;
  const damage = Math.max(1, Math.floor(rawDamage));
  return {
    damage,
    attackerId: '',
    defenderId: '',
    skillName: '',
    attackerRageGain: 10,
    defenderRageGain: 5,
    isCritical: fluctuation > 1.05,
  };
}

export function gainExp(pet: Pet, enemyLevel: number): Pet {
  const expGained = enemyLevel * 10 + 50;
  let newExp = pet.exp + expGained;
  let newLevel = pet.level;
  let skills = pet.skills;

  const expToNext = (lv: number) => lv * 50 + 100;

  while (newLevel < 50 && newExp >= expToNext(newLevel)) {
    newExp -= expToNext(newLevel);
    newLevel++;
    skills = getSkillsForLevel(pet.element, newLevel);
  }

  if (newLevel > pet.level) {
    const template = PET_TEMPLATES.find((t) => t.element === pet.element)!;
    const maxHp = calcStat(template.baseHp, newLevel);
    return {
      ...pet,
      level: newLevel,
      exp: newExp,
      maxHp,
      currentHp: maxHp,
      attack: calcStat(template.baseAtk, newLevel),
      defense: calcStat(template.baseDef, newLevel),
      speed: calcStat(template.baseSpd, newLevel),
      skills,
    };
  }

  return { ...pet, exp: newExp };
}

export function fightRound(
  playerPet: Pet,
  enemyPet: Pet,
  playerSkillIndex: number,
  enemySkillIndex: number
): FightRoundResult {
  const actions: FightAction[] = [];
  let pPet = { ...playerPet };
  let ePet = { ...enemyPet };
  let playerPetDied = false;
  let enemyPetDied = false;

  const playerSkill = pPet.skills[playerSkillIndex] ?? pPet.skills[0];
  const enemySkill = ePet.skills[enemySkillIndex] ?? ePet.skills[0];

  const playerFirst = pPet.speed >= ePet.speed;

  const firstAttacker = playerFirst ? 'player' : 'enemy';
  const secondAttacker = playerFirst ? 'enemy' : 'player';

  const firstSkill = playerFirst ? playerSkill : enemySkill;
  const secondSkill = playerFirst ? enemySkill : playerSkill;

  const firstAtkPet = playerFirst ? pPet : ePet;
  const firstDefPet = playerFirst ? ePet : pPet;

  const dmg1 = calculateDamage(firstAtkPet.attack, firstDefPet.defense, firstSkill.coefficient);
  dmg1.skillName = firstSkill.name;
  dmg1.isCritical = dmg1.isCritical;

  const action1: FightAction = {
    attacker: firstAttacker,
    defender: secondAttacker,
    damage: dmg1.damage,
    skillName: firstSkill.name,
    attackerRageGain: dmg1.attackerRageGain,
    defenderRageGain: dmg1.defenderRageGain,
    isCritical: dmg1.isCritical,
  };
  actions.push(action1);

  if (playerFirst) {
    ePet.currentHp = Math.max(0, ePet.currentHp - dmg1.damage);
    pPet.rage = Math.min(100, pPet.rage + 10);
    ePet.rage = Math.min(100, ePet.rage + 5);
  } else {
    pPet.currentHp = Math.max(0, pPet.currentHp - dmg1.damage);
    ePet.rage = Math.min(100, ePet.rage + 10);
    pPet.rage = Math.min(100, pPet.rage + 5);
  }

  if (ePet.currentHp <= 0) {
    enemyPetDied = true;
    ePet.rage = 0;
  }
  if (pPet.currentHp <= 0) {
    playerPetDied = true;
    pPet.rage = 0;
  }

  if (!playerPetDied && !enemyPetDied) {
    const secondAtkPet = playerFirst ? ePet : pPet;
    const secondDefPet = playerFirst ? pPet : ePet;

    const dmg2 = calculateDamage(secondAtkPet.attack, secondDefPet.defense, secondSkill.coefficient);

    const action2: FightAction = {
      attacker: secondAttacker,
      defender: firstAttacker,
      damage: dmg2.damage,
      skillName: secondSkill.name,
      attackerRageGain: dmg2.attackerRageGain,
      defenderRageGain: dmg2.defenderRageGain,
      isCritical: dmg2.isCritical,
    };
    actions.push(action2);

    if (playerFirst) {
      pPet.currentHp = Math.max(0, pPet.currentHp - dmg2.damage);
      ePet.rage = Math.min(100, ePet.rage + 10);
      pPet.rage = Math.min(100, pPet.rage + 5);
    } else {
      ePet.currentHp = Math.max(0, ePet.currentHp - dmg2.damage);
      pPet.rage = Math.min(100, pPet.rage + 10);
      ePet.rage = Math.min(100, ePet.rage + 5);
    }

    if (ePet.currentHp <= 0) {
      enemyPetDied = true;
      ePet.rage = 0;
    }
    if (pPet.currentHp <= 0) {
      playerPetDied = true;
      pPet.rage = 0;
    }
  }

  const battleEnded = (playerPetDied && pPet.currentHp <= 0) || (enemyPetDied && ePet.currentHp <= 0);
  let winner: 'player' | 'enemy' | null = null;
  if (battleEnded) {
    winner = enemyPetDied ? 'player' : 'enemy';
  }

  return {
    actions,
    playerPetDied,
    enemyPetDied,
    battleEnded,
    winner,
  };
}

export function generateEnemySkill(enemyPet: Pet): number {
  const available = enemyPet.skills.length;
  return Math.floor(Math.random() * available);
}

export function generateEnemyTeam(playerLevel: number): Pet[] {
  const elements: ElementType[] = ['fire', 'water', 'grass', 'electric', 'wind', 'earth'];
  const count = Math.min(3, 1 + Math.floor(playerLevel / 10));
  const team: Pet[] = [];
  const usedElements = new Set<ElementType>();
  for (let i = 0; i < count; i++) {
    let elem: ElementType;
    do {
      elem = elements[Math.floor(Math.random() * elements.length)];
    } while (usedElements.has(elem));
    usedElements.add(elem);
    const level = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
    const pet = createPet(elem, level);
    team.push(pet);
  }
  return team;
}

export function feedPet(pet: Pet, feedCount: number, feedDate: string): { pet: Pet; newFeedCount: number; newFeedDate: string; success: boolean } {
  const today = new Date().toISOString().split('T')[0];
  let currentCount = feedCount;
  let currentDate = feedDate;

  if (currentDate !== today) {
    currentCount = 0;
    currentDate = today;
  }

  if (currentCount >= 5) {
    return { pet, newFeedCount: currentCount, newFeedDate: currentDate, success: false };
  }

  const healAmount = Math.floor(pet.maxHp * 0.25);
  const newHp = Math.min(pet.maxHp, pet.currentHp + healAmount);

  return {
    pet: { ...pet, currentHp: newHp },
    newFeedCount: currentCount + 1,
    newFeedDate: currentDate,
    success: true,
  };
}

export function createBattleLogEntries(result: FightRoundResult): BattleLogEntry[] {
  const entries: BattleLogEntry[] = [];
  for (const action of result.actions) {
    const attackerLabel = action.attacker === 'player' ? '己方' : '敌方';
    const defenderLabel = action.defender === 'player' ? '己方' : '敌方';
    entries.push({
      text: `${attackerLabel}使用【${action.skillName}】对${defenderLabel}造成 ${action.damage} 点伤害${action.isCritical ? '（暴击！）' : ''}`,
      type: 'damage',
    });
    entries.push({
      text: `攻击方怒气+${action.attackerRageGain} 防御方怒气+${action.defenderRageGain}`,
      type: 'rage',
    });
  }
  if (result.playerPetDied) {
    entries.push({ text: '己方宠物战败！', type: 'death' });
  }
  if (result.enemyPetDied) {
    entries.push({ text: '敌方宠物战败！', type: 'death' });
  }
  if (result.battleEnded && result.winner) {
    entries.push({
      text: result.winner === 'player' ? '战斗胜利！' : '战斗失败...',
      type: 'info',
    });
  }
  return entries;
}

const STORAGE_KEY = 'petBattle_playerState';

export function savePlayerState(state: PlayerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
}

export function loadPlayerState(): PlayerState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as PlayerState;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function resetGameData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function initPlayerState(): PlayerState {
  const existing = loadPlayerState();
  if (existing) return existing;
  return {
    pets: createAllPets(),
    teamIndices: [],
    feedCount: 0,
    feedDate: new Date().toISOString().split('T')[0],
  };
}
