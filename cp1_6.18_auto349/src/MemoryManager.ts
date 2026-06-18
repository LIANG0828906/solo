import { MemoryFragment, GridCell, GRID_SIZE, CELL_SIZE } from './Types'
import { MazeGenerator } from './MazeGenerator'

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const FRAGMENT_COUNT = 4

export class MemoryManager {
  private fragments: MemoryFragment[] = []
  private pickedSequence: string[] = []

  init(mazeGenerator: MazeGenerator): void {
    this.fragments = []
    this.pickedSequence = []

    const deadEnds = mazeGenerator.getDeadEnds()
    const shuffled = [...deadEnds].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(FRAGMENT_COUNT, shuffled.length))

    for (let i = 0; i < selected.length; i++) {
      const cell = selected[i]
      const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      this.fragments.push({
        gridX: cell.x,
        gridY: cell.y,
        character: char,
        picked: false,
        pickAnimation: 0
      })
    }
  }

  getFragments(): MemoryFragment[] {
    return this.fragments
  }

  getPickedSequence(): string[] {
    return this.pickedSequence
  }

  getCorrectSequence(): string[] {
    return this.fragments
      .filter(f => f.picked)
      .map(f => f.character)
  }

  pickFragment(playerX: number, playerY: number): MemoryFragment | null {
    const playerGridX = Math.floor(playerX / CELL_SIZE)
    const playerGridY = Math.floor(playerY / CELL_SIZE)

    for (const fragment of this.fragments) {
      if (!fragment.picked && fragment.gridX === playerGridX && fragment.gridY === playerGridY) {
        const fragCenterX = fragment.gridX * CELL_SIZE + CELL_SIZE / 2
        const fragCenterY = fragment.gridY * CELL_SIZE + CELL_SIZE / 2
        const dist = Math.sqrt(
          Math.pow(playerX - fragCenterX, 2) + Math.pow(playerY - fragCenterY, 2)
        )
        if (dist < CELL_SIZE / 2) {
          fragment.picked = true
          fragment.pickAnimation = 0
          this.pickedSequence.push(fragment.character)
          return fragment
        }
      }
    }
    return null
  }

  updateAnimations(deltaTime: number): void {
    for (const fragment of this.fragments) {
      if (fragment.picked && fragment.pickAnimation < 1) {
        fragment.pickAnimation = Math.min(1, fragment.pickAnimation + deltaTime / 400)
      }
    }
  }

  allPicked(): boolean {
    return this.fragments.every(f => f.picked)
  }

  checkSequence(input: string): boolean {
    const correct = this.getCorrectSequence().join('')
    return input.toUpperCase() === correct
  }

  getFragmentCount(): number {
    return this.fragments.length
  }

  getPickedCount(): number {
    return this.fragments.filter(f => f.picked).length
  }
}
