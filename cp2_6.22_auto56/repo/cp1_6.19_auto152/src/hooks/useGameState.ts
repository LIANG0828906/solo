import { useState, useEffect, useCallback } from 'react'

export interface Clue {
  id: string
  title: string
  icon: string
  description: string
  hint: string
  collected: boolean
  used: boolean
  itemId: string
}

export interface Puzzle {
  id: string
  title: string
  type: 'password' | 'anagram'
  answer: string
  requiredClues: string[]
  solved: boolean
  description: string
}

export interface GameState {
  clues: Clue[]
  puzzles: Puzzle[]
  startTime: number | null
  elapsedTime: number
  gameWon: boolean
  doorOpen: boolean
}

const STORAGE_KEY = 'detective-escape-room-state'

const initialClues: Clue[] = [
  {
    id: 'diary',
    title: '侦探日记',
    icon: '📔',
    description: '一本泛黄的日记，最后一页写着："真相藏于时间之中，午夜的钟声敲响三下，答案在数字的尽头。" 角落处用红笔标注着 "7"。',
    hint: '数字 7',
    collected: false,
    used: false,
    itemId: 'bookshelf'
  },
  {
    id: 'puzzleBox',
    title: '密码盒',
    icon: '📦',
    description: '一个精致的黄铜密码盒，盒盖上刻有神秘的符号图案。底部刻着一行小字："首位为始，末位为终，中间藏着真相的钥匙。" 符号旁边标注着 "3" 和 "9"。',
    hint: '数字 3 和 9',
    collected: false,
    used: false,
    itemId: 'desk'
  },
  {
    id: 'globe',
    title: '地球仪暗格',
    icon: '🌍',
    description: '地球仪的底座可以旋转，里面藏着一张纸条："字母重排，开启真相之门。将 DETECTIVE 重新排列，你会找到答案。" 纸条背面画着一个指南针。',
    hint: '字母重排谜题',
    collected: false,
    used: false,
    itemId: 'globe'
  },
  {
    id: 'clockNote',
    title: '挂钟密函',
    icon: '🕰️',
    description: '挂钟背面藏着一封密函："四位数字密码，第一位是日记的秘密，第二位和第三位是密码盒的启示，第四位...你需要在壁炉的余烬中寻找。"',
    hint: '密码提示',
    collected: false,
    used: false,
    itemId: 'clock'
  },
  {
    id: 'fireplaceKey',
    title: '壁炉灰烬',
    icon: '🔥',
    description: '壁炉的灰烬中藏着一枚刻有数字 "2" 的铜牌。铜牌背面刻着："最后的数字，是结束也是开始。"',
    hint: '数字 2',
    collected: false,
    used: false,
    itemId: 'fireplace'
  }
]

const initialPuzzles: Puzzle[] = [
  {
    id: 'passwordLock',
    title: '四位密码锁',
    type: 'password',
    answer: '7392',
    requiredClues: ['diary', 'puzzleBox', 'clockNote', 'fireplaceKey'],
    solved: false,
    description: '根据收集到的线索，推断出四位数字密码。提示：日记(第1位)、密码盒(第2、3位)、壁炉(第4位)'
  },
  {
    id: 'anagramPuzzle',
    title: '字母重排谜题',
    type: 'anagram',
    answer: 'DETECTED',
    requiredClues: ['globe'],
    solved: false,
    description: '将 DETECTIVE 的字母重新排列，组成一个表示"已发现"的单词。'
  }
]

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        clues: parsed.clues || initialClues,
        puzzles: parsed.puzzles || initialPuzzles,
        startTime: parsed.startTime || null,
        elapsedTime: parsed.elapsedTime || 0,
        gameWon: parsed.gameWon || false,
        doorOpen: parsed.doorOpen || false
      }
    }
  } catch (e) {
    console.error('Failed to load game state:', e)
  }
  return {
    clues: initialClues,
    puzzles: initialPuzzles,
    startTime: null,
    elapsedTime: 0,
    gameWon: false,
    doorOpen: false
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (state.startTime && !state.gameWon) {
      const timer = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000)
        }))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [state.startTime, state.gameWon])

  useEffect(() => {
    const allCluesCollected = state.clues.every(c => c.collected)
    const allPuzzlesSolved = state.puzzles.every(p => p.solved)
    if (allCluesCollected && allPuzzlesSolved && !state.gameWon) {
      setState(prev => ({ ...prev, gameWon: true, doorOpen: true }))
    }
  }, [state.clues, state.puzzles, state.gameWon])

  const collectClue = useCallback((clueId: string) => {
    setState(prev => ({
      ...prev,
      startTime: prev.startTime || Date.now(),
      clues: prev.clues.map(c =>
        c.id === clueId ? { ...c, collected: true } : c
      )
    }))
  }, [])

  const solvePuzzle = useCallback((puzzleId: string, answer: string): boolean => {
    const puzzle = state.puzzles.find(p => p.id === puzzleId)
    if (!puzzle) return false

    const isCorrect = answer.toUpperCase() === puzzle.answer.toUpperCase()
    if (isCorrect) {
      setState(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(p =>
          p.id === puzzleId ? { ...p, solved: true } : p
        ),
        clues: prev.clues.map(c =>
          puzzle.requiredClues.includes(c.id) ? { ...c, used: true } : c
        )
      }))
    }
    return isCorrect
  }, [state.puzzles])

  const canSolvePuzzle = useCallback((puzzleId: string): boolean => {
    const puzzle = state.puzzles.find(p => p.id === puzzleId)
    if (!puzzle) return false
    return puzzle.requiredClues.every(clueId =>
      state.clues.find(c => c.id === clueId)?.collected
    )
  }, [state.puzzles, state.clues])

  const resetGame = useCallback(() => {
    setState({
      clues: initialClues.map(c => ({ ...c, collected: false, used: false })),
      puzzles: initialPuzzles.map(p => ({ ...p, solved: false })),
      startTime: null,
      elapsedTime: 0,
      gameWon: false,
      doorOpen: false
    })
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const collectedCount = state.clues.filter(c => c.collected).length
  const totalClues = state.clues.length

  return {
    state,
    clues: state.clues,
    puzzles: state.puzzles,
    elapsedTime: state.elapsedTime,
    gameWon: state.gameWon,
    doorOpen: state.doorOpen,
    collectedCount,
    totalClues,
    collectClue,
    solvePuzzle,
    canSolvePuzzle,
    resetGame,
    formatTime
  }
}
