
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { generateNoise, type NoiseType } from './NoiseEngine'
import { renderToCanvas, downloadBlob, canvasToSVG, generateGradientStrip, type ColorStop } from './CanvasRenderer'
import { getPresets, savePreset, type Preset } from './api'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

const DEFAULT_COLOR_STOPS: ColorStop[] = [
  { position: 0, color: '#1E1B4B' },
  { position: 0.5, color: '#7C3AED' },
  { position: 1, color: '#F0ABFC' }
]

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const noiseDataRef = useRef<Float32Array | null>(null)
  const fadeAnimRef = useRef<number | null>(null)
  const renderRafRef = useRef<number | null>(null)
  const pendingRenderRef = useRef(false)

  const [noiseType, setNoiseType] = useState<NoiseType>('perlin')
  const [frequency, setFrequency] = useState(0.05)
  const [octaves, setOctaves] = useState(4)
  const [seed, setSeed] = useState(42)
  const [colorStops, setColorStops] = useState<ColorStop[]>(DEFAULT_COLOR_STOPS)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportModalFading, setExportModalFading] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetName, setPresetName] = useState('')
  const [draggingStop, setDraggingStop] = useState<number | null>(null)
  const gradientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPresets().then(p => setPresets(p))
  }, [])

  const scheduleRender = useCallback(() => {
    if (renderRafRef.current !== null) return
    pendingRenderRef.current = true
    renderRafRef.current = requestAnimationFrame(() => {
      renderRafRef.current = null
      if (!pendingRenderRef.current || !canvasRef.current || !noiseDataRef.current) return
      pendingRenderRef.current = false
      renderToCanvas(canvasRef.current, noiseDataRef.current, colorStops, 1)
    })
  }, [colorStops])

  const generateAndFade = useCallback(() => {
    const data = generateNoise({
      type: noiseType,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      seed,
      frequency,
      octaves
    })
    noiseDataRef.current = data

    if (fadeAnimRef.current !== null) {
      cancelAnimationFrame(fadeAnimRef.current)
    }

    const startTime = performance.now()
    const duration = 500

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      if (canvasRef.current && noiseDataRef.current) {
        renderToCanvas(canvasRef.current, noiseDataRef.current, colorStops, eased)
      }

      if (progress < 1) {
        fadeAnimRef.current = requestAnimationFrame(animate)
      } else {
        fadeAnimRef.current = null
      }
    }

    fadeAnimRef.current = requestAnimationFrame(animate)
  }, [noiseType, seed, frequency, octaves, colorStops])

  useEffect(() => {
    generateAndFade()
  }, [generateAndFade])

  useEffect(() => {
    scheduleRender()
  }, [colorStops, scheduleRender])

  useEffect(() => {
    return () => {
      if (fadeAnimRef.current !== null) cancelAnimationFrame(fadeAnimRef.current)
      if (renderRafRef.current !== null) cancelAnimationFrame(renderRafRef.current)
    }
  }, [])

  const handleNoiseTypeChange = (type: NoiseType) => {
    setNoiseType(type)
  }

  const handleExport = async (format: 'png' | 'svg') => {
    if (!canvasRef.current) return
    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'png') {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `color-noise-${timestamp}.png`)
        }
      }, 'image/png')
    } else {
      const svgContent = canvasToSVG(canvasRef.current)
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      downloadBlob(blob, `color-noise-${timestamp}.svg`)
    }

    setExportModalFading(true)
    setTimeout(() => {
      setShowExportModal(false)
      setExportModalFading(false)
    }, 300)
  }

  const handleSavePreset = async () => {
    if (!presetName.trim()) return
    const newPreset = await savePreset({
      name: presetName.trim(),
      noiseType,
      frequency,
      octaves,
      seed,
      colorStops
    })
    if (newPreset) {
      setPresets(prev => [...prev, newPreset])
      setPresetName('')
    }
  }

  const handleLoadPreset = (preset: Preset) => {
    setNoiseType(preset.noiseType)
    setFrequency(preset.frequency)
    setOctaves(preset.octaves)
    setSeed(preset.seed)
    setColorStops(preset.colorStops)
  }

  const handleColorChange = (index: number, color: string) => {
    setColorStops(prev => prev.map((stop, i) =>
      i === index ? { ...stop, color } : stop
    ))
  }

  const handleGradientMouseDown = (index: number) => {
    setDraggingStop(index)
  }

  const handleGradientMouseMove = (e: React.MouseEvent) => {
    if (draggingStop === null || !gradientRef.current) return
    const rect = gradientRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setColorStops(prev => prev.map((stop, i) =>
      i === draggingStop ? { ...stop, position: x } : stop
    ))
  }

  const handleGradientMouseUp = () => {
    setDraggingStop(null)
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      backgroundColor: '#111827',
      overflow: 'hidden'
    }}>
      <div style={{
        width: 320,
        minWidth: 320,
        backgroundColor: '#1F2937',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        borderRight: '1px solid #374151'
      }}>
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#F9FAFB',
            marginBottom: 4
          }}>色噪沙盒</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>Color Noise Sandbox</p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>噪声类型</label>
          <select
            value={noiseType}
            onChange={(e) => handleNoiseTypeChange(e.target.value as NoiseType)}
          >
            <option value="perlin">Perlin 噪声（平滑连绵）</option>
            <option value="simplex">Simplex 噪声（更自然）</option>
            <option value="worley">Worley 噪声（细胞斑点）</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>频率: {frequency.toFixed(2)}</label>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>八度: {octaves}</label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={octaves}
            onChange={(e) => setOctaves(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>种子: {seed}</label>
          <input
            type="range"
            min={1}
            max={1000}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
          />
        </div>

        <div style={{
          backgroundColor: '#1F2937',
          borderRadius: 12,
          padding: 12,
          border: '1px solid #374151'
        }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 12
          }}>颜色映射</label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 12
          }}>
            {colorStops.map((stop, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`,
                    padding: 2
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: stop.color
                    }} />
                  </div>
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                  {index === 0 ? '起点' : index === 1 ? '中点' : '终点'}
                </span>
              </div>
            ))}
          </div>

          <div
            ref={gradientRef}
            onMouseMove={handleGradientMouseMove}
            onMouseUp={handleGradientMouseUp}
            onMouseLeave={handleGradientMouseUp}
            style={{
              height: 24,
              borderRadius: 8,
              background: generateGradientStrip(colorStops, 100, 24),
              position: 'relative',
              cursor: draggingStop !== null ? 'col-resize' : 'default'
            }}
          >
            {colorStops.map((stop, index) => (
              <div
                key={index}
                onMouseDown={() => handleGradientMouseDown(index)}
                style={{
                  position: 'absolute',
                  left: `${stop.position * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: stop.color,
                  border: '2px solid #FFFFFF',
                  cursor: 'col-resize',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  transition: draggingStop === index ? 'none' : 'transform 0.2s',
                  zIndex: draggingStop === index ? 10 : 1
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          style={{
            width: 120,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            alignSelf: 'flex-start'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#10B981' }}
        >
          导出纹理
        </button>

        <div style={{ borderTop: '1px solid #374151', paddingTop: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>保存预设</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="预设名称"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleSavePreset}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
            >
              保存
            </button>
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: '#D1D5DB',
            marginBottom: 8
          }}>已保存预设</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {presets.length === 0 ? (
              <p style={{ fontSize: 12, color: '#6B7280' }}>暂无预设</p>
            ) : (
              presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#374151',
                    color: '#E5E7EB',
                    fontSize: 14,
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4B5563'
                    e.currentTarget.style.borderColor = '#3B82F6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  {preset.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        minHeight: 600,
        overflow: 'auto',
        backgroundColor: '#111827'
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            border: '2px solid #4B5563',
            borderRadius: 4,
            cursor: 'crosshair',
            backgroundColor: '#000000',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
      </div>

      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            opacity: exportModalFading ? 0 : 1,
            transition: 'opacity 0.3s ease-out'
          }}
        >
          <div
            style={{
              backgroundColor: '#1F2937',
              borderRadius: 16,
              padding: 24,
              minWidth: 320,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #374151'
            }}
          >
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#F9FAFB',
              marginBottom: 16
            }}>导出纹理</h3>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
              选择导出格式：
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handleExport('png')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 500
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563EB' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3B82F6' }}
              >
                PNG 格式
              </button>
              <button
                onClick={() => handleExport('svg')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  backgroundColor: '#8B5CF6',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 500
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#8B5CF6' }}
              >
                SVG 格式
              </button>
            </div>
            <button
              onClick={() => {
                setExportModalFading(true)
                setTimeout(() => {
                  setShowExportModal(false)
                  setExportModalFading(false)
                }, 300)
              }}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: '#374151',
                color: '#D1D5DB',
                fontSize: 14
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4B5563' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#374151' }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
