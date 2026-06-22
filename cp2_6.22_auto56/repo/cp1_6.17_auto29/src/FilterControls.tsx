import React, { useMemo } from 'react'
import { useAppStore } from './store'
import { FILTER_PRESETS, DEFAULT_FILTER } from './types'
import type { FilterSettings } from './types'

const FilterControls: React.FC = () => {
  const { layers, selectedLayerId, updateLayer } = useAppStore()

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)
  const isImageLayer = selectedLayer?.type === 'image'

  const currentFilter = useMemo(() => {
    if (selectedLayer?.type === 'image') {
      return selectedLayer.filter
    }
    return DEFAULT_FILTER
  }, [selectedLayer])

  const handlePresetClick = (presetName: string) => {
    if (!selectedLayerId || !isImageLayer) return
    const preset = FILTER_PRESETS[presetName]
    if (preset) {
      updateLayer(selectedLayerId, {
        filter: { ...DEFAULT_FILTER, ...preset },
      })
    }
  }

  const handleFilterChange = (key: keyof FilterSettings, value: number) => {
    if (!selectedLayerId || !isImageLayer) return
    updateLayer(selectedLayerId, {
      filter: { ...currentFilter, [key]: value },
    })
  }

  const presetColors: Record<string, string> = {
    '美食暖黄': 'linear-gradient(135deg, #FFE4B5 0%, #FFA500 100%)',
    '极简黑白': 'linear-gradient(135deg, #333 0%, #ccc 100%)',
    '复古胶片': 'linear-gradient(135deg, #D2B48C 0%, #8B7355 100%)',
    '清新冷蓝': 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
    '高饱和电商': 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    '柔光': 'linear-gradient(135deg, #FFF0F5 0%, #FFE4E1 100%)',
    '锐化': 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
    '暗调': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  }

  const isPresetActive = (presetName: string): boolean => {
    if (!isImageLayer) return false
    const preset = FILTER_PRESETS[presetName]
    if (!preset) return false
    return Object.entries(preset).every(([key, value]) => {
      const currentValue = currentFilter[key as keyof FilterSettings]
      return Math.abs(currentValue - (value as number)) < 0.05
    })
  }

  const sliders = [
    { key: 'brightness' as const, label: '亮度', min: 0, max: 2, step: 0.01, value: currentFilter.brightness },
    { key: 'contrast' as const, label: '对比度', min: 0, max: 2, step: 0.01, value: currentFilter.contrast },
    { key: 'saturation' as const, label: '饱和度', min: 0, max: 2, step: 0.01, value: currentFilter.saturation },
    { key: 'hue' as const, label: '色相', min: -180, max: 180, step: 1, value: currentFilter.hue },
  ]

  return (
    <div className="filter-panel">
      <h3 className="panel-title">预设滤镜</h3>
      <div className="filter-grid">
        {Object.keys(FILTER_PRESETS).map((name) => (
          <div
            key={name}
            className={`filter-item ${isPresetActive(name) ? 'active' : ''}`}
            onClick={() => handlePresetClick(name)}
          >
            <div
              className="filter-preview"
              style={{
                background: presetColors[name] || '#ddd',
              }}
            >
              <div className="filter-preview-inner">{name.charAt(0)}</div>
            </div>
            <span className="filter-name">{name}</span>
          </div>
        ))}
      </div>

      <div className="section-divider" />

      <h3 className="panel-title">微调</h3>
      <div className="filter-slider-group">
        {sliders.map((slider) => (
          <div key={slider.key} style={{ marginBottom: 12 }}>
          <div className="filter-slider-label">
            <span>{slider.label}</span>
            <span>{slider.value.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="filter-slider"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={slider.value}
            disabled={!isImageLayer}
            onChange={(e) =>
              handleFilterChange(slider.key, parseFloat(e.target.value))
            }
          />
        </div>
      ))}
      </div>

      {!isImageLayer && (
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div className="empty-icon">🎨</div>
          <div>选择图片图层以调整滤镜</div>
        </div>
      )}
    </div>
  )
}

export default FilterControls
