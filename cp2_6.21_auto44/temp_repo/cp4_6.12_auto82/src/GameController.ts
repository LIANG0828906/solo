import type { Direction } from './GameEngine'
import { GameEngine } from './GameEngine'

interface KeyMapping {
  [key: string]: { playerId: number; direction: Direction }
}

const KEY_MAPPINGS: KeyMapping = {
  'w': { playerId: 0, direction: 'up' },
  'W': { playerId: 0, direction: 'up' },
  's': { playerId: 0, direction: 'down' },
  'S': { playerId: 0, direction: 'down' },
  'a': { playerId: 0, direction: 'left' },
  'A': { playerId: 0, direction: 'left' },
  'd': { playerId: 0, direction: 'right' },
  'D': { playerId: 0, direction: 'right' },

  'ArrowUp': { playerId: 1, direction: 'up' },
  'ArrowDown': { playerId: 1, direction: 'down' },
  'ArrowLeft': { playerId: 1, direction: 'left' },
  'ArrowRight': { playerId: 1, direction: 'right' },

  't': { playerId: 2, direction: 'up' },
  'T': { playerId: 2, direction: 'up' },
  'g': { playerId: 2, direction: 'down' },
  'G': { playerId: 2, direction: 'down' },
  'f': { playerId: 2, direction: 'left' },
  'F': { playerId: 2, direction: 'left' },
  'h': { playerId: 2, direction: 'right' },
  'H': { playerId: 2, direction: 'right' },

  'i': { playerId: 3, direction: 'up' },
  'I': { playerId: 3, direction: 'up' },
  'k': { playerId: 3, direction: 'down' },
  'K': { playerId: 3, direction: 'down' },
  'j': { playerId: 3, direction: 'left' },
  'J': { playerId: 3, direction: 'left' },
  'l': { playerId: 3, direction: 'right' },
  'L': { playerId: 3, direction: 'right' },

  'Numpad8': { playerId: 4, direction: 'up' },
  'Numpad5': { playerId: 4, direction: 'down' },
  'Numpad4': { playerId: 4, direction: 'left' },
  'Numpad6': { playerId: 4, direction: 'right' },

  'o': { playerId: 5, direction: 'up' },
  'O': { playerId: 5, direction: 'up' },
  'm': { playerId: 5, direction: 'down' },
  'M': { playerId: 5, direction: 'down' },
  'n': { playerId: 5, direction: 'left' },
  'N': { playerId: 5, direction: 'left' },
  'b': { playerId: 5, direction: 'right' },
  'B': { playerId: 5, direction: 'right' },
}

export class GameController {
  private engine: GameEngine
  private handler: (e: KeyboardEvent) => void
  private playerCount: number
  private keyQueue: Map<number, Direction> = new Map()

  constructor(engine: GameEngine, playerCount: number) {
    this.engine = engine
    this.playerCount = playerCount
    this.handler = this.handleKeyDown.bind(this)
  }

  attach(): void {
    window.addEventListener('keydown', this.handler)
  }

  detach(): void {
    window.removeEventListener('keydown', this.handler)
    this.keyQueue.clear()
  }

  updatePlayerCount(count: number): void {
    this.playerCount = count
  }

  flushQueue(): void {
    for (const [playerId, direction] of this.keyQueue) {
      this.engine.setDirection(playerId, direction)
    }
    this.keyQueue.clear()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault()
    }

    let mapping: { playerId: number; direction: Direction } | undefined

    if (e.code && e.code.startsWith('Numpad')) {
      mapping = KEY_MAPPINGS[e.code]
    } else {
      mapping = KEY_MAPPINGS[e.key] || KEY_MAPPINGS[e.code]
    }

    if (!mapping) return
    if (mapping.playerId >= this.playerCount) return
    if (this.playerCount <= 4 && mapping.playerId >= 4) return

    const current = this.keyQueue.get(mapping.playerId)
    if (!current) {
      this.keyQueue.set(mapping.playerId, mapping.direction)
    }
  }
}
