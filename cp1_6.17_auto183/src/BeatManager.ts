import { eventBus } from './EventBus'
import { useGameStore } from './state'
import type { Note, Obstacle } from './state'

export class BeatManager {
  private beatEventListener: (() => void) | null = null
  private lastNoteBeat: number = -1
  private lastObstacleBeat: number = -1
  private noteIdCounter: number = 0
  private obstacleIdCounter: number = 0
  private scrollSpeed: number = 300
  private gameTime: number = 0

  constructor() {
    this.beatEventListener = eventBus.on('beat', this.handleBeat.bind(this))
  }

  private handleBeat(beatTime: number): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    const difficulty = state.difficulty
    const beatInterval = 60 / state.bpm

    const noteEveryNBars = this.getNoteFrequency(difficulty)
    const obstacleEveryNBars = this.getObstacleFrequency(difficulty)

    const beatIndex = Math.round(beatTime / beatInterval)
    const isStrongBeat = beatIndex % 4 === 0

    if (beatIndex - this.lastNoteBeat >= noteEveryNBars * 4) {
      this.spawnNote(difficulty, isStrongBeat)
      this.lastNoteBeat = beatIndex
    }

    if (beatIndex - this.lastObstacleBeat >= obstacleEveryNBars * 4 && beatIndex > 8) {
      this.spawnObstacle(difficulty)
      this.lastObstacleBeat = beatIndex
    }
  }

  private getNoteFrequency(difficulty: number): number {
    if (difficulty <= 2) return 1
    if (difficulty <= 4) return 0.75
    if (difficulty <= 6) return 0.5
    if (difficulty <= 8) return 0.4
    return 0.33
  }

  private getObstacleFrequency(difficulty: number): number {
    if (difficulty <= 2) return 4
    if (difficulty <= 4) return 3
    if (difficulty <= 6) return 2
    if (difficulty <= 8) return 1.5
    return 1
  }

  private spawnNote(difficulty: number, isStrongBeat: boolean): void {
    const state = useGameStore.getState()
    const randomOffset = (Math.random() - 0.5) * 2 * 10 * (difficulty - 1)

    let lane = Math.floor(Math.random() * 3)

    if (difficulty > 5) {
      const playerLane = state.playerPos
      if (Math.random() < 0.4 + (difficulty - 5) * 0.1) {
        lane = playerLane
      }
    }

    const note: Note = {
      id: `note_${++this.noteIdCounter}`,
      lane,
      y: -50 + randomOffset,
      collected: false,
      isStrongBeat,
      spawnTime: this.gameTime,
    }

    useGameStore.getState().addNote(note)
  }

  private spawnObstacle(difficulty: number): void {
    const state = useGameStore.getState()

    let lane = Math.floor(Math.random() * 3)

    if (difficulty > 3) {
      const playerLane = state.playerPos
      if (Math.random() < 0.3 + (difficulty - 3) * 0.08) {
        lane = playerLane
      }
    }

    const obstacle: Obstacle = {
      id: `obstacle_${++this.obstacleIdCounter}`,
      lane,
      y: -100,
      hit: false,
      warningStartTime: this.gameTime,
      spawnTime: this.gameTime + 0.5,
    }

    useGameStore.getState().addObstacle(obstacle)
  }

  update(gameTime: number, deltaTime: number): void {
    this.gameTime = gameTime
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    const speedMultiplier = 1 + (state.difficulty - 1) * 0.05
    const speed = this.scrollSpeed * speedMultiplier * deltaTime

    const updatedNotes = state.notes
      .map((note) => ({
        ...note,
        y: note.y + speed,
      }))
      .filter((note) => note.y < 700 && !note.collected)

    const updatedObstacles = state.obstacles
      .map((obstacle) => ({
        ...obstacle,
        y: obstacle.y + speed,
      }))
      .filter((obstacle) => obstacle.y < 700 && !obstacle.hit)

    if (
      updatedNotes.length !== state.notes.length ||
      updatedNotes.some((n, i) => n.y !== state.notes[i]?.y)
    ) {
      useGameStore.setState({ notes: updatedNotes })
    }

    if (
      updatedObstacles.length !== state.obstacles.length ||
      updatedObstacles.some((o, i) => o.y !== state.obstacles[i]?.y)
    ) {
      useGameStore.setState({ obstacles: updatedObstacles })
    }
  }

  reset(): void {
    this.lastNoteBeat = -1
    this.lastObstacleBeat = -1
    this.gameTime = 0
  }

  destroy(): void {
    if (this.beatEventListener) {
      this.beatEventListener()
    }
  }
}
