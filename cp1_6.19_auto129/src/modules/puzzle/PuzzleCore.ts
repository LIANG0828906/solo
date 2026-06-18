import { useReducer, useCallback, useEffect, useRef } from 'react'

export interface IPuzzlePiece {
  id: number
  points: string
  targetX: number
  targetY: number
  targetRotation: number
  currentX: number
  currentY: number
  currentRotation: number
  isPlaced: boolean
  color: string
}

export interface IPuzzleState {
  pieces: IPuzzlePiece[]
  totalPieces: number
  placedCount: number
  touchCount: number
  successCount: number
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  currentTip: string
  tipKey: number
}

type PuzzleAction =
  | { type: 'DRAG_START'; pieceId: number }
  | { type: 'DRAG_MOVE'; pieceId: number; x: number; y: number }
  | { type: 'DRAG_END'; pieceId: number }
  | { type: 'ROTATE_PIECE'; pieceId: number; rotation: number }
  | { type: 'PLACE_PIECE'; pieceId: number }
  | { type: 'INCREMENT_TOUCH' }
  | { type: 'TICK_TIME' }
  | { type: 'SET_TIP'; tip: string }
  | { type: 'RESET' }
  | { type: 'COMPLETE' }

const HISTORY_TIPS = [
  '唐三彩是唐代低温铅质彩釉陶器的总称，以黄、绿、白三色为主，盛行于唐高宗至唐玄宗时期。',
  '青铜鼎是古代中国最重要的礼器之一，象征着权力与地位，最早出现于新石器时代晚期。',
  '宋代五大名窑：汝窑、官窑、哥窑、钧窑、定窑，代表了中国古代瓷器制作的最高水平。',
  '青花瓷又称白地青花瓷，常简称青花，是中国瓷器的主流品种之一，属釉下彩瓷。',
  '兵马俑是秦始皇陵的陪葬坑中的陶俑，被誉为"世界第八大奇迹"，每个士兵面容各异。',
  '玉琮是良渚文化的典型器物，外方内圆，是古代祭祀天地的重要礼器。',
  '景德镇素有"瓷都"之称，自汉代开始烧制陶瓷，至今已有两千多年历史。',
  '斗彩是明代成化时期的珍贵瓷器品种，采用釉下青花与釉上彩料相结合的工艺。',
  '紫砂壶是中国特有的手工制造陶土工艺品，原产地为江苏宜兴，始于北宋。',
]

const PIECE_COLORS = [
  '#D4A574',
  '#C4956A',
  '#B8865A',
  '#CDB891',
  '#D9B382',
  '#C9A372',
  '#BE9064',
  '#D4A068',
  '#C89B5E',
]

function generatePiecePoints(id: number): string {
  const patterns: string[] = [
    '0,0 80,0 70,60 10,70',
    '0,0 75,5 65,75 5,65',
    '5,0 80,0 75,80 0,70',
    '0,10 70,0 80,65 10,80',
    '0,0 85,0 75,70 5,60',
    '10,0 75,5 80,75 5,70',
    '0,5 70,0 85,80 10,75',
    '5,0 80,5 75,85 0,75',
    '0,0 75,10 70,80 5,75',
  ]
  return patterns[id % patterns.length]
}

function generateInitialPieces(): IPuzzlePiece[] {
  const pieces: IPuzzlePiece[] = []
  const centerX = 350
  const centerY = 250

  const gridPositions = [
    { x: -80, y: -80 },
    { x: 0, y: -85 },
    { x: 80, y: -80 },
    { x: -85, y: 0 },
    { x: 0, y: 0 },
    { x: 85, y: 0 },
    { x: -80, y: 80 },
    { x: 0, y: 85 },
    { x: 80, y: 80 },
  ]

  const minDistance = 70

  for (let i = 0; i < 9; i++) {
    const targetX = centerX + gridPositions[i].x
    const targetY = centerY + gridPositions[i].y

    let currentX: number, currentY: number
    let valid = false
    let attempts = 0

    while (!valid && attempts < 200) {
      const angle = Math.random() * Math.PI * 2
      const distance = 80 + Math.random() * 120

      currentX = targetX + Math.cos(angle) * distance
      currentY = targetY + Math.sin(angle) * distance

      currentX = Math.max(60, Math.min(640, currentX))
      currentY = Math.max(60, Math.min(440, currentY))

      valid = true
      for (let j = 0; j < i; j++) {
        const dx = currentX - pieces[j].currentX
        const dy = currentY - pieces[j].currentY
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
          valid = false
          break
        }
      }

      attempts++
    }

    if (!valid) {
      const angle = (i / 9) * Math.PI * 2
      currentX = centerX + Math.cos(angle) * 180
      currentY = centerY + Math.sin(angle) * 140
    }

    const rotation = (Math.random() - 0.5) * 90

    pieces.push({
      id: i,
      points: generatePiecePoints(i),
      targetX,
      targetY,
      targetRotation: 0,
      currentX: currentX!,
      currentY: currentY!,
      currentRotation: rotation,
      isPlaced: false,
      color: PIECE_COLORS[i],
    })
  }

  return pieces
}

