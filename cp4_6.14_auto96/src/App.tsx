import React, { useState, useEffect, useRef } from 'react'
import Canvas from './Canvas'
import { useCanvasStore, COLOR_PALETTE, type ToolType } from './store'

const PencilIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const MarkerIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h6" />
    <path d="M10.6 13.8a2 2 0 0 1 0-3.6l2.8-1.4a2 2 0 0 1 2.7 1l2 3.5a2 2 0 0 1-1 2.7l-2.8 1.4a2 2 0 0 1-2.7-1z" />
    <path d="m9 6-6 6v6h6l6-6" />
  </svg>
)

const AirbrushIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="18" cy="7" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="14" r="1" />
    <path d="M5 16h4a3 3 0 0 1 3 3v2H5v-5z" />
  </svg>
)

const SelectIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity="0.3" />
  </svg>
)

const WandIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 10V8M10 5l-2-2M10 9l-2-2M20 5l2-2M20 9l2-2" />
    <path d="m9.5 11.5-5 5a2.12 2.12 0 0 0 3 3l5-5" />
    <path d="m14 7 3 3" />
  </svg>
)

const PlusIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const EyeIcon: React.FC<{ size?: number; visible?: boolean }> = ({ size = 16, visible = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={visible ? 1 : 0.3}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    {!visible && <path d="M2 2l20 20" />}
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const Toolbar: React.FC = () => {
  const { tool, setTool, color, setColor, brushSize, setBrushSize, selection } = useCanvasStore()

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <PencilIcon />, label: '铅笔' },
    { id: 'marker', icon: <MarkerIcon />, label: '马克笔' },
    { id: 'airbrush', icon: <AirbrushIcon />, label: '喷枪' },
    { id: 'select', icon: <SelectIcon />, label: '选区' }
  ]

  const handleComplete = () => {
    if ((window as any).handleAIComplete) {
      (window as any).handleAIComplete()
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="tool-buttons">
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="divider" />

        <div className="brush-size">
          <span className="brush-label">笔触</span>
          <input
            type="range"
            min="10"
            max="50"
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="size-slider"
          />
          <span className="size-value">{brushSize}px</span>
        </div>

        <div className="divider" />

        <div className="color-palette">
          {COLOR_PALETTE.map((c, idx) => (
            <button
              key={idx}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-right">
        <button
          className={`complete-btn ${!selection.active ? 'disabled' : ''}`}
          onClick={handleComplete}
          disabled={!selection.active}
        >
          <WandIcon />
          <span>AI补全</span>
        </button>
      </div>

      <style>{`
        .toolbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 10;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tool-buttons {
          display: flex;
          gap: 4px;
        }
        .tool-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.2s;
          position: relative;
        }
        .tool-btn:hover {
          background: #f1f5f9;
        }
        .tool-btn.active {
          color: #3b82f6;
          background: #eff6ff;
        }
        .tool-btn.active::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 8px;
          right: 8px;
          height: 2px;
          background: #3b82f6;
          border-radius: 1px;
        }
        .divider {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
          margin: 0 4px;
        }
        .brush-size {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brush-label {
          font-size: 13px;
          color: #64748b;
        }
        .size-slider {
          width: 100px;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #e2e8f0;
          border-radius: 2px;
          outline: none;
        }
        .size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .size-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        .size-value {
          font-size: 12px;
          color: #94a3b8;
          min-width: 32px;
          text-align: right;
        }
        .color-palette {
          display: grid;
          grid-template-columns: repeat(6, 32px);
          grid-template-rows: repeat(6, 32px);
          gap: 2px;
          padding: 4px;
        }
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.selected {
          transform: scale(1.125);
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #3b82f6;
          width: 36px;
          height: 36px;
        }
        .complete-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .complete-btn:hover:not(.disabled) {
          background: #2563eb;
        }
        .complete-btn.disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

const LayerPanel: React.FC = () => {
  const { layers, activeLayerId, setActiveLayer, toggleLayerVisibility, addLayer } = useCanvasStore()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const generateLayerThumbnail = (layerId: string): string => {
    const state = useCanvasStore.getState()
    const layer = state.layers.find(l => l.id === layerId)
    if (!layer || layer.strokeIds.length === 0) return ''

    const canvas = document.createElement('canvas')
    canvas.width = 60
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.fillStyle = '#f5f5f0'
    ctx.fillRect(0, 0, 60, 60)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    layer.strokeIds.forEach(id => {
      const stroke = state.strokes[id]
      if (stroke) {
        stroke.points.forEach(p => {
          minX = Math.min(minX, p.x)
          minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x)
          maxY = Math.max(maxY, p.y)
        })
      }
    })

    if (minX === Infinity) return canvas.toDataURL()

    const padding = 10
    const contentW = maxX - minX
    const contentH = maxY - minY
    const scale = Math.min((60 - padding * 2) / contentW, (60 - padding * 2) / contentH, 2)
    const offsetX = padding + (60 - padding * 2 - contentW * scale) / 2 - minX * scale
    const offsetY = padding + (60 - padding * 2 - contentH * scale) / 2 - minY * scale

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    layer.strokeIds.forEach(id => {
      const stroke = state.strokes[id]
      if (stroke && stroke.points.length >= 2) {
        ctx.beginPath()
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.baseSize * 0.3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        stroke.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
      }
    })

    ctx.restore()
    return canvas.toDataURL()
  }

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  useEffect(() => {
    const newThumbs: Record<string, string> = {}
    layers.forEach(layer => {
      newThumbs[layer.id] = generateLayerThumbnail(layer.id)
    })
    setThumbnails(newThumbs)
  }, [layers.length, layers.map(l => l.strokeIds.length).join(',')])

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <span className="panel-title">图层</span>
        <button className="add-layer-btn" onClick={addLayer} title="新建图层">
          <PlusIcon size={16} />
        </button>
      </div>
      <div className="layer-list">
        {[...layers].reverse().map(layer => (
          <div
            key={layer.id}
            className={`layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <div
              className="layer-thumb"
              style={{
                backgroundImage: thumbnails[layer.id] ? `url(${thumbnails[layer.id]})` : 'none',
                backgroundColor: '#f5f5f0',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <span className="layer-name">{layer.name}</span>
            <button
              className="eye-btn"
              onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id) }}
              title={layer.visible ? '隐藏图层' : '显示图层'}
            >
              <EyeIcon visible={layer.visible} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .layer-panel {
          position: absolute;
          top: 56px;
          right: 0;
          width: 200px;
          bottom: 32px;
          background: #fafafa;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .panel-title {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .add-layer-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .add-layer-btn:hover {
          background: #2563eb;
        }
        .layer-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .layer-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .layer-item:hover {
          background: #f1f5f9;
        }
        .layer-item.active {
          background: #eff6ff;
          border: 2px solid #3b82f6;
        }
        .layer-thumb {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .layer-name {
          flex: 1;
          font-size: 12px;
          color: #475569;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .eye-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .eye-btn:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  )
}

const StatusBar: React.FC = () => {
  const { tool, mousePos } = useCanvasStore()

  const toolNames: Record<string, string> = {
    pencil: '铅笔',
    marker: '马克笔',
    airbrush: '喷枪',
    select: '选区工具'
  }

  return (
    <div className="status-bar">
      <span className="status-item">工具: {toolNames[tool] || tool}</span>
      <span className="status-divider">|</span>
      <span className="status-item">坐标: ({mousePos.x}, {mousePos.y})</span>

      <style>{`
        .status-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 32px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          z-index: 10;
        }
        .status-item {
          font-size: 12px;
          color: #64748b;
        }
        .status-divider {
          color: #e2e8f0;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}

const MobileFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { tool, setTool, color, setColor, brushSize, setBrushSize, selection } = useCanvasStore()

  const handleComplete = () => {
    if ((window as any).handleAIComplete) {
      (window as any).handleAIComplete()
    }
    setIsOpen(false)
  }

  return (
    <>
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-section">
            <div className="mobile-section-title">工具</div>
            <div className="mobile-tools">
              {['pencil', 'marker', 'airbrush', 'select'].map(t => (
                <button
                  key={t}
                  className={`mobile-tool-btn ${tool === t ? 'active' : ''}`}
                  onClick={() => { setTool(t as ToolType); setIsOpen(false) }}
                >
                  {t === 'pencil' && <PencilIcon size={18} />}
                  {t === 'marker' && <MarkerIcon size={18} />}
                  {t === 'airbrush' && <AirbrushIcon size={18} />}
                  {t === 'select' && <SelectIcon size={18} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-section">
            <div className="mobile-section-title">笔触大小: {brushSize}px</div>
            <input
              type="range"
              min="10"
              max="50"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="mobile-slider"
            />
          </div>

          <div className="mobile-section">
            <div className="mobile-section-title">颜色</div>
            <div className="mobile-colors">
              {COLOR_PALETTE.slice(0, 12).map((c, idx) => (
                <button
                  key={idx}
                  className={`mobile-color ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <button
            className={`mobile-complete ${!selection.active ? 'disabled' : ''}`}
            onClick={handleComplete}
            disabled={!selection.active}
          >
            <WandIcon size={18} />
            <span>AI 智能补全</span>
          </button>
        </div>
      </div>

      <button className="floating-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <PlusIcon size={24} />
        )}
      </button>

      <style>{`
        .floating-btn {
          display: none;
          position: fixed;
          right: 16px;
          bottom: 16px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          z-index: 100;
          display: none;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .floating-btn:active {
          transform: scale(0.95);
        }
        .mobile-menu {
          display: none;
          position: fixed;
          right: 16px;
          bottom: 76px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 99;
          width: 280px;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .mobile-menu.open {
          max-height: 500px;
          opacity: 1;
        }
        .mobile-menu-content {
          padding: 16px;
        }
        .mobile-section {
          margin-bottom: 16px;
        }
        .mobile-section-title {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          margin-bottom: 8px;
        }
        .mobile-tools {
          display: flex;
          gap: 8px;
        }
        .mobile-tool-btn {
          flex: 1;
          height: 40px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .mobile-tool-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .mobile-slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #e2e8f0;
          border-radius: 2px;
        }
        .mobile-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .mobile-colors {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
        }
        .mobile-color {
          aspect-ratio: 1;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .mobile-color.selected {
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .mobile-complete {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .mobile-complete.disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .floating-btn {
            display: flex;
          }
          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </>
  )
}

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas />

      {!isMobile && <Toolbar />}
      {!isMobile && <LayerPanel />}
      {!isMobile && <StatusBar />}

      <MobileFloatingButton />

      <style>{`
        @media (max-width: 768px) {
          .toolbar,
          .layer-panel,
          .status-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
