import React, { useState, useCallback, useRef } from 'react'
import {
  Plus,
  Upload,
  Eye,
  Minus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Palette,
  Check,
  X,
} from 'lucide-react'
import { useSceneStore, PRESET_VIEWS, PRESET_COLORS, type BuildingBlockData } from '@/store/sceneStore'
import { validateBlockData } from '@/utils/blockBuilder'
import gsap from 'gsap'

const ViewButton: React.FC<{
  label: string
  onClick: () => void
}> = ({ label, onClick }) => (
  <button className="view-btn" onClick={onClick}>
    {label}
  </button>
)

const PropertySlider: React.FC<{
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}> = ({ label, value, min, max, step = 0.1, onChange }) => (
  <div className="prop-row">
    <label className="prop-label">{label}</label>
    <div className="prop-slider-group">
      <input
        type="range"
        className="prop-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <input
        type="number"
        className="prop-number"
        min={min}
        max={max}
        step={step}
        value={parseFloat(value.toFixed(2))}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) {
            onChange(Math.max(min, Math.min(max, v)))
          }
        }}
      />
    </div>
  </div>
)

const ColorPicker: React.FC<{
  value: string
  onChange: (color: string) => void
}> = ({ value, onChange }) => {
  const [customColor, setCustomColor] = useState(value)
  const [showCustom, setShowCustom] = useState(false)

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="color-picker">
      <div className="color-presets">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className={`color-swatch ${value.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="color-custom-row">
        <button
          className={`color-custom-toggle ${showCustom ? 'active' : ''}`}
          onClick={() => setShowCustom(!showCustom)}
        >
          <Palette size={14} />
          <span>自定义</span>
        </button>
        {showCustom && (
          <input
            type="color"
            className="color-input"
            value={customColor}
            onChange={handleCustomChange}
          />
        )}
        <span className="color-hex">{value}</span>
      </div>
    </div>
  )
}

const DeleteConfirm: React.FC<{
  blockName: string
  onConfirm: () => void
  onCancel: () => void
}> = ({ blockName, onConfirm, onCancel }) => (
  <div className="delete-confirm-overlay" onClick={(e) => e.stopPropagation()}>
    <div className="delete-confirm-bubble">
      <p>确定删除 "{blockName}"？</p>
      <div className="delete-confirm-actions">
        <button className="btn-delete-confirm" onClick={onConfirm}>
          确定
        </button>
        <button className="btn-delete-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  </div>
)

const ColorBandPreview: React.FC = () => (
  <div className="color-band-preview">
    <div
      className="color-band-gradient"
      style={{
        background:
          'linear-gradient(to right, #3498db, #2ecc71, #e74c3c)',
      }}
    />
    <div className="color-band-labels">
      <span>低</span>
      <span>中</span>
      <span>高</span>
    </div>
  </div>
)

const ControlPanel: React.FC = () => {
  const blocks = useSceneStore((s) => s.blocks)
  const selectedBlockId = useSceneStore((s) => s.selectedBlockId)
  const isPanelCollapsed = useSceneStore((s) => s.isPanelCollapsed)
  const deleteConfirmId = useSceneStore((s) => s.deleteConfirmId)
  const addBlock = useSceneStore((s) => s.addBlock)
  const updateBlock = useSceneStore((s) => s.updateBlock)
  const deleteBlock = useSceneStore((s) => s.deleteBlock)
  const duplicateBlock = useSceneStore((s) => s.duplicateBlock)
  const selectBlock = useSceneStore((s) => s.selectBlock)
  const togglePanel = useSceneStore((s) => s.togglePanel)
  const requestCameraView = useSceneStore((s) => s.requestCameraView)
  const setDeleteConfirm = useSceneStore((s) => s.setDeleteConfirm)
  const applyHeightColorMapping = useSceneStore((s) => s.applyHeightColorMapping)
  const importBlocks = useSceneStore((s) => s.importBlocks)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null

  const handleAddBlock = useCallback(() => {
    addBlock()
  }, [addBlock])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (validateBlockData(data)) {
            importBlocks(data)
          }
        } catch {
          console.error('Invalid JSON file')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [importBlocks]
  )

  const handleUpdatePosition = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      if (!selectedBlockId || !selectedBlock) return
      updateBlock(selectedBlockId, {
        position: { ...selectedBlock.position, [axis]: value },
      })
    },
    [selectedBlockId, selectedBlock, updateBlock]
  )

  const handleUpdateDimension = useCallback(
    (dim: 'width' | 'length' | 'height', value: number) => {
      if (!selectedBlockId || !selectedBlock) return
      updateBlock(selectedBlockId, {
        dimensions: { ...selectedBlock.dimensions, [dim]: value },
      })
    },
    [selectedBlockId, selectedBlock, updateBlock]
  )

  const handleUpdateName = useCallback(
    (name: string) => {
      if (!selectedBlockId) return
      updateBlock(selectedBlockId, { name })
    },
    [selectedBlockId, updateBlock]
  )

  const handleUpdateColor = useCallback(
    (color: string) => {
      if (!selectedBlockId) return
      updateBlock(selectedBlockId, { color })
    },
    [selectedBlockId, updateBlock]
  )

  const handleDeleteConfirm = useCallback(
    (id: string) => {
      const meshEl = document.querySelector(`[data-block-id="${id}"]`)
      if (meshEl) {
        gsap.to(meshEl, {
          scale: 0,
          duration: 0.4,
          ease: 'power2.out',
          onComplete: () => deleteBlock(id),
        })
      } else {
        deleteBlock(id)
      }
    },
    [deleteBlock]
  )

  return (
    <div className={`control-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button className="panel-toggle" onClick={togglePanel}>
        {isPanelCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="panel-content">
        <div className="panel-header">
          <h1 className="panel-title">体块编辑器</h1>
          <div className="panel-header-actions">
            <button className="btn-primary" onClick={handleAddBlock}>
              <Plus size={16} />
              <span>新建</span>
            </button>
            <button className="btn-secondary" onClick={handleImport}>
              <Upload size={16} />
              <span>导入</span>
            </button>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-title">视角</div>
          <div className="view-buttons">
            <ViewButton label="俯视" onClick={() => requestCameraView(PRESET_VIEWS.top)} />
            <ViewButton label="侧视" onClick={() => requestCameraView(PRESET_VIEWS.side)} />
            <ViewButton label="前视" onClick={() => requestCameraView(PRESET_VIEWS.front)} />
          </div>
        </div>

        <div className="panel-section">
          <div className="section-title">
            体块列表
            <span className="block-count">{blocks.length}/50</span>
          </div>
          <div className="block-list">
            {blocks.length === 0 && (
              <div className="empty-hint">暂无体块，点击"新建"添加</div>
            )}
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`block-card ${selectedBlockId === block.id ? 'selected' : ''}`}
                style={{ borderLeftColor: block.color }}
                onClick={() => selectBlock(block.id)}
              >
                <div className="block-card-info">
                  <span className="block-card-name">{block.name}</span>
                  <span className="block-card-meta">
                    {block.dimensions.width}×{block.dimensions.length}×{block.dimensions.height}
                  </span>
                </div>
                <div className="block-card-actions">
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateBlock(block.id)
                    }}
                    title="复制"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(block.id)
                    }}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {deleteConfirmId === block.id && (
                  <DeleteConfirm
                    blockName={block.name}
                    onConfirm={() => handleDeleteConfirm(block.id)}
                    onCancel={() => setDeleteConfirm(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedBlock && (
          <div className="panel-section">
            <div className="section-title">属性编辑</div>
            <div className="prop-form">
              <div className="prop-row">
                <label className="prop-label">名称</label>
                <input
                  type="text"
                  className="prop-text-input"
                  value={selectedBlock.name}
                  onChange={(e) => handleUpdateName(e.target.value)}
                />
              </div>

              <div className="prop-group-title">位置</div>
              <PropertySlider
                label="X"
                value={selectedBlock.position.x}
                min={-10}
                max={10}
                onChange={(v) => handleUpdatePosition('x', v)}
              />
              <PropertySlider
                label="Y"
                value={selectedBlock.position.y}
                min={-10}
                max={10}
                onChange={(v) => handleUpdatePosition('y', v)}
              />
              <PropertySlider
                label="Z"
                value={selectedBlock.position.z}
                min={-10}
                max={10}
                onChange={(v) => handleUpdatePosition('z', v)}
              />

              <div className="prop-group-title">尺寸</div>
              <PropertySlider
                label="宽度"
                value={selectedBlock.dimensions.width}
                min={0.5}
                max={5}
                step={0.1}
                onChange={(v) => handleUpdateDimension('width', v)}
              />
              <PropertySlider
                label="长度"
                value={selectedBlock.dimensions.length}
                min={0.5}
                max={5}
                step={0.1}
                onChange={(v) => handleUpdateDimension('length', v)}
              />
              <PropertySlider
                label="高度"
                value={selectedBlock.dimensions.height}
                min={0.5}
                max={10}
                step={0.1}
                onChange={(v) => handleUpdateDimension('height', v)}
              />

              <div className="prop-group-title">颜色</div>
              <ColorPicker
                value={selectedBlock.color}
                onChange={handleUpdateColor}
              />
            </div>
          </div>
        )}

        <div className="panel-section panel-section-bottom">
          <div className="section-title">按高度着色</div>
          <ColorBandPreview />
          <button
            className="btn-color-mapping"
            onClick={applyHeightColorMapping}
            disabled={blocks.length === 0}
          >
            <Palette size={16} />
            <span>应用高度着色</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
