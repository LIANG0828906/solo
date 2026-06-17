import React, { useEffect, useCallback, useRef } from 'react'
import { usePianoStore } from '../store/usePianoStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { PIANO_KEYS, WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT, getColorForNote } from '../constants/piano'

const WHITE_KEY_HEIGHT = 120
const WHITE_KEY_BG = '#F5F0E8'
const WHITE_KEY_ACTIVE = '#E0D4B8'
const BLACK_KEY_BG = '#2C2C2C'
const BLACK_KEY_ACTIVE = '#1A1A1A'

interface PianoKeyboardProps {
  onRecordToggle: () => void
  onPlayToggle: () => void
  recording: boolean
  hasRecording: boolean
  isPlaying: boolean
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  onRecordToggle,
  onPlayToggle,
  recording,
  hasRecording,
  isPlaying,
}) => {
  const { playNote, stopNote, initAudioContext } = useAudioEngine()
  const { addNote, removeNote, activeNotes } = usePianoStore()
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack)
  const blackKeys = PIANO_KEYS.filter(k => k.isBlack)
  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH

  const handleNoteOn = useCallback((note: string, freq: number) => {
    if (pressedKeysRef.current.has(note)) return
    
    initAudioContext()
    pressedKeysRef.current.add(note)
    const color = getColorForNote(note)
    playNote(freq, 0.5)
    addNote(note, freq, color, 80)
  }, [addNote, playNote, initAudioContext])

  const handleNoteOff = useCallback((note: string, freq: number) => {
    if (!pressedKeysRef.current.has(note)) return
    
    pressedKeysRef.current.delete(note)
    stopNote(freq)
    removeNote(note)
  }, [removeNote, stopNote])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = PIANO_KEYS.find(k => k.keyBinding.toLowerCase() === e.key.toLowerCase())
      if (key) {
        handleNoteOn(key.note, key.freq)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = PIANO_KEYS.find(k => k.keyBinding.toLowerCase() === e.key.toLowerCase())
      if (key) {
        handleNoteOff(key.note, key.freq)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleNoteOn, handleNoteOff])

  const isNoteActive = (note: string) => {
    return activeNotes.some(n => n.note === note)
  }

  return (
    <div className="keyboard-wrapper">
      <div className="controls">
        <button
          className={`record-btn ${recording ? 'recording' : ''}`}
          onClick={onRecordToggle}
          title={recording ? 'Stop Recording' : 'Start Recording'}
        >
          {recording ? '■' : '●'}
        </button>
        {hasRecording && !recording && (
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onPlayToggle}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>
      <div 
        className="piano-container"
        ref={containerRef}
        style={{ width: `${totalWidth}px` }}
      >
        <div className="white-keys">
          {whiteKeys.map((key) => (
            <div
              key={key.note}
              className={`white-key ${isNoteActive(key.note) ? 'active' : ''}`}
              onMouseDown={() => handleNoteOn(key.note, key.freq)}
              onMouseUp={() => handleNoteOff(key.note, key.freq)}
              onMouseLeave={() => handleNoteOff(key.note, key.freq)}
              style={{
                width: `${WHITE_KEY_WIDTH}px`,
                height: `${WHITE_KEY_HEIGHT}px`,
                backgroundColor: isNoteActive(key.note) ? WHITE_KEY_ACTIVE : WHITE_KEY_BG,
              }}
            >
              <span className="key-label">{key.keyBinding}</span>
            </div>
          ))}
        </div>
        <div className="black-keys">
          {blackKeys.map((key) => (
            <div
              key={key.note}
              className={`black-key ${isNoteActive(key.note) ? 'active' : ''}`}
              onMouseDown={() => handleNoteOn(key.note, key.freq)}
              onMouseUp={() => handleNoteOff(key.note, key.freq)}
              onMouseLeave={() => handleNoteOff(key.note, key.freq)}
              style={{
                left: `${key.x}px`,
                width: `${BLACK_KEY_WIDTH}px`,
                height: `${BLACK_KEY_HEIGHT}px`,
                backgroundColor: isNoteActive(key.note) ? BLACK_KEY_ACTIVE : BLACK_KEY_BG,
              }}
            >
              <span className="key-label">{key.keyBinding}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .keyboard-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          background: linear-gradient(to top, #1A1A2E 0%, #0D0D1A 100%);
          min-width: 800px;
        }

        .controls {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .record-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          background-color: #FF4444;
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .record-btn:hover {
          background-color: #CC3333;
        }

        .record-btn.recording {
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .play-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background-color: #4444FF;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .play-btn:hover {
          background-color: #3333CC;
        }

        .piano-container {
          position: relative;
          height: ${WHITE_KEY_HEIGHT}px;
          user-select: none;
        }

        .white-keys {
          display: flex;
          position: relative;
          height: 100%;
        }

        .white-key {
          border: 1px solid #333;
          border-radius: 0 0 4px 4px;
          cursor: pointer;
          transition: background-color 0.1s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .white-key:hover {
          background-color: #EDE5D5 !important;
        }

        .white-key.active {
          transition: background-color 0.1s ease;
        }

        .black-keys {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: ${BLACK_KEY_HEIGHT}px;
          pointer-events: none;
        }

        .black-key {
          position: absolute;
          border-radius: 0 0 3px 3px;
          cursor: pointer;
          transition: background-color 0.1s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 6px;
          z-index: 2;
          pointer-events: auto;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .black-key:hover {
          background-color: #1F1F1F !important;
        }

        .black-key.active {
          transition: background-color 0.1s ease;
        }

        .key-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          user-select: none;
          pointer-events: none;
        }

        .white-key .key-label {
          color: rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  )
}
