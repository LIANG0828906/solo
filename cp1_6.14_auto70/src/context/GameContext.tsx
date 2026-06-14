import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import axios from 'axios'

export interface Player {
  id: string
  name: string
  avatar: string
  role: string
  roleName: string
  roleEmoji: string
  roleDescription: string
  coins: number
  position: number
  isCurrentTurn: boolean
}

export interface LogEntry {
  id: string
  timestamp: string
  playerId?: string
  playerName?: string
  action: string
  details: string
  expanded?: boolean
}

export interface DiceResult {
  value: number
  seed: number
  animationFrames: number[]
}

export interface GameEventData {
  id: string
  type: string
  title: string
  description: string
  amount: number
  targetPosition?: number
}

export interface BoardCellData {
  index: number
  type: string
  name: string
  description: string
  cost: number
  color: string
}

export interface GameState {
  roomCode: string | null
  players: Player[]
  currentPlayerIndex: number
  phase: 'lobby' | 'playing' | 'ended'
  logs: LogEntry[]
  selectedEvent: GameEventData | null
  winner: Player | null
  turnCount: number
  maxTurns: number
  boardCells: BoardCellData[]
  isMoving: boolean
  isRolling: boolean
  diceResult: DiceResult | null
  pendingEvents: GameEventData[]
  showRoleModal: string | null
  showResultPanel: boolean
}

type Action =
  | { type: 'SET_GAME'; payload: Partial<GameState> }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; updates: Partial<Player> } }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SET_PHASE'; payload: 'lobby' | 'playing' | 'ended' }
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'SET_LOGS'; payload: LogEntry[] }
  | { type: 'TOGGLE_LOG_EXPAND'; payload: string }
  | { type: 'SET_EVENT'; payload: GameEventData | null }
  | { type: 'PUSH_PENDING_EVENTS'; payload: GameEventData[] }
  | { type: 'SHIFT_PENDING_EVENT' }
  | { type: 'SET_WINNER'; payload: Player | null }
  | { type: 'SET_MOVING'; payload: boolean }
  | { type: 'SET_ROLLING'; payload: boolean }
  | { type: 'SET_DICE_RESULT'; payload: DiceResult | null }
  | { type: 'SET_BOARD_CELLS'; payload: BoardCellData[] }
  | { type: 'SET_TURN_COUNT'; payload: number }
  | { type: 'SET_SHOW_ROLE_MODAL'; payload: string | null }
  | { type: 'SET_SHOW_RESULT_PANEL'; payload: boolean }
  | { type: 'RESET_GAME' }

