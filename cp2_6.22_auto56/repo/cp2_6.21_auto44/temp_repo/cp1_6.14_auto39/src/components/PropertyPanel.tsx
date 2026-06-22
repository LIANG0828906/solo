import { useState, useEffect, useRef } from 'react'
import type { PlacedArtwork, Artwork } from '../types'

interface PropertyPanelProps {
  selectedArtwork: PlacedArtwork | null
  artworkData: Artwork | null
  onUpdate: (id: string, updates: Partial<PlacedArtwork>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function PropertyPanel({
  selectedArtwork,
  artworkData,
  onUpdate,
  onDelete,
  onClose
}: PropertyPanelProps) {
  const [localPosX, setLocalPosX] = useState(0)
  const [localPosY, setLocalPosY] = useState(0)
  const [localRotation, setLocalRotation] = useState(0)
  const [localScale, setLocalScale] = useState(1)
  const isUpdating = useRef(false)

  useEffect(() => {
    if (selectedArtwork) {
      setLocalPosX(Math.round(selectedArtwork.positionX * 100) / 100)
      setLocalPosY(Math.round(selectedArtwork.positionY * 100) / 100)
      setLocalRotation(Math.round(selectedArtwork.rotation * 10) / 10)
      setLocalScale(Math.round(selectedArtwork.scale * 100) / 100)
    }
  }, [selectedArtwork])

  const handlePosChange = (axis: 'x' | 'y', delta: number) => {
    if (!selectedArtwork) return
    const newVal = axis === 'x' ? localPosX + delta : localPosY + delta
    if (axis === 'x') {
      setLocalPosX(Math.round(newVal * 100) / 100)
    } else {
      setLocalPosY(Math.round(newVal * 100) / 100)
    }
    onUpdate(selectedArtwork.id, {
      [axis === 'x' ? 'positionX' : 'positionY']: newVal
    })
  }

  const handleRotationChange = (delta: number) => {
    if (!selectedArtwork) return
    const newRotation = Math.max(0, Math.min(90, localRotation + delta))
    setLocalRotation(Math.round(newRotation * 10) / 10)
    onUpdate(selectedArtwork.id, { rotation: newRotation })
  }

  const handleScaleChange = (delta: number) => {
    if (!selectedArtwork) return
    const newScale = Math.max(0.3, Math.min(3, localScale + delta))
    setLocalScale(Math.round(newScale * 100) / 100)
    onUpdate(selectedArtwork.id, { scale: newScale })
  }

  const handleRotationInput = (value: string) => {
    if (!selectedArtwork || isUpdating.current) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    const clamped = Math.max(0, Math.min(90, num))
    setLocalRotation(Math.round(clamped * 10) / 10)
    isUpdating.current = true
    requestAnimationFrame(() => {
      onUpdate(selectedArtwork.id, { rotation: clamped })
      isUpdating.current = false
    })
  }

  if (!selectedArtwork) return null

  return (
    <div style={styles.panel} className="glass-panel">
      <div style={styles.header}>
        <h3 style={styles.title}>属性面板</h3>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      {artworkData && (
        <div style={styles.artworkInfo}>
          <img
            src={artworkData.imageUrl}
            alt={artworkData.title}
            style={styles.previewImg}
          />
          <div>
            <div style={styles.artTitle}>{artworkData.title}</div>
            <div style={styles.artAuthor}>{artworkData.author}</div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>位置</div>
        <div style={styles.controlRow}>
          <span style={styles.label}>X 坐标</span>
          <div style={styles.numberControl}>
            <button
              style={styles.arrowBtn}
              onClick={() => handlePosChange('x', -0.01)}
              onMouseDown={(e) => {
                e.preventDefault()
              }}
            >
              −
            </button>
            <span style={styles.value}>{localPosX.toFixed(2)}</span>
            <button
              style={styles.arrowBtn}
              onClick={() => handlePosChange('x', 0.01)}
            >
              +
            </button>
          </div>
        </div>
        <div style={styles.controlRow}>
          <span style={styles.label}>Y 坐标</span>
          <div style={styles.numberControl}>
            <button
              style={styles.arrowBtn}
              onClick={() => handlePosChange('y', -0.01)}
            >
              −
            </button>
            <span style={styles.value}>{localPosY.toFixed(2)}</span>
            <button
              style={styles.arrowBtn}
              onClick={() => handlePosChange('y', 0.01)}
            >
              +
            </button>
          </div>
        </div>
        <div style={styles.hint}>点击按钮微调，按住可连续调整</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>旋转角度</div>
        <div style={styles.controlRow}>
          <span style={styles.label}>角度</span>
          <div style={styles.numberControl}>
            <button
              style={styles.arrowBtn}
              onClick={() => handleRotationChange(-1)}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max="90"
              step="0.1"
              value={localRotation}
              onChange={(e) => handleRotationInput(e.target.value)}
              style={styles.inputValue}
            />
            <button
              style={styles.arrowBtn}
              onClick={() => handleRotationChange(1)}
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="90"
          step="0.5"
          value={localRotation}
          onChange={(e) => handleRotationInput(e.target.value)}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>缩放</div>
        <div style={styles.controlRow}>
          <span style={styles.label}>比例</span>
          <div style={styles.numberControl}>
            <button
              style={styles.arrowBtn}
              onClick={() => handleScaleChange(-0.05)}
            >
              −
            </button>
            <span style={styles.value}>{localScale.toFixed(2)}</span>
            <button
              style={styles.arrowBtn}
              onClick={() => handleScaleChange(0.05)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>墙面</div>
        <div style={styles.wallButtons}>
          {(['front', 'back', 'left', 'right'] as const).map((wall) => (
            <button
              key={wall}
              style={{
                ...styles.wallBtn,
                ...(selectedArtwork.wall === wall ? styles.wallBtnActive : {})
              }}
              onClick={() =>
                onUpdate(selectedArtwork.id, { wall, positionX: 0, positionY: 0 })
              }
            >
              {wall === 'front'
                ? '正面墙'
                : wall === 'back'
                ? '背面墙'
                : wall === 'left'
                ? '左侧墙'
                : '右侧墙'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <button
          className="btn btn-secondary btn-small"
          style={styles.deleteBtn}
          onClick={() => onDelete(selectedArtwork.id)}
        >
          删除画作
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '280px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px 0 0 16px',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333'
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.05)',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  artworkInfo: {
    padding: '16px 20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.06)'
  },
  previewImg: {
    width: '50px',
    height: '50px',
    borderRadius: '6px',
    objectFit: 'cover'
  },
  artTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333'
  },
  artAuthor: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px'
  },
  section: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.04)'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#555',
    marginBottom: '12px'
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  label: {
    fontSize: '13px',
    color: '#666'
  },
  numberControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '6px',
    padding: '2px'
  },
  arrowBtn: {
    width: '28px',
    height: '26px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  value: {
    minWidth: '60px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    fontFamily: 'monospace'
  },
  inputValue: {
    width: '60px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    fontFamily: 'monospace',
    border: 'none',
    background: 'white',
    borderRadius: '4px',
    padding: '4px 6px',
    outline: 'none'
  },
  hint: {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '4px'
  },
  slider: {
    width: '100%',
    height: '4px',
    cursor: 'pointer',
    accentColor: '#d4a574'
  },
  wallButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  wallBtn: {
    padding: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#555',
    transition: 'all 0.2s ease'
  },
  wallBtnActive: {
    background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 100%)',
    color: 'white',
    borderColor: 'transparent'
  },
  footer: {
    padding: '16px 20px',
    marginTop: 'auto'
  },
  deleteBtn: {
    width: '100%',
    color: '#e74c3c',
    border: '1px solid rgba(231,76,60,0.3)'
  }
}

export default PropertyPanel
