import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { forgeRune, returnFragments, calculateSuccessRate, generateHexagramPositions, elementColors, getElementParticleColors, rarityStars } from '../../utils/gemUtils'
import { playForgeSuccess, playForgeFail } from '../../utils/audioUtils'
import { ElementIcon } from '../../components/ElementIcon'
import type { Fragment, Rune } from '../../types'
import './ForgeWorkshop.css'

export const ForgeWorkshop: React.FC = () => {
  const { forgeSlots, setForgeSlot, removeFragment, addRune, addFragment, runeCollection } = useGameStore()
  const [isForging, setIsForging] = useState(false)
  const [forgeResult, setForgeResult] = useState<'success' | 'fail' | null>(null)
  const [resultRune, setResultRune] = useState<Rune | null>(null)
  const [shakeSlots, setShakeSlots] = useState<number[]>([])
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])
  const particleIdRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  const hexPositions = generateHexagramPositions(6)
  const successRate = calculateSuccessRate(forgeSlots)
  const hasEnoughFragments = forgeSlots.filter((f) => f !== null).length >= 3

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    if (isForging) return

    try {
      const fragmentData = e.dataTransfer.getData('fragment')
      if (!fragmentData) return
      const fragment = JSON.parse(fragmentData) as Fragment

      const existingFragment = useGameStore.getState().fragments.find((f) => f.id === fragment.id)
      if (!existingFragment || existingFragment.count <= 0) return

      if (forgeSlots[slotIndex]) {
        return
      }

      setForgeSlot(slotIndex, { ...existingFragment, count: 1 })
    } catch (err) {
      console.error('Drop error:', err)
    }
  }

  const handleSlotClick = (index: number) => {
    if (isForging) return
    if (forgeSlots[index]) {
      setForgeSlot(index, null)
    }
  }

  const triggerParticles = useCallback((element: string) => {
    const colors = getElementParticleColors(element as any)
    const newParticles: Array<{ id: number; x: number; y: number; color: string }> = []
    
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40
      const velocity = 30 + Math.random() * 50
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
      })
    }
    setParticles(newParticles)

    let frame = 0
    const maxFrames = 60
    const animate = () => {
      frame++
      if (frame < maxFrames) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setParticles([])
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const handleForge = async () => {
    if (isForging || !hasEnoughFragments) return

    setIsForging(true)
    setForgeResult(null)
    setResultRune(null)

    const filledFragments = forgeSlots.filter((f) => f !== null) as Fragment[]

    filledFragments.forEach((f) => {
      removeFragment(f.id, 1)
    })

    setTimeout(() => {
      const result = forgeRune(forgeSlots)

      if (result) {
        setForgeResult('success')
        setResultRune(result)
        addRune(result)
        triggerParticles(result.element)
        playForgeSuccess()
      } else {
        setForgeResult('fail')
        setShakeSlots([0, 1, 2, 3, 4, 5])
        playForgeFail()

        const returned = returnFragments(forgeSlots)
        returned.forEach(({ fragment, count }) => {
          if (count > 0) {
            addFragment(fragment, count)
          }
        })

        setTimeout(() => setShakeSlots([]), 300)
      }

      setTimeout(() => {
        setIsForging(false)
        useGameStore.getState().clearForgeSlots()
      }, 1500)
    }, 800)
  }

  return (
    <div className="forge-workshop">
      <h2 className="section-title">合成台</h2>

      <div className="forge-container">
        <div className="hexagram-wrapper">
          <svg className="hexagram-svg" viewBox="-120 -120 240 240">
            <polygon
              points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50"
              fill="none"
              stroke={forgeResult === 'fail' ? '#8b0000' : 'rgba(201, 163, 74, 0.3)'}
              strokeWidth="2"
              className={`hexagram-line ${isForging && forgeResult !== 'fail' ? 'glowing' : ''}`}
            />
            <polygon
              points="0,100 86.6,50 86.6,-50 0,-100 -86.6,-50 -86.6,50"
              fill="none"
              stroke={forgeResult === 'fail' ? '#8b0000' : 'rgba(201, 163, 74, 0.3)'}
              strokeWidth="2"
              className={`hexagram-line ${isForging && forgeResult !== 'fail' ? 'glowing' : ''}`}
            />
          </svg>

          {particles.length > 0 && (
            <div className="particles-container">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="particle"
                  style={{
                    '--tx': `${p.x}px`,
                    '--ty': `${p.y}px`,
                    '--color': p.color,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {forgeSlots.map((fragment, index) => {
              const pos = hexPositions[index]
              const isShaking = shakeSlots.includes(index)
              return (
                <div
                  key={index}
                  className={`forge-slot ${fragment ? 'filled' : ''} ${isShaking ? 'shake' : ''} ${forgeResult === 'fail' ? 'cracked' : ''}`}
                  style={{
                    left: `calc(50% + ${pos.x}px - 30px)`,
                    top: `calc(50% + ${pos.y}px - 30px)`,
                    borderColor: fragment ? elementColors[fragment.element] : undefined,
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleSlotClick(index)}
                >
                  {fragment ? (
                    <div className="slot-fragment">
                    <ElementIcon element={fragment.element} size={28} />
                    </div>
                  ) : (
                    <span className="slot-number">{index + 1}</span>
                  )}
                </div>
              )
            })}

          <div
            className="forge-center">
            <button
              className={`forge-button ${hasEnoughFragments && !isForging ? 'active' : ''} ${isForging ? 'forging' : ''}`}
              onClick={handleForge}
              disabled={!hasEnoughFragments || isForging}
            >
              {isForging ? '合成中...' : '合成'}
            </button>
            {hasEnoughFragments && (
              <div className="success-rate">
                成功率: {Math.round(successRate * 100)}%
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="collection-panel">
        <h3 className="collection-title">符文收藏</h3>
        <div className="rune-collection">
          {runeCollection.length === 0 ? (
            <p className="empty-collection">暂无符文，快去合成吧！</p>
          ) : (
            runeCollection.map((rune) => (
              <div
                key={rune.id}
                className="rune-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('rune', JSON.stringify(rune))
                  e.dataTransfer.effectAllowed = 'move'
                }}
                style={{
                  '--rune-color': elementColors[rune.element],
                } as React.CSSProperties}
              >
                <ElementIcon element={rune.element} size={24} />
                <div className="rune-info">
                  <div className="rune-name">{rune.name}</div>
                  <div className="rune-rarity" style={{ color: elementColors[rune.element] }}>
                    {rarityStars(rune.rarity)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {forgeResult === 'success' && resultRune && (
        <div className="forge-result-overlay">
          <div className="forge-result-card success">
            <div className="result-icon">✨</div>
            <h3>合成成功！</h3>
            <div
              className="result-rune"
              style={{ borderColor: elementColors[resultRune.element] }}
            >
              <ElementIcon element={resultRune.element} size={48} />
              <div className="result-rune-name">{resultRune.name}</div>
              <div className="result-rune-rarity" style={{ color: elementColors[resultRune.element] }}>
                {rarityStars(resultRune.rarity)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
