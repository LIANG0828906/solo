import React, { useState } from 'react'
import { FilterState, defaultFilters, generateCSSString } from '../utils/filterEngine'

interface FilterPanelProps {
  filters: FilterState
  dispatch: React.Dispatch<{ type: string; payload: Partial<FilterState> }>
  onReset: () => void
  onCopyCSS: () => void
  onDownloadImage: () => void
  onSavePreset: () => void
}

interface SliderConfig {
  key: keyof FilterState
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const sliders: SliderConfig[] = [
  { key: 'blur', label: '模糊', min: 0, max: 20, step: 1, unit: 'px' },
  { key: 'brightness', label: '亮度', min: 0, max: 200, step: 5, unit: '%' },
  { key: 'contrast', label: '对比度', min: 0, max: 200, step: 5, unit: '%' },
  { key: 'hueRotate', label: '色相旋转', min: 0, max: 360, step: 1, unit: 'deg' },
  { key: 'saturate', label: '饱和度', min: 0, max: 200, step: 5, unit: '%' },
  { key: 'grayscale', label: '灰度', min: 0, max: 100, step: 1, unit: '%' },
]

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  dispatch,
  onReset,
  onCopyCSS,
  onDownloadImage,
  onSavePreset,
}) => {
  const [showExport, setShowExport] = useState(false)
  const [isResetPressed, setIsResetPressed] = useState(false)

  const handleChange = (key: keyof FilterState, value: number) => {
    dispatch({ type: 'SET_FILTER', payload: { [key]: value } })
  }

  const handleReset = () => {
    setIsResetPressed(true)
    setTimeout(() => setIsResetPressed(false), 100)
    onReset()
  }

  const handleCopyCSS = () => {
    setShowExport(false)
    onCopyCSS()
  }

  const handleDownloadImage = () => {
    setShowExport(false)
    onDownloadImage()
  }

  const handleSavePreset = () => {
    setShowExport(false)
    onSavePreset()
  }

  return (
    <div className="filter-panel">
      <div className="panel-header">
        <h2>滤镜参数</h2>
      </div>

      <div className="sliders-container">
        {sliders.map((slider) => (
          <div key={slider.key} className="slider-item">
            <div className="slider-header">
              <span className="slider-label">{slider.label}</span>
              <span className="slider-value">
                {filters[slider.key]}
                {slider.unit}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={filters[slider.key]}
              onChange={(e) => handleChange(slider.key, Number(e.target.value))}
              className="filter-slider"
            />
          </div>
        ))}
      </div>

      <div className="panel-buttons">
        <button
          className="btn btn-reset"
          onClick={handleReset}
          style={{ transform: isResetPressed ? 'scale(0.95)' : 'scale(1)' }}
        >
          重置
        </button>
        <div className="export-wrapper">
          <button
            className="btn btn-export"
            onClick={() => setShowExport(!showExport)}
          >
            导出设置
          </button>
          {showExport && (
            <div className="export-dropdown">
              <button className="dropdown-item" onClick={handleCopyCSS}>
                复制 CSS 代码
              </button>
              <button className="dropdown-item" onClick={handleDownloadImage}>
                下载当前预览图
              </button>
              <button className="dropdown-item" onClick={handleSavePreset}>
                保存到本地预设
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .filter-panel {
          width: 280px;
          background: #1E293B;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .panel-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 4px;
        }

        .sliders-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex: 1;
        }

        .slider-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-label {
          font-size: 14px;
          color: #94A3B8;
          font-weight: 500;
        }

        .slider-value {
          font-size: 12px;
          color: #38BDF8;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-weight: 500;
        }

        .filter-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #334155;
          outline: none;
          cursor: pointer;
        }

        .filter-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0EA5E9;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
          transition: transform 0.15s ease;
        }

        .filter-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .filter-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0EA5E9;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
        }

        .panel-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .btn {
          width: 100%;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          font-family: inherit;
        }

        .btn-reset {
          background: #475569;
          color: #F8FAFC;
        }

        .btn-reset:hover {
          background: #334155;
        }

        .btn-export {
          background: #0EA5E9;
          color: #FFFFFF;
        }

        .btn-export:hover {
          background: #0284C7;
        }

        .export-wrapper {
          position: relative;
        }

        .export-dropdown {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          width: 240px;
          background: #1E293B;
          border-radius: 8px;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          padding: 6px;
          z-index: 10;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: transparent;
          color: #F8FAFC;
          font-size: 13px;
          font-weight: 400;
          text-align: left;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.15s ease;
        }

        .dropdown-item:hover {
          background: #334155;
        }
      `}</style>
    </div>
  )
}

export default FilterPanel
