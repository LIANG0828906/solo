import { useRef, useState, useEffect } from 'react'
import { ThreeScene } from './scene'
import ControlPanel from './ControlPanel'
import {
  useJewelryStore,
  Snapshot,
  METAL_COLORS,
  GEM_COLORS,
  METAL_NAMES,
  GEM_NAMES,
  getRingSizeCode,
} from './store'

function Toast() {
  const toast = useJewelryStore((s) => s.toast)
  const hideToast = useJewelryStore((s) => s.hideToast)

  if (!toast) return null

  const bgColor = toast.type === 'success' ? '#2ECC71' : '#E74C3C'

  return (
    <div
      onClick={hideToast}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: bgColor,
        color: 'white',
        padding: '12px 24px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: `0 4px 20px ${bgColor}40`,
        zIndex: 10000,
        cursor: 'pointer',
        animation: 'slideDown 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 400,
      }}
    >
      <span style={{ fontSize: 16 }}>
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      {toast.message}
    </div>
  )
}

function SnapshotGallery() {
  const snapshots = useJewelryStore((s) => s.snapshots)
  const showToast = useJewelryStore((s) => s.showToast)
  const setMetal = useJewelryStore((s) => s.setMetal)
  const setGem = useJewelryStore((s) => s.setGem)
  const setSize = useJewelryStore((s) => s.setSize)
  const setLightEnv = useJewelryStore((s) => s.setLightEnv)
  const removeSnapshot = useJewelryStore((s) => s.removeSnapshot)

  const restoreSnapshot = (snap: Snapshot) => {
    setMetal(snap.metal)
    setGem(snap.gem)
    setSize(snap.size)
    setLightEnv(snap.lightEnv)
    showToast('success', '已恢复快照状态')
  }

  return (
    <div
      style={{
        width: '100%',
        height: 120,
        background: 'rgba(255,255,255,0.03)',
        borderTop: '0.5px solid #2D2D44',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
      className="gallery-scrollbar"
    >
      <style>{`
        .gallery-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .gallery-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .gallery-scrollbar::-webkit-scrollbar-thumb {
          background: #4A4A6E;
          border-radius: 2px;
        }
        .gallery-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5A5A8E;
        }
      `}</style>

      <div
        style={{
          fontSize: 11,
          color: '#666',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          padding: '8px 4px',
          borderRight: '1px solid #2D2D44',
          whiteSpace: 'nowrap',
          letterSpacing: 1,
          minWidth: 20,
        }}
      >
        快照长廊 ({snapshots.length}/12)
      </div>

      {snapshots.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#555',
            fontStyle: 'italic',
          }}
        >
          点击"保存快照"按钮，将当前设计视角保存到这里
        </div>
      ) : (
        snapshots.map((snap) => (
          <div
            key={snap.id}
            style={{
              width: 200,
              height: 96,
              borderRadius: 8,
              background: '#1A1A2E',
              border: '1px solid #2D2D44',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.borderColor = '#FFD700'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.borderColor = '#2D2D44'
            }}
            onClick={() => restoreSnapshot(snap)}
          >
            <div
              style={{
                width: '100%',
                height: 60,
                background: 'linear-gradient(135deg, #1A1A2E 0%, #2C2C4C 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {snap.thumbnail ? (
                <img
                  src={snap.thumbnail}
                  alt="snapshot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: `3px solid ${METAL_COLORS[snap.metal]}`,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 12,
                        height: 12,
                        background: GEM_COLORS[snap.gem],
                        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                padding: '6px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: METAL_COLORS[snap.metal],
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#E0E0E0' }}>
                    {METAL_NAMES[snap.metal]} + {GEM_NAMES[snap.gem]}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: '#666' }}>
                  {snap.size.toFixed(1)}cm / {getRingSizeCode(snap.size)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeSnapshot(snap.id)
                  showToast('success', '快照已删除')
                }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(231,76,60,0.2)',
                  border: 'none',
                  color: '#E74C3C',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="delete-btn"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                ×
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TopBar({ onSaveSnapshot, isSaving }: { onSaveSnapshot: () => void; isSaving: boolean }) {
  const metal = useJewelryStore((s) => s.metal)
  const gem = useJewelryStore((s) => s.gem)
  const size = useJewelryStore((s) => s.size)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 280,
        height: 56,
        background: 'rgba(26,26,46,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '0.5px solid #2D2D44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          💎
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0' }}>
            珠宝3D设计预览系统
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>
            Jewelry 3D Designer Pro
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: METAL_COLORS[metal],
              }}
            />
            <span style={{ color: '#AAA' }}>{METAL_NAMES[metal]}</span>
          </div>
          <span style={{ color: '#444' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                background: GEM_COLORS[gem],
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              }}
            />
            <span style={{ color: '#AAA' }}>{GEM_NAMES[gem]}</span>
          </div>
          <span style={{ color: '#444' }}>|</span>
          <span style={{ color: '#FFD700', fontWeight: 600 }}>
            {getRingSizeCode(size)} / {size.toFixed(1)}cm
          </span>
        </div>

        <button
          onClick={onSaveSnapshot}
          disabled={isSaving}
          style={{
            padding: '10px 20px',
            background: isSaving
              ? 'linear-gradient(135deg, #555 0%, #333 100%)'
              : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            borderRadius: 8,
            color: isSaving ? '#888' : '#1A1A2E',
            fontSize: 12,
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: isSaving
              ? 'none'
              : '0 4px 15px rgba(255,215,0,0.3)',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,215,0,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isSaving
              ? 'none'
              : '0 4px 15px rgba(255,215,0,0.3)'
          }}
        >
          <span>{isSaving ? '⏳' : '📷'}</span>
          {isSaving ? '保存中...' : '保存快照'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [isSaving, setIsSaving] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const metal = useJewelryStore((s) => s.metal)
  const gem = useJewelryStore((s) => s.gem)
  const size = useJewelryStore((s) => s.size)
  const lightEnv = useJewelryStore((s) => s.lightEnv)
  const markers = useJewelryStore((s) => s.markers)
  const currentView = useJewelryStore((s) => s.currentView)
  const addSnapshot = useJewelryStore((s) => s.addSnapshot)
  const showToast = useJewelryStore((s) => s.showToast)
  const snapshots = useJewelryStore((s) => s.snapshots)

  const handleSaveSnapshot = async () => {
    if (isSaving) return
    if (snapshots.length >= 12) {
      showToast('error', '快照数量已达上限（12张），请删除部分快照')
      return
    }

    setIsSaving(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 50))

      const canvas = canvasContainerRef.current?.querySelector('canvas')
      let thumbnail = ''

      if (canvas) {
        try {
          thumbnail = canvas.toDataURL('image/png', 0.6)
        } catch (e) {
          thumbnail = ''
        }
      }

      const VIEW_POSITIONS: Record<string, [number, number, number]> = {
        front: [0, 0, 6],
        side45: [4.2, 3, 4.2],
        top: [0, 6, 0.1],
      }

      const snapshot: Snapshot = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        thumbnail,
        cameraPosition: VIEW_POSITIONS[currentView] || [4.2, 3, 4.2],
        cameraTarget: [0, 0, 0],
        metal,
        gem,
        size,
        lightEnv,
        markers: JSON.parse(JSON.stringify(markers)),
        timestamp: Date.now(),
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      addSnapshot(snapshot)
      showToast('success', '快照保存成功！点击长廊卡片可快速恢复')
    } catch (e) {
      showToast('error', '快照保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>

      <Toast />

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#1A1A2E',
          }}
        >
          <TopBar onSaveSnapshot={handleSaveSnapshot} isSaving={isSaving} />

          <div
            ref={canvasContainerRef}
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <ThreeScene />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 136,
              left: 16,
              background: 'rgba(0,0,0,0.5)',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 10,
              color: '#888',
              pointerEvents: 'none',
              zIndex: 5,
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: '#AAA', marginBottom: 4, fontWeight: 500 }}>操作提示</div>
            <div>🖱 左键拖拽：旋转视角</div>
            <div>🖱 滚轮：缩放</div>
            <div>🖱 右键拖拽：平移</div>
            <div>👆 点击模型：添加标记</div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 72,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#666',
                padding: '3px 8px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 4,
                border: '1px solid #2D2D44',
              }}
            >
              FPS: 实时渲染
            </div>
          </div>
        </div>

        <div
          style={{
            width: 280,
            flexShrink: 0,
            padding: 16,
            paddingLeft: 0,
          }}
        >
          <ControlPanel />
        </div>
      </div>

      <SnapshotGallery />
    </div>
  )
}
