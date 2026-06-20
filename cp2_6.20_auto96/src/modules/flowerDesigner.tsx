import { useState, useEffect, useRef, useCallback } from 'react'
import { useFlowerStore, type VaseFlower } from '../store/flowerStore'
import type { Flower, PairingFlower } from '../services/api'
import { flowerApi } from '../services/api'

interface PopupState {
  instanceId: string
  x: number
  y: number
  pairings: PairingFlower[]
  loadingPairings: boolean
}

function FlowerDesigner() {
  const {
    vaseFlowers,
    addFlowerToVase,
    removeFlowerFromVase,
    allFlowers,
    setMobileDrawerOpen,
  } = useFlowerStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [insertAnimIds, setInsertAnimIds] = useState<Set<string>>(new Set())
  const designerRef = useRef<HTMLDivElement>(null)
  const popupTimer = useRef<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      try {
        const json = e.dataTransfer.getData('application/json')
        if (json) {
          const flower = JSON.parse(json) as Flower
          addFlowerToVase(flower)
          setInsertAnimIds((prev) => {
            const next = new Set(prev)
            const newInstanceId = vaseFlowers.length > 0 ? `new-${Date.now()}` : `first-${Date.now()}`
            next.add(newInstanceId)
            setTimeout(() => {
              setInsertAnimIds((p) => {
                const np = new Set(p)
                np.delete(newInstanceId)
                return np
              })
            }, 500)
            return next
          })
        } else {
          const id = e.dataTransfer.getData('text/plain')
          const flower = allFlowers.find((f) => f.id === id)
          if (flower) {
            addFlowerToVase(flower)
          }
        }
      } catch (err) {
        console.error('Drop error:', err)
      }
    },
    [addFlowerToVase, allFlowers, vaseFlowers.length]
  )

  const handleFlowerClick = useCallback(
    async (e: React.MouseEvent, vaseFlower: VaseFlower) => {
      e.stopPropagation()
      const rect = designerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setPopup({
        instanceId: vaseFlower.instanceId,
        x,
        y,
        pairings: [],
        loadingPairings: true,
      })

      if (popupTimer.current) window.clearTimeout(popupTimer.current)

      try {
        const result = await flowerApi.getFlowerPairings(vaseFlower.flowerId)
        setPopup((prev) => {
          if (!prev) return prev
          return { ...prev, pairings: result.pairings, loadingPairings: false }
        })
      } catch (err) {
        console.error('加载搭配建议失败', err)
        setPopup((prev) => (prev ? { ...prev, loadingPairings: false } : prev))
      }
    },
    []
  )

  const closePopup = useCallback(() => {
    setPopup(null)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!popup) return
      const target = e.target as HTMLElement
      if (target.closest('.flower-popup-container')) return
      if (target.closest('.vase-flower-item')) return
      closePopup()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [popup, closePopup])

  const handleAddPairing = useCallback(
    (pairing: PairingFlower) => {
      const flower = allFlowers.find((f) => f.id === pairing.id)
      if (flower) {
        addFlowerToVase(flower)
      }
    },
    [allFlowers, addFlowerToVase]
  )

  const handleRemove = useCallback(
    (instanceId: string) => {
      removeFlowerFromVase(instanceId)
      setPopup(null)
    },
    [removeFlowerFromVase]
  )

  const selectedFlower = popup
    ? vaseFlowers.find((f) => f.instanceId === popup.instanceId)
    : null

  const maxHeight = Math.max(80, ...vaseFlowers.map((f) => f.flower.height))

  return (
    <div
      ref={designerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={closePopup}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(212, 165, 116, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(255, 159, 67, 0.06) 0%, transparent 50%),
          linear-gradient(180deg, #fdf7f0 0%, var(--bg-main) 100%)
        `,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          设计区 · 将花材拖拽到下方花瓶中
        </div>
      </div>

      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(212, 165, 116, 0.1)',
            border: '3px dashed var(--accent-1)',
            borderRadius: '0',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '16px 32px',
              background: 'var(--bg-glass-strong)',
              borderRadius: '16px',
              border: '1px solid var(--border-medium)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              backdropFilter: 'blur(10px)',
            }}
          >
            🌸 释放即可插入花瓶
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '100px',
          transform: 'translateX(-50%)',
          width: 'min(600px, 85%)',
          height: `${maxHeight * 5 + 200}px`,
          maxHeight: 'calc(100% - 160px)',
          minHeight: '400px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '62%',
            height: '220px',
            pointerEvents: 'auto',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 220"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              filter: 'drop-shadow(0 20px 40px rgba(74, 55, 40, 0.18))',
            }}
          >
            <defs>
              <linearGradient id="glassBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="20%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="50%" stopColor="rgba(220,240,255,0.35)" />
                <stop offset="80%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
              </linearGradient>
              <linearGradient id="glassRim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
              </linearGradient>
              <linearGradient id="waterFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(173,216,230,0.4)" />
                <stop offset="100%" stopColor="rgba(100,180,220,0.55)" />
              </linearGradient>
              <linearGradient id="shineEffect" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <filter id="glassBlur">
                <feGaussianBlur stdDeviation="1" />
              </filter>
            </defs>
            <path
              d="M60,10 L240,10 L255,40 L270,140 Q275,190 240,210 L60,210 Q25,190 30,140 L45,40 Z"
              fill="url(#glassBody)"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            <path
              d="M60,10 L240,10 L255,40 L270,140 Q275,190 240,210 L60,210 Q25,190 30,140 L45,40 Z"
              fill="none"
              stroke="rgba(200,220,240,0.5)"
              strokeWidth="0.5"
            />
            <ellipse cx="150" cy="10" rx="90" ry="8" fill="url(#glassRim)" stroke="rgba(220,235,250,0.8)" strokeWidth="1" />
            <ellipse cx="150" cy="85" rx="110" ry="10" fill="url(#waterFill)" opacity="0.8" />
            <path
              d="M75,40 Q80,120 95,200"
              stroke="url(#shineEffect)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M225,40 Q220,120 205,200"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="150" cy="210" rx="85" ry="6" fill="rgba(74,55,40,0.12)" />
          </svg>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '110px',
            left: 0,
            right: 0,
            height: 'calc(100% - 230px)',
            minHeight: '200px',
            pointerEvents: 'auto',
          }}
        >
          {vaseFlowers.map((vf, idx) => {
            const heightPx = (vf.flower.height / maxHeight) * 180 + 140
            const xPercent = vf.position.x
            const zIndex = Math.floor(vf.position.z * 10) + idx
            const isSelected = popup?.instanceId === vf.instanceId
            const hasAnim =
              insertAnimIds.size > 0 && idx === vaseFlowers.length - 1

            return (
              <div
                key={vf.instanceId}
                className="vase-flower-item"
                onClick={(e) => handleFlowerClick(e, vf)}
                style={{
                  position: 'absolute',
                  left: `${xPercent}%`,
                  bottom: '0',
                  transform: 'translateX(-50%)',
                  width: '70px',
                  height: `${heightPx}px`,
                  zIndex: zIndex,
                  cursor: 'pointer',
                  animation: hasAnim ? 'bounce-in 0.3s ease-out' : undefined,
                  mixBlendMode: 'normal',
                  isolation: 'isolate',
                  filter: isSelected
                    ? `drop-shadow(0 0 12px ${vf.flower.color_hex}66) drop-shadow(0 4px 8px rgba(0,0,0,0.1))`
                    : 'drop-shadow(0 4px 6px rgba(74,55,40,0.15))',
                  transition: 'filter 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.filter = `drop-shadow(0 0 8px ${vf.flower.color_hex}44) drop-shadow(0 6px 12px rgba(74,55,40,0.2))`
                    e.currentTarget.style.transform = 'translateX(-50%) translateY(-3px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.filter =
                      'drop-shadow(0 4px 6px rgba(74,55,40,0.15))'
                    e.currentTarget.style.transform = 'translateX(-50%) translateY(0)'
                  }
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '2px',
                    height: `${heightPx - 50}px`,
                    background: `linear-gradient(180deg, ${vf.flower.color_hex}20, #6b8e5a, #5a7d4a)`,
                    borderRadius: '2px',
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    transform: 'translateX(-50%)',
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${vf.flower.color_hex}dd 0%, ${vf.flower.color_hex}88 60%, transparent 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    animation: `float ${3 + (idx % 3) * 0.4}s ease-in-out infinite`,
                    animationDelay: `${idx * 0.15}s`,
                    mixBlendMode: 'multiply' as const,
                  }}
                >
                  <span
                    style={{
                      fontSize: '38px',
                      mixBlendMode: 'normal' as const,
                      position: 'relative',
                      zIndex: 3,
                    }}
                  >
                    {vf.flower.image}
                  </span>
                </div>
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '62px',
                      height: '62px',
                      borderRadius: '50%',
                      border: `2px solid ${vf.flower.color_hex}`,
                      animation: 'pulse 1.2s ease-in-out infinite',
                      zIndex: 0,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {vaseFlowers.length === 0 && !isDragOver && (
        <div
          style={{
            position: 'absolute',
            bottom: '340px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            opacity: 0.8,
          }}
        >
          <div
            style={{
              fontSize: '44px',
              marginBottom: '12px',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            🌷
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              marginBottom: '4px',
            }}
          >
            拖入花材，打造专属于你的花束
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--text-muted)',
            }}
          >
            也可直接点击左侧花材卡片快速添加
          </div>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              display: 'none',
              marginTop: '16px',
              padding: '10px 20px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              pointerEvents: 'auto',
            }}
            className="mobile-open-library"
          >
            🎨 打开花材库
          </button>
        </div>
      )}

      {popup && selectedFlower && (
        <div
          className="flower-popup-container"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max(popup.x, 180), (designerRef.current?.clientWidth || 800) - 260)}px`,
            top: `${Math.max(popup.y - 200, 20)}px`,
            width: '300px',
            background: 'var(--bg-glass-strong)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '18px',
            padding: '18px',
            boxShadow: 'var(--shadow-deep)',
            border: '1px solid var(--border-medium)',
            zIndex: 100,
            animation: 'fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: `radial-gradient(circle, ${selectedFlower.flower.color_hex}44 0%, ${selectedFlower.flower.color_hex}11 100%)`,
                border: `1.5px solid ${selectedFlower.flower.color_hex}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}
            >
              {selectedFlower.flower.image}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '3px',
                }}
              >
                {selectedFlower.flower.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {selectedFlower.flower.seasons.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '1.5px 7px',
                      borderRadius: '8px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      background:
                        s === '春'
                          ? '#a8e6cf40'
                          : s === '夏'
                          ? '#ffd3b640'
                          : s === '秋'
                          ? '#ffaaa540'
                          : '#dcedc140',
                      color:
                        s === '春'
                          ? '#27ae60'
                          : s === '夏'
                          ? '#f39c12'
                          : s === '秋'
                          ? '#e67e22'
                          : '#3498db',
                    }}
                  >
                    {s}
                  </span>
                ))}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '1.5px 7px',
                    borderRadius: '8px',
                    fontSize: '9.5px',
                    background: selectedFlower.flower.color_hex + '30',
                    color: selectedFlower.flower.color_hex,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: selectedFlower.flower.color_hex,
                    }}
                  />
                  {selectedFlower.flower.color}
                </span>
              </div>
            </div>
            <button
              onClick={closePopup}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-panel)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              💬 花语解读
            </div>
            <div
              style={{
                fontSize: '12.5px',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                padding: '10px 12px',
                background: `linear-gradient(135deg, ${selectedFlower.flower.color_hex}12 0%, rgba(255,255,255,0.5) 100%)`,
                borderRadius: '10px',
                borderLeft: `3px solid ${selectedFlower.flower.color_hex}`,
                fontStyle: 'italic',
              }}
            >
              "{selectedFlower.flower.meaning}"
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🎯 最佳搭配推荐
            </div>
            {popup.loadingPairings ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
                  ⏳
                </span>{' '}
                正在寻找搭配灵感...
              </div>
            ) : popup.pairings.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-panel)',
                  borderRadius: '10px',
                }}
              >
                暂无搭配建议
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {popup.pairings.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddPairing(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: 'var(--bg-panel)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-soft)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-glass-strong)'
                      e.currentTarget.style.transform = 'translateX(3px)'
                      e.currentTarget.style.borderColor = p.color_hex + '66'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-panel)'
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.borderColor = 'var(--border-soft)'
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: `radial-gradient(circle, ${p.color_hex}44, ${p.color_hex}11)`,
                        border: `1.5px solid ${p.color_hex}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      {p.image}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        background: 'var(--accent-gradient)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      + 添加
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleRemove(popup.instanceId)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(238,90,90,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            🗑️ 从花瓶中移除
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .mobile-open-library {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  )
}

export default FlowerDesigner
