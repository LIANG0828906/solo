import React, { useState, useEffect, useRef } from 'react'
import type { Residue, Measurement, ModelMode, ResidueLabel, Atom } from '../../types'

interface UIControlsProps {
  modelMode: ModelMode
  selectedResidue: Residue | null
  measurements: Measurement[]
  labels: ResidueLabel[]
  isMeasuringMode: boolean
  measuringAtom: Atom | null
  isMobile: boolean
  sidebarOpen: boolean
  onFileLoad: (file: File) => void
  onModeChange: (mode: ModelMode) => void
  onAddLabel: (text: string) => void
  onRemoveLabel: (residueId: number) => void
  onToggleMeasurementMode: () => void
  onRemoveMeasurement: (id: string) => void
  onToggleSidebar: () => void
}

const ANIMATION_DURATION = 300

const UIControls: React.FC<UIControlsProps> = ({
  modelMode,
  selectedResidue,
  measurements,
  labels,
  isMeasuringMode,
  measuringAtom,
  isMobile,
  sidebarOpen,
  onFileLoad,
  onModeChange,
  onAddLabel,
  onRemoveLabel,
  onToggleMeasurementMode,
  onRemoveMeasurement,
  onToggleSidebar
}) => {
  const [labelText, setLabelText] = useState('')
  const [removingMeasurementIds, setRemovingMeasurementIds] = useState<Set<string>>(new Set())
  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers = pendingTimersRef.current
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
      setRemovingMeasurementIds(new Set())
    }
  }, [])

  const removeMeasurementWithAnimation = (id: string) => {
    if (removingMeasurementIds.has(id)) return

    setRemovingMeasurementIds(prev => new Set(prev).add(id))

    const timer = setTimeout(() => {
      pendingTimersRef.current.delete(id)
      setRemovingMeasurementIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      onRemoveMeasurement(id)
    }, ANIMATION_DURATION)

    pendingTimersRef.current.set(id, timer)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileLoad(file)
    }
  }

  const handleAddLabel = () => {
    if (labelText.trim() && selectedResidue) {
      onAddLabel(labelText.trim())
      setLabelText('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLabel()
    }
  }

  const selectedLabels = selectedResidue
    ? labels.filter(l => l.residueId === selectedResidue.id)
    : []

  const getResidueFormula = (residue: Residue): string => {
    const elementCounts: Record<string, number> = {}
    for (const atom of residue.atoms) {
      elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1
    }
    return Object.entries(elementCounts)
      .map(([el, count]) => `${el}${count > 1 ? count : ''}`)
      .join('')
  }

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1 className="sidebar-title">蛋白质3D查看器</h1>
        {isMobile && (
          <button className="menu-btn" onClick={onToggleSidebar}>
            ×
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-title">加载文件</div>
        <label className="btn btn-primary">
          <span>📂</span>
          加载PDB
          <input
            type="file"
            accept=".pdb"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="sidebar-section">
        <div className="section-title">显示模式</div>
        <div className="mode-buttons">
          <button
            className={`btn mode-btn ${modelMode === 'ballstick' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => onModeChange('ballstick')}
          >
            <div>⚛️</div>
            <span>球棍模型</span>
          </button>
          <button
            className={`btn mode-btn ${modelMode === 'cartoon' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => onModeChange('cartoon')}
          >
            <div>🧬</div>
            <span>卡通模型</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">选中残基</div>
        {selectedResidue ? (
          <>
            <div className="info-row">
              <span className="info-label">链标识</span>
              <span className="info-value">{selectedResidue.chainId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">残基序号</span>
              <span className="info-value">{selectedResidue.seqNum}</span>
            </div>
            <div className="info-row">
              <span className="info-label">名称</span>
              <span className="info-value">{selectedResidue.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">分子式</span>
              <span className="info-value">{getResidueFormula(selectedResidue)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">原子数</span>
              <span className="info-value">{selectedResidue.atoms.length}</span>
            </div>

            <div className="label-input-group">
              <input
                type="text"
                className="label-input"
                placeholder="添加标签..."
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="add-label-btn"
                onClick={handleAddLabel}
                disabled={!labelText.trim()}
              >
                添加
              </button>
            </div>

            {selectedLabels.length > 0 && (
              <div className="labels-list">
                {selectedLabels.map((label) => (
                  <div key={label.residueId} className="label-item">
                    <span>{label.text}</span>
                    <button
                      className="delete-btn"
                      onClick={() => onRemoveLabel(label.residueId)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-selection">
            点击场景中的原子或骨架选择残基
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>测量列表</span>
          <button
            className={`btn ${isMeasuringMode ? 'btn-active' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '11px', width: 'auto' }}
            onClick={onToggleMeasurementMode}
          >
            {isMeasuringMode ? '取消测量' : '开始测量'}
          </button>
        </div>
        {isMeasuringMode && (
          <div style={{ fontSize: '12px', color: '#4facfe', marginBottom: '10px' }}>
            {measuringAtom
              ? `已选择第一个原子: ${measuringAtom.name}，请点击第二个原子`
              : '请点击第一个原子开始测量'}
          </div>
        )}
        {measurements.length > 0 ? (
          <div className="measurement-list">
            {measurements.map((measurement) => (
              <div
                key={measurement.id}
                className={`measurement-item ${
                  removingMeasurementIds.has(measurement.id) ? 'removing' : ''
                }`}
              >
                <div className="measurement-info">
                  <div className="measurement-atoms">
                    {measurement.atom1.name} ({measurement.atom1.chainId}{measurement.atom1.residueId})
                    {' → '}
                    {measurement.atom2.name} ({measurement.atom2.chainId}{measurement.atom2.residueId})
                  </div>
                  <div className="measurement-distance">
                    {measurement.distance.toFixed(2)} Å
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => removeMeasurementWithAnimation(measurement.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-selection">
            暂无测量数据
          </div>
        )}
      </div>
    </div>
  )
}

export default UIControls
