export type EquipmentType = 'weapon' | 'armor' | 'ring' | 'helmet'

export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  attackBonus: number
  defenseBonus: number
  healthBonus: number
}

export interface Enemy {
  id: string
  name: string
  maxHealth: number
  currentHealth: number
  attack: number
  defense: number
}

export interface CombatState {
  active: boolean
  enemy: Enemy | null
  playerHealth: number
  playerMaxHealth: number
  log: string[]
  result: 'ongoing' | 'win' | 'lose' | null
}

const ENEMY_NAMES = [
  '哥布林战士',
  '骷髅兵',
  '史莱姆',
  '蝙蝠群',
  '暗影刺客',
  '石像鬼',
  '腐化骑士',
]

const EQUIPMENT_NAMES: Record<EquipmentType, string[]> = {
  weapon: ['铁剑', '战斧', '匕首', '长弓', '战锤', '弯刀'],
  armor: ['皮甲', '锁子甲', '板甲', '长袍', '龙鳞甲'],
  ring: ['力量戒指', '守护戒指', '生命戒指', '幸运戒指', '魔法戒指'],
  helmet: ['铁盔', '皮帽', '王冠', '角盔', '兜鍪'],
}

const DROP_CHANCE = 0.4

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function createEnemy(): Enemy {
  const name = ENEMY_NAMES[randomInt(0, ENEMY_NAMES.length - 1)]
  const baseHealth = randomInt(40, 80)
  const baseAttack = randomInt(5, 10)
  const baseDefense = randomInt(1, 4)

  return {
    id: generateId(),
    name,
    maxHealth: baseHealth,
    currentHealth: baseHealth,
    attack: baseAttack,
    defense: baseDefense,
  }
}

export function calculateDamage(
  attackPower: number,
  defense: number
): number {
  const baseDamage = Math.max(1, attackPower - defense)
  const variance = Math.floor(baseDamage * 0.2)
  return baseDamage + randomInt(-variance, variance)
}

export function playerAttack(
  enemy: Enemy,
  playerAttackPower: number
): { enemy: Enemy; damage: number } {
  const damage = calculateDamage(playerAttackPower, enemy.defense)
  const newHealth = Math.max(0, enemy.currentHealth - damage)

  return {
    enemy: {
      ...enemy,
      currentHealth: newHealth,
    },
    damage,
  }
}

export function enemyAttack(
  enemy: Enemy,
  playerDefense: number,
  playerCurrentHealth: number
): { playerHealth: number; damage: number } {
  const damage = calculateDamage(enemy.attack, playerDefense)
  const newHealth = Math.max(0, playerCurrentHealth - damage)

  return {
    playerHealth: newHealth,
    damage,
  }
}

export function generateRandomEquipment(): Equipment {
  const types: EquipmentType[] = ['weapon', 'armor', 'ring', 'helmet']
  const type = types[randomInt(0, types.length - 1)]
  const names = EQUIPMENT_NAMES[type]
  const name = names[randomInt(0, names.length - 1)]

  let attackBonus = 0
  let defenseBonus = 0
  let healthBonus = 0

  switch (type) {
    case 'weapon':
      attackBonus = randomInt(1, 5)
      break
    case 'armor':
      defenseBonus = randomInt(1, 3)
      healthBonus = randomInt(5, 15)
      break
    case 'ring':
      attackBonus = randomInt(0, 2)
      defenseBonus = randomInt(0, 2)
      healthBonus = randomInt(0, 10)
      break
    case 'helmet':
      defenseBonus = randomInt(1, 2)
      healthBonus = randomInt(5, 20)
      break
  }

  const prefixes = ['精良的', '破旧的', '神秘的', '古老的', '闪耀的']
  const usePrefix = Math.random() > 0.5
  const finalName = usePrefix
    ? prefixes[randomInt(0, prefixes.length - 1)] + name
    : name

  return {
    id: generateId(),
    name: finalName,
    type,
    attackBonus,
    defenseBonus,
    healthBonus,
  }
}

export function rollForLoot(): Equipment | null {
  if (Math.random() < DROP_CHANCE) {
    return generateRandomEquipment()
  }
  return null
}

export function isCombatOver(state: CombatState): boolean {
  return state.result !== null && state.result !== 'ongoing'
}
