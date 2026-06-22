import { useState, useEffect, useRef, useCallback } from 'react'
import ColorWheel from './components/ColorWheel'
import PreviewPanel from './components/PreviewPanel'
import {
  generateSchemeColors,
  generateShades,
  hexToHsl,
  hslToHex,
  getContrastRatio,
  getWCAGRating,
  formatTime,
  generateId,
  type SchemeType,
  type SchemeColor,
  type HistoryItem,
} from './utils/colorUtils'

const SCHEME_TYPES: { type: SchemeType; label: string }[] = [
  { type: 'analogous', label: '类比色' },
  { type: 'complementary', label: '互补色' },
  { type: 'triadic', label: '三角色' },
  { type: 'monochromatic', label: '单色' },
  { type: 'adjacent', label: '邻近色' },
]

const SHADE_KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const

export default function App() {
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [schemeType, setSchemeType] = useState<SchemeType>('analogous')
  const [schemeColors, setSchemeColors] = useState<SchemeColor[]>([])
  const [selectedSchemeIndex, setSelectedSchemeIndex] = useState(2)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isFlying, setIsFlying] = useState(false)
  const [flyPosition, setFlyPosition] = useState({ x: 0, y: 0, scale: 1, opacity: 1, color: '' })
  const flyAnimationRef = useRef<number | null>(null)
  const historyListRef = useRef<HTMLDivElement>(null)
  const wheelContainerRef = useRef<HTMLDivElement>(null)

  const primaryHsl = hexToHsl(primaryColor)
  const contrastRatio = getContrastRatio(primaryColor, '#ffffff')
  const wcagResult = getWCAGRating(contrastRatio)
  const contrastOnDark = getContrastRatio(primaryColor, '#1a1a2e')
  const wcagOnDark = getWCAGRating(contrastOnDark)

  useEffect(() => {
    const colors = generateSchemeColors(primaryColor, schemeType)
    setSchemeColors(colors)
  }, [primaryColor, schemeType])

  useEffect(() => {
    const saved = localStorage.getItem('colorPaletteHistory')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {
        setHistory([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('colorPaletteHistory', JSON.stringify(history))
  }, [history])

  const handlePrimaryChange = useCallback((color: string) => {
    setPrimaryColor(color)
  }, [])

  const handleSchemeColorChange = useCallback((index: number, hsl: { h?: number; s?: number; l?: number }) => {
    setSchemeColors(prev => {
      const newColors = [...prev]
      const color = { ...newColors[index] }
      const newHsl = { ...color.hsl }

      if (hsl.h !== undefined) newHsl.h = hsl.h
      if (hsl.s !== undefined) newHsl.s = hsl.s
      if (hsl.l !== undefined) newHsl.l = hsl.l

      color.hsl = newHsl
      color.base = hslToHex(newHsl.h, newHsl.s, newHsl.l)
      color.shades = generateShades(color.base)
      newColors[index] = color

      if (index === selectedSchemeIndex) {
        setPrimaryColor(color.base)
      }

      return newColors
    })
  }, [selectedSchemeIndex])

  const handleSaveToHistory = useCallback(() => {
    const newItem: HistoryItem = {
      id: generateId(),
      name: `配色方案 ${history.length + 1}`,
      timestamp: Date.now(),
      primaryColor,
      schemeType,
      schemeColors: schemeColors.map(c => ({ ...c, shades: { ...c.shades } })),
    }

    setHistory(prev => {
      const updated = [newItem, ...prev]
      if (updated.length > 20) {
        return updated.slice(0, 20)
      }
      return updated
    })
  }, [primaryColor, schemeType, schemeColors, history.length])

  const handleLoadFromHistory = useCallback((item: HistoryItem, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement
    const fromRect = target.getBoundingClientRect()

    const wheelRect = wheelContainerRef.current?.getBoundingClientRect()
    if (!wheelRect) return

    const startX = fromRect.left + fromRect.width / 2
    const startY = fromRect.top + fromRect.height / 2
    const endX = wheelRect.left + wheelRect.width / 2
    const endY = wheelRect.top + wheelRect.height / 2

    const duration = 400
    const startTime = performance.now()

    setFlyPosition({ x: startX, y: startY, scale: 1, opacity: 1, color: item.primaryColor })
    setIsFlying(true)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentX = startX + (endX - startX) * easeProgress
      const currentY = startY + (endY - startY) * easeProgress
      const currentScale = 1 - 0.7 * easeProgress
      const currentOpacity = 1 - 0.3 * easeProgress

      setFlyPosition({
        x: currentX,
        y: currentY,
        scale: currentScale,
        opacity: currentOpacity,
        color: item.primaryColor,
      })

      if (progress < 1) {
        flyAnimationRef.current = requestAnimationFrame(animate)
      } else {
        setPrimaryColor(item.primaryColor)
        setSchemeType(item.schemeType)
        setSchemeColors(item.schemeColors.map(c => ({ ...c, shades: { ...c.shades } })))
        setSelectedSchemeIndex(2)
        setIsFlying(false)
      }
    }

    flyAnimationRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    return () => {
      if (flyAnimationRef.current) {
        cancelAnimationFrame(flyAnimationRef.current)
      }
    }
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleExportJSON = useCallback(() => {
    const data = {
      exportTime: new Date().toISOString(),
      schemeType,
      schemeTypeName: SCHEME_TYPES.find(s => s.type === schemeType)?.label,
      primaryColor,
      schemeColors: schemeColors.map(c => ({
        base: c.base,
        hsl: c.hsl,
        shades: c.shades,
      })),
      history: history.map(h => ({
        id: h.id,
        name: h.name,
        timestamp: h.timestamp,
        created: new Date(h.timestamp).toISOString(),
        primaryColor: h.primaryColor,
        schemeType: h.schemeType,
        schemeColors: h.schemeColors.map(c => ({
          base: c.base,
          hsl: c.hsl,
          shades: c.shades,
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-palette-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [schemeType, primaryColor, schemeColors, history])

  const selectedColor = schemeColors[selectedSchemeIndex] || schemeColors[2]
  const selectedHsl = selectedColor?.hsl || primaryHsl

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#1a1a2e',
      color: '#e8e8e8',
      padding: '28px 32px',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(ellipse at 30% 20%, ${primaryColor}12, transparent 50%),
                     radial-gradient(ellipse at 70% 80%, ${primaryColor}0a, transparent 50%)`,
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1500px', margin: '0 auto' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{
              fontSize: '30px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${primaryColor}, #a78bfa)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '6px',
              transition: 'background 0.3s ease',
            }}>
              色彩调色板生成器
            </h1>
            <p style={{ fontSize: '14px', color: '#a0a0b8' }}>
              探索颜色组合 · 生成配色方案 · 实时预览效果
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#a0a0b8', marginBottom: '5px' }}>
                WCAG 对比度 (白底)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                <span style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: wcagResult.level === 'Fail' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: wcagResult.level === 'Fail' ? '#f87171' : '#4ade80',
                  boxShadow: wcagResult.level === 'Fail'
                    ? '0 0 12px rgba(239, 68, 68, 0.2)'
                    : '0 0 12px rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.3s ease',
                }}>
                  {wcagResult.text}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  {contrastRatio.toFixed(2)}:1
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#a0a0b8', marginBottom: '5px' }}>
                WCAG 对比度 (深色底)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                <span style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: wcagOnDark.level === 'Fail' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: wcagOnDark.level === 'Fail' ? '#f87171' : '#4ade80',
                  boxShadow: wcagOnDark.level === 'Fail'
                    ? '0 0 12px rgba(239, 68, 68, 0.2)'
                    : '0 0 12px rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.3s ease',
                }}>
                  {wcagOnDark.text}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  {contrastOnDark.toFixed(2)}:1
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="app-main-grid">
          <div ref={wheelContainerRef} className="wheel-section">
            <div style={{
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              <ColorWheel color={primaryColor} onChange={handlePrimaryChange} size={340} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '16px 28px',
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                backgroundColor: primaryColor,
                boxShadow: `0 4px 20px ${primaryColor}60`,
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              }} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>
                  {primaryColor.toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0b8', marginTop: '2px' }}>
                  HSL: {primaryHsl.h}°, {primaryHsl.s}%, {primaryHsl.l}%
                </div>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <PreviewPanel primaryColor={primaryColor} />
            </div>
          </div>

          <div className="sidebar-section">
            <div style={{
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '12px',
              padding: '22px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
                配色方案
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {SCHEME_TYPES.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setSchemeType(type)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: schemeType === type ? primaryColor : 'rgba(255, 255, 255, 0.08)',
                      color: schemeType === type ? '#fff' : '#a0a0b8',
                      transition: 'all 0.3s ease',
                      boxShadow: schemeType === type ? `0 2px 12px ${primaryColor}40` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (schemeType !== type) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (schemeType !== type) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '12px',
              padding: '22px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
                衍生色板
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
                marginBottom: '18px',
              }}>
                {schemeColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedSchemeIndex(index)
                      setPrimaryColor(color.base)
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      backgroundColor: color.base,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.3s ease',
                      boxShadow: selectedSchemeIndex === index
                        ? `0 0 0 3px ${primaryColor}, 0 4px 16px ${primaryColor}40`
                        : '0 2px 10px rgba(0, 0, 0, 0.25)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title={`色阶 ${index + 1}: ${color.base}`}
                  >
                    <span style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '11px',
                      color: color.hsl.l > 55 ? '#222' : '#fff',
                      fontWeight: 700,
                    }}>
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>

              {selectedColor && (
                <div style={{
                  padding: '14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#a0a0b8',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>色阶 50-900</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: selectedColor.base,
                    }}>
                      {selectedColor.base.toUpperCase()}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '2px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}>
                    {SHADE_KEYS.map(shade => (
                      <div
                        key={shade}
                        style={{
                          aspectRatio: '1',
                          backgroundColor: selectedColor.shades[shade],
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          position: 'relative',
                        }}
                        onClick={() => setPrimaryColor(selectedColor.shades[shade])}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1.3) scaleX(1.1)'
                          e.currentTarget.style.zIndex = '1'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1) scaleX(1)'
                          e.currentTarget.style.zIndex = '0'
                        }}
                        title={`${shade}: ${selectedColor.shades[shade]}`}
                      >
                        <span style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: parseInt(shade) >= 600 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}>
                          {shade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '12px',
              padding: '22px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '18px' }}>
                HSL 调整 <span style={{ color: '#a0a0b8', fontWeight: 400, fontSize: '13px' }}>(色阶 {selectedSchemeIndex + 1})</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '12px', color: '#a0a0b8' }}>色相 (H)</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{Math.round(selectedHsl.h)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedHsl.h}
                    onChange={(e) => {
                      const h = parseInt(e.target.value)
                      handleSchemeColorChange(selectedSchemeIndex, { h })
                    }}
                    style={{
                      background: `linear-gradient(to right,
                        hsl(0, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(60, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(120, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(180, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(240, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(300, ${selectedHsl.s}%, ${selectedHsl.l}%),
                        hsl(360, ${selectedHsl.s}%, ${selectedHsl.l}%)
                      )`,
                      height: '8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '12px', color: '#a0a0b8' }}>饱和度 (S)</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{Math.round(selectedHsl.s)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedHsl.s}
                    onChange={(e) => {
                      const s = parseInt(e.target.value)
                      handleSchemeColorChange(selectedSchemeIndex, { s })
                    }}
                    style={{
                      background: `linear-gradient(to right,
                        hsl(${selectedHsl.h}, 0%, ${selectedHsl.l}%),
                        hsl(${selectedHsl.h}, 100%, ${selectedHsl.l}%)
                      )`,
                      height: '8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '12px', color: '#a0a0b8' }}>亮度 (L)</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{Math.round(selectedHsl.l)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedHsl.l}
                    onChange={(e) => {
                      const l = parseInt(e.target.value)
                      handleSchemeColorChange(selectedSchemeIndex, { l })
                    }}
                    style={{
                      background: `linear-gradient(to right,
                        hsl(${selectedHsl.h}, ${selectedHsl.s}%, 5%),
                        hsl(${selectedHsl.h}, ${selectedHsl.s}%, 50%),
                        hsl(${selectedHsl.h}, ${selectedHsl.s}%, 95%)
                      )`,
                      height: '8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSaveToHistory}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  borderRadius: '10px',
                  backgroundColor: primaryColor,
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 16px ${primaryColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = `0 6px 24px ${primaryColor}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${primaryColor}40`
                }}
              >
                保存到历史
              </button>
              <button
                onClick={handleExportJSON}
                style={{
                  padding: '13px 22px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e8e8e8',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                导出 JSON
              </button>
            </div>

            <div style={{
              backgroundColor: 'rgba(22, 33, 62, 0.5)',
              borderRadius: '12px',
              padding: '22px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
                  历史记录 <span style={{ color: '#666', fontWeight: 400, fontSize: '13px' }}>({history.length}/20)</span>
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    style={{
                      fontSize: '12px',
                      color: '#f87171',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    清空
                  </button>
                )}
              </div>

              <div
                ref={historyListRef}
                style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingRight: '4px',
                }}
              >
                {history.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#555',
                    fontSize: '13px',
                  }}>
                    暂无历史记录
                    <div style={{ fontSize: '11px', marginTop: '6px', color: '#444' }}>
                      点击"保存到历史"按钮保存当前配色
                    </div>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => handleLoadFromHistory(item, e)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                        e.currentTarget.style.borderColor = `${item.primaryColor}50`
                        e.currentTarget.style.transform = 'translateX(6px)'
                        e.currentTarget.style.boxShadow = `0 4px 16px ${item.primaryColor}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        gap: '2px',
                        marginBottom: '10px',
                        height: '26px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}>
                        {item.schemeColors.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              backgroundColor: c.base,
                              transition: 'background-color 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFlying && (
        <div
          style={{
            position: 'fixed',
            left: flyPosition.x - 24,
            top: flyPosition.y - 24,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: flyPosition.color,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: `0 0 30px ${flyPosition.color}90, 0 0 60px ${flyPosition.color}60`,
            transform: `scale(${flyPosition.scale})`,
            opacity: flyPosition.opacity,
            willChange: 'transform, opacity, left, top',
          }}
        />
      )}

      <style>{`
        .app-main-grid {
          display: grid;
          grid-template-columns: 1.3fr 420px;
          gap: 36px;
          align-items: start;
        }

        .wheel-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          position: sticky;
          top: 28px;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        @keyframes flyToWheel {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: scale(0.2) translate(var(--end-x), var(--end-y));
            opacity: 0;
          }
        }

        @media (max-width: 1200px) {
          .app-main-grid {
            grid-template-columns: 1fr 380px;
            gap: 24px;
          }
        }

        @media (max-width: 1000px) {
          .app-main-grid {
            grid-template-columns: 1fr;
          }

          .wheel-section {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 768px) {
          .app-main-grid {
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}