const initialState: GameState = {
  roomCode: null,
  players: [],
  currentPlayerIndex: 0,
  phase: 'lobby',
  logs: [],
  selectedEvent: null,
  winner: null,
  turnCount: 0,
  maxTurns: 50,
  boardCells: [],
  isMoving: false,
  isRolling: false,
  diceResult: null,
  pendingEvents: [],
  showRoleModal: null,
  showResultPanel: false,
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
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayerIndex: action.payload }
    case 'SET_PHASE':
      return { ...state, phase: action.payload }
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] }
    case 'SET_LOGS':
      return { ...state, logs: action.payload }
    case 'TOGGLE_LOG_EXPAND':
      return {
        ...state,
        logs: state.logs.map(l =>
          l.id === action.payload ? { ...l, expanded: !l.expanded } : l
        ),
      }
    case 'SET_EVENT':
      return { ...state, selectedEvent: action.payload }
    case 'PUSH_PENDING_EVENTS':
      return { ...state, pendingEvents: [...state.pendingEvents, ...action.payload] }
    case 'SHIFT_PENDING_EVENT':
      return { ...state, pendingEvents: state.pendingEvents.slice(1) }
    case 'SET_WINNER':
      return { ...state, winner: action.payload, showResultPanel: action.payload ? true : state.showResultPanel }
    case 'SET_MOVING':
      return { ...state, isMoving: action.payload }
    case 'SET_ROLLING':
      return { ...state, isRolling: action.payload }
    case 'SET_DICE_RESULT':
      return { ...state, diceResult: action.payload }
    case 'SET_BOARD_CELLS':
      return { ...state, boardCells: action.payload }
    case 'SET_TURN_COUNT':
      return { ...state, turnCount: action.payload }
    case 'SET_SHOW_ROLE_MODAL':
      return { ...state, showRoleModal: action.payload }
    case 'SET_SHOW_RESULT_PANEL':
      return { ...state, showResultPanel: action.payload }
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
  rollDice: () => Promise<DiceResult | null>
  movePlayer: (steps: number) => Promise<any>
  endTurn: () => Promise<any>
  fetchGameState: () => Promise<any>
  fetchLogs: () => Promise<any>
  fetchBoardCells: () => Promise<void>
  addCustomLog: (action: string, details: string, playerId?: string) => Promise<any>
  toggleLogExpand: (logId: string) => void
  setEvent: (event: GameEventData | null) => void
  setShowRoleModal: (roleId: string | null) => void
  setShowResultPanel: (show: boolean) => void
  clearPendingEvent: () => void
  copyLogsToClipboard: () => Promise<boolean>
  leaveGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const createLogEntry = useCallback(
    (action: string, details: string, player?: Player): LogEntry => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      playerId: player?.id,
      playerName: player?.name,
      action,
      details,
      expanded: false,
    }),
    []
  )

  const createGame = async (playerName: string) => {
    try {
      const response = await axios.post('/api/game/create', { playerName })
      const { roomCode, player, gameState } = response.data
      dispatch({ type: 'SET_GAME', payload: { roomCode, phase: 'lobby' } })
      dispatch({ type: 'SET_PLAYERS', payload: gameState.players })
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
      dispatch({ type: 'SET_PLAYERS', payload: gameState.players })
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
      const { gameState } = response.data
      dispatch({ type: 'SET_PHASE', payload: 'playing' })
      dispatch({ type: 'SET_PLAYERS', payload: gameState.players })
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: gameState.currentPlayerIndex })
      dispatch({ type: 'SET_TURN_COUNT', payload: gameState.turnCount })
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
      dispatch({ type: 'SET_ROLLING', payload: true })
      const response = await axios.post('/api/game/roll-dice', { roomCode: state.roomCode })
      const { diceResult } = response.data
      dispatch({ type: 'SET_DICE_RESULT', payload: diceResult })
      return diceResult as DiceResult
    } catch (error) {
      console.error('掷骰子失败:', error)
      dispatch({ type: 'SET_ROLLING', payload: false })
      throw error
    }
  }

  const movePlayer = async (steps: number) => {
    try {
      dispatch({ type: 'SET_MOVING', payload: true })
      const response = await axios.post('/api/game/move', { roomCode: state.roomCode, steps })
      const { player, newPosition, events, gameState, totalDelta } = response.data
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { id: player.id, updates: { position: newPosition, coins: player.coins } },
      })
      if (gameState) {
        dispatch({ type: 'SET_PLAYERS', payload: gameState.players })
        if (gameState.winner) {
          dispatch({ type: 'SET_WINNER', payload: gameState.winner })
          dispatch({ type: 'SET_PHASE', payload: 'ended' })
        }
        if (gameState.phase) {
          dispatch({ type: 'SET_PHASE', payload: gameState.phase })
        }
      }
      if (events && events.length > 0) {
        dispatch({ type: 'PUSH_PENDING_EVENTS', payload: events })
      }
      return { player, newPosition, events, totalDelta }
    } catch (error) {
      console.error('移动失败:', error)
      dispatch({ type: 'SET_MOVING', payload: false })
      throw error
    }
  }

  const endTurn = async () => {
    try {
      const response = await axios.post('/api/game/end-turn', { roomCode: state.roomCode })
      const { nextPlayerIndex, nextPlayer, turnCount, gameState } = response.data
      const currentPlayer = state.players.find(p => p.isCurrentTurn)
      if (currentPlayer) {
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: { id: currentPlayer.id, updates: { isCurrentTurn: false } },
        })
      }
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { id: nextPlayer.id, updates: { isCurrentTurn: true, coins: nextPlayer.coins } },
      })
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: nextPlayerIndex })
      dispatch({ type: 'SET_TURN_COUNT', payload: turnCount })
      dispatch({ type: 'SET_ROLLING', payload: false })
      dispatch({ type: 'SET_DICE_RESULT', payload: null })
      dispatch({ type: 'SET_MOVING', payload: false })
      if (gameState) {
        if (gameState.winner) {
          dispatch({ type: 'SET_WINNER', payload: gameState.winner })
          dispatch({ type: 'SET_PHASE', payload: 'ended' })
        }
        if (gameState.phase) {
          dispatch({ type: 'SET_PHASE', payload: gameState.phase })
        }
      }
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
          turnCount: gameState.turnCount,
          maxTurns: gameState.maxTurns,
          logs: gameState.logs || [],
        },
      })
      if (gameState.winner) {
        dispatch({ type: 'SET_SHOW_RESULT_PANEL', payload: true })
      }
      return response.data
    } catch (error) {
      console.error('获取游戏状态失败:', error)
      throw error
    }
  }

  const fetchLogs = async () => {
    if (!state.roomCode) return
    try {
      const response = await axios.get(`/api/game/logs/${state.roomCode}`)
      dispatch({ type: 'SET_LOGS', payload: response.data.logs })
      return response.data
    } catch (error) {
      console.error('获取日志失败:', error)
      throw error
    }
  }

  const fetchBoardCells = async () => {
    try {
      const response = await axios.get('/api/game/board-cells')
      dispatch({ type: 'SET_BOARD_CELLS', payload: response.data.cells })
    } catch (error) {
      console.error('获取棋盘数据失败:', error)
    }
  }

  const addCustomLog = async (action: string, details: string, playerId?: string) => {
    if (!state.roomCode) return
    try {
      const response = await axios.post('/api/game/log', {
        roomCode: state.roomCode,
        action,
        details,
        playerId,
      })
      dispatch({ type: 'ADD_LOG', payload: response.data.log })
      return response.data
    } catch (error) {
      console.error('添加日志失败:', error)
    }
  }

  const toggleLogExpand = useCallback((logId: string) => {
    dispatch({ type: 'TOGGLE_LOG_EXPAND', payload: logId })
  }, [])

  const setEvent = useCallback((event: GameEventData | null) => {
    dispatch({ type: 'SET_EVENT', payload: event })
  }, [])

  const setShowRoleModal = useCallback((roleId: string | null) => {
    dispatch({ type: 'SET_SHOW_ROLE_MODAL', payload: roleId })
  }, [])

  const setShowResultPanel = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_RESULT_PANEL', payload: show })
  }, [])

  const clearPendingEvent = useCallback(() => {
    dispatch({ type: 'SHIFT_PENDING_EVENT' })
  }, [])

  const copyLogsToClipboard = async () => {
    try {
      const text = state.logs
        .slice()
        .reverse()
        .map((log) => {
          const time = new Date(log.timestamp).toLocaleString('zh-CN')
          const player = log.playerName ? `[${log.playerName}]` : ''
          return `${time} ${player} ${log.action}: ${log.details}`
        })
        .join('\n')
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('复制日志失败:', error)
      return false
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
        fetchLogs,
        fetchBoardCells,
        addCustomLog,
        toggleLogExpand,
        setEvent,
        setShowRoleModal,
        setShowResultPanel,
        clearPendingEvent,
        copyLogsToClipboard,
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
