import React, { useRef, useState } from 'react'
import { useAppStore, BrushMode } from './store'
import { getLabelColor, DataPoint, Point3D } from './utils'

const LoadingHexagon: React.FC = () => (
  <svg viewBox="0 0 100 100" className="loading-hexagon">
    <polygon
      points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
      fill="none"
      stroke="#00D4FF"
      strokeWidth="4"
    />
    <polygon
      points="50,20 75,35 75,65 50,80 25,65 25,35"
      fill="#00D4FF"
      opacity="0.3"
    />
  </svg>
)

const LeftPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rawData = useAppStore(state => state.rawData)
  const reducedCoords = useAppStore(state => state.reducedCoords)
  const selectedIds = useAppStore(state => state.selectedIds)
  const brushMode = useAppStore(state => state.brushMode)
  const isProcessing = useAppStore(state => state.isProcessing)
  const progress = useAppStore(state => state.progress)
  const loadDataFromCSV = useAppStore(state => state.loadDataFromCSV)
  const setBrushMode = useAppStore(state => state.setBrushMode)
  const runDimensionalityReduction = useAppStore(state => state.runDimensionalityReduction)
  const clearSelection = useAppStore(state => state.clearSelection)
  const assignLabelToSelected = useAppStore(state => state.assignLabelToSelected)

  const [labelInput, setLabelInput] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      loadDataFromCSV(text)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      loadDataFromCSV(text)
    }
    reader.readAsText(file)
  }

  const brushButtons: { mode: BrushMode; label: string; icon: string }[] = [
    { mode: 'select', label: '点选', icon: '👆' },
    { mode: 'rectangle', label: '矩形', icon: '▭' },
    { mode: 'lasso', label: '套索', icon: '✎' }
  ]

  const handleSetBrush = (mode: BrushMode) => {
    setBrushMode(brushMode === mode ? null : mode)
  }

  const handleAssignLabel = (label: string) => {
    if (label.trim()) {
      assignLabelToSelected(label.trim())
      setLabelInput('')
    }
  }

  return (
    <div className="section" style={{ gap: '20px' }}>
      <div>
        <div className="panel-title">数据加载</div>
        <div className="section">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            className="file-drop-zone"
            style={{
              borderColor: dragOver ? '#00D4FF' : undefined,
              background: dragOver ? 'rgba(0, 212, 255, 0.05)' : undefined
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div style={{ fontSize: '28px' }}>📊</div>
            <p>点击或拖拽 CSV 文件到此处</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>
              最多 500 行，10 个数值列
            </p>
          </div>

          {rawData.length > 0 && (
            <div className="info-text" style={{ marginTop: '8px' }}>
              ✓ 已加载 {rawData.length} 个数据点
              {reducedCoords.length > 0 && `，降维完成`}
            </div>
          )}

          {isProcessing && (
            <div style={{ marginTop: '12px' }}>
              <div className="info-text" style={{ marginBottom: '6px' }}>
                {progress < 0.2 ? '解析数据中...' : progress < 1 ? `降维计算中... ${Math.round(progress * 100)}%` : '完成！'}
              </div>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {rawData.length > 0 && !isProcessing && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: '8px' }}
              onClick={runDimensionalityReduction}
            >
              🔄 重新降维
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="panel-title">画笔工具</div>
        <div className="section">
          <div className="btn-group">
            {brushButtons.map(({ mode, label, icon }) => (
              <button
                key={mode}
                className={`brush-btn ${brushMode === mode ? 'active' : ''}`}
                onClick={() => handleSetBrush(mode)}
              >
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
                {label}
              </button>
            ))}
          </div>

          <div className="info-text">
            {brushMode === null && '点击点可选中/取消选中'}
            {brushMode === 'select' && '点击数据点进行选择'}
            {brushMode === 'rectangle' && '拖拽绘制矩形选区'}
            {brushMode === 'lasso' && '自由绘制套索选区'}
          </div>
        </div>
      </div>

      <div>
        <div className="panel-title">标注管理</div>
        <div className="section">
          <div className="info-text">
            已选中 <span style={{ color: '#00D4FF', fontWeight: 'bold' }}>{selectedIds.size}</span> 个点
          </div>

          {selectedIds.size > 0 && (
            <>
              <div className="btn-group">
                <button
                  className="btn-secondary btn"
                  style={{ flex: 1, background: 'rgba(0, 255, 136, 0.15)', color: '#00FF88' }}
                  onClick={() => assignLabelToSelected('正常')}
                >
                  标记正常
                </button>
                <button
                  className="btn-secondary btn"
                  style={{ flex: 1, background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500' }}
                  onClick={() => assignLabelToSelected('异常')}
                >
                  标记异常
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="自定义标签..."
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAssignLabel(labelInput)}
                />
                <button
                  className="btn"
                  onClick={() => handleAssignLabel(labelInput)}
                  style={{ padding: '10px 14px' }}
                >
                  ✓
                </button>
              </div>

              <button
                className="btn btn-secondary"
                onClick={clearSelection}
              >
                清除选择
              </button>
            </>
          )}

          {selectedIds.size === 0 && rawData.length > 0 && (
            <div className="info-text">
              使用画笔工具选择数据点后可批量标注
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="panel-title">操作说明</div>
        <div className="info-text" style={{ lineHeight: '1.8' }}>
          • 左键拖拽：旋转视角<br />
          • 滚轮：缩放场景<br />
          • 右键拖拽：平移视角<br />
          • 静止 3 秒后自动旋转
        </div>
      </div>
    </div>
  )
}

interface RightPanelProps {
  onPointClick: (coord: Point3D) => void
}

const RightPanel: React.FC<RightPanelProps> = ({ onPointClick }) => {
  const rawData = useAppStore(state => state.rawData)
  const reducedCoords = useAppStore(state => state.reducedCoords)

  const labeledPoints = rawData.filter(p => p.label)

  const handleExport = () => {
    const exportData = rawData.map((point, i) => ({
      ...point,
      reducedCoord: reducedCoords[i] || null
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `labeled-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPointCoord = (point: DataPoint): Point3D | null => {
    const idx = rawData.findIndex(p => p.id === point.id)
    return idx >= 0 && idx < reducedCoords.length ? reducedCoords[idx] : null
  }

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) {
      return v.toExponential(2)
    }
    return v.toFixed(3)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div>
        <div className="panel-title">
          已标注数据
          <span style={{ float: 'right', fontSize: '13px', color: '#8888AA', fontWeight: 'normal' }}>
            {labeledPoints.length} / {rawData.length}
          </span>
        </div>

        {rawData.length === 0 ? (
          <div className="info-text">请先加载数据文件</div>
        ) : labeledPoints.length === 0 ? (
          <div className="info-text">暂无标注数据，选择点进行标注</div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '4px' }}>
            {labeledPoints.map((point) => {
              const coord = getPointCoord(point)
              const labelColor = getLabelColor(point.label)
              const summaryVals = point.values.slice(0, 3)

              return (
                <div
                  key={point.id}
                  className="label-item"
                  style={{ borderLeftColor: labelColor || '#00D4FF' }}
                  onClick={() => coord && onPointClick(coord)}
                >
                  <span
                    className="label-tag"
                    style={{
                      background: labelColor ? `${labelColor}33` : '#2A2A3E',
                      color: labelColor || '#00D4FF'
                    }}
                  >
                    {point.label}
                  </span>
                  <div className="label-data">
                    {summaryVals.map((v, i) => `v${i + 1}: ${formatValue(v)}`).join('  ')}
                  </div>
                  {coord && (
                    <div className="label-data" style={{ marginTop: '4px', fontSize: '11px' }}>
                      坐标: ({coord.x.toFixed(2)}, {coord.y.toFixed(2)}, {coord.z.toFixed(2)})
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {labeledPoints.length > 0 && (
        <button
          className="btn"
          onClick={handleExport}
          style={{ marginTop: 'auto' }}
        >
          📥 导出标注结果 (JSON)
        </button>
      )}
    </div>
  )
}

export { LeftPanel, RightPanel, LoadingHexagon }
