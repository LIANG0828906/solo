import { create } from 'zustand'
import type { PlayerState, EnemyState, DungeonGenerateResponse, LootItem, GameState } from '@/game/types'

const initialPlayer: PlayerState = {
  hp: 100,
  maxHp: 100,
  energy: 50,
  maxEnergy: 50,
  energyRegen: 2,
  attack: 15,
  defense: 5,
  level: 1,
  floor: 1,
  gold: 0,
  inventory: [],
  equippedWeapon: null,
  equippedArmor: null,
  equippedAccessory: null,
  position: { x: 0, y: 0, z: 0 },
  isInvincible: false,
  isAttacking: false,
  isDead: false,
}

export const useGameStore = create<GameState & {
  startGame: (dungeonData: DungeonGenerateResponse) => void
  setPlayerPosition: (pos: { x: number; y: number; z: number }) => void
  damagePlayer: (amount: number) => void
  healPlayer: (amount: number) => void
  useEnergy: (amount: number) => void
  regenEnergy: (dt: number) => void
  setPlayerInvincible: (val: boolean) => void
  setPlayerAttacking: (val: boolean) => void
  addGold: (amount: number) => void
  addItem: (item: LootItem) => void
  equipItem: (item: LootItem) => void
  removeItem: (itemId: string) => void
  setEnemies: (enemies: EnemyState[]) => void
  updateEnemy: (id: string, updates: Partial<EnemyState>) => void
  removeEnemy: (id: string) => void
  setDungeonData: (data: DungeonGenerateResponse) => void
  nextFloor: () => void
  setGameOver: (val: boolean) => void
  setPaused: (val: boolean) => void
  setInventoryOpen: (val: boolean) => void
  setBossBar: (show: boolean, name?: string, hp?: number, maxHp?: number) => void
  updateBossHp: (hp: number) => void
  setDamageFlash: (val: number) => void
  setNewLoot: (item: LootItem | null) => void
  addMessage: (msg: string) => void
  setTransitioning: (val: boolean) => void
  resetGame: () => void
}>((set, get) => ({
  player: { ...initialPlayer },
  enemies: [],
  currentFloor: 1,
  dungeonData: null,
  isGameOver: false,
  isPaused: false,
  isInGame: false,
  isInventoryOpen: false,
  bossHp: 0,
  bossMaxHp: 0,
  showBossBar: false,
  bossName: '',
  damageFlash: 0,
  newLoot: null,
  messages: [],
  isTransitioning: false,

  startGame: (dungeonData) => set({
    player: { ...initialPlayer },
    enemies: [],
    currentFloor: 1,
    dungeonData,
    isGameOver: false,
    isPaused: false,
    isInGame: true,
    isInventoryOpen: false,
    bossHp: 0,
    bossMaxHp: 0,
    showBossBar: false,
    bossName: '',
    damageFlash: 0,
    newLoot: null,
    messages: [],
    isTransitioning: false,
  }),

  setPlayerPosition: (pos) => set((s) => ({
    player: { ...s.player, position: pos }
  })),

  damagePlayer: (amount) => set((s) => {
    const actualDmg = Math.max(1, amount - s.player.defense)
    const newHp = Math.max(0, s.player.hp - actualDmg)
    return {
      player: {
        ...s.player,
        hp: newHp,
        isDead: newHp <= 0,
      },
      damageFlash: 1,
      isGameOver: newHp <= 0,
    }
  }),

  healPlayer: (amount) => set((s) => ({
    player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + amount) }
  })),

  useEnergy: (amount) => set((s) => ({
    player: { ...s.player, energy: Math.max(0, s.player.energy - amount) }
  })),

  regenEnergy: (dt) => set((s) => ({
    player: {
      ...s.player,
      energy: Math.min(
        s.player.maxEnergy,
        s.player.energy + s.player.energyRegen * dt
      ),
    }
  })),

  setPlayerInvincible: (val) => set((s) => ({
    player: { ...s.player, isInvincible: val }
  })),

  setPlayerAttacking: (val) => set((s) => ({
    player: { ...s.player, isAttacking: val }
  })),

  addGold: (amount) => set((s) => ({
    player: { ...s.player, gold: s.player.gold + amount }
  })),

  addItem: (item) => set((s) => ({
    player: { ...s.player, inventory: [...s.player.inventory, item] },
    newLoot: item,
  })),

  equipItem: (item) => set((s) => {
    const p = { ...s.player }
    const slot = item.type === 'weapon' ? 'equippedWeapon'
      : item.type === 'armor' ? 'equippedArmor' : 'equippedAccessory'
    const prev = p[slot]
    p[slot] = item
    if (prev) {
      p.inventory = p.inventory.filter((i) => i.id !== prev.id)
    }
    p.inventory = p.inventory.filter((i) => i.id !== item.id)
    if (prev) p.inventory.push(prev)
    p.attack = 15 + (p.equippedWeapon?.stats.attackBonus ?? 0)
    p.maxHp = 100 + (p.equippedArmor?.stats.hpBonus ?? 0)
    p.energyRegen = 2 + (p.equippedAccessory?.stats.energyRegenBonus ?? 0)
    p.hp = Math.min(p.hp, p.maxHp)
    return { player: p }
  }),

  removeItem: (itemId) => set((s) => ({
    player: { ...s.player, inventory: s.player.inventory.filter((i) => i.id !== itemId) }
  })),

  setEnemies: (enemies) => set({ enemies }),

  updateEnemy: (id, updates) => set((s) => ({
    enemies: s.enemies.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),

  removeEnemy: (id) => set((s) => ({
    enemies: s.enemies.filter((e) => e.id !== id)
  })),

  setDungeonData: (data) => set({ dungeonData: data }),

  nextFloor: () => set((s) => ({
    currentFloor: s.currentFloor + 1,
    player: { ...s.player, floor: s.currentFloor + 1 },
  })),

  setGameOver: (val) => set({ isGameOver: val }),

  setPaused: (val) => set({ isPaused: val }),

  setInventoryOpen: (val) => set({ isInventoryOpen: val }),

  setBossBar: (show, name, hp, maxHp) => set({
    showBossBar: show,
    bossName: name ?? '',
    bossHp: hp ?? 0,
    bossMaxHp: maxHp ?? 0,
  }),

  updateBossHp: (hp) => set({ bossHp: hp }),

  setDamageFlash: (val) => set({ damageFlash: val }),

  setNewLoot: (item) => set({ newLoot: item }),

  addMessage: (msg) => set((s) => ({
    messages: [...s.messages.slice(-4), msg]
  })),

  setTransitioning: (val) => set({ isTransitioning: val }),

  resetGame: () => set({
    player: { ...initialPlayer },
    enemies: [],
    currentFloor: 1,
    dungeonData: null,
    isGameOver: false,
    isPaused: false,
    isInGame: false,
    isInventoryOpen: false,
    bossHp: 0,
    bossMaxHp: 0,
    showBossBar: false,
    bossName: '',
    damageFlash: 0,
    newLoot: null,
    messages: [],
    isTransitioning: false,
  }),
}))
