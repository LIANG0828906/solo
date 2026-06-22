import { create } from 'zustand'
import {
  GameState,
  GameStatus,
  GridCell,
  Player,
  MemoryFragment,
  Footprint,
  DisplayCharacter,
  GRID_SIZE,
  CELL_SIZE,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  INITIAL_TIME
} from './Types'

interface GameStore extends GameState {
  setStatus: (status: GameStatus) => void
  setTimeLeft: (time: number) => void
  setGrid: (grid: GridCell[][]) => void
  setPlayer: (player: Player) => void
  updatePlayer: (updates: Partial<Player>) => void
  setFragments: (fragments: MemoryFragment[]) => void
  setPickedSequence: (seq: string[]) => void
  addPickedCharacter: (char: string) => void
  setFootprints: (footprints: Footprint[]) => void
  addFootprint: (footprint: Footprint) => void
  setCurrentDisplay: (display: DisplayCharacter | null) => void
  setShowDialog: (show: boolean) => void
  setUserInput: (input: string) => void
  setFailAnimation: (value: number) => void
  resetGame: () => void
}

const createInitialPlayer = (): Player => ({
  x: CELL_SIZE / 2,
  y: CELL_SIZE / 2,
  radius: PLAYER_RADIUS,
  speed: PLAYER_SPEED,
  pulsePhase: 0
})

const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        isDeadEnd: false
      })
    }
    grid.push(row)
  }
  return grid
}

export const useGameStore = create<GameStore>((set) => ({
  status: 'playing',
  timeLeft: INITIAL_TIME,
  grid: createEmptyGrid(),
  player: createInitialPlayer(),
  fragments: [],
  pickedSequence: [],
  footprints: [],
  currentDisplay: null,
  showDialog: false,
  userInput: '',
  failAnimation: 0,

  setStatus: (status) => set({ status }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setGrid: (grid) => set({ grid }),
  setPlayer: (player) => set({ player }),
  updatePlayer: (updates) => set((state) => ({ player: { ...state.player, ...updates } })),
  setFragments: (fragments) => set({ fragments }),
  setPickedSequence: (pickedSequence) => set({ pickedSequence }),
  addPickedCharacter: (char) => set((state) => ({ pickedSequence: [...state.pickedSequence, char] })),
  setFootprints: (footprints) => set({ footprints }),
  addFootprint: (footprint) => set((state) => ({ footprints: [...state.footprints, footprint] })),
  setCurrentDisplay: (currentDisplay) => set({ currentDisplay }),
  setShowDialog: (showDialog) => set({ showDialog }),
  setUserInput: (userInput) => set({ userInput }),
  setFailAnimation: (failAnimation) => set({ failAnimation }),
  resetGame: () => set({
    status: 'playing',
    timeLeft: INITIAL_TIME,
    player: createInitialPlayer(),
    fragments: [],
    pickedSequence: [],
    footprints: [],
    currentDisplay: null,
    showDialog: false,
    userInput: '',
    failAnimation: 0
  })
}))
