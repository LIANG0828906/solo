import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from './store'
import SkillParticle from './SkillParticle'
import { SKILL_DURATION, TRANSITION_DURATION } from './types'
import { v4 as uuidv4 } from 'uuid'

interface ActiveEffect {
  id: string
  skillId: string
  startTime: number
}

const Scene: React.FC<{
  effects: ActiveEffect[]
  onEffectComplete: (id: string) => void
}> = ({ effects, onEffectComplete }) => {
  const getSkillById = useAppStore((state) => state.getSkillById)

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      {effects.map((effect) => {
        const skill = getSkillById(effect.skillId)
        if (!skill) return null
        return (
          <SkillParticle
            key={effect.id}
            skill={skill}
            startTime={effect.startTime}
            onComplete={() => onEffectComplete(effect.id)}
          />
        )
      })}
    </>
  )
}

const StatsCard: React.FC<{
  totalDamage: number
  totalCooldown: number
  totalDuration: number
}> = ({ totalDamage, totalCooldown, totalDuration }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(15, 52, 96, 0.9)',
        backdropFilter: 'blur(4px)',
        borderRadius: 4,
        border: '0.5px solid #e94560',
        padding: 12,
        minWidth: 140,
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>
        连招统计
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#aaa' }}>总伤害:</span>
          <span style={{ color: '#ff6b35', fontWeight: 700 }}>{totalDamage}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#aaa' }}>总冷却:</span>
          <span style={{ color: '#4ecdc4', fontWeight: 700 }}>{totalCooldown}s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#aaa' }}>耗时:</span>
          <span style={{ color: '#95e1d3', fontWeight: 700 }}>{totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  )
}

const ComboPreview: React.FC = () => {
  const {
    comboSlots,
    playback: { isPlaying, currentIndex, stats },
    getSkillById,
    startPlayback,
    stopPlayback,
    setCurrentPlaybackIndex,
  } = useAppStore()

  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([])
  const playbackTimerRef = useRef<number | null>(null)
  const effectTimersRef = useRef<Map<string, number>>(new Map())

  const filledSlots = comboSlots.filter((s) => s.skillId !== null)
  const hasSkills = filledSlots.length > 0

  const handleEffectComplete = useCallback((effectId: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== effectId))
    const timer = effectTimersRef.current.get(effectId)
    if (timer) {
      clearTimeout(timer)
      effectTimersRef.current.delete(effectId)
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    let currentStep = 0

    const playNextSkill = () => {
      if (currentStep >= filledSlots.length) {
        const totalTime = filledSlots.length * (SKILL_DURATION + TRANSITION_DURATION) * 1000
        playbackTimerRef.current = window.setTimeout(() => {
          stopPlayback()
          setCurrentPlaybackIndex(-1)
        }, totalTime + 500)
        return
      }

      const slot = filledSlots[currentStep]
      if (!slot.skillId) {
        currentStep++
        playNextSkill()
        return
      }

      const effectId = uuidv4()
      const startTime = Date.now()

      setActiveEffects((prev) => [...prev, { id: effectId, skillId: slot.skillId!, startTime }])
      setCurrentPlaybackIndex(currentStep)

      const fadeTimer = window.setTimeout(() => {
        setActiveEffects((prev) => prev.filter((e) => e.id !== effectId))
        effectTimersRef.current.delete(effectId)
      }, SKILL_DURATION * 1000 + 100)

      effectTimersRef.current.set(effectId, fadeTimer)

      currentStep++
      playbackTimerRef.current = window.setTimeout(
        playNextSkill,
        (SKILL_DURATION + TRANSITION_DURATION) * 1000
      )
    }

    playNextSkill()

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current)
        playbackTimerRef.current = null
      }
      effectTimersRef.current.forEach((timer) => clearTimeout(timer))
      effectTimersRef.current.clear()
    }
  }, [isPlaying, filledSlots, stopPlayback, setCurrentPlaybackIndex])

  const handlePlayClick = () => {
    if (isPlaying) {
      stopPlayback()
      setActiveEffects([])
      setCurrentPlaybackIndex(-1)
    } else {
      setActiveEffects([])
      startPlayback()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 400,
          height: 300,
          backgroundColor: '#0a0a1a',
          borderRadius: 4,
          border: '0.5px solid #e94560',
          overflow: 'hidden',
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#0a0a1a']} />
          <Scene effects={activeEffects} onEffectComplete={handleEffectComplete} />
        </Canvas>

        <StatsCard
          totalDamage={stats.totalDamage}
          totalCooldown={stats.totalCooldown}
          totalDuration={stats.totalDuration}
        />

        {!hasSkills && !isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            拖入技能开始预览
          </div>
        )}

        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 4,
            }}
          >
            {filledSlots.map((slot, i) => {
              const skill = getSkillById(slot.skillId)
              return (
                <div
                  key={slot.id}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor:
                      i === currentIndex
                        ? '#4ade80'
                        : i < currentIndex
                          ? 'rgba(74, 222, 128, 0.3)'
                          : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    transition: 'all 0.3s ease',
                    transform: i === currentIndex ? 'scale(1.2)' : 'scale(1)',
                    boxShadow:
                      i === currentIndex ? '0 0 10px rgba(74, 222, 128, 0.6)' : 'none',
                  }}
                >
                  {skill?.icon}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={handlePlayClick}
        disabled={!hasSkills}
        style={{
          padding: '12px 48px',
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: isPlaying ? '#e94560' : hasSkills ? '#0f3460' : 'rgba(15, 52, 96, 0.5)',
          color: isPlaying ? 'white' : hasSkills ? 'white' : 'rgba(255,255,255,0.5)',
          border: `2px solid ${isPlaying || hasSkills ? '#e94560' : 'rgba(233, 69, 96, 0.3)'}`,
          borderRadius: 4,
          cursor: hasSkills ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onMouseEnter={(e) => {
          if (hasSkills) {
            e.currentTarget.style.backgroundColor = '#e94560'
          }
        }}
        onMouseLeave={(e) => {
          if (hasSkills) {
            e.currentTarget.style.backgroundColor = isPlaying ? '#e94560' : '#0f3460'
          }
        }}
      >
        <span>{isPlaying ? '⏹' : '▶'}</span>
        <span>{isPlaying ? '停止播放' : '播放连招'}</span>
      </button>
    </div>
  )
}

export default ComboPreview
