import type { Potion, BattleOutcome, BattleRound } from "@/types"
import { ALL_RECIPES } from "@/modules/alchemy"

const ENEMY_POTIONS: Potion[] = ALL_RECIPES.filter(
  (r) => r.product.rarity === "common" || r.product.rarity === "rare"
).map((r) => r.product)

export function getRandomEnemyPotion(): Potion {
  return ENEMY_POTIONS[Math.floor(Math.random() * ENEMY_POTIONS.length)]
}

function applyAction(
  potion: Potion,
  opponentDamageReduction: number
): { damage: number; heal: number; selfDamageReduction: number; log: string; actionName: string } {
  switch (potion.type) {
    case "damage": {
      const raw = potion.power
      const damage = Math.max(1, Math.round(raw * (1 - opponentDamageReduction)))
      return {
        damage,
        heal: 0,
        selfDamageReduction: 0,
        log: `使用「${potion.name}」造成了 ${damage} 点伤害`,
        actionName: "damage",
      }
    }
    case "heal": {
      const heal = potion.power
      return {
        damage: 0,
        heal,
        selfDamageReduction: 0,
        log: `使用「${potion.name}」恢复了 ${heal} 点生命`,
        actionName: "heal",
      }
    }
    case "weaken": {
      const halfDamage = Math.round(potion.power / 2)
      const damage = Math.max(1, Math.round(halfDamage * (1 - opponentDamageReduction)))
      const selfDamageReduction = 0.3
      return {
        damage,
        heal: 0,
        selfDamageReduction,
        log: `使用「${potion.name}」造成了 ${damage} 点伤害，并削弱了对方下次攻击30%伤害`,
        actionName: "weaken",
      }
    }
  }
}

export function simulateBattle(playerPotion: Potion, enemyPotion: Potion): BattleOutcome {
  const rounds: BattleRound[] = []
  const logs: string[] = []
  let playerHp = 100
  let enemyHp = 100
  const maxHp = 100
  let playerDamageReduction = 0
  let enemyDamageReduction = 0

  logs.push(`你装备了「${playerPotion.name}」`)
  logs.push(`敌人装备了「${enemyPotion.name}」`)
  logs.push("战斗开始！")
  logs.push("")

  for (let i = 1; i <= 3; i++) {
    if (playerHp <= 0 || enemyHp <= 0) break

    logs.push(`—— 第 ${i} 回合 ——`)

    const playerAction = applyAction(playerPotion, enemyDamageReduction)
    const enemyAction = applyAction(enemyPotion, playerDamageReduction)

    logs.push(`你${playerAction.log}`)
    enemyHp -= playerAction.damage
    playerHp = Math.min(maxHp, playerHp + playerAction.heal)
    if (playerHp <= 0 || enemyHp <= 0) {
      playerHp = Math.max(0, playerHp)
      enemyHp = Math.max(0, enemyHp)
      rounds.push({
        playerAction: playerAction.actionName,
        enemyAction: enemyAction.actionName,
        playerDamage: enemyAction.damage,
        enemyDamage: playerAction.damage,
        playerHeal: playerAction.heal,
        enemyHeal: enemyAction.heal,
        playerHpAfter: playerHp,
        enemyHpAfter: enemyHp,
      })
      break
    }

    logs.push(`敌人${enemyAction.log}`)
    playerHp -= enemyAction.damage
    enemyHp = Math.min(maxHp, enemyHp + enemyAction.heal)

    playerHp = Math.max(0, playerHp)
    enemyHp = Math.max(0, enemyHp)

    playerDamageReduction = enemyAction.selfDamageReduction
    enemyDamageReduction = playerAction.selfDamageReduction

    rounds.push({
      playerAction: playerAction.actionName,
      enemyAction: enemyAction.actionName,
      playerDamage: enemyAction.damage,
      enemyDamage: playerAction.damage,
      playerHeal: playerAction.heal,
      enemyHeal: enemyAction.heal,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    })

    logs.push("")
  }

  playerHp = Math.max(0, playerHp)
  enemyHp = Math.max(0, enemyHp)

  let winner: "player" | "enemy" | "draw"
  if (playerHp > 0 && enemyHp <= 0) {
    winner = "player"
    logs.push("你获得了胜利！")
  } else if (enemyHp > 0 && playerHp <= 0) {
    winner = "enemy"
    logs.push("你被击败了……")
  } else if (playerHp > enemyHp) {
    winner = "player"
    logs.push(`你的剩余生命更高，你获得了胜利！(${playerHp} vs ${enemyHp})`)
  } else if (enemyHp > playerHp) {
    winner = "enemy"
    logs.push(`敌人剩余生命更高，你被击败了……(${playerHp} vs ${enemyHp})`)
  } else {
    winner = "draw"
    logs.push(`双方势均力敌，平局！(${playerHp} vs ${enemyHp})`)
  }

  return {
    rounds,
    logs,
    playerFinalHp: playerHp,
    enemyFinalHp: enemyHp,
    winner,
  }
}
