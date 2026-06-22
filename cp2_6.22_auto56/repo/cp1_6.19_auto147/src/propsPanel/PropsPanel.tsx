import React, { useCallback } from 'react'
import { useEditor } from '@/context/EditorContext'
import type { Sticker } from '@/types'
import './PropsPanel.css'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (val: number) => void
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">
          {value}
          {unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

const PropsPanel: React.FC = () => {
  const { stickers, selectedStickerId, updateStickerProp } = useEditor()

  const selected: Sticker | undefined = stickers.find((s) => s.id === selectedStickerId)

  const handleScaleChange = useCallback(
    (val: number) => {
      if (selectedStickerId) updateStickerProp(selectedStickerId, { scale: val })
    },
    [selectedStickerId, updateStickerProp]
  )

  const handleRotationChange = useCallback(
    (val: number) => {
      if (selectedStickerId) updateStickerProp(selectedStickerId, { rotation: val })
    },
    [selectedStickerId, updateStickerProp]
  )

  const handleOpacityChange = useCallback(
    (val: number) => {
      if (selectedStickerId) updateStickerProp(selectedStickerId, { opacity: val })
    },
    [selectedStickerId, updateStickerProp]
  )

  return (
    <div className="props-panel">
      <h3 className="panel-title">属性面板</h3>
      {selected ? (
        <div className="panel-content">
          <div className="selected-preview">
            {selected.type === 'preset' ? (
              <span className="preview-emoji">{selected.content}</span>
            ) : (
              <img src={selected.content} alt="" className="preview-image" />
            )}
            <div className="preview-info">
              <div className="preview-type">{selected.type === 'preset' ? '预设贴纸' : '上传图片'}</div>
            </div>
          </div>

          <div className="sliders-wrapper">
            <Slider
              label="缩放比例"
              value={selected.scale}
              min={0.5}
              max={2.0}
              step={0.1}
              unit="x"
              onChange={handleScaleChange}
            />
            <Slider
              label="旋转角度"
              value={selected.rotation}
              min={0}
              max={360}
              step={1}
              unit="°"
              onChange={handleRotationChange}
            />
            <Slider
              label="透明度"
              value={selected.opacity}
              min={0.1}
              max={1.0}
              step={0.1}
              onChange={handleOpacityChange}
            />
          </div>

          <div className="panel-tip">提示：选中贴纸后按 Delete 键可快速删除</div>
        </div>
      ) : (
        <div className="panel-empty">
          <div className="empty-icon">✏️</div>
          <p>请点击画布上的贴纸进行编辑</p>
        </div>
      )}
    </div>
  )
}

export default PropsPanel