const initialState: IPuzzleState = {
  pieces: generateInitialPieces(),
  totalPieces: 9,
  placedCount: 0,
  touchCount: 0,
  successCount: 0,
  startTime: Date.now(),
  elapsedTime: 0,
  isCompleted: false,
  currentTip: '',
  tipKey: 0,
}

function puzzleReducer(state: IPuzzleState, action: PuzzleAction): IPuzzleState {
  switch (action.type) {
    case 'DRAG_MOVE': {
      const pieces = state.pieces.map((p) =>
        p.id === action.pieceId && !p.isPlaced
          ? { ...p, currentX: action.x, currentY: action.y }
          : p
      )
      return { ...state, pieces }
    }

    case 'ROTATE_PIECE': {
      const pieces = state.pieces.map((p) =>
        p.id === action.pieceId && !p.isPlaced
          ? { ...p, currentRotation: action.rotation }
          : p
      )
      return { ...state, pieces }
    }

    case 'PLACE_PIECE': {
      let placedCount = 0
      const pieces = state.pieces.map((p) => {
        if (p.id === action.pieceId && !p.isPlaced) {
          placedCount = state.placedCount + 1
          return {
            ...p,
            currentX: p.targetX,
            currentY: p.targetY,
            currentRotation: p.targetRotation,
            isPlaced: true,
          }
        }
        return p
      })

      const isCompleted = placedCount >= state.totalPieces
      const randomTip = HISTORY_TIPS[Math.floor(Math.random() * HISTORY_TIPS.length)]

      return {
        ...state,
        pieces,
        placedCount,
        successCount: state.successCount + 1,
        isCompleted,
        currentTip: randomTip,
        tipKey: state.tipKey + 1,
      }
    }

    case 'INCREMENT_TOUCH': {
      return { ...state, touchCount: state.touchCount + 1 }
    }

    case 'TICK_TIME': {
      if (state.isCompleted) return state
      return {
        ...state,
        elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
      }
    }

    case 'SET_TIP': {
      return { ...state, currentTip: action.tip, tipKey: state.tipKey + 1 }
    }

    case 'RESET': {
      return {
        ...initialState,
        pieces: generateInitialPieces(),
        startTime: Date.now(),
        tipKey: 0,
      }
    }

    case 'COMPLETE': {
      return { ...state, isCompleted: true }
    }

    default:
      return state
  }
}

export function checkProximity(piece: IPuzzlePiece): boolean {
  const dx = piece.currentX - piece.targetX
  const dy = piece.currentY - piece.targetY
  const distance = Math.sqrt(dx * dx + dy * dy)

  let rotationDiff = Math.abs(piece.currentRotation - piece.targetRotation)
  while (rotationDiff > 180) {
    rotationDiff = Math.abs(rotationDiff - 360)
  }

  return distance < 20 && rotationDiff < 10
}

export function playCeramicSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioCtx = new AudioContext()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05)

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)

    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.1)
  } catch (e) {
    console.warn('Audio not supported')
  }
}

export function usePuzzleState() {
  const [state, dispatch] = useReducer(puzzleReducer, initialState)
  const rafRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      if (now - lastTimeRef.current >= 1000) {
        dispatch({ type: 'TICK_TIME' })
        lastTimeRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const movePiece = useCallback((pieceId: number, x: number, y: number) => {
    dispatch({ type: 'DRAG_MOVE', pieceId, x, y })
  }, [])

  const rotatePiece = useCallback((pieceId: number, rotation: number) => {
    dispatch({ type: 'ROTATE_PIECE', pieceId, rotation })
  }, [])

  const placePiece = useCallback((pieceId: number) => {
    dispatch({ type: 'PLACE_PIECE', pieceId })
    playCeramicSound()
  }, [])

  const incrementTouch = useCallback(() => {
    dispatch({ type: 'INCREMENT_TOUCH' })
  }, [])

  const resetPuzzle = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const setTip = useCallback((tip: string) => {
    dispatch({ type: 'SET_TIP', tip })
  }, [])

  const accuracy =
    state.touchCount > 0
      ? ((state.successCount / state.touchCount) * 100).toFixed(1)
      : '0.0'

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    state,
    movePiece,
    rotatePiece,
    placePiece,
    incrementTouch,
    resetPuzzle,
    setTip,
    accuracy,
    formatTime,
  }
}
