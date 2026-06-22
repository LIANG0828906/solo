import { useBattleStore, type Enemy, type DamageNumber } from './store'
import { getMonsterTemplate } from './CallManager'

const WAVE_INTERVAL = 5000
const DAMAGE_NUMBER_LIFETIME = 600
const ENEMY_DEATH_DURATION = 400
const STATS_PANEL_WIDTH = 180

let enemyIdCounter = 0
let damageIdCounter = 0
let animFrameId = 0
let battleWidth = 800
let battleHeight = 600

function generateWaveEnemies(wave: number, areaWidth: number, areaHeight: number): Enemy[] {
  const count = 3 + Math.floor(Math.random() * 3)
  const enemies: Enemy[] = []
  const baseHp = 30 + wave * 15
  const hpVariance = 10 + wave * 5

  for (let i = 0; i < count; i++) {
    const hp = baseHp + Math.floor(Math.random() * hpVariance)
    const targetX = areaWidth * 0.45 + Math.random() * (areaWidth * 0.4)
    const targetY = 50 + Math.random() * (areaHeight - 160)
    enemies.push({
      id: `enemy_${++enemyIdCounter}_${Date.now()}_${i}`,
      hp,
      maxHp: hp,
      x: areaWidth + 60,
      y: targetY,
      targetX,
      targetY,
      spawnTime: performance.now(),
      isDying: false,
      deathTime: 0,
    })
  }
  return enemies
}

function getMonsterPos(slotIndex: number) {
  const cardWidth = 56
  const padding = 24
  const formationY = battleHeight - 110
  const formation = useBattleStore.getState().formation
  const totalWidth = formation.length * cardWidth
  const startX = Math.max(padding, (battleWidth - STATS_PANEL_WIDTH - totalWidth) / 2)
  return {
    x: startX + slotIndex * cardWidth + 24,
    y: formationY,
  }
}

function battleLoop(now: number) {
  const state = useBattleStore.getState()
  if (!state.battleActive) return

  let newEnemies = [...state.enemies]
  let newFormation = [...state.formation]
  let newKillCount = state.killCount
  let newMana = state.mana
  let newDamageNumbers = [...state.damageNumbers]
  let newWave = state.wave
  let newLastWaveTime = state.lastWaveTime
  let manaFlash = false

  for (let i = newDamageNumbers.length - 1; i >= 0; i--) {
    if (now - newDamageNumbers[i].createdAt > DAMAGE_NUMBER_LIFETIME) {
      newDamageNumbers.splice(i, 1)
    }
  }

  for (let i = newEnemies.length - 1; i >= 0; i--) {
    if (newEnemies[i].isDying && now - newEnemies[i].deathTime > ENEMY_DEATH_DURATION) {
      newEnemies.splice(i, 1)
    }
  }

  for (let fi = 0; fi < newFormation.length; fi++) {
    const monster = newFormation[fi]
    const template = getMonsterTemplate(monster.templateId)
    if (!template) continue
    if (now - monster.lastAttackTime < template.attackInterval) continue

    let nearestIdx = -1
    let nearestDist = Infinity
    for (let ei = 0; ei < newEnemies.length; ei++) {
      const e = newEnemies[ei]
      if (e.isDying) continue
      const mPos = getMonsterPos(monster.slotIndex)
      const dx = mPos.x - e.targetX
      const dy = mPos.y - e.targetY
      const dist = dx * dx + dy * dy
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = ei
      }
    }

    if (nearestIdx >= 0) {
      const enemy = newEnemies[nearestIdx]
      const newHp = enemy.hp - template.attack
      newEnemies[nearestIdx] = { ...enemy, hp: newHp }
      newFormation[fi] = { ...monster, lastAttackTime: now }

      const dn: DamageNumber = {
        id: `dmg_${++damageIdCounter}_${Date.now()}`,
        value: template.attack,
        x: enemy.targetX + 10,
        y: enemy.targetY - 10,
        createdAt: now,
      }
      newDamageNumbers.push(dn)

      if (newHp <= 0) {
        newEnemies[nearestIdx] = { ...newEnemies[nearestIdx], isDying: true, deathTime: now }
        newKillCount++
        newMana = Math.min(newMana + 3, 100)
        manaFlash = true
      }
    }
  }

  if (now - newLastWaveTime >= WAVE_INTERVAL) {
    newWave++
    const areaWidth = battleWidth - STATS_PANEL_WIDTH
    const areaHeight = battleHeight
    const waveEnemies = generateWaveEnemies(newWave, areaWidth, areaHeight)
    newEnemies = newEnemies.concat(waveEnemies)
    newLastWaveTime = now
  }

  useBattleStore.setState({
    enemies: newEnemies,
    formation: newFormation,
    killCount: newKillCount,
    mana: newMana,
    damageNumbers: newDamageNumbers,
    wave: newWave,
    lastWaveTime: newLastWaveTime,
    ...(manaFlash ? { manaFlash: true } : {}),
  })

  if (manaFlash) {
    setTimeout(() => useBattleStore.setState({ manaFlash: false }), 200)
  }

  animFrameId = requestAnimationFrame(battleLoop)
}

export function startBattle(width: number, height: number): () => void {
  battleWidth = width
  battleHeight = height
  const now = performance.now()

  const areaWidth = width - STATS_PANEL_WIDTH
  const firstWaveEnemies = generateWaveEnemies(1, areaWidth, height)

  useBattleStore.setState({
    battleActive: true,
    lastWaveTime: now,
    wave: 1,
    killCount: 0,
    enemies: firstWaveEnemies,
    damageNumbers: [],
    formation: [],
    mana: 50,
    manaPulse: false,
    manaFlash: false,
  })

  animFrameId = requestAnimationFrame(battleLoop)

  return () => {
    useBattleStore.setState({ battleActive: false })
    cancelAnimationFrame(animFrameId)
  }
}

export function updateBattleDimensions(width: number, height: number) {
  battleWidth = width
  battleHeight = height
}
