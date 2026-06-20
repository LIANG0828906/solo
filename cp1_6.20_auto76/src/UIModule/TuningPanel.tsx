import React, { useState, useCallback, useRef, useEffect } from 'react'
import { debounce } from 'lodash'
import { useColorState } from '@ColorModule/ColorStateContext'
import type { ColorParams } from '@ColorModule/types'
import './TuningPanel.css'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  colorIndex: number
  onChange: (value: number) => void
  onSlideStart: () => void
  onSlideEnd: () => void
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  unit = '',
  colorIndex,
  onChange,
  onSlideStart,
  onSlideEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const colors = ['#00d4ff', '#8b5cf6', '#00d4ff', '#8b5cf6']
  const trackColor = colors[colorIndex % colors.length]

  const percentage = ((value - min) / (max - min)) * 100

  const handleMove = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const newValue = Math.round((x / rect.width) * (max - min) + min)
      onChange(newValue)
    },
    [min, max, onChange]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    onSlideStart()
    handleMove(e.clientX)

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleMouseUp = () => {
      setIsDragging(false)
      onSlideEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    onSlideStart()
    handleMove(e.touches[0].clientX)

    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)
    const handleTouchEnd = () => {
      setIsDragging(false)
      onSlideEnd()
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value" style={{ color: trackColor }}>
          {value}{unit}
        </span>
      </div>
      <div
        ref={trackRef}
        className={`slider-track ${isDragging ? 'dragging' : ''}`}
        style={{
          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
          style={{
            left: `calc(${percentage}% - 10px)`,
            background: trackColor,
            boxShadow: isDragging ? `0 0 20px ${trackColor}, 0 0 40px ${trackColor}` : `0 0 10px ${trackColor}`,
          }}
        />
      </div>
    </div>
  )
}

const TuningPanel: React.FC = () => {
  const { params, setParams, presets, applyPreset, activePresetId, colorMatrix, cssFilter, saveScheme, playClickSound, playSlideSound, isTransitioning } = useColorState()
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [schemeName, setSchemeName] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const debouncedSetParams = useCallback(
    debounce((key: keyof ColorParams, value: number) => {
      setParams({ [key]: value })
    }, 16),
    [setParams]
  )

  const handleSliderChange = useCallback(
    (key: keyof ColorParams) => (value: number) => {
      debouncedSetParams(key, value)
    },
    [debouncedSetParams]
  )

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      playClickSound()
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [playClickSound])

  const handleSaveScheme = () => {
    if (schemeName.trim()) {
      saveScheme(schemeName.trim())
      setSchemeName('')
      setSaveModalOpen(false)
      playClickSound()
    }
  }

  useEffect(() => {
    const event = new CustomEvent('paramsChanged', { detail: params })
    window.dispatchEvent(event)
  }, [params])

  const sliders: Array<{ key: keyof ColorParams; label: string; min: number; max: number; unit: string }> = [
    { key: 'hueRotate', label: '色相旋转', min: 0, max: 360, unit: '°' },
    { key: 'saturation', label: '饱和度', min: -100, max: 100, unit: '' },
    { key: 'brightness', label: '亮度', min: -100, max: 100, unit: '' },
    { key: 'contrast', label: '对比度', min: -100, max: 100, unit: '' },
  ]

  return (
    <div className="tuning-panel">
      <div className="panel-header">
        <h1 className="panel-title">色彩调校</h1>
        <p className="panel-subtitle">实时预览调色效果</p>
      </div>

      <div className="section">
        <h3 className="section-title">参数调整</h3>
        <div className="sliders-group">
          {sliders.map((slider, index) => (
            <Slider
              key={slider.key}
              label={slider.label}
              value={params[slider.key]}
              min={slider.min}
              max={slider.max}
              unit={slider.unit}
              colorIndex={index}
              onChange={handleSliderChange(slider.key)}
              onSlideStart={playSlideSound}
              onSlideEnd={playClickSound}
            />
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">预设方案</h3>
        <div className={`presets-grid ${isTransitioning ? 'transitioning' : ''}`}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`preset-btn ${activePresetId === preset.id ? 'active' : ''}`}
              onClick={() => {
                applyPreset(preset)
                playClickSound()
              }}
            >
              <div
                className="preset-preview"
                style={{
                  background: `linear-gradient(90deg, ${preset.previewColors.join(', ')})`,
                }}
              />
              <span className="preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">导出代码</h3>

        <div className="code-block">
          <div className="code-header">
            <span className="code-label">3x3 颜色矩阵</span>
            <button
              className={`copy-btn ${copiedField === 'matrix' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(JSON.stringify(colorMatrix, null, 2), 'matrix')}
            >
              {copiedField === 'matrix' ? '已复制 ✓' : '复制'}
            </button>
          </div>
          <pre className="code-content">
            <code>{JSON.stringify(colorMatrix, null, 2)}</code>
          </pre>
        </div>

        <div className="code-block">
          <div className="code-header">
            <span className="code-label">CSS Filter</span>
            <button
              className={`copy-btn ${copiedField === 'css' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(`filter: ${cssFilter};`, 'css')}
            >
              {copiedField === 'css' ? '已复制 ✓' : '复制'}
            </button>
          </div>
          <pre className="code-content">
            <code>filter: {cssFilter};</code>
          </pre>
        </div>
      </div>

      <button
        className="save-btn"
        onClick={() => {
          setSaveModalOpen(true)
          playClickSound()
        }}
      >
        保存当前方案
      </button>

      {saveModalOpen && (
        <div className="modal-overlay" onClick={() => setSaveModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">保存调色方案</h3>
            <input
              type="text"
              className="modal-input"
              placeholder="输入方案名称..."
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveScheme()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setSaveModalOpen(false)}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleSaveScheme}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TuningPanel
