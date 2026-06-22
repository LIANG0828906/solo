import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Rune, RUNES, useGameStore, RuneType } from '../../store/gameStore'
import { RuneEngine } from './RuneEngine'

const RUNE_SYMBOLS: Record<RuneType, string> = {
  fire: '🔥',
  ice: '❄',
  thunder: '⚡',
  life: '🌿',
  shadow: '🌙'
}

interface Ripple {
  id: string
  runeId: string
  color: string
}

const RunePanel: React.FC = () => {
  const {
    selectedRunes,
    addRune,
    removeRune,
    clearRunes,
    consecutiveErrors,
    hintRuneId,
    setHintRuneId,
    isPortalActive,
    isInteractionDisabled,
    incrementCombinations,
    setLastErrorCombination,
    setPortalActive,
    setInteractionDisabled
  } = useGameStore()

  const [ripples, setRipples] = useState<Ripple[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  const getSelectedRuneIds = useCallback(() => {
    return selectedRunes.map((r) => r.id)
  }, [selectedRunes])

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playRuneSound = useCallback(
    (frequency: number) => {
      try {
        const ctx = initAudioContext()
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.2)
      } catch {
        // Audio not supported
      }
    },
    [initAudioContext]
  )

  const createRipple = useCallback((runeId: string, color: string) => {
    const ripple: Ripple = {
      id: `${runeId}-${Date.now()}-${Math.random()}`,
      runeId,
      color
    }
    setRipples((prev) => [...prev, ripple])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
    }, 300)
  }, [])

  const handleRuneClick = useCallback(
    (rune: Rune) => {
      if (isPortalActive || isInteractionDisabled) return
      if (selectedRunes.length >= 3) return

      createRipple(rune.id, rune.color)
      playRuneSound(rune.frequency)
      addRune(rune)
    },
    [isPortalActive, isInteractionDisabled, selectedRunes.length, createRipple, playRuneSound, addRune]
  )

  const handleSlotRuneClick = useCallback(
    (index: number) => {
      if (isPortalActive || isInteractionDisabled) return
      removeRune(index)
    },
    [isPortalActive, isInteractionDisabled, removeRune]
  )

  const handleActivate = useCallback(() => {
    if (isPortalActive || isInteractionDisabled) return
    if (selectedRunes.length !== 3) return

    const result = RuneEngine.validate(selectedRunes)
    incrementCombinations(result.valid)

    if (result.valid) {
      setHintRuneId(null)
      setInteractionDisabled(true)
      setPortalActive(true)

      setTimeout(() => {
        setPortalActive(false)
        setInteractionDisabled(false)
        clearRunes()
      }, 3500)
    } else {
      setLastErrorCombination([...selectedRunes])
      setTimeout(() => {
        clearRunes()
      }, 500)
    }
  }, [isPortalActive, isInteractionDisabled, selectedRunes, incrementCombinations, setHintRuneId, setInteractionDisabled, setPortalActive, clearRunes, setLastErrorCombination])

  const handleShowHint = useCallback(() => {
    if (consecutiveErrors < 3) return

    const hintType = RuneEngine.getHintForFirstRune()
    const targetRune = RUNES.find((r) => r.type === hintType)
    if (targetRune) {
      setHintRuneId(targetRune.id)
      setTimeout(() => {
        setHintRuneId(null)
      }, 4000)
    }
  }, [consecutiveErrors, setHintRuneId])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const isSelected = (rune: Rune) => getSelectedRuneIds().includes(rune.id)

  return (
    <div className={`rune-panel-container ${isInteractionDisabled ? 'disabled' : ''}`}>
      <div className="rune-grid">
        {RUNES.map((rune, index) => (
          <div key={rune.id} className="rune-wrapper" style={{ animationDelay: `${index * 50}ms` }}>
            <div
              className={`rune-circle ${isSelected(rune) ? 'selected' : ''} ${hintRuneId === rune.id ? 'hint-pulse' : ''}`}
              style={{
                '--rune-color': rune.color,
                '--rune-glow': rune.innerGlow
              } as React.CSSProperties}
              onClick={() => handleRuneClick(rune)}
            >
              <span className="rune-symbol">{RUNE_SYMBOLS[rune.type]}</span>
              {ripples
                .filter((r) => r.runeId === rune.id)
                .map((ripple) => (
                  <div
                    key={ripple.id}
                    className="rune-ripple"
                    style={{ borderColor: ripple.color, boxShadow: `0 0 20px ${ripple.color}` }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rune-slots-bar">
        {selectedRunes.length === 0 ? (
          <span className="slots-placeholder">点击符文开始组合...</span>
        ) : (
          selectedRunes.map((rune, index) => (
            <React.Fragment key={`slot-${rune.id}-${index}`}>
              <div
                className="slot-rune"
                style={{
                  '--rune-color': rune.color,
                  '--rune-glow': rune.innerGlow
                } as React.CSSProperties}
                onClick={() => handleSlotRuneClick(index)}
              >
                <span className="slot-symbol">{RUNE_SYMBOLS[rune.type]}</span>
              </div>
              {index < selectedRunes.length - 1 && <span className="slot-arrow">→</span>}
            </React.Fragment>
          ))
        )}
      </div>

      <div className="rune-actions">
        <button
          className="activate-btn"
          disabled={selectedRunes.length !== 3 || isPortalActive || isInteractionDisabled}
          onClick={handleActivate}
        >
          激活传送门
        </button>
        {consecutiveErrors >= 3 && (
          <button className="hint-btn" onClick={handleShowHint}>
            💡 获取提示
          </button>
        )}
      </div>
    </div>
  )
}

export default RunePanel
