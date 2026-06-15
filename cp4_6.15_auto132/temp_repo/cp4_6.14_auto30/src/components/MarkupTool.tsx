import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function MarkupTool() {
  const markPoints = useAppStore((s) => s.markPoints)
  const isMarkMode = useAppStore((s) => s.isMarkMode)
  const modelUrl = useAppStore((s) => s.modelUrl)
  const removeMarkPoint = useAppStore((s) => s.removeMarkPoint)
  const moveMarkPoint = useAppStore((s) => s.moveMarkPoint)
  const projectToScreen = useAppStore((s) => s.projectToScreen)

  const [activeMarkId, setActiveMarkId] = useState<string | null>(null)
  const [draggingMarkId, setDraggingMarkId] = useState<string | null>(null)
  const [screenPositions, setScreenPositions] = useState<
    Record<string, { x: number; y: number }>
  >({})
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (!projectToScreen || markPoints.length === 0) {
      if (markPoints.length === 0) setScreenPositions({})
      return
    }

    let rafId: number

    const updatePositions = () => {
      const next: Record<string, { x: number; y: number }> = {}
      for (const mp of markPoints) {
        if (draggingMarkId === mp.id) {
          next[mp.id] = mp.worldPosition
        } else {
          const projected = projectToScreen(mp.position)
          next[mp.id] = projected ?? mp.worldPosition
        }
      }
      setScreenPositions(next)
      rafId = requestAnimationFrame(updatePositions)
    }

    rafId = requestAnimationFrame(updatePositions)
    return () => cancelAnimationFrame(rafId)
  }, [markPoints, projectToScreen, draggingMarkId])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      e.preventDefault()
      const pos = screenPositions[id]
      if (!pos) return
      dragOffsetRef.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      }
      setDraggingMarkId(id)
      setActiveMarkId(null)
    },
    [screenPositions]
  )

  useEffect(() => {
    if (!draggingMarkId) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - dragOffsetRef.current.x
      const y = e.clientY - dragOffsetRef.current.y
      const mp = markPoints.find((p) => p.id === draggingMarkId)
      if (mp) {
        moveMarkPoint(draggingMarkId, mp.position, { x, y })
      }
    }

    const handleMouseUp = () => {
      setDraggingMarkId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingMarkId, markPoints, moveMarkPoint])

  const handleRingClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if (draggingMarkId) return
      setActiveMarkId((prev) => (prev === id ? null : id))
    },
    [draggingMarkId]
  )

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setActiveMarkId(null)
    },
    []
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      removeMarkPoint(id)
      setActiveMarkId(null)
    },
    [removeMarkPoint]
  )

  return (
    <div style={styles.overlay}>
      {markPoints.map((mp) => {
        const pos = screenPositions[mp.id] ?? mp.worldPosition
        const isDragging = draggingMarkId === mp.id
        const isActive = activeMarkId === mp.id

        return (
          <div key={mp.id}>
            <div
              style={{
                ...styles.ring,
                left: pos.x - 10,
                top: pos.y - 10,
                ...(isDragging ? styles.ringDragging : {}),
              }}
              onMouseDown={(e) => handleMouseDown(e, mp.id)}
              onClick={(e) => handleRingClick(e, mp.id)}
            />

            {isActive && !isDragging && (
              <div
                style={{
                  ...styles.panel,
                  left: pos.x + 14,
                  top: pos.y - 14,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={styles.panelHeader}>
                  <span style={styles.panelTitle}>
                    {mp.materialName}
                  </span>
                  <button style={styles.iconBtn} onClick={handleClose}>
                    <X size={14} />
                  </button>
                </div>
                <div style={styles.panelBody}>
                  <div style={styles.panelRow}>
                    <span style={styles.panelLabel}>法线方向</span>
                    <span style={styles.panelValue}>
                      ({mp.normal[0].toFixed(2)},{' '}
                      {mp.normal[1].toFixed(2)},{' '}
                      {mp.normal[2].toFixed(2)})
                    </span>
                  </div>
                  <div style={styles.panelRow}>
                    <span style={styles.panelLabel}>光照强度</span>
                    <span style={styles.panelValue}>
                      {mp.lightIntensity.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div style={styles.panelFooter}>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, mp.id)}
                  >
                    <Trash2 size={13} />
                    <span>删除标记</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {isMarkMode && modelUrl && (
        <div style={styles.modeHint}>
          标记模式：点击模型表面添加标记点
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 20,
    height: 20,
    border: '2px solid rgba(255,255,255,0.7)',
    borderRadius: '50%',
    background: 'rgba(79,195,247,0.15)',
    pointerEvents: 'auto',
    cursor: 'grab',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
    zIndex: 10,
  },
  ringDragging: {
    borderColor: 'var(--accent-blue)',
    transform: 'scale(1.2)',
    cursor: 'grabbing',
  },
  panel: {
    position: 'absolute',
    background: 'rgba(10,15,30,0.92)',
    border: '1px solid rgba(79,195,247,0.3)',
    borderRadius: 10,
    padding: 14,
    minWidth: 200,
    backdropFilter: 'blur(8px)',
    boxShadow:
      '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,195,247,0.1)',
    pointerEvents: 'auto',
    zIndex: 20,
    animation: 'markupPanelIn 0.2s ease',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--accent-blue)',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 2,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
  },
  panelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  panelLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  panelValue: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  },
  panelFooter: {
    borderTop: '1px solid rgba(79,195,247,0.15)',
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modeHint: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 20px',
    background: 'rgba(10,15,30,0.85)',
    border: '1px solid rgba(79,195,247,0.25)',
    borderRadius: 20,
    color: 'var(--accent-blue)',
    fontSize: 13,
    pointerEvents: 'none',
    backdropFilter: 'blur(6px)',
    animation: 'markupHintIn 0.3s ease',
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes markupPanelIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes markupHintIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`
if (!document.querySelector('style[data-markup-tool]')) {
  styleSheet.setAttribute('data-markup-tool', 'true')
  document.head.appendChild(styleSheet)
}
