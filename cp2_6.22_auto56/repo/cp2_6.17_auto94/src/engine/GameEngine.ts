import type { Position, Item, Hero, CellType, Monster, Unit } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { MazeGenerator } from './MazeGenerator'
import { AIController } from './AIController'
import { BattleSystem } from './BattleSystem'

type GamePhase = 'idle' | 'player_turn' | 'enemy_turn' | 'game_over'

export class GameEngine {
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private readonly frameBudget: number = 16
  private phase: GamePhase = 'idle'
  private pendingHeroMove: { heroId: string; position: Position } | null = null
  private pendingHeroAttack: { heroId: string; monsterId: string } | null = null
  private isRunning: boolean = false
  private battleSystem: BattleSystem

  constructor() {
    this.battleSystem = new BattleSystem()
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.initGame()
    this.lastTime = performance.now()
    this.gameLoop()
    useGameStore.getState().setEngineResetCallback?.(() => this.reset())
  }

  reset(): void {
    this.stop()
    this.phase = 'idle'
    this.pendingHeroMove = null
    this.pendingHeroAttack = null
    this.start()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private initGame(): void {
    const store = useGameStore.getState()
    store.initGame()

    const { maze, monsters, startPositions } = MazeGenerator.generateMaze(12, 12)
    store.setMaze(maze)
    store.setMonsters(monsters)

    const heroes = useGameStore.getState().heroes
    heroes.forEach((hero, index) => {
      if (startPositions[index]) {
        store.updateHero(hero.id, { position: startPositions[index] })
      }
    })

    if (heroes.length > 0) {
      store.selectHero(heroes[0].id)
    }

    this.phase = 'player_turn'
    store.addBattleLog('游戏开始！探索迷宫，击败所有怪物！')
  }

  requestHeroMove(heroId: string, position: Position): void {
    if (this.phase !== 'player_turn') return

    const state = useGameStore.getState()
    const hero = state.heroes.find((h) => h.id === heroId)
    if (!hero || hero.hp <= 0) return
    if (state.selectedHeroId !== heroId) return

    const { maze, heroes, monsters } = state
    if (!this.isValidMove(position, maze, heroes, monsters, heroId)) return

    this.pendingHeroMove = { heroId, position }
  }

  requestAttack(heroId: string, monsterId: string): void {
    if (this.phase !== 'player_turn') return

    const state = useGameStore.getState()
    const hero = state.heroes.find((h) => h.id === heroId)
    const monster = state.monsters.find((m) => m.id === monsterId)

    if (!hero || !monster || hero.hp <= 0) return
    if (!this.isAdjacent(hero.position, monster.position)) return

    this.pendingHeroAttack = { heroId, monsterId }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= this.frameBudget) {
      this.lastTime = currentTime - (deltaTime % this.frameBudget)
      this.update(deltaTime)
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(_deltaTime: number): void {
    const state = useGameStore.getState()

    if (state.gameStatus !== 'playing') {
      this.phase = 'game_over'
      return
    }

    if (this.phase === 'player_turn') {
      if (this.pendingHeroAttack) {
        this.executeHeroAttack(this.pendingHeroAttack.heroId, this.pendingHeroAttack.monsterId)
        this.pendingHeroAttack = null
        this.endPlayerTurn()
      } else if (this.pendingHeroMove) {
        this.executeHeroMove(this.pendingHeroMove)
        this.pendingHeroMove = null
      }
    }

    if (this.phase === 'enemy_turn') {
      this.executeEnemyTurn()
    }

    this.cleanupAnimationEffects()
  }

  private executeHeroMove(move: { heroId: string; position: Position }): void {
    const store = useGameStore.getState()
    const hero = store.heroes.find((h) => h.id === move.heroId)
    if (!hero) return

    store.moveHero(move.heroId, move.position)
    store.addBattleLog(`${hero.name} 移动到 (${move.position.x}, ${move.position.y})`)

    this.handleItemPickup(move.position)

    const autoAttacked = this.tryAutoAttack(move.heroId)
    if (!autoAttacked) {
      this.endPlayerTurn()
    } else {
      this.endPlayerTurn()
    }
  }

  private handleItemPickup(position: Position): void {
    const store = useGameStore.getState()
    const { maze, selectedHeroId } = store

    if (maze[position.y]?.[position.x] !== 'treasure') return
    if (!selectedHeroId) return

    const items: Item[] = [
      { type: 'heal_potion', value: 30 },
      { type: 'power_potion', value: 10, duration: 3 },
      { type: 'shield_potion', value: 10, duration: 3 },
    ]
    const randomItem = items[Math.floor(Math.random() * items.length)]

    const selectedHero = store.heroes.find((h) => h.id === selectedHeroId)
    if (!selectedHero) return

    store.applyItem(selectedHeroId, randomItem)

    store.addAnimationEffect({
      type: 'item',
      position,
      targetId: selectedHeroId,
    })

    const newMaze = maze.map((row) => [...row])
    newMaze[position.y][position.x] = 'floor'
    store.setMaze(newMaze)
  }

  private tryAutoAttack(heroId: string): boolean {
    const state = useGameStore.getState()
    const hero = state.heroes.find((h) => h.id === heroId)
    if (!hero) return false

    const adjacentMonster = state.monsters.find((monster) =>
      this.isAdjacent(hero.position, monster.position)
    )

    if (adjacentMonster) {
      this.executeHeroAttack(heroId, adjacentMonster.id)
      return true
    }

    return false
  }

  private executeHeroAttack(heroId: string, monsterId: string): void {
    const state = useGameStore.getState()
    const hero = state.heroes.find((h) => h.id === heroId)
    const monster = state.monsters.find((m) => m.id === monsterId)

    if (!hero || !monster) return

    const result = BattleSystem.resolveHeroAttack(hero, monster)

    if (result.isCritical) {
      state.addBattleLog(`暴击！${hero.name} 对 ${monster.name} 造成 ${result.damage} 点伤害！`)
    } else {
      state.addBattleLog(`${hero.name} 攻击 ${monster.name}，造成 ${result.damage} 点伤害！`)
    }

    state.addAnimationEffect({
      type: 'attack',
      position: monster.position,
      targetId: monsterId,
      value: result.damage,
    })

    if (result.targetDefeated) {
      state.removeMonster(monsterId)
      state.addBattleLog(`${monster.name} 被击败了！`)
    } else {
      state.updateMonster(monsterId, { hp: result.targetHp })
    }

    this.checkWinCondition()
  }

  private endPlayerTurn(): void {
    const state = useGameStore.getState()
    if (state.gameStatus !== 'playing') return

    this.phase = 'enemy_turn'
    state.tickBuffs()
  }

  private executeEnemyTurn(): void {
    const state = useGameStore.getState()
    const { monsters, maze } = state

    const aliveMonsters = monsters.filter((m) => m.hp > 0)
    const allUnits: Unit[] = [...aliveMonsters]
    const sortedMonsters = this.battleSystem.getTurnOrder(allUnits) as Monster[]

    for (const monster of sortedMonsters) {
      if (useGameStore.getState().gameStatus !== 'playing') break

      const currentMonster = useGameStore.getState().monsters.find((m) => m.id === monster.id)
      if (!currentMonster || currentMonster.hp <= 0) continue

      const currentHeroes = useGameStore.getState().heroes
      const action = AIController.getAction(currentMonster, currentHeroes, maze)

      useGameStore.getState().updateMonster(monster.id, { aiState: action.aiState })

      if (action.type === 'move') {
        useGameStore.getState().updateMonster(monster.id, { position: action.position })
      } else if (action.type === 'attack') {
        this.executeMonsterAttack(monster.id, action.heroId)
      }

      if (this.checkLoseCondition()) {
        break
      }
    }

    if (useGameStore.getState().gameStatus === 'playing') {
      this.phase = 'player_turn'
      useGameStore.getState().incrementTurn()
    }
  }

  private executeMonsterAttack(monsterId: string, heroId: string): void {
    const state = useGameStore.getState()
    const monster = state.monsters.find((m) => m.id === monsterId)
    const hero = state.heroes.find((h) => h.id === heroId)

    if (!monster || !hero) return

    const result = BattleSystem.resolveMonsterAttack(monster, hero)

    if (result.isCritical) {
      state.addBattleLog(`暴击！${monster.name} 对 ${hero.name} 造成 ${result.damage} 点伤害！`)
    } else {
      state.addBattleLog(`${monster.name} 攻击 ${hero.name}，造成 ${result.damage} 点伤害！`)
    }

    state.addAnimationEffect({
      type: 'damage',
      position: hero.position,
      targetId: heroId,
      value: result.damage,
    })

    if (result.targetDefeated) {
      state.updateHero(heroId, { hp: 0 })
      state.addBattleLog(`${hero.name} 倒下了！`)

      const aliveHeroes = state.heroes.filter((h) => h.hp > 0)
      if (aliveHeroes.length > 0 && state.selectedHeroId === heroId) {
        state.selectHero(aliveHeroes[0].id)
      }
    } else {
      state.updateHero(heroId, { hp: result.targetHp })
    }
  }

  private checkWinCondition(): boolean {
    const state = useGameStore.getState()
    const aliveMonsters = state.monsters.filter((m) => m.hp > 0)

    if (aliveMonsters.length === 0) {
      state.updateGameStatus('won')
      state.addBattleLog('胜利！所有怪物已被击败！')
      this.phase = 'game_over'
      return true
    }

    return false
  }

  private checkLoseCondition(): boolean {
    const state = useGameStore.getState()
    const aliveHeroes = state.heroes.filter((h) => h.hp > 0)

    if (aliveHeroes.length === 0) {
      state.updateGameStatus('lost')
      state.addBattleLog('失败...英雄小队全军覆没。')
      this.phase = 'game_over'
      return true
    }

    return false
  }

  private isValidMove(
    position: Position,
    maze: CellType[][],
    heroes: Hero[],
    monsters: { position: Position }[],
    heroId: string
  ): boolean {
    if (position.x < 0 || position.y < 0 || position.y >= maze.length || position.x >= maze[0].length) {
      return false
    }

    const cell = maze[position.y][position.x]
    if (cell === 'wall') return false

    const otherHeroOnCell = heroes.some(
      (h) => h.id !== heroId && h.hp > 0 && h.position.x === position.x && h.position.y === position.y
    )
    if (otherHeroOnCell) return false

    const monsterOnCell = monsters.some(
      (m) => m.position.x === position.x && m.position.y === position.y
    )
    if (monsterOnCell) return false

    return true
  }

  private isAdjacent(a: Position, b: Position): boolean {
    const dx = Math.abs(a.x - b.x)
    const dy = Math.abs(a.y - b.y)
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)
  }

  private cleanupAnimationEffects(): void {
    const state = useGameStore.getState()
    const now = Date.now()
    const effects = state.animationEffects.filter((e) => now - e.createdAt < 1500)

    if (effects.length !== state.animationEffects.length) {
      useGameStore.setState({ animationEffects: effects })
    }
  }

  getPhase(): GamePhase {
    return this.phase
  }
}

export const gameEngine = new GameEngine()
