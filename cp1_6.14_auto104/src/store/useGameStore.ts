import { create } from 'zustand'
import type {
  CommandType,
  GamePhase,
  Robot,
  RobotType,
  TurnSnapshot
} from '@/core/types'
import { GameEngine } from '@/core/GameEngine'
import { COMMAND_SLOTS, TURN_DELAY_MS } from '@/config/gameConfig'

interface GameStoreState {
  phase: GamePhase
  turn: number
  currentCommandIndex: number
  selectedRobotType: RobotType | null
  playerCommands: CommandType[]
  robots: Robot[]
  latestSnapshot: TurnSnapshot | null
  replaySnapshots: TurnSnapshot[]
  replayIndex: number
  winner: Robot | null
  engine: GameEngine
  countdown: number

  setPhase: (p: GamePhase) => void
  selectRobot: (t: RobotType) => void
  setPlayerCommand: (index: number, cmd: CommandType | null) => void
  clearPlayerCommands: () => void
  moveCommand: (from: number, to: number) => void
  createBattle: () => void
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  applyPlayerCommands: () => void
  advanceTurn: () => Promise<void>
  gotoReplayIndex: (idx: number) => void
  resetAll: () => void
  setCountdown: (n: number) => void
}

export const engineSingleton = new GameEngine()

export const useGameStore = create<GameStoreState>((set, get) => ({
  phase: 'lobby',
  turn: 0,
  currentCommandIndex: -1,
  selectedRobotType: null,
  playerCommands: [
    'forward',
    'turnRight',
    'attack',
    'forward',
    'defend',
    'scan'
  ] as CommandType[],
  robots: [],
  latestSnapshot: null,
  replaySnapshots: [],
  replayIndex: 0,
  winner: null,
  engine: engineSingleton,
  countdown: 10,

  setPhase: (p) => set({ phase: p }),

  selectRobot: (t) => {
    set({ selectedRobotType: t })
  },

  setPlayerCommand: (index, cmd) => {
    const arr = [...get().playerCommands]
    if (cmd === null) {
      arr.splice(index, 1)
      while (arr.length < COMMAND_SLOTS) arr.push('forward')
    } else {
      arr[index] = cmd
    }
    set({ playerCommands: arr.slice(0, COMMAND_SLOTS) })
  },

  clearPlayerCommands: () => {
    set({ playerCommands: Array(COMMAND_SLOTS).fill('forward') as CommandType[] })
  },

  moveCommand: (from, to) => {
    const arr = [...get().playerCommands]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    set({ playerCommands: arr.slice(0, COMMAND_SLOTS) })
  },

  createBattle: () => {
    const { selectedRobotType, playerCommands, engine } = get()
    if (!selectedRobotType) return
    engine.initBattle(selectedRobotType)
    engine.setPlayerCommands(playerCommands)
    const initial = engine.snapshots[engine.snapshots.length - 1] ?? null
    set({
      phase: 'playing',
      turn: 1,
      currentCommandIndex: -1,
      robots: initial ? initial.robots : [],
      latestSnapshot: initial,
      replaySnapshots: engine.getAllSnapshots(),
      replayIndex: 0,
      winner: null,
      countdown: 10
    })
  },

  startGame: () => {
    get().advanceTurn()
  },

  pauseGame: () => {
    if (get().phase === 'playing') set({ phase: 'paused' })
  },

  resumeGame: () => {
    const { phase } = get()
    if (phase === 'paused') {
      set({ phase: 'playing' })
      get().advanceTurn()
    }
  },

  applyPlayerCommands: () => {
    const { playerCommands, engine } = get()
    engine.setPlayerCommands(playerCommands)
  },

  advanceTurn: async () => {
    const state = get()
    if (state.phase !== 'playing') return
    if (state.engine.isBattleOver()) {
      const w = state.engine.getWinner()
      set({
        phase: 'ended',
        winner: w,
        replaySnapshots: state.engine.getAllSnapshots(),
        replayIndex: state.engine.getAllSnapshots().length - 1
      })
      return
    }

    state.engine.startTurn()
    state.engine.setPlayerCommands(state.playerCommands)
    set({ turn: state.engine.turn })

    const generator = state.engine.executeAllCommands()
    let step = await generator.next()
    let i = 0

    const processNext = async () => {
      if (get().phase !== 'playing') return
      if (!step.done && step.value) {
        const snap = step.value
        set({
          currentCommandIndex: i,
          robots: snap.robots,
          latestSnapshot: snap,
          replaySnapshots: state.engine.getAllSnapshots()
        })
        i++
        await new Promise((r) => setTimeout(r, TURN_DELAY_MS))
        step = await generator.next()
        if (get().phase !== 'playing') return
        setImmediate(processNext)
      } else {
        const doneSnap = state.engine.snapshots[state.engine.snapshots.length - 1] ?? null
        set({
          robots: doneSnap ? doneSnap.robots : [],
          latestSnapshot: doneSnap,
          replaySnapshots: state.engine.getAllSnapshots()
        })
        await new Promise((r) => setTimeout(r, 500))
        if (state.engine.isBattleOver()) {
          const w = state.engine.getWinner()
          set({
            phase: 'ended',
            winner: w,
            replaySnapshots: state.engine.getAllSnapshots(),
            replayIndex: state.engine.getAllSnapshots().length - 1
          })
          return
        }
        const cur = get()
        if (cur.phase === 'playing') {
          cur.advanceTurn()
        }
      }
    }
    setImmediate(processNext)
  },

  gotoReplayIndex: (idx) => {
    const snaps = get().replaySnapshots
    const clamped = Math.max(0, Math.min(idx, snaps.length - 1))
    const snap = snaps[clamped]
    if (!snap) return
    set({
      replayIndex: clamped,
      robots: snap.robots,
      latestSnapshot: snap,
      turn: snap.turn <= 0 ? 1 : snap.turn,
      currentCommandIndex: snap.executingIndex
    })
  },

  resetAll: () => {
    engineSingleton.reset()
    set({
      phase: 'lobby',
      turn: 0,
      currentCommandIndex: -1,
      selectedRobotType: null,
      robots: [],
      latestSnapshot: null,
      replaySnapshots: [],
      replayIndex: 0,
      winner: null,
      countdown: 10
    })
  },

  setCountdown: (n) => set({ countdown: n })
}))
