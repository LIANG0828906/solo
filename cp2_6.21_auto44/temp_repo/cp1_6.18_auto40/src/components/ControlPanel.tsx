import { useState } from 'react'
import { useMoleculeStore, ATOM_CONFIG, AtomType, MOLECULE_TEMPLATES } from '../store/moleculeStore'

const ControlPanel = () => {
  const [hoveredAtom, setHoveredAtom] = useState<AtomType | null>(null)
  const [atomCounter, setAtomCounter] = useState<Record<AtomType, number>>({
    carbon: 0,
    hydrogen: 0,
    oxygen: 0
  })
  const { addAtom, selectedAtomType, setSelectedAtomType, validateMolecule, validationResult, resetScene, atoms, bonds } = useMoleculeStore()

  const handleAtomDragStart = (e: React.DragEvent, type: AtomType) => {
    e.dataTransfer.setData('atomType', type)
    setSelectedAtomType(type)
  }

  const handleAtomClick = (type: AtomType) => {
    const basePositions: Record<AtomType, { x: number; y: number; z: number }> = {
      carbon: { x: -0.5, y: 0, z: 0 },
      hydrogen: { x: 0, y: 0, z: 0 },
      oxygen: { x: 0, y: 0, z: 0 }
    }
    const base = basePositions[type]
    const count = atomCounter[type]
    
    let offsetX = 0
    let offsetY = 0
    let offsetZ = 0
    
    if (type === 'hydrogen') {
      const bondAngle = (104.5 / 2) * (Math.PI / 180)
      const bondLength = 0.4
      if (count === 0) {
        offsetX = Math.cos(bondAngle) * bondLength
        offsetY = Math.sin(bondAngle) * bondLength
      } else {
        offsetX = -Math.cos(bondAngle) * bondLength
        offsetY = Math.sin(bondAngle) * bondLength
      }
    } else {
      const angle = count * (Math.PI * 2 / 4)
      const radius = 0.5
      offsetX = Math.cos(angle) * radius
      offsetY = Math.sin(angle) * radius
    }
    
    const pos = {
      x: base.x + offsetX,
      y: base.y + offsetY,
      z: base.z + offsetZ
    }
    addAtom(type, pos.x, pos.y, pos.z)
    setAtomCounter(prev => ({ ...prev, [type]: prev[type] + 1 }))
  }

  const renderAtomPreview = (type: AtomType, size: number = 40) => {
    const config = ATOM_CONFIG[type]
    const actualSize = (config.radius / 30) * size
    
    let style: React.CSSProperties = {
      width: actualSize,
      height: actualSize,
      borderRadius: '50%',
      backgroundColor: config.color,
      boxShadow: `0 0 12px ${config.color}4D`,
      transition: 'all 0.2s ease'
    }

    if (type === 'carbon') {
      style = {
        ...style,
        background: `radial-gradient(circle at 30% 30%, #718096, ${config.color}, #2D3748)`,
        boxShadow: `0 0 12px ${config.color}4D, inset -2px -2px 8px rgba(0,0,0,0.3)`
      }
    } else if (type === 'hydrogen') {
      style = {
        ...style,
        background: `radial-gradient(circle at 30% 30%, #FFFFFF, ${config.color}, #CBD5E0)`,
        boxShadow: `0 0 12px ${config.color}4D`
      }
    } else {
      style = {
        ...style,
        opacity: 0.7,
        background: `radial-gradient(circle at 30% 30%, #FEB2B2, ${config.color}, #C53030)`,
        boxShadow: `0 0 12px ${config.color}7A`
      }
    }

    return <div style={style} />
  }

  const atomTypes: AtomType[] = ['carbon', 'hydrogen', 'oxygen']

  return (
    <div style={styles.panel}>
      {validationResult?.success && (
        <div style={styles.successBanner}>
          ✓ 匹配成功
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>原子库</h3>
        <div style={styles.atomGrid}>
          {atomTypes.map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleAtomDragStart(e, type)}
              onClick={() => handleAtomClick(type)}
              onMouseEnter={() => setHoveredAtom(type)}
              onMouseLeave={() => setHoveredAtom(null)}
              style={{
                ...styles.atomCell,
                backgroundColor: hoveredAtom === type ? '#2D3748' : 'transparent'
              }}
            >
              <div style={styles.atomPreviewContainer}>
                {renderAtomPreview(type)}
              </div>
              <span style={styles.atomLabel}>{ATOM_CONFIG[type].name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>化学键类型</h3>
        <div style={styles.bondInfo}>
          <div style={styles.bondRow}>
            <div style={{ ...styles.bondIcon, backgroundColor: '#68D391' }} />
            <span style={styles.bondLabel}>单键 - 点击切换</span>
          </div>
          <div style={styles.bondRow}>
            <div style={{
              display: 'flex',
              gap: 4
            }}>
              <div style={{ ...styles.bondIcon, backgroundColor: '#F6E05E', width: 12 }} />
              <div style={{ ...styles.bondIcon, backgroundColor: '#F6E05E', width: 12 }} />
            </div>
            <span style={styles.bondLabel}>双键 - 绿色键点击一次</span>
          </div>
          <div style={styles.bondRow}>
            <div style={{
              display: 'flex',
              gap: 3
            }}>
              <div style={{ ...styles.bondIcon, backgroundColor: '#FC8181', width: 8 }} />
              <div style={{ ...styles.bondIcon, backgroundColor: '#FC8181', width: 8 }} />
              <div style={{ ...styles.bondIcon, backgroundColor: '#FC8181', width: 8 }} />
            </div>
            <span style={styles.bondLabel}>三键 - 黄色键点击一次</span>
          </div>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>分子模板</h3>
        <div style={styles.templateList}>
          {MOLECULE_TEMPLATES.map((template) => (
            <div key={template.formula} style={styles.templateItem}>
              <span style={styles.templateFormula}>{template.formula}</span>
              <span style={styles.templateName}>{template.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.statsSection}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>原子数:</span>
          <span style={styles.statValue}>{atoms.length}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>化学键:</span>
          <span style={styles.statValue}>{bonds.length}</span>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button
          onClick={validateMolecule}
          style={styles.validateButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#38A169'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#48BB78'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#2F855A'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#38A169'
          }}
        >
          验证分子结构
        </button>

        <button
          onClick={() => {
            resetScene()
            setAtomCounter({ carbon: 0, hydrogen: 0, oxygen: 0 })
          }}
          style={styles.resetButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4A5568'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2D3748'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#1A202C'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#4A5568'
          }}
        >
          清空场景
        </button>
      </div>

      <div style={styles.instructions}>
        <p style={styles.instructionTitle}>操作说明：</p>
        <ul style={styles.instructionList}>
          <li>点击原子库添加原子到场景</li>
          <li>拖拽原子移动位置</li>
          <li>原子靠近自动生成化学键</li>
          <li>点击化学键切换键型</li>
          <li>拖拽空白处旋转视角</li>
          <li>滚轮缩放视图</li>
        </ul>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    left: 24,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 220,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    border: '1px solid #374151',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    padding: 16,
    zIndex: 100,
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  successBanner: {
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    border: '1px solid #48BB78',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#68D391',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    animation: 'pulse 0.5s ease-in-out'
  },
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 10,
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    margin: '12px 0'
  },
  atomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6
  },
  atomCell: {
    width: 60,
    height: 70,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    cursor: 'grab',
    transition: 'all 0.2s ease',
    gap: 4
  },
  atomPreviewContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40
  },
  atomLabel: {
    color: '#A0AEC0',
    fontSize: 10,
    textAlign: 'center'
  },
  bondInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  bondRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  bondIcon: {
    width: 24,
    height: 3,
    borderRadius: 2
  },
  bondLabel: {
    color: '#A0AEC0',
    fontSize: 11
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  templateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: 'rgba(45, 55, 72, 0.5)',
    borderRadius: 6
  },
  templateFormula: {
    color: '#68D391',
    fontWeight: 600,
    fontSize: 12
  },
  templateName: {
    color: '#718096',
    fontSize: 10
  },
  statsSection: {
    padding: '10px 0'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  statLabel: {
    color: '#718096',
    fontSize: 12
  },
  statValue: {
    color: '#63B3ED',
    fontWeight: 600,
    fontSize: 12
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8
  },
  validateButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#48BB78',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: 0.5
  },
  resetButton: {
    width: '100%',
    height: 36,
    backgroundColor: '#2D3748',
    color: '#A0AEC0',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  instructions: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #374151'
  },
  instructionTitle: {
    color: '#A0AEC0',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 6
  },
  instructionList: {
    color: '#718096',
    fontSize: 10,
    paddingLeft: 16,
    margin: 0,
    lineHeight: 1.6
  }
}

export default ControlPanel
