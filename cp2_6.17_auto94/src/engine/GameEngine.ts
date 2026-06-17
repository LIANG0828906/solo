import type { Position, Item, Hero, CellType } from '@/types'
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
  private isRunning: boolean = false

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.initGame()
    this.lastTime = performance.now()
    this.gameLoop()
    useGameStore.getState().setEngineResetCallback(() => this.reset())
  }

  reset(): void {
    this.stop()
    this.phase = 'idle'
    this.pendingHeroMove = null
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

    this.phase = 'player_turn'
    store.addBattleLog('Explore the maze and defeat all monsters!')
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

    this.executeHeroAttack(heroId, monsterId)
    this.endPlayerTurn()
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

    if (this.phase === 'player_turn' && this.pendingHeroMove) {
      this.executeHeroMove(this.pendingHeroMove)
      this.pendingHeroMove = null
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
    store.addBattleLog(`${hero.name} moves to (${move.position.x}, ${move.position.y})`)

    this.handleItemPickup(move.heroId, move.position)

    const autoAttacked = this.tryAutoAttack(move.heroId)
    if (!autoAttacked) {
      this.endPlayerTurn()
    } else {
      this.endPlayerTurn()
    }
  }

  private handleItemPickup(heroId: string, position: Position): void {
    const store = useGameStore.getState()
    const { maze } = store

    if (maze[position.y]?.[position.x] === 'treasure') {
      const items: Item[] = [
        { type: 'heal_potion', value: 30 },
        { type: 'power_potion', value: 10, duration: 3 },
        { type: 'shield_potion', value: 10, duration: 3 },
      ]
      const randomItem = items[Math.floor(Math.random() * items.length)]

      store.applyItem(heroId, randomItem)

      const newMaze = maze.map((row) => [...row])
      newMaze[position.y][position.x] = 'floor'
      store.setMaze(newMaze)
    }
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
      state.addBattleLog(`Critical hit! ${hero.name} attacks ${monster.name} for ${result.damage} damage!`)
    } else {
      state.addBattleLog(`${hero.name} attacks ${monster.name} for ${result.damage} damage!`)
    }

    state.addAnimationEffect({
      type: 'attack',
      position: monster.position,
      targetId: monsterId,
      value: result.damage,
    })

    if (result.targetDefeated) {
      state.removeMonster(monsterId)
      state.addBattleLog(`${monster.name} has been defeated!`)
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
    const sortedMonsters = [...aliveMonsters].sort((a, b) => b.speed - a.speed)

    for (const monster of sortedMonsters) {
      if (state.gameStatus !== 'playing') break

      const currentMonster = useGameStore.getState().monsters.find((m) => m.id === monster.id)
      if (!currentMonster || currentMonster.hp <= 0) continue

      const currentHeroes = useGameStore.getState().heroes
      const action = AIController.getAction(currentMonster, currentHeroes, maze)

      if (action.type === 'move') {
        useGameStore.getState().updateMonster(monster.id, { position: action.position })
      } else if (action.type === 'attack') {
        this.executeMonsterAttack(monster.id, action.heroId)
      }

      if (this.checkLoseCondition()) {
        break
      }
    }

    if (state.gameStatus === 'playing') {
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
      state.addBattleLog(`Critical hit! ${monster.name} attacks ${hero.name} for ${result.damage} damage!`)
    } else {
      state.addBattleLog(`${monster.name} attacks ${hero.name} for ${result.damage} damage!`)
    }

    state.addAnimationEffect({
      type: 'damage',
      position: hero.position,
      targetId: heroId,
      value: result.damage,
    })

    if (result.targetDefeated) {
      state.updateHero(heroId, { hp: 0 })
      state.addBattleLog(`${hero.name} has fallen!`)

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
      state.addBattleLog('Victory! All monsters have been defeated!')
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
      state.addBattleLog('Defeat! All heroes have fallen...')
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
    const effects = state.animationEffects.filter((e) => now - e.createdAt < 1000)

    if (effects.length !== state.animationEffects.length) {
      useGameStore.setState({ animationEffects: effects })
    }
  }

  getPhase(): GamePhase {
    return this.phase
  }
}

export const gameEngine = new GameEngine()
