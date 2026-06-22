import { useAtomsStore } from '../stores/atomsStore'
import type { DisplayMode } from '../stores/atomsStore'
import { MOLECULES } from '../data/molecules'

interface ControlPanelProps {
  isMobile: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function ControlPanel({
  isMobile,
  mobileOpen,
  onCloseMobile,
}: ControlPanelProps) {
  const selectedMoleculeId = useAtomsStore((s) => s.selectedMoleculeId)
  const molecule = useAtomsStore((s) => s.molecule)
  const displayMode = useAtomsStore((s) => s.displayMode)
  const rotationSpeed = useAtomsStore((s) => s.rotationSpeed)
  const autoRotate = useAtomsStore((s) => s.autoRotate)
  const annotations = useAtomsStore((s) => s.annotations)
  const highlightedAtomId = useAtomsStore((s) => s.highlightedAtomId)

  const setSelectedMoleculeId = useAtomsStore((s) => s.setSelectedMoleculeId)
  const setDisplayMode = useAtomsStore((s) => s.setDisplayMode)
  const setRotationSpeed = useAtomsStore((s) => s.setRotationSpeed)
  const setAutoRotate = useAtomsStore((s) => s.setAutoRotate)
  const resetView = useAtomsStore((s) => s.resetView)
  const deleteAnnotation = useAtomsStore((s) => s.deleteAnnotation)
  const setHighlightedAtomId = useAtomsStore((s) => s.setHighlightedAtomId)

  const displayModes: { value: DisplayMode; label: string }[] = [
    { value: 'ballstick', label: '球棍' },
    { value: 'spacefill', label: '空间填充' },
    { value: 'wireframe', label: '线框' },
  ]

  const handleAnnotationClick = (atomId: number) => {
    if (highlightedAtomId === atomId) {
      setHighlightedAtomId(null)
    } else {
      setHighlightedAtomId(atomId)
    }
  }

  const getAtomById = (atomId: number) => {
    return molecule.atoms.find((a) => a.id === atomId)
  }

  return (
    <>
      <div
        className={`control-panel ${mobileOpen ? 'mobile-open' : ''}`}
        style={isMobile && !mobileOpen ? { visibility: 'hidden' } : {}}
      >
        <div className="panel-header">
          <div className="panel-title">🔬 分子查看器</div>
          {isMobile && (
            <button
              className="panel-toggle"
              onClick={onCloseMobile}
              aria-label="关闭面板"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="section">
          <label className="section-label">分子选择</label>
          <select
            className="select-input"
            value={selectedMoleculeId}
            onChange={(e) => setSelectedMoleculeId(e.target.value)}
          >
            {MOLECULES.map((mol) => (
              <option key={mol.id} value={mol.id}>
                {mol.name} ({mol.formula})
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', padding: '4px 8px 0' }}>
            {molecule.description}
          </div>
        </div>

        <div className="section">
          <label className="section-label">显示模式</label>
          <div className="button-group">
            {displayModes.map((mode) => (
              <button
                key={mode.value}
                className={`mode-btn ${displayMode === mode.value ? 'active' : ''}`}
                onClick={() => setDisplayMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="slider-container">
            <div className="slider-label">
              <span>旋转速度</span>
              <span className="slider-value">{rotationSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={5}
              step={0.1}
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            />
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              userSelect: 'none',
              marginTop: '4px',
            }}
          >
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#667eea',
                cursor: 'pointer',
              }}
            />
            自动旋转
          </label>
        </div>

        <div className="section">
          <button className="secondary-btn" onClick={resetView}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            重置视角
          </button>
        </div>

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="section-label" style={{ margin: 0 }}>
              原子标注
            </label>
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.08)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {annotations.length}
            </span>
          </div>

          {annotations.length === 0 ? (
            <div className="empty-annotations">
              暂无标注
              <br />
              双击原子可添加
            </div>
          ) : (
            <div className="annotation-list">
              {annotations.map((ann) => {
                const atom = getAtomById(ann.atomId)
                if (!atom) return null
                const isHighlighted = highlightedAtomId === ann.atomId
                return (
                  <div
                    key={ann.id}
                    className={`annotation-item ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleAnnotationClick(ann.atomId)}
                  >
                    <div
                      className="annotation-color-dot"
                      style={{ backgroundColor: atom.color }}
                    />
                    <div className="annotation-info">
                      <div className="annotation-name">
                        [{atom.id}] {atom.elementName} - {atom.element}
                      </div>
                      <div className="annotation-note">
                        {ann.note || '无备注'}
                      </div>
                    </div>
                    <button
                      className="annotation-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAnnotation(ann.id)
                      }}
                      title="删除标注"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 'auto',
            padding: '12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            分子信息
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.8', color: 'rgba(255,255,255,0.75)' }}>
            <div>
              原子数: <span style={{ color: '#667eea', fontWeight: 600 }}>{molecule.atoms.length}</span>
            </div>
            <div>
              化学键: <span style={{ color: '#667eea', fontWeight: 600 }}>{molecule.bonds.length}</span>
            </div>
            <div>
              分子式: <span style={{ color: '#667eea', fontWeight: 600 }}>{molecule.formula}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
