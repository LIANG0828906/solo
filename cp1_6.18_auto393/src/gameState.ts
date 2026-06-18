import { create } from 'zustand'
import { Player, Bullet, Enemy, PowerUp, Particle, Star } from './entities'

interface GameState {
  player: Player
  bullets: Bullet[]
  enemies: Enemy[]
  powerUps: PowerUp[]
  particles: Particle[]
  stars: Star[]
  score: number
  isGameOver: boolean
  flashAlpha: number
  scoreForNextLife: number

  resetGame: () => void
  setScore: (score: number) => void
  addScore: (points: number) => void
  setGameOver: (over: boolean) => void
  setFlashAlpha: (alpha: number) => void
}

const createStars = (): Star[] => {
  const stars: Star[] = []
  for (let i = 0; i < 100; i++) {
    stars.push(new Star())
  }
  return stars
}

const initialState = () => ({
  player: new Player(),
  bullets: [] as Bullet[],
  enemies: [] as Enemy[],
  powerUps: [] as PowerUp[],
  particles: [] as Particle[],
  stars: createStars(),
  score: 0,
  isGameOver: false,
  flashAlpha: 0,
  scoreForNextLife: 500,
})

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState(),

  resetGame: () => {
    set(initialState())
  },

  setScore: (score: number) => {
    set({ score })
  },

  addScore: (points: number) => {
    const { score, player, scoreForNextLife } = get()
    const newScore = score + points
    
    let newScoreForNextLife = scoreForNextLife
    if (newScore >= scoreForNextLife) {
      player.addLife()
      newScoreForNextLife = scoreForNextLife + 500
    }
    
    set({ score: newScore, scoreForNextLife: newScoreForNextLife })
  },

  setGameOver: (over: boolean) => {
    set({ isGameOver: over })
  },

  setFlashAlpha: (alpha: number) => {
    set({ flashAlpha: alpha })
  },
}))
