import React, { useMemo, useState, useEffect, useRef } from 'react'
import { usePianoStore, Note } from '../store/usePianoStore'
import { PIANO_KEYS, WHITE_KEY_WIDTH } from '../constants/piano'

const VISUALIZER_HEIGHT = 400
const MAX_VELOCITY = 100
const FADE_DURATION = 1500

const CHORD_PATTERNS: { [key: string]: number[] } = {
  'maj': [0, 4, 7],
  'min': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'hdim7': [0, 3, 6, 10],
  'm7b5': [0, 3, 6, 10],
  'aug7': [0, 4, 8, 10],
  'maj9': [0, 4, 7, 11, 14],
  '9': [0, 4, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  '11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 17, 21],
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

interface VisualizingNote extends Note {
  left: number
  width: number
  initialHeight: number
  fadeProgress: number
}

export const Visualizer: React.FC = () => {
  const { activeNotes } = usePianoStore()
  const [visualizingNotes, setVisualizingNotes] = useState<VisualizingNote[]>([])
  const activeNotesRef = useRef(activeNotes)

  useEffect(() => {
    activeNotesRef.current = activeNotes
  }, [activeNotes])

  const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack)
  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH

  useEffect(() => {
    setVisualizingNotes(prev => {
      const newVisualizingNotes: VisualizingNote[] = []
      
      activeNotes.forEach(note => {
        const existing = prev.find(vn => vn.id === note.id)
        if (existing) {
          newVisualizingNotes.push({ ...existing, fadeProgress: 0 })
        } else {
          const keyInfo = PIANO_KEYS.find(k => k.note === note.note)
          if (keyInfo) {
            const left = keyInfo.isBlack 
              ? keyInfo.x 
              : keyInfo.whiteKeyIndex * WHITE_KEY_WIDTH
            const width = keyInfo.isBlack ? 18 : WHITE_KEY_WIDTH
            const initialHeight = (note.velocity / MAX_VELOCITY) * (VISUALIZER_HEIGHT - 40)
            
            newVisualizingNotes.push({
              ...note,
              left,
              width,
              initialHeight,
              fadeProgress: 0,
            })
          }
        }
      })

      const remainingOldNotes = prev
        .filter(vn => !activeNotes.some(an => an.id === vn.id))
        .map(vn => ({ ...vn, fadeProgress: vn.fadeProgress || 0 }))

      return [...newVisualizingNotes, ...remainingOldNotes]
    })
  }, [activeNotes])

  useEffect(() => {
    let animationId: number
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      setVisualizingNotes(prev => {
        const currentActiveNotes = activeNotesRef.current
        const updated = prev
          .map(vn => {
            if (!currentActiveNotes.some(an => an.id === vn.id)) {
              return {
                ...vn,
                fadeProgress: Math.min(1, vn.fadeProgress + deltaTime / FADE_DURATION),
              }
            }
            return vn
          })
          .filter(vn => vn.fadeProgress < 1)
        
        return updated
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  const chordName = useMemo(() => {
    if (activeNotes.length < 3) return null

    const notesList = [...activeNotes].sort((a, b) => a.freq - b.freq)
    const semitonesList = notesList.map(n => {
      const noteName = n.note.replace(/[0-9]/g, '')
      return NOTE_NAMES.indexOf(noteName)
    })

    const uniqueSemitones = [...new Set(semitonesList)]
    
    let bestChordName: string | null = null
    let bestMatchCount = 0

    for (let rootIdx = 0; rootIdx < uniqueSemitones.length; rootIdx++) {
      const rootSemitone = uniqueSemitones[rootIdx]
      const intervals = uniqueSemitones
        .map(s => (s - rootSemitone + 12) % 12)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a - b)

      for (const [name, pattern] of Object.entries(CHORD_PATTERNS)) {
        if (pattern.length > intervals.length) continue
        
        const matchCount = pattern.filter(p => intervals.includes(p % 12)).length
        if (matchCount === pattern.length && matchCount > bestMatchCount) {
          bestChordName = name
          bestMatchCount = matchCount
          const rootNoteName = NOTE_NAMES[rootSemitone]
          bestChordName = `${rootNoteName}${name === 'maj' ? '' : name}`
        }
      }
    }

    return bestChordName
  }, [activeNotes])

  return (
    <div className="visualizer-container">
      {chordName && (
        <div className="chord-display" key={chordName}>
          {chordName}
        </div>
      )}
      <div className="visualizer-canvas" style={{ width: `${totalWidth}px` }}>
        {visualizingNotes.map(vn => {
          const opacity = 0.8 * (1 - vn.fadeProgress)
          const height = vn.initialHeight * (1 - vn.fadeProgress * 0.7)
          
          return (
            <div
              key={vn.id}
              className="note-bar"
              style={{
                left: `${vn.left}px`,
                width: `${vn.width}px`,
                height: `${Math.max(height, 2)}px`,
                backgroundColor: vn.color,
                opacity,
                boxShadow: `inset 0 0 20px ${vn.color}, 0 0 15px ${vn.color}`,
              }}
            />
          )
        })}
      </div>

      <style>{`
        .visualizer-container {
          width: 100%;
          height: ${VISUALIZER_HEIGHT}px;
          background-color: #0D0D1A;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 800px;
        }

        .chord-display {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          color: #88FF88;
          text-shadow: 0 0 10px rgba(136, 255, 136, 0.5);
          z-index: 10;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .visualizer-canvas {
          position: relative;
          height: 100%;
          flex: 1;
        }

        .note-bar {
          position: absolute;
          bottom: 0;
          border-radius: 4px 4px 0 0;
          transition: all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
