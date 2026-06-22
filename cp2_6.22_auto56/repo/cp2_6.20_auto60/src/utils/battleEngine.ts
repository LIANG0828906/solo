import type { Rune, EquippedRunes } from '../types'

export interface BattleCharacter {
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  critRate: number
  element: string
  runes: Rune[]
}

export interface BattleResult {
  victory: boolean
  totalDamage: number
  effectsTriggered: number
  turns: number
  damageLog: Array<{ turn: number; attacker: string; damage: number; isCrit: boolean; effect?: string }>
}

const opponents = [
  { name: '石像鬼', baseHealth: 200, baseAttack: 25, baseDefense: 15, element: 'stone', avatar: '🗿' },
  { name: '暗影刺客', baseHealth: 150, baseAttack: 40, baseDefense: 8, element: 'dark', avatar: '🥷' },
  { name: '火焰魔像', baseHealth: 280, baseAttack: 30, baseDefense: 20, element: 'fire', avatar: '🔥' },
  { name: '冰霜巨人', baseHealth: 320, baseAttack: 22, baseDefense: 25, element: 'water', avatar: '❄️' },
  { name: '雷霆精灵', baseHealth: 180, baseAttack: 35, baseDefense: 10, element: 'thunder', avatar: '⚡' },
]

export const getRandomOpponent = () => {
  return opponents[Math.floor(Math.random() * opponents.length)]
}

export const calculatePlayerStats = (equippedRunes: EquippedRunes) => {
  const baseHealth = 500
  const baseAttack = 30
  const baseDefense = 15
  const baseCritRate = 5

  const runes = Object.values(equippedRunes).filter((r): r is Rune => r !== null)

  let totalHealth = baseHealth
  let totalAttack = baseAttack
  let totalDefense = baseDefense
  let totalCritRate = baseCritRate

  runes.forEach((rune) => {
    totalHealth += rune.stats.health || 0
    totalAttack += rune.stats.attack || 0
    totalDefense += rune.stats.defense || 0
    totalCritRate += rune.stats.critRate || 0
  })

  const primaryElement = runes.length > 0 
    ? runes.reduce((acc, r) => {
        acc[r.element] = (acc[r.element] || 0) + r.rarity
        return acc
      }, {} as Record<string, number>)
    : {}

  const dominantElement = Object.entries(primaryElement).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'

  return {
    health: totalHealth,
    attack: totalAttack,
    defense: totalDefense,
    critRate: Math.min(totalCritRate, 80),
    element: dominantElement,
    runes,
  }
}

export const simulateBattle = (playerStats: ReturnType<typeof calculatePlayerStats>, opponent: typeof opponents[0]): BattleResult => {
  let playerHealth = playerStats.health
  let opponentHealth = opponent.baseHealth
  let totalDamage = 0
  let effectsTriggered = 0
  let turns = 0
  const damageLog: BattleResult['damageLog'] = []

  while (playerHealth > 0 && opponentHealth > 0 && turns < 50) {
    turns++

    const isCrit = Math.random() * 100 < playerStats.critRate
    let damage = Math.max(1, playerStats.attack - opponent.baseDefense * 0.5)
    if (isCrit) damage *= 1.5
    damage = Math.round(damage * (0.9 + Math.random() * 0.2))

    opponentHealth = Math.max(0, opponentHealth - damage)
    totalDamage += damage
    damageLog.push({ turn: turns, attacker: 'player', damage, isCrit })

    playerStats.runes.forEach((rune) => {
      if (Math.random() < rune.effectChance) {
        effectsTriggered++
        if (rune.element === 'fire') {
          const burnDamage = Math.round(damage * 0.2)
          opponentHealth = Math.max(0, opponentHealth - burnDamage)
          totalDamage += burnDamage
        } else if (rune.element === 'water') {
          const heal = Math.round(damage * 0.15)
          playerHealth = Math.min(playerStats.health, playerHealth + heal)
        } else if (rune.element === 'thunder') {
          const chainDamage = Math.round(damage * 0.3)
          opponentHealth = Math.max(0, opponentHealth - chainDamage)
          totalDamage += chainDamage
        } else if (rune.element === 'wind') {
          // 闪避在被攻击时处理
        } else if (rune.element === 'dark') {
          const lifesteal = Math.round(damage * 0.1)
          playerHealth = Math.min(playerStats.health, playerHealth + lifesteal)
        }
      }
    })

    if (opponentHealth <= 0) break

    let dodged = false
    playerStats.runes.forEach((rune) => {
      if (rune.element === 'wind' && Math.random() < rune.effectChance) {
        dodged = true
        effectsTriggered++
      }
    })

    if (!dodged) {
      const oppDamage = Math.max(1, opponent.baseAttack - playerStats.defense * 0.5)
      playerHealth = Math.max(0, playerHealth - Math.round(oppDamage * (0.9 + Math.random() * 0.2)))
      damageLog.push({ turn: turns, attacker: 'opponent', damage: Math.round(oppDamage), isCrit: false })
    } else {
      damageLog.push({ turn: turns, attacker: 'opponent', damage: 0, isCrit: false, effect: '闪避' })
    }
  }

  return {
    victory: opponentHealth <= 0,
    totalDamage,
    effectsTriggered,
    turns,
    damageLog,
  }
}
