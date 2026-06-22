import { create } from 'zustand'

export interface MonsterTemplate {
  id: string
  name: string
  race: string
  cost: number
  attack: number
  attackInterval: number
  emoji: string
}

export interface MonsterInstance {
  id: string
  templateId: string
  slotIndex: number
  lastAttackTime: number
}

export interface Enemy {
  id: string
  hp: number
  maxHp: number
  x: number
  y: number
  targetX: number
  targetY: number
  spawnTime: number
  isDying: boolean
  deathTime: number
}

export interface DamageNumber {
  id: string
  value: number
  x: number
  y: number
  createdAt: number
}

export interface BattleState {
  mana: number
  maxMana: number
  wave: number
  killCount: number
  formation: MonsterInstance[]
  enemies: Enemy[]
  damageNumbers: DamageNumber[]
  manaPulse: boolean
  manaFlash: boolean
  battleActive: boolean
  lastWaveTime: number
}

interface BattleActions {
  setMana: (mana: number) => void
  addMana: (amount: number) => void
  incrementWave: () => void
  incrementKillCount: () => void
  addToFormation: (monster: MonsterInstance) => void
  reorderFormation: (oldIndex: number, newIndex: number) => void
  setEnemies: (enemies: Enemy[]) => void
  addEnemies: (enemies: Enemy[]) => void
  updateEnemyHp: (id: string, hp: number) => void
  setEnemyDying: (id: string, deathTime: number) => void
  removeEnemy: (id: string) => void
  addDamageNumber: (dn: DamageNumber) => void
  removeDamageNumber: (id: string) => void
  setManaPulse: (v: boolean) => void
  setManaFlash: (v: boolean) => void
  setBattleActive: (v: boolean) => void
  setLastWaveTime: (t: number) => void
  updateMonsterAttackTime: (id: string, time: number) => void
}

export const useBattleStore = create<BattleState & BattleActions>((set) => ({
  mana: 50,
  maxMana: 100,
  wave: 0,
  killCount: 0,
  formation: [],
  enemies: [],
  damageNumbers: [],
  manaPulse: false,
  manaFlash: false,
  battleActive: false,
  lastWaveTime: 0,

  setMana: (mana) => set({ mana: Math.max(0, Math.min(mana, 100)) }),
  addMana: (amount) => set((s) => ({ mana: Math.max(0, Math.min(s.mana + amount, 100)) })),
  incrementWave: () => set((s) => ({ wave: s.wave + 1 })),
  incrementKillCount: () => set((s) => ({ killCount: s.killCount + 1 })),
  addToFormation: (monster) =>
    set((s) => ({
      formation: [...s.formation, { ...monster, slotIndex: s.formation.length }],
    })),
  reorderFormation: (oldIndex, newIndex) =>
    set((s) => {
      const newFormation = [...s.formation]
      const [moved] = newFormation.splice(oldIndex, 1)
      newFormation.splice(newIndex, 0, moved)
      return {
        formation: newFormation.map((m, i) => ({ ...m, slotIndex: i })),
      }
    }),
  setEnemies: (enemies) => set({ enemies }),
  addEnemies: (enemies) => set((s) => ({ enemies: [...s.enemies, ...enemies] })),
  updateEnemyHp: (id, hp) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, hp } : e)),
    })),
  setEnemyDying: (id, deathTime) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, isDying: true, deathTime } : e)),
    })),
  removeEnemy: (id) => set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),
  addDamageNumber: (dn) => set((s) => ({ damageNumbers: [...s.damageNumbers, dn] })),
  removeDamageNumber: (id) =>
    set((s) => ({ damageNumbers: s.damageNumbers.filter((d) => d.id !== id) })),
  setManaPulse: (v) => set({ manaPulse: v }),
  setManaFlash: (v) => set({ manaFlash: v }),
  setBattleActive: (v) => set({ battleActive: v }),
  setLastWaveTime: (t) => set({ lastWaveTime: t }),
  updateMonsterAttackTime: (id, time) =>
    set((s) => ({
      formation: s.formation.map((m) => (m.id === id ? { ...m, lastAttackTime: time } : m)),
    })),
}))
