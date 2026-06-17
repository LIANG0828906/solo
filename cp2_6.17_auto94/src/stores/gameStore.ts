import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { GameState, GameActions, Hero, Monster, CellType, Position, GameStatus, AnimationEffect, Item } from '@/types'

const generateInitialMaze = (): CellType[][] => {
  const size = 12
  const maze: CellType[][] = Array(size).fill(null).map(() => 
    Array(size).fill('wall' as CellType)
  )
  
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      maze[y][x] = 'floor'
    }
  }
  
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * (size - 2)) + 1
    const y = Math.floor(Math.random() * (size - 2)) + 1
    if (!(x === 1 && y === 1) && !(x === size - 2 && y === size - 2)) {
      maze[y][x] = 'wall'
    }
  }
  
  maze[1][1] = 'floor'
  maze[size - 2][size - 2] = 'exit'
  maze[5][5] = 'treasure'
  maze[8][3] = 'treasure'
  
  return maze
}

const createInitialHeroes = (): Hero[] => [
  {
    id: uuidv4(),
    name: '战士',
    type: 'warrior',
    position: { x: 1, y: 1 },
    hp: 100,
    maxHp: 100,
    attack: 25,
    defense: 15,
    speed: 8,
    skills: [
      { name: '重击', type: 'damage', power: 40, value: 40, cooldown: 3, currentCooldown: 0 },
      { name: '防御姿态', type: 'buff', power: 10, value: 10, cooldown: 4, currentCooldown: 0 }
    ],
    buffs: [],
    activeBuffs: [],
    level: 1,
    experience: 0,
    gold: 0,
    inventory: []
  },
  {
    id: uuidv4(),
    name: '法师',
    type: 'mage',
    position: { x: 1, y: 2 },
    hp: 70,
    maxHp: 70,
    attack: 35,
    defense: 8,
    speed: 10,
    skills: [
      { name: '火球术', type: 'damage', power: 50, value: 50, cooldown: 2, currentCooldown: 0 },
      { name: '魔力护盾', type: 'buff', power: 8, value: 8, cooldown: 3, currentCooldown: 0 }
    ],
    buffs: [],
    activeBuffs: [],
    level: 1,
    experience: 0,
    gold: 0,
    inventory: []
  },
  {
    id: uuidv4(),
    name: '牧师',
    type: 'cleric',
    position: { x: 2, y: 1 },
    hp: 80,
    maxHp: 80,
    attack: 15,
    defense: 12,
    speed: 9,
    skills: [
      { name: '治愈术', type: 'heal', power: 35, value: 35, cooldown: 2, currentCooldown: 0 },
      { name: '神圣祝福', type: 'buff', power: 12, value: 12, cooldown: 5, currentCooldown: 0 }
    ],
    buffs: [],
    activeBuffs: [],
    level: 1,
    experience: 0,
    gold: 0,
    inventory: []
  }
]

const createInitialMonsters = (): Monster[] => [
  {
    id: uuidv4(),
    name: '哥布林',
    position: { x: 6, y: 4 },
    hp: 50,
    maxHp: 50,
    attack: 18,
    defense: 5,
    speed: 7,
    aiState: 'patrol',
    skills: [{ name: '撕咬', type: 'damage', power: 25, value: 25, cooldown: 0, currentCooldown: 0 }],
    buffs: [],
    expReward: 50,
    goldReward: 20,
    loot: []
  },
  {
    id: uuidv4(),
    name: '骷髅兵',
    position: { x: 8, y: 8 },
    hp: 60,
    maxHp: 60,
    attack: 22,
    defense: 8,
    speed: 6,
    aiState: 'patrol',
    skills: [{ name: '骨刃', type: 'damage', power: 30, value: 30, cooldown: 0, currentCooldown: 0 }],
    buffs: [],
    expReward: 70,
    goldReward: 30,
    loot: []
  },
  {
    id: uuidv4(),
    name: '史莱姆',
    position: { x: 4, y: 9 },
    hp: 40,
    maxHp: 40,
    attack: 12,
    defense: 3,
    speed: 5,
    aiState: 'patrol',
    skills: [{ name: '酸液', type: 'damage', power: 20, value: 20, cooldown: 0, currentCooldown: 0 }],
    buffs: [],
    expReward: 30,
    goldReward: 15,
    loot: []
  }
]

