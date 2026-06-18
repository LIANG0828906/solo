import { create } from 'zustand'
import eventBus from '../eventBus'

interface Player {
  id: string
  nickname: string
  avatarColor: string
  score: number
  correctCount: number
  totalTime: number
  isHost: boolean
}

interface CurrentQuestion {
  questionId: string
  text: string
  options: string[]
  correctIndex: number
  roundIndex: number
}

interface GameStore {
  phase: 'waiting' | 'playing' | 'roundEnd' | 'result'
  players: Player[]
  currentQuestion: CurrentQuestion | null
  currentRound: number
  totalRounds: number
  timeRemaining: number
  totalTime: number
  selectedAnswer: number | null
  answerLocked: boolean
  answerCorrect: boolean | null
  currentPlayerId: string
  rankings: Player[]
  roundTransition: boolean

  setPhase: (phase: GameStore['phase']) => void
  addPlayer: (player: Player) => void
  setCurrentQuestion: (q: GameStore['currentQuestion']) => void
  setTimeRemaining: (t: number) => void
  submitAnswer: (selectedIndex: number, correctIndex: number, playerId: string) => void
  updateRankings: () => void
  setRoundTransition: (v: boolean) => void
  reset: () => void
}

const initialState = {
  phase: 'waiting' as const,
  players: [] as Player[],
  currentQuestion: null as CurrentQuestion | null,
  currentRound: 0,
  totalRounds: 10,
  timeRemaining: 0,
  totalTime: 0,
  selectedAnswer: null as number | null,
  answerLocked: false,
  answerCorrect: null as boolean | null,
  currentPlayerId: '',
  rankings: [] as Player[],
  roundTransition: false,
}

const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
      currentPlayerId: state.currentPlayerId || player.id,
    })),

  setCurrentQuestion: (q) =>
    set({
      currentQuestion: q,
      selectedAnswer: null,
      answerLocked: false,
      answerCorrect: null,
      currentRound: q?.roundIndex ?? get().currentRound,
      roundTransition: false,
    }),

  setTimeRemaining: (t) => set({ timeRemaining: t }),

  submitAnswer: (selectedIndex, correctIndex, playerId) => {
    const state = get()
    if (playerId !== state.currentPlayerId) return
    const correct = selectedIndex === correctIndex
    set({
      selectedAnswer: selectedIndex,
      answerLocked: true,
      answerCorrect: correct,
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: correct ? p.score + 100 : p.score,
              correctCount: correct ? p.correctCount + 1 : p.correctCount,
            }
          : p
      ),
    })
  },

  updateRankings: () => {
    const rankings = [...get().players].sort((a, b) => b.score - a.score)
    set({ rankings })
  },

  setRoundTransition: (v) => set({ roundTransition: v }),

  reset: () => set(initialState),
}))

let roundEndTimeout: ReturnType<typeof setTimeout> | null = null

export function initGameManager() {
  eventBus.on(
    'playerJoined',
    (data: { playerId: string; nickname: string; avatar: string }) => {
      const state = useGameStore.getState()
      const isHost = state.players.length === 0
      const player: Player = {
        id: data.playerId,
        nickname: data.nickname,
        avatarColor: data.avatar,
        score: 0,
        correctCount: 0,
        totalTime: 0,
        isHost,
      }
      useGameStore.getState().addPlayer(player)
      eventBus.emit('gameStateChange', 'waiting')
    }
  )

  eventBus.on(
    'questionReceived',
    (data: {
      questionId: string
      text: string
      options: string[]
      correctIndex: number
      roundIndex: number
    }) => {
      useGameStore.getState().setCurrentQuestion(data)
      useGameStore.getState().setPhase('playing')
      eventBus.emit('roundUpdate', {
        roundIndex: data.roundIndex,
        totalRounds: useGameStore.getState().totalRounds,
        question: data,
      })
      eventBus.emit('gameStateChange', 'playing')
    }
  )

  eventBus.on(
    'timerSync',
    (data: { remaining: number; total: number }) => {
      useGameStore.setState({
        timeRemaining: data.remaining,
        totalTime: data.total,
      })
    }
  )

  eventBus.on(
    'answerSubmit',
    (data: { playerId: string; questionId: string; selectedIndex: number }) => {
      const state = useGameStore.getState()
      if (data.playerId === state.currentPlayerId) {
        const correctIndex = state.currentQuestion?.correctIndex ?? -1
        state.submitAnswer(data.selectedIndex, correctIndex, data.playerId)
        const updatedState = useGameStore.getState()
        const player = updatedState.players.find(
          (p) => p.id === data.playerId
        )
        if (player) {
          eventBus.emit('scoreUpdate', {
            playerId: data.playerId,
            score: player.score,
            delta: updatedState.answerCorrect ? 100 : 0,
          })
        }
      }
    }
  )

  eventBus.on(
    'roundEnd',
    (data: {
      roundIndex: number
      correctIndex: number
      playerAnswers: { playerId: string; selectedIndex: number }[]
    }) => {
      const state = useGameStore.getState()

      const updatedPlayers = state.players.map((player) => {
        if (player.id === state.currentPlayerId) return player
        const answer = data.playerAnswers.find(
          (a) => a.playerId === player.id
        )
        if (!answer) return player
        const correct = answer.selectedIndex === data.correctIndex
        return {
          ...player,
          score: correct ? player.score + 100 : player.score,
          correctCount: correct ? player.correctCount + 1 : player.correctCount,
        }
      })

      useGameStore.setState({ players: updatedPlayers, phase: 'roundEnd' })
      useGameStore.getState().updateRankings()

      const finalState = useGameStore.getState()

      for (const player of finalState.players) {
        const answer = data.playerAnswers.find(
          (a) => a.playerId === player.id
        )
        const delta = answer
          ? answer.selectedIndex === data.correctIndex
            ? 100
            : 0
          : 0
        eventBus.emit('scoreUpdate', {
          playerId: player.id,
          score: player.score,
          delta,
        })
      }

      eventBus.emit('rankUpdate', { rankings: finalState.rankings })
      eventBus.emit('gameStateChange', 'roundEnd')

      if (roundEndTimeout) clearTimeout(roundEndTimeout)

      roundEndTimeout = setTimeout(() => {
        const currentState = useGameStore.getState()
        if (data.roundIndex + 1 >= currentState.totalRounds) {
          currentState.setPhase('result')
          eventBus.emit('gameStateChange', 'result')
        } else {
          currentState.setRoundTransition(true)
          currentState.setPhase('playing')
          eventBus.emit('gameStateChange', 'playing')
        }
      }, 3000)
    }
  )

  eventBus.on('resetGame', () => {
    if (roundEndTimeout) {
      clearTimeout(roundEndTimeout)
      roundEndTimeout = null
    }
    useGameStore.getState().reset()
  })
}

export { useGameStore }
export type { Player, GameStore }
