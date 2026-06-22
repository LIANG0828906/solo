import { useMemo } from 'react'
import { Music, Volume2 } from 'lucide-react'
import {
  type NoteName,
  ALL_NOTES,
  WHITE_KEYS,
  BLACK_KEYS,
  isBlackKey,
} from '@/types'
import { audioEngine } from '@/audio/AudioEngine'
import { useGameStore } from '@/store/gameStore'
import { cn } from '@/lib/utils'

interface PianoKeyboardProps {
  highlightedNotes: NoteName[]
  onNotePlay?: (note: NoteName) => void
}

const BLACK_KEY_POSITIONS: Record<string, number> = {
  'C#': 0,
  'D#': 1,
  'F#': 3,
  'G#': 4,
  'A#': 5,
}

export default function PianoKeyboard({
  highlightedNotes,
  onNotePlay,
}: PianoKeyboardProps) {
  const waveType = useGameStore((s) => s.waveType)
  const selectedNotes = useGameStore((s) => s.selectedNotes)
  const showAnswer = useGameStore((s) => s.showAnswer)
  const feedback = useGameStore((s) => s.feedback)
  const currentQuestion = useGameStore((s) => s.currentQuestion)

  const correctNotes = useMemo(() => {
    if (!showAnswer || !currentQuestion) return []
    if (currentQuestion.type === 'interval') {
      return [currentQuestion.note1, currentQuestion.note2]
    }
    if (currentQuestion.type === 'chord') {
      return currentQuestion.notes
    }
    if (currentQuestion.type === 'scale') {
      return currentQuestion.notes
    }
    return []
  }, [showAnswer, currentQuestion])

  const handleKeyClick = (note: NoteName) => {
    if (onNotePlay) {
      onNotePlay(note)
    }
  }

  const handleKeyHover = (note: NoteName) => {
    audioEngine.playNote(note, waveType, 0.3)
  }

  const getKeyState = (note: NoteName) => {
    const isSelected = selectedNotes.includes(note)
    const isHighlighted = highlightedNotes.includes(note)
    const isCorrect = correctNotes.includes(note)
    const isWrong = showAnswer && isSelected && !isCorrect
    return { isSelected, isHighlighted, isCorrect, isWrong }
  }

  const getKeyClasses = (note: NoteName, black: boolean) => {
    const state = getKeyState(note)
    const base = black
      ? 'bg-key-black border-gray-700 text-gray-300 z-10'
      : 'bg-gradient-to-b from-key-white to-gray-200 border-gray-300 text-gray-800 z-0'

    let highlight = ''
    if (state.isCorrect && showAnswer) {
      highlight = 'ring-2 ring-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
    } else if (state.isWrong && showAnswer) {
      highlight = 'ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
    } else if (state.isSelected) {
      highlight = feedback === 'correct'
        ? 'ring-2 ring-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
        : feedback === 'incorrect'
          ? 'ring-2 ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
          : 'ring-2 ring-gold shadow-[0_0_12px_rgba(212,175,55,0.5)]'
    } else if (state.isHighlighted) {
      highlight = 'ring-2 ring-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
    }

    return cn(
      base,
      highlight,
      'relative flex flex-col items-center justify-end cursor-pointer',
      'transition-all duration-150 ease-out',
      'hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]',
      'active:scale-95 active:animate-key-bounce',
      black ? 'rounded-b-md' : 'rounded-b-lg',
    )
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-gold" />
        <span className="font-body text-sm text-gray-400">钢琴键盘</span>
      </div>

      <div className="relative mx-auto overflow-x-auto pb-2" style={{ maxWidth: '100%' }}>
        <div className="relative flex" style={{ minWidth: '420px', height: '200px' }}>
          {WHITE_KEYS.map((note, i) => {
            const keyWidth = 100 / 7
            return (
              <div
                key={note}
                className={getKeyClasses(note, false)}
                style={{
                  width: `${keyWidth}%`,
                  height: '200px',
                  border: '1px solid',
                  borderRadius: '0 0 8px 8px',
                }}
                onClick={() => handleKeyClick(note)}
                onMouseEnter={() => handleKeyHover(note)}
              >
                <span className="text-xs font-semibold mb-3 opacity-70">{note}</span>
              </div>
            )
          })}

          {BLACK_KEYS.map((note) => {
            const pos = BLACK_KEY_POSITIONS[note]
            const leftPercent = ((pos + 1) * (100 / 7)) - (100 / 14) - (2.5 / 7)
            return (
              <div
                key={note}
                className={getKeyClasses(note, true)}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${100 / 7 * 0.6}%`,
                  height: '125px',
                  border: '1px solid',
                  borderRadius: '0 0 6px 6px',
                  zIndex: 10,
                }}
                onClick={() => handleKeyClick(note)}
                onMouseEnter={() => handleKeyHover(note)}
              >
                <span className="text-[10px] font-semibold mb-2 opacity-60">{note}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <Volume2 className="w-3 h-3" />
        <span>悬停琴键试听 · 点击选择音符</span>
      </div>
    </div>
  )
}
