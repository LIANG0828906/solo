import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import axios from 'axios'

export interface Player {
  id: string
  name: string
  avatar: string
  role: string
  coins: number
  position: number
  isCurrentTurn: boolean
}

export interface LogEntry {
  id: string
  timestamp: Date
  playerId?: string
  playerName?: string
  action: string
  details: string
  expanded?: boolean
}

export interface GameAssets {
  boardImage?: string
  diceImages?: string[]
  eventCards?: any[]
}

export interface GameState {
  roomCode: string | null
  players: Player[]
  currentPlayerIndex: number
  phase: 'lobby' | 'playing' | 'ended'
  logs: LogEntry[]
  assets: GameAssets
  selectedEvent: any | null
  winner: Player | null
}

type Action =
  | { type: 'SET_GAME'; payload: Partial<GameState> }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; updates: Partial<Player> } }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SET_PHASE'; payload: 'lobby' | 'playing' | 'ended' }
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'SET_EVENT'; payload: any | null }
  | { type: 'SET_WINNER'; payload: Player | null }
  | { type: 'RESET_GAME' }

const initialState: GameState = {
  roomCode: null,
  players: [],
  currentPlayerIndex: 0,
  phase: 'lobby',
  logs: [],
  assets: {},
  selectedEvent: null,
  winner: null,
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, ...action.payload }
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] }
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) }
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      }
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayerIndex: action.payload }
    case 'SET_PHASE':
      return { ...state, phase: action.payload }
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] }
    case 'SET_EVENT':
      return { ...state, selectedEvent: action.payload }
    case 'SET_WINNER':
      return { ...state, winner: action.payload }
    case 'RESET_GAME':
      return initialState
    default:
      return state
  }
}

interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<Action>
  createGame: (playerName: string) => Promise<any>
  joinGame: (roomCode: string, playerName: string) => Promise<any>
  startGame: () => Promise<any>
  rollDice: () => Promise<any>
  movePlayer: (steps: number) => Promise<any>
  endTurn: () => Promise<any>
  fetchGameState: () => Promise<any>
  leaveGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const createLogEntry = (action: string, details: string, player?: Player): LogEntry => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    playerId: player?.id,
    playerName: player?.name,
    action,
    details,
    expanded: false,
  })

  const createGame = async (playerName: string) => {
    try {
      const response = await axios.post('/api/game/create', { playerName })
      const { roomCode, player, gameState } = response.data
      dispatch({ type: 'SET_GAME', payload: { roomCode, phase: 'lobby' } })
      dispatch({ type: 'ADD_PLAYER', payload: player })
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry('创建房间', `房间号：${roomCode}`, player),
      })
      return response.data
    } catch (error) {
      console.error('创建房间失败:', error)
      throw error
    }
  }

  const joinGame = async (roomCode: string, playerName: string) => {
    try {
      const response = await axios.post('/api/game/join', { roomCode, playerName })
      const { player, gameState } = response.data
      dispatch({ type: 'SET_GAME', payload: { roomCode, phase: 'lobby' } })
      dispatch({ type: 'ADD_PLAYER', payload: player })
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry('加入房间', `${playerName} 加入了房间`, player),
      })
      return response.data
    } catch (error) {
      console.error('加入房间失败:', error)
      throw error
    }
  }

  const startGame = async () => {
    try {
      const response = await axios.post('/api/game/start', { roomCode: state.roomCode })
      dispatch({ type: 'SET_PHASE', payload: 'playing' })
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry('游戏开始', '游戏正式开始！祝大家好运！'),
      })
      return response.data
    } catch (error) {
      console.error('开始游戏失败:', error)
      throw error
    }
  }

  const rollDice = async () => {
    try {
      const response = await axios.post('/api/game/roll-dice', { roomCode: state.roomCode })
      const { diceResult, currentPlayer } = response.data
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry(
          '掷骰子',
          `掷出了 ${diceResult} 点`,
          state.players[state.currentPlayerIndex]
        ),
      })
      return response.data
    } catch (error) {
      console.error('掷骰子失败:', error)
      throw error
    }
  }

  const movePlayer = async (steps: number) => {
    try {
      const response = await axios.post('/api/game/move', { roomCode: state.roomCode, steps })
      const { player, newPosition, event } = response.data
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { id: player.id, updates: { position: newPosition, coins: player.coins } },
      })
      if (event) {
        dispatch({ type: 'SET_EVENT', payload: event })
      }
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry(
          '移动',
          `移动到第 ${newPosition} 格`,
          state.players[state.currentPlayerIndex]
        ),
      })
      return response.data
    } catch (error) {
      console.error('移动失败:', error)
      throw error
    }
  }

  const endTurn = async () => {
    try {
      const response = await axios.post('/api/game/end-turn', { roomCode: state.roomCode })
      const { nextPlayerIndex, nextPlayer } = response.data
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: nextPlayerIndex })
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { id: nextPlayer.id, updates: { isCurrentTurn: true } },
      })
      const currentPlayer = state.players.find(p => p.isCurrentTurn)
      if (currentPlayer) {
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: { id: currentPlayer.id, updates: { isCurrentTurn: false } },
        })
      }
      dispatch({
        type: 'ADD_LOG',
        payload: createLogEntry('回合结束', `轮到 ${nextPlayer.name}`, nextPlayer),
      })
      return response.data
    } catch (error) {
      console.error('结束回合失败:', error)
      throw error
    }
  }

  const fetchGameState = async () => {
    if (!state.roomCode) return
    try {
      const response = await axios.get(`/api/game/state/${state.roomCode}`)
      const { gameState } = response.data
      dispatch({
        type: 'SET_GAME',
        payload: {
          players: gameState.players,
          currentPlayerIndex: gameState.currentPlayerIndex,
          phase: gameState.phase,
          winner: gameState.winner,
        },
      })
      return response.data
    } catch (error) {
      console.error('获取游戏状态失败:', error)
      throw error
    }
  }

  const leaveGame = () => {
    dispatch({ type: 'RESET_GAME' })
  }

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        createGame,
        joinGame,
        startGame,
        rollDice,
        movePlayer,
        endTurn,
        fetchGameState,
        leaveGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameContextProvider')
  }
  return context
}
