import { useState, useEffect, useCallback, useRef } from 'react'
import TerrainGenerator from './TerrainGenerator'
import PathPlanner from './PathPlanner'
import {
  TerrainParams,
  PathPoint,
  ExportData,
  GRID_SIZE,
  generateTerrain,
  gridToWorld,
} from './api'

type ViewMode = 'split' | 'full3d'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

export default function App() {
  const [terrainParams, setTerrainParams] = useState<TerrainParams>({
    amplitude: 5,
    frequency: 2,
    seaLevel: 0,
  })

  const [heights, setHeights] = useState<Float32Array>(() =>
    generateTerrain({ amplitude: 5, frequency: 2, seaLevel: 0 })
  )

  const [pathPoints, setPathPoints] = useState<PathPoint[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastIdRef = useRef(0)

  useEffect(() => {
    const h = generateTerrain(terrainParams)
    setHeights(h)
  }, [terrainParams])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  const handleAddPoint = useCallback(
    (point: PathPoint) => {
      setPathPoints((prev) => [...prev, point])
    },
    []
  )

  const handleUpdatePoint = useCallback((index: number, point: PathPoint) => {
    setPathPoints((prev) => {
      const next = [...prev]
      next[index] = point
      return next
    })
  }, [])

  const handleClearPath = useCallback(() => {
    setPathPoints([])
    showToast('路径已清空', 'info')
  }, [showToast])

  const handleExport = useCallback(() => {
    const data: ExportData = {
      terrainParams,
      pathPoints,
      gridSize: GRID_SIZE,
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terrain-path-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('导出成功', 'success')
  }, [terrainParams, pathPoints, showToast])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data: ExportData = JSON.parse(event.target?.result as string)
          if (data.terrainParams && data.pathPoints) {
            setTerrainParams(data.terrainParams)
            const newHeights = generateTerrain(data.terrainParams)
            setHeights(newHeights)
            setPathPoints(
              data.pathPoints.map((p) => {
                const gx = ((p.x + GRID_SIZE / 2) / GRID_SIZE) * 200
                const gy = ((p.z + GRID_SIZE / 2) / GRID_SIZE) * 200
                return gridToWorld(gx, gy, newHeights)
              })
            )
            showToast('导入成功', 'success')
          } else {
            showToast('文件格式无效', 'error')
          }
        } catch {
          showToast('导入失败：文件解析错误', 'error')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [showToast]
  )

  const handleParamChange = useCallback(
    (key: keyof TerrainParams, value: number) => {
      setTerrainParams((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'split' ? 'full3d' : 'split'))
  }, [])

  const sliderStyle = (label: string, value: number, min: number, max: number, step: number) => ({
    width: '100%',
    accentColor: '#ff7b00',
    cursor: 'pointer',
    height: '6px',
    borderRadius: '3px',
    appearance: 'none' as const,
    background: `linear-gradient(to right, #ff7b00 0%, #ff7b00 ${((value - min) / (max - min)) * 100}%, #3a4b5a ${((value - min) / (max - min)) * 100}%, #3a4b5a 100%)`,
  })

  const ControlPanel = () => (
    <div
      style={{
        padding: isMobile ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
      }}
    >
      <div style={{ color: '#cdd9e0', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
        地形参数
      </div>

      {[
        { key: 'amplitude' as const, label: '起伏幅度', min: 1, max: 10, step: 0.5 },
        { key: 'frequency' as const, label: '频率', min: 1, max: 5, step: 0.1 },
        { key: 'seaLevel' as const, label: '海平面偏移', min: -2, max: 2, step: 0.1 },
      ].map(({ key, label, min, max, step }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9aabb8', fontSize: '13px' }}>{label}</span>
            <span style={{ color: '#ff7b00', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
              {terrainParams[key].toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={terrainParams[key]}
            onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
            style={sliderStyle(label, terrainParams[key], min, max, step)}
          />
        </div>
      ))}

      <div
        style={{
          height: '1px',
          background: '#2a3b4a',
          margin: '8px 0',
        }}
      />

      <div style={{ color: '#cdd9e0', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
        路径信息
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9aabb8', fontSize: '13px' }}>
        <span>路径点数</span>
        <span style={{ color: '#ff7b00', fontWeight: 600 }}>{pathPoints.length}</span>
      </div>

      <button
        onClick={handleClearPath}
        style={buttonStyle('#3a4b5a', '#4a5b6a')}
      >
        清空路径
      </button>

      <div
        style={{
          height: '1px',
          background: '#2a3b4a',
          margin: '8px 0',
        }}
      />

      <button
        onClick={toggleViewMode}
        style={buttonStyle('#ff7b00', '#ff8b1a')}
      >
        {viewMode === 'split' ? '全屏 3D 视图' : '分屏视图'}
      </button>
    </div>
  )

  const buttonStyle = (bg: string, hover: string): React.CSSProperties => ({
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    background: bg,
    color: bg === '#ff7b00' ? '#1a2332' : '#cdd9e0',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  })

  const toolbarButtonStyle = (bg: string): React.CSSProperties => ({
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    background: bg,
    color: bg === '#ff7b00' ? '#1a2332' : '#cdd9e0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  })

  const glassPanelStyle: React.CSSProperties = {
    background: 'rgba(30, 42, 58, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: isMobile ? '0' : '12px',
    overflow: 'hidden',
  }

  const mainContainerStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#1a2332',
        position: 'relative' as const,
      }
    : {
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#1a2332',
        position: 'relative' as const,
      }

  const viewContainerStyle = (flex: number): React.CSSProperties => ({
    flex,
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'flex 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  })

  return (
    <div style={mainContainerStyle}>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff7b00;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(255,123,0,0.4);
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.9);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff7b00;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(255,123,0,0.4);
        }
        .btn-hover:hover { filter: brightness(1.15); transform: scale(1.02); }
        .btn-hover:active { transform: scale(0.97); transition: transform 0.1s ease; }
        @keyframes slideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: isMobile ? (menuOpen ? 'auto' : '16px') : '16px',
          right: isMobile ? (menuOpen ? 'auto' : '16px') : '16px',
          bottom: isMobile && menuOpen ? 'calc(100% + 8px)' : 'auto',
          display: 'flex',
          gap: '8px',
          zIndex: 100,
          alignItems: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
        <button
          className="btn-hover"
          onClick={handleImportClick}
          style={{
            ...toolbarButtonStyle('rgba(30, 42, 58, 0.8)'),
          }}
        >
          导入
        </button>
        <button
          className="btn-hover"
          onClick={handleExport}
          style={toolbarButtonStyle('#ff7b00')}
        >
          导出
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          top: isMobile ? (menuOpen ? 'auto' : '16px') : '16px',
          left: isMobile ? (menuOpen ? 'auto' : '16px') : '16px',
          bottom: isMobile && menuOpen ? 'calc(100% + 8px)' : 'auto',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff7b00, #ff9b3a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          🏔️
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#cdd9e0', fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>
            地形探险家
          </div>
          <div style={{ color: '#5a6b7a', fontSize: '11px' }}>
            Terrain Explorer
          </div>
        </div>
      </div>

      {isMobile ? (
        <>
          <div
            style={{
              ...viewContainerStyle(1),
              display: 'flex',
              flexDirection: 'column',
              paddingTop: menuOpen ? '60px' : '60px',
            }}
          >
            <div style={viewContainerStyle(1)}>
              <TerrainGenerator heights={heights} pathPoints={pathPoints} />
              {viewMode === 'full3d' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '70px',
                    left: '16px',
                    width: '200px',
                    height: '150px',
                    zIndex: 50,
                    animation: 'fadeInUp 0.3s ease',
                  }}
                >
                  <PathPlanner
                    heights={heights}
                    amplitude={terrainParams.amplitude}
                    pathPoints={pathPoints}
                    onAddPoint={handleAddPoint}
                    onUpdatePoint={handleUpdatePoint}
                    onClearPath={handleClearPath}
                    compact
                  />
                </div>
              )}
            </div>
            {viewMode === 'split' && (
              <div style={{ ...viewContainerStyle(1), borderTop: '1px solid #2a3b4a' }}>
                <PathPlanner
                  heights={heights}
                  amplitude={terrainParams.amplitude}
                  pathPoints={pathPoints}
                  onAddPoint={handleAddPoint}
                  onUpdatePoint={handleUpdatePoint}
                  onClearPath={handleClearPath}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              position: 'absolute',
              bottom: menuOpen ? 'calc(50vh - 60px)' : '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ff7b00',
              border: 'none',
              color: '#1a2332',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,123,0,0.4)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {menuOpen ? '✕' : '⚙'}
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50vh',
              ...glassPanelStyle,
              transform: menuOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 150,
              overflowY: 'auto' as const,
            }}
          >
            <div style={{ height: '40px' }} />
            <ControlPanel />
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              ...viewContainerStyle(viewMode === 'full3d' ? 1 : 1),
            }}
          >
            <TerrainGenerator heights={heights} pathPoints={pathPoints} />
            {viewMode === 'full3d' && (
              <div
                style={{
                  position: 'absolute',
                  top: '70px',
                  left: '16px',
                  width: '200px',
                  height: '150px',
                  zIndex: 50,
                  animation: 'fadeInUp 0.3s ease',
                }}
              >
                <PathPlanner
                  heights={heights}
                  amplitude={terrainParams.amplitude}
                  pathPoints={pathPoints}
                  onAddPoint={handleAddPoint}
                  onUpdatePoint={handleUpdatePoint}
                  onClearPath={handleClearPath}
                  compact
                />
              </div>
            )}
          </div>

          {viewMode === 'split' && (
            <div
              style={{
                ...viewContainerStyle(1),
                display: 'flex',
                borderLeft: '1px solid #2a3b4a',
              }}
            >
              <div style={{ flex: 1 }}>
                <PathPlanner
                  heights={heights}
                  amplitude={terrainParams.amplitude}
                  pathPoints={pathPoints}
                  onAddPoint={handleAddPoint}
                  onUpdatePoint={handleUpdatePoint}
                  onClearPath={handleClearPath}
                />
              </div>
              <div
                style={{
                  width: '260px',
                  ...glassPanelStyle,
                  borderRadius: '0',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  flexShrink: 0,
                  overflowY: 'auto' as const,
                }}
              >
                <ControlPanel />
              </div>
            </div>
          )}

          {viewMode === 'full3d' && (
            <div
              style={{
                position: 'absolute',
                right: '16px',
                top: '70px',
                width: '260px',
                ...glassPanelStyle,
                zIndex: 50,
                overflowY: 'auto' as const,
                maxHeight: 'calc(100vh - 100px)',
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              <ControlPanel />
            </div>
          )}
        </>
      )}

      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background:
                toast.type === 'success'
                  ? 'rgba(42, 150, 80, 0.9)'
                  : toast.type === 'error'
                  ? 'rgba(200, 60, 60, 0.9)'
                  : 'rgba(60, 100, 150, 0.9)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeInUp 0.3s ease, fadeOut 0.3s ease 2.2s forwards',
            }}
          >
            {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : 'ℹ '}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
