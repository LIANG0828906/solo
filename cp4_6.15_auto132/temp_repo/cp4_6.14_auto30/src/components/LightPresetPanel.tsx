import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'
import PresetCard from './PresetCard'
import { X, Save, Layers3, GripVertical } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { LightPreset } from '../utils/sceneHelpers'

export default function LightPresetPanel() {
  const rightPanelVisible = useAppStore((s) => s.rightPanelVisible)
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel)
  const savedPresets = useAppStore((s) => s.savedPresets)
  const currentPresetId = useAppStore((s) => s.currentPresetId)
  const removePreset = useAppStore((s) => s.removePreset)
  const reorderPresets = useAppStore((s) => s.reorderPresets)
  const addPreset = useAppStore((s) => s.addPreset)
  const applyPresetToCurrent = useAppStore((s) => s.applyPresetToCurrent)
  const ambientIntensity = useAppStore((s) => s.ambientIntensity)
  const directionalIntensity = useAppStore((s) => s.directionalIntensity)

  const listRef = useRef<HTMLDivElement>(null)
  const dragGhostRef = useRef<HTMLElement | null>(null)

  const longPressTimer = useRef<number | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [ghostOffset, setGhostOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showSaveTip, setShowSaveTip] = useState(false)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging || dragIndex === null) return
      e.preventDefault()

      setGhostPos({
        x: e.clientX - ghostOffset.x,
        y: e.clientY - ghostOffset.y,
      })

      if (!listRef.current) return
      const cards = listRef.current.querySelectorAll<HTMLElement>(
        '.preset-card-wrapper'
      )
      let foundIndex: number | null = null
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect()
        const cy = rect.top + rect.height / 2
        if (e.clientY < cy) {
          foundIndex = i
          break
        }
      }
      if (foundIndex === null && cards.length > 0) {
        foundIndex = cards.length - 1
      }
      setDragOverIndex(foundIndex)
    }

    function onMouseUp(e: MouseEvent) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      if (!isDragging) {
        setDragIndex(null)
        setDragOverIndex(null)
        return
      }

      if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
        reorderPresets(dragIndex, dragOverIndex)
      }

      setIsDragging(false)
      setDragIndex(null)
      setDragOverIndex(null)
      if (dragGhostRef.current) {
        dragGhostRef.current.remove()
        dragGhostRef.current = null
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, dragIndex, dragOverIndex, ghostOffset, reorderPresets])

  const handleCardMouseDown = (index: number, e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    dragStartPos.current = { x: e.clientX, y: e.clientY }
    setGhostOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setGhostPos({ x: rect.left, y: rect.top })

    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      setDragIndex(index)
      setIsDragging(true)
      setDragOverIndex(index)

      const ghost = target.cloneNode(true) as HTMLElement
      ghost.style.position = 'fixed'
      ghost.style.left = `${rect.left}px`
      ghost.style.top = `${rect.top}px`
      ghost.style.width = `${rect.width}px`
      ghost.style.pointerEvents = 'none'
      ghost.style.opacity = '0.85'
      ghost.style.transform = 'rotate(-1.5deg) scale(1.03)'
      ghost.style.zIndex = '10000'
      ghost.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,195,247,0.35)'
      ghost.classList.add('preset-card-ghost')
      document.body.appendChild(ghost)
      dragGhostRef.current = ghost

      if (navigator.vibrate) navigator.vibrate?.(15)
    }, 500)
  }

  useEffect(() => {
    if (isDragging && dragGhostRef.current) {
      dragGhostRef.current.style.left = `${ghostPos.x}px`
      dragGhostRef.current.style.top = `${ghostPos.y}px`
    }
  }, [ghostPos, isDragging])

  const handleSavePreset = () => {
    const now = new Date()
    const name = `自定义方案 ${now.getMonth() + 1}/${now.getDate()} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const preset: LightPreset = {
      id: uuidv4(),
      name,
      thumbnail: undefined,
      ambient: { color: '#ffffff', intensity: ambientIntensity },
      directional: {
        color: '#fff8e7',
        intensity: directionalIntensity,
        position: [5, 8, 5],
      },
      pointLights: [],
    }
    addPreset(preset)
    setShowSaveTip(true)
    setTimeout(() => setShowSaveTip(false), 2200)
  }

  const handleApplyPreset = (preset: LightPreset) => {
    if (isDragging) return
    applyPresetToCurrent(preset)
  }

  return (
    <>
      <div
        style={{
          ...styles.panel,
          transform: rightPanelVisible
            ? 'translateX(0)'
            : 'translateX(100%)',
          boxShadow: rightPanelVisible
            ? '-8px 0 30px rgba(0,0,0,0.35)'
            : 'none',
        }}
      >
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Layers3 size={18} color="var(--accent-blue)" />
            <span>光照预设方案</span>
            <span style={styles.headerCount}>{savedPresets.length}</span>
          </div>

          <div style={styles.headerActions}>
            <div style={{ position: 'relative' }}>
              <button
                style={styles.saveBtn}
                onClick={handleSavePreset}
                title="保存当前光照配置为预设"
              >
                <Save size={15} />
                <span>保存</span>
              </button>
              {showSaveTip && (
                <div style={styles.saveTip}>已保存 ✓</div>
              )}
            </div>
            <button
              style={styles.closeBtn}
              onClick={toggleRightPanel}
              title="隐藏预设面板"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={styles.dragHint}>
          <GripVertical size={12} />
          <span>长按卡片 0.5 秒可拖拽排序</span>
        </div>

        <div ref={listRef} style={styles.list}>
          {savedPresets.length === 0 ? (
            <div style={styles.empty}>
              <Layers3 size={36} color="var(--text-secondary)" />
              <div style={styles.emptyTitle}>暂无预设方案</div>
              <div style={styles.emptyDesc}>
                点击"保存"按钮以保存当前光照配置
              </div>
            </div>
          ) : (
            savedPresets.map((preset, i) => {
              let transform = ''
              if (isDragging && dragIndex !== null && dragOverIndex !== null) {
                if (i === dragIndex) {
                  transform = 'opacity(0.4)'
                } else if (dragIndex < dragOverIndex) {
                  if (i > dragIndex && i <= dragOverIndex) {
                    transform = 'translateY(-92px)'
                  }
                } else if (dragIndex > dragOverIndex) {
                  if (i >= dragOverIndex && i < dragIndex) {
                    transform = 'translateY(92px)'
                  }
                }
              }
              return (
                <div
                  key={preset.id}
                  style={{
                    transition: isDragging
                      ? 'transform 0.25s cubic-bezier(0.4,0,0.2,1)'
                      : 'none',
                    transform,
                  }}
                >
                  <PresetCard
                    preset={preset}
                    index={i}
                    isActive={preset.id === currentPresetId}
                    onApply={handleApplyPreset}
                    onDelete={removePreset}
                    onDragStart={handleCardMouseDown}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>

      {!rightPanelVisible && (
        <button
          style={styles.reopenBtn}
          onClick={toggleRightPanel}
          title="显示预设面板"
        >
          <Layers3 size={18} />
        </button>
      )}

      <PanelStyles />
    </>
  )
}

function PanelStyles() {
  const injected = useRef(false)
  useEffect(() => {
    if (injected.current) return
    injected.current = true
    const css = document.createElement('style')
    css.setAttribute('data-lightpanel-styles', 'true')
    css.textContent = `
      .preset-card-ghost * {
        pointer-events: none !important;
      }
    `
    document.head.appendChild(css)
  }, [])
  return null
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 320,
    height: '100%',
    background: 'rgba(22, 33, 62, 0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(79,195,247,0.12)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    transition:
      'transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 10px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  headerCount: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--accent-blue)',
    background: 'rgba(79,195,247,0.1)',
    padding: '2px 7px',
    borderRadius: 999,
    marginLeft: 2,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    height: 30,
    background: 'linear-gradient(135deg, rgba(255,183,77,0.22), rgba(255,183,77,0.08))',
    color: 'var(--accent-amber)',
    border: '1px solid rgba(255,183,77,0.35)',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  saveTip: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#0a0f1e',
    color: '#81c784',
    fontSize: 11,
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(129,199,132,0.2)',
    whiteSpace: 'nowrap',
    animation: 'tipIn 0.2s ease',
    zIndex: 100,
  },
  closeBtn: {
    width: 30,
    height: 30,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  dragHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 18px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    opacity: 0.7,
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 14px 18px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '60px 20px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    opacity: 0.7,
  },
  emptyDesc: {
    fontSize: 12,
    opacity: 0.7,
    maxWidth: 220,
    lineHeight: 1.6,
  },
  reopenBtn: {
    position: 'fixed',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 36,
    height: 68,
    background: 'rgba(22,33,62,0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(79,195,247,0.2)',
    borderRight: 'none',
    borderRadius: '10px 0 0 10px',
    color: 'var(--accent-blue)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    transition: 'all 0.2s ease',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
  },
}

const extraCss = document.createElement('style')
extraCss.textContent = `
  @keyframes tipIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  [style*="saveBtn"]:hover {
    background: rgba(255,183,77,0.3) !important;
    border-color: rgba(255,183,77,0.55) !important;
    box-shadow: 0 0 14px rgba(255,183,77,0.25);
  }
  [style*="closeBtn"]:hover,
  [style*="reopenBtn"]:hover {
    border-color: rgba(79,195,247,0.35) !important;
    background: rgba(79,195,247,0.1) !important;
    color: var(--text-primary) !important;
  }
  [style*="reopenBtn"]:hover {
    width: 42px;
  }
`
if (!document.querySelector('style[data-lightpanel-extra]')) {
  extraCss.setAttribute('data-lightpanel-extra', 'true')
  document.head.appendChild(extraCss)
}