const createInitialState = (): GameState => ({
  maze: generateInitialMaze(),
  heroes: createInitialHeroes(),
  monsters: createInitialMonsters(),
  turn: 1,
  selectedHeroId: null,
  battleLog: ['游戏开始！英雄小队进入迷宫...'],
  gameStatus: 'playing',
  animationEffects: []
})

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  selectHero: (id: string | null) => set({ selectedHeroId: id }),

  moveHero: (heroId: string, position: Position) => set((state) => ({
    heroes: state.heroes.map((h) =>
      h.id === heroId ? { ...h, position } : h
    )
  })),

  attackMonster: (heroId: string, monsterId: string) => set((state) => {
    const hero = state.heroes.find((h) => h.id === heroId)
    const monster = state.monsters.find((m) => m.id === monsterId)
    
    if (!hero || !monster) return state
    
    const damage = Math.max(hero.attack - monster.defense, 1)
    const newHp = Math.max(monster.hp - damage, 0)
    
    return {
      monsters: state.monsters.map((m) =>
        m.id === monsterId ? { ...m, hp: newHp } : m
      ).filter((m) => m.hp > 0),
      battleLog: [...state.battleLog, `${hero.name} 对 ${monster.name} 造成 ${damage} 点伤害！${newHp <= 0 ? `${monster.name} 被击败！` : ''}`]
    }
  }),

  addLog: (message: string) => set((state) => ({
    battleLog: [...state.battleLog, message]
  })),

  addBattleLog: (message: string) => set((state) => ({
    battleLog: [...state.battleLog, message]
  })),

  setGameStatus: (status: GameStatus) => set({ gameStatus: status }),

  updateGameStatus: (status: GameStatus) => set({ gameStatus: status }),

  resetGame: () => set(createInitialState()),

  initGame: () => set(createInitialState()),

  setMaze: (maze: CellType[][]) => set({ maze }),

  setMonsters: (monsters: Monster[]) => set({ monsters }),

  updateHero: (heroId: string, updates: Partial<Hero>) => set((state) => ({
    heroes: state.heroes.map((h) =>
      h.id === heroId ? { ...h, ...updates } : h
    )
  })),

  updateMonster: (monsterId: string, updates: Partial<Monster>) => set((state) => ({
    monsters: state.monsters.map((m) =>
      m.id === monsterId ? { ...m, ...updates } : m
    )
  })),

  removeMonster: (monsterId: string) => set((state) => ({
    monsters: state.monsters.filter((m) => m.id !== monsterId)
  })),

  applyItem: (heroId: string, item: Item) => set((state) => {
    const hero = state.heroes.find((h) => h.id === heroId)
    if (!hero) return state

    let newHero = { ...hero }

    switch (item.type) {
      case 'heal_potion':
        newHero.hp = Math.min(hero.maxHp, hero.hp + item.value)
        return {
          heroes: state.heroes.map((h) => h.id === heroId ? newHero : h),
          battleLog: [...state.battleLog, `${hero.name} 拾取了治疗药水，恢复 ${item.value} 点生命值！`]
        }
      case 'power_potion':
        newHero.buffs = [
          ...hero.buffs,
          {
            id: uuidv4(),
            name: '力量药水',
            stat: 'attack',
            type: 'attack',
            value: item.value,
            remainingTurns: item.duration || 3,
            duration: item.duration || 3
          }
        ]
        newHero.activeBuffs = newHero.buffs
        return {
          heroes: state.heroes.map((h) => h.id === heroId ? newHero : h),
          battleLog: [...state.battleLog, `${hero.name} 拾取了力量药水，攻击力提升 ${item.value} 点，持续 ${item.duration} 回合！`]
        }
      case 'shield_potion':
        newHero.buffs = [
          ...hero.buffs,
          {
            id: uuidv4(),
            name: '护盾药水',
            stat: 'defense',
            type: 'defense',
            value: item.value,
            remainingTurns: item.duration || 3,
            duration: item.duration || 3
          }
        ]
        newHero.activeBuffs = newHero.buffs
        return {
          heroes: state.heroes.map((h) => h.id === heroId ? newHero : h),
          battleLog: [...state.battleLog, `${hero.name} 拾取了护盾药水，防御力提升 ${item.value} 点，持续 ${item.duration} 回合！`]
        }
      default:
        return state
    }
  }),

  tickBuffs: () => set((state) => ({
    heroes: state.heroes.map((hero) => {
      const updatedBuffs = hero.buffs
        .map((buff) => ({ ...buff, remainingTurns: buff.remainingTurns - 1, duration: buff.duration - 1 }))
        .filter((buff) => buff.remainingTurns > 0)
      return {
        ...hero,
        buffs: updatedBuffs,
        activeBuffs: updatedBuffs
      }
    })
  })),

  incrementTurn: () => set((state) => ({ turn: state.turn + 1 })),

  addAnimationEffect: (effect: AnimationEffect) => set((state) => ({
    animationEffects: [...state.animationEffects, { ...effect, id: uuidv4(), createdAt: Date.now() }]
  }))
}))
