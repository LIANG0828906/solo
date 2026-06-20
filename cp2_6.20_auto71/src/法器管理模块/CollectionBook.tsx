import React, { useState, useEffect, useCallback, useRef } from 'react'
import { type SmeltedArtifact, type Achievement, getCollection, getAchievements, checkAchievements } from '@/utils/api'

const ELEMENT_COLORS: Record<string, string> = {
  metal: '#c0c0c0',
  wood: '#4caf50',
  water: '#2196f3',
  fire: '#f44336',
  earth: '#ff9800',
}

const ELEMENT_LABELS: Record<string, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

interface CollectionBookProps {
  onBack?: () => void
}

interface ActiveAchievement extends Achievement {
  showId: number
}

const CollectionBook = React.memo(function CollectionBook({ onBack }: CollectionBookProps) {
  const [collection, setCollection] = useState<SmeltedArtifact[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeAchievements, setActiveAchievements] = useState<ActiveAchievement[]>([])
  const [hoveredArtifact, setHoveredArtifact] = useState<SmeltedArtifact | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  const showIdRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const popupRef = useRef<HTMLDivElement>(null)
  const targetPosRef = useRef({ x: 0, y: 0 })
  const currentPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [col, ach] = await Promise.all([getCollection(), getAchievements()])
        setCollection(col)
        setAchievements(ach)

        const newlyUnlocked = await checkAchievements(col, 0)
        const newAchievements = newlyUnlocked.filter(
          (a) => !ach.find((existing) => existing.id === a.id && existing.isUnlocked),
        )

        if (newAchievements.length > 0) {
          showAchievementNotification(newAchievements)
        }
      } catch (err) {
        console.error('加载收藏数据失败:', err)
      }
    }

    loadData()
  }, [])

  const showAchievementNotification = useCallback((newAchievements: Achievement[]) => {
    newAchievements.forEach((achievement, index) => {
      const showId = showIdRef.current++
      setTimeout(() => {
        setActiveAchievements((prev) => [...prev, { ...achievement, showId }])

        setTimeout(() => {
          setActiveAchievements((prev) => prev.filter((a) => a.showId !== showId))
        }, 5000)
      }, index * 600)
    })
  }, [])

  const handleMouseEnter = useCallback(
    (artifact: SmeltedArtifact, e: React.MouseEvent<HTMLDivElement>) => {
      setHoveredArtifact(artifact)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top
      targetPosRef.current = { x, y }
      currentPosRef.current = { x, y }
      setHoverPosition({ x, y })
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoveredArtifact) {
        targetPosRef.current = {
          x: e.clientX,
          y: e.clientY,
        }
      }
    },
    [hoveredArtifact],
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredArtifact(null)
  }, [])

  useEffect(() => {
    if (!hoveredArtifact || !popupRef.current) return

    let running = true

    const animate = () => {
      if (!running) return

      const target = targetPosRef.current
      const current = currentPosRef.current

      const dx = target.x - current.x
      const dy = target.y - current.y

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        currentPosRef.current = {
          x: current.x + dx * 0.15,
          y: current.y + dy * 0.15,
        }

        if (popupRef.current) {
          popupRef.current.style.left = `${currentPosRef.current.x + 16}px`
          popupRef.current.style.top = `${currentPosRef.current.y - 10}px`
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [hoveredArtifact])

  const statLabels: Record<string, string> = {
    attack: '攻击',
    defense: '防御',
    speed: '速度',
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: `
          linear-gradient(180deg, #3e2723 0%, #2d1b18 50%, #1a0f0d 100%),
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 40px,
            rgba(0, 0, 0, 0.05) 40px,
            rgba(0, 0, 0, 0.05) 80px
          ),
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(139, 90, 43, 0.1) 3px,
            rgba(139, 90, 43, 0.1) 6px
          )
        `,
        backgroundBlendMode: 'multiply',
        padding: '32px 24px',
        boxSizing: 'border-box',
      }}
      onMouseMove={handleMouseMove}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              color: '#cda434',
              fontSize: 28,
              fontWeight: 900,
              margin: 0,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontFamily: 'serif',
            }}
          >
            法器图鉴
          </h2>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid #8b6914',
                background: 'rgba(62, 39, 35, 0.8)',
                color: '#cda434',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#8b6914'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(62, 39, 35, 0.8)'
                e.currentTarget.style.color = '#cda434'
              }}
            >
              返回
            </button>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div
            className="collection-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '32px 24px',
            }}
          >
            {collection.map((artifact) => (
              <div key={artifact.smeltedId} style={{ position: 'relative' }}>
                <div
                  className="artifact-cell"
                  onMouseEnter={(e) => {
                    handleMouseEnter(artifact, e)
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = `
                      inset 0 2px 12px rgba(255, 215, 0, 0.4),
                      0 8px 32px rgba(0, 0, 0, 0.7),
                      0 0 24px rgba(205, 164, 52, 0.3)
                    `
                  }}
                  onMouseLeave={(e) => {
                    handleMouseLeave()
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = `
                      inset 0 2px 8px rgba(255, 215, 0, 0.2),
                      0 4px 16px rgba(0, 0, 0, 0.5)
                    `
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #cda434, #8b6914)',
                    padding: 2,
                    boxShadow: `
                      inset 0 2px 8px rgba(255, 215, 0, 0.2),
                      0 4px 16px rgba(0, 0, 0, 0.5)
                    `,
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    willChange: 'transform',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: `
                        radial-gradient(circle at 30% 30%, rgba(205, 164, 52, 0.3), transparent 60%),
                        radial-gradient(circle at 70% 70%, rgba(139, 105, 20, 0.4), transparent 60%),
                        linear-gradient(135deg, #2a1a15, #1a0f0d)
                      `,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '75%',
                        height: '75%',
                        borderRadius: '50%',
                        background: `
                          radial-gradient(circle at 35% 35%, ${ELEMENT_COLORS[artifact.mainElement]}88, ${ELEMENT_COLORS[artifact.mainElement]}22),
                          url(${artifact.icon}) center/cover
                        `,
                        border: `2px solid ${ELEMENT_COLORS[artifact.mainElement]}`,
                        boxShadow: `0 0 16px ${ELEMENT_COLORS[artifact.mainElement]}66`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                      }}
                    >
                      {!artifact.icon && artifact.name.slice(0, 2)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#f5e6a3',
                        fontSize: 12,
                        fontWeight: 600,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {artifact.name}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    left: -8,
                    right: -8,
                    height: 8,
                    background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 50%, #2d1b18 100%)',
                    borderRadius: '2px',
                    boxShadow: `
                      0 2px 4px rgba(0, 0, 0, 0.5),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    zIndex: -1,
                  }}
                />
              </div>
            ))}
          </div>

          {collection.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#8b6914',
                fontSize: 16,
              }}
            >
              暂无收藏的法器
            </div>
          )}
        </div>
      </div>

      {hoveredArtifact && (
        <div
          ref={popupRef}
          className="artifact-popup"
          style={{
            position: 'fixed',
            left: hoverPosition.x + 16,
            top: hoverPosition.y - 10,
            zIndex: 100,
            pointerEvents: 'none',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(30, 20, 15, 0.85)',
            border: '1px solid #cda434',
            borderRadius: 12,
            padding: 16,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            willChange: 'transform, opacity',
          }}
        >
          <div
            style={{
              color: '#f5e6a3',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 12,
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {hoveredArtifact.name}
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#cda434', fontSize: 12, marginBottom: 4 }}>主元素</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: ELEMENT_COLORS[hoveredArtifact.mainElement],
                  boxShadow: `0 0 8px ${ELEMENT_COLORS[hoveredArtifact.mainElement]}`,
                }}
              />
              <span style={{ color: '#f5e6a3', fontSize: 13 }}>
                {ELEMENT_LABELS[hoveredArtifact.mainElement]}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#cda434', fontSize: 12, marginBottom: 6 }}>属性</div>
            {(['attack', 'defense', 'speed'] as const).map((stat) => (
              <div
                key={stat}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 2,
                }}
              >
                <span style={{ color: '#aaa' }}>{statLabels[stat]}</span>
                <span style={{ color: '#f5e6a3', fontWeight: 600 }}>
                  {Math.round(hoveredArtifact.finalStats[stat] * 100) / 100}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: '#cda434', fontSize: 12, marginBottom: 6 }}>魂窍</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {hoveredArtifact.soulHoles.map((hole, i) => (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: hole ? `2px solid ${ELEMENT_COLORS[hole]}` : '2px dashed #555',
                    background: hole
                      ? `radial-gradient(circle at 35% 35%, ${ELEMENT_COLORS[hole]}aa, ${ELEMENT_COLORS[hole]}44)`
                      : 'rgba(30, 20, 15, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {hole ? ELEMENT_LABELS[hole] : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        {activeAchievements.map((achievement) => (
          <div
            key={achievement.showId}
            style={{
              position: 'relative',
              width: 280,
              padding: '16px 16px 16px 20px',
              background: 'rgba(30, 20, 15, 0.95)',
              border: '2px solid #cda434',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
              willChange: 'transform, opacity',
              animation: 'slideInAchievement 0.4s ease-out forwards, fadeOutAchievement 0.5s ease-in 4.5s forwards',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: -28,
                width: 80,
                height: 28,
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                transform: 'rotate(-45deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span
                style={{
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  transform: 'rotate(0deg)',
                  paddingLeft: 12,
                }}
              >
                成就达成！
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, #cda434, #8b6914)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(205, 164, 52, 0.4)',
                }}
              >
                {achievement.icon || '🏆'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#ff4444',
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  成就达成！
                </div>
                <div
                  style={{
                    color: '#f5e6a3',
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {achievement.name}
                </div>
                <div
                  style={{
                    color: '#aaa',
                    fontSize: 11,
                    lineHeight: 1.4,
                  }}
                >
                  {achievement.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInAchievement {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOutAchievement {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        .collection-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        
        @media (max-width: 768px) {
          .collection-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 480px) {
          .collection-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        .artifact-popup {
          will-change: left, top;
        }
      `}</style>
    </div>
  )
})

export default CollectionBook
