import { useState, useEffect, useCallback, useRef } from 'react'
import TerrainGenerator from './TerrainGenerator'
import PathPlanner from './PathPlanner'
import {
  TerrainParams,
  PathPoint,
  ExportData,
  GRID_SIZE,
  GRID_RESOLUTION,
  generateTerrain,
  gridToWorld,
  validateExportData,
  validateTerrainParams,
  validatePathPoint,
} from './api'

type ViewMode = 'split' | 'full3d'
type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const TRANSITION_MS = 300
const ELASTIC = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

export default function App() {
  const [terrainParams, setTerrainParams] = useState<TerrainParams>({
    amplitude: 5,
    frequency: 2,
    seaLevel: 0,
  })

  const [heights, setHeights] = useState<Float32Array>(() => {
    try {
      return generateTerrain({ amplitude: 5, frequency: 2, seaLevel: 0 })
    } catch (e) {
      console.error('Initial terrain error:', e)
      return new Float32Array(GRID_RESOLUTION * GRID_RESOLUTION)
    }
  })

  const [pathPoints, setPathPoints] = useState<PathPoint[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [viewAnimating, setViewAnimating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastIdRef = useRef(0)
  const animTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      const safe = validateTerrainParams(terrainParams)
      const h = generateTerrain(safe)
      setHeights(h)
    } catch (e) {
      console.error('Terrain regen error:', e)
    }
  }, [terrainParams])

  useEffect(() => {
    const checkMobile = () => {
      try {
        setIsMobile(window.innerWidth < 768)
      } catch (_) { /* ignore */ }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (animTimeoutRef.current !== null) {
        window.clearTimeout(animTimeoutRef.current)
      }
    }
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    try {
      const id = ++toastIdRef.current
      setToasts((prev) => [...prev, { id, message, type }])
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2800)
      return () => window.clearTimeout(timer)
    } catch (_) { /* ignore */ }
  }, [])

  const handleAddPoint = useCallback(
    (point: PathPoint) => {
      try {
        if (!validatePathPoint(point)) {
          console.warn('Invalid path point rejected:', point)
          return
        }
        setPathPoints((prev) => {
          if (prev.length >= 50) {
            showToast('路径点已达上限 (50)', 'info')
            return prev
          }
          return [...prev, point]
        })
      } catch (e) {
        console.error('addPoint error:', e)
        showToast('添加路径点失败', 'error')
      }
    },
    [showToast]
  )

  const handleUpdatePoint = useCallback((index: number, point: PathPoint) => {
    try {
      if (typeof index !== 'number' || index < 0 || !validatePathPoint(point)) {
        return
      }
      setPathPoints((prev) => {
        if (index >= prev.length) return prev
        const next = [...prev]
        next[index] = point
        return next
      })
    } catch (e) {
      console.error('updatePoint error:', e)
    }
  }, [])

  const handleClearPath = useCallback(() => {
    try {
      setPathPoints([])
      showToast('路径已清空', 'info')
    } catch (e) {
      console.error('clearPath error:', e)
    }
  }, [showToast])

  const handleExport = useCallback(() => {
    if (isExporting) return
    try {
      setIsExporting(true)

      if (pathPoints.length === 0) {
        showToast('当前没有可导出的路径点', 'info')
        setIsExporting(false)
        return
      }

      const safeParams = validateTerrainParams(terrainParams)
      const safePoints: PathPoint[] = []
      for (let i = 0; i < pathPoints.length; i++) {
        const p = pathPoints[i]
        if (validatePathPoint(p)) {
          safePoints.push(p)
        }
      }

      const data: ExportData = {
        terrainParams: safeParams,
        pathPoints: safePoints,
        gridSize: GRID_SIZE,
      }

      let json: string
      try {
        json = JSON.stringify(data, null, 2)
      } catch (e) {
        console.error('JSON stringify error:', e)
        showToast('导出失败：数据序列化错误', 'error')
        setIsExporting(false)
        return
      }

      let blob: Blob
      let url: string
      try {
        blob = new Blob([json], { type: 'application/json;charset=utf-8' })
        url = URL.createObjectURL(blob)
      } catch (e) {
        console.error('Blob error:', e)
        showToast('导出失败：创建文件错误', 'error')
        setIsExporting(false)
        return
      }

      try {
        const a = document.createElement('a')
        a.href = url
        const ts = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        a.download = `terrain-path-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}.json`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        showToast(`已导出 ${safePoints.length} 个路径点`, 'success')
      } catch (e) {
        console.error('Download error:', e)
        showToast('导出失败：下载错误', 'error')
      } finally {
        try { URL.revokeObjectURL(url) } catch (_) { /* ignore */ }
        setIsExporting(false)
      }
    } catch (e) {
      console.error('Export outer error:', e)
      showToast('导出失败', 'error')
      setIsExporting(false)
    }
  }, [isExporting, terrainParams, pathPoints, showToast])

  const handleImportClick = useCallback(() => {
    if (isImporting) return
    try {
      fileInputRef.current?.click()
    } catch (e) {
      console.error('Import click error:', e)
      showToast('打开文件失败', 'error')
    }
  }, [isImporting, showToast])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''

      if (!file) return
      if (isImporting) return

      try {
        setIsImporting(true)

        if (!file.name.toLowerCase().endsWith('.json')) {
          showToast('请选择 JSON 格式文件', 'error')
          setIsImporting(false)
          return
        }

        if (file.size > 5 * 1024 * 1024) {
          showToast('文件过大 (> 5MB)', 'error')
          setIsImporting(false)
          return
        }

        const reader = new FileReader()

        reader.onerror = () => {
          showToast('文件读取失败', 'error')
          setIsImporting(false)
        }

        reader.onload = (event) => {
          try {
            const raw = event.target?.result
            if (typeof raw !== 'string') {
              showToast('文件内容无效', 'error')
              setIsImporting(false)
              return
            }

            let parsed: unknown
            try {
              parsed = JSON.parse(raw)
            } catch (parseErr) {
              console.error('JSON parse error:', parseErr)
              showToast('JSON 格式错误，请检查文件', 'error')
              setIsImporting(false)
              return
            }

            const validated = validateExportData(parsed)
            if (!validated) {
              showToast('文件格式无效或数据损坏', 'error')
              setIsImporting(false)
              return
            }

            if (!validated.pathPoints || validated.pathPoints.length === 0) {
              showToast('文件中没有有效的路径点', 'info')
            }

            try {
              setTerrainParams(validated.terrainParams)
              const newHeights = generateTerrain(validated.terrainParams)
              setHeights(newHeights)

              const newPoints: PathPoint[] = []
              for (let i = 0; i < validated.pathPoints.length; i++) {
                const p = validated.pathPoints[i]
                if (!validatePathPoint(p)) continue

                try {
                  const gx = ((p.x + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
                  const gy = ((p.z + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
                  const world = gridToWorld(gx, gy, newHeights)
                  if (validatePathPoint(world)) {
                    newPoints.push(world)
                  }
                } catch (_) { /* skip bad point */ }
              }
              setPathPoints(newPoints)

              const count = newPoints.length
              if (count > 0) {
                showToast(`导入成功：${count} 个路径点`, 'success')
              } else {
                showToast('地形参数已恢复（无有效路径点）', 'success')
              }
            } catch (applyErr) {
              console.error('Apply import error:', applyErr)
              showToast('导入时应用数据失败', 'error')
            }
          } catch (outerErr) {
            console.error('Import onload outer error:', outerErr)
            showToast('导入失败', 'error')
          } finally {
            setIsImporting(false)
          }
        }

        try {
          reader.readAsText(file, 'utf-8')
        } catch (readErr) {
          console.error('Read start error:', readErr)
          showToast('文件读取启动失败', 'error')
          setIsImporting(false)
        }
      } catch (e) {
        console.error('Import outer error:', e)
        showToast('导入失败', 'error')
        setIsImporting(false)
      }
    },
    [isImporting, showToast]
  )

  const handleParamChange = useCallback(
    (key: keyof TerrainParams, value: number) => {
      try {
        if (typeof value !== 'number' || !isFinite(value)) return
        setTerrainParams((prev) => {
          const next = { ...prev, [key]: value }
          return validateTerrainParams(next)
        })
      } catch (e) {
        console.error('paramChange error:', e)
      }
    },
    []
  )

  const toggleViewMode = useCallback(() => {
    try {
      if (viewAnimating) return
      setViewAnimating(true)
      setViewMode((prev) => (prev === 'split' ? 'full3d' : 'split'))
      if (animTimeoutRef.current !== null) {
        window.clearTimeout(animTimeoutRef.current)
      }
      animTimeoutRef.current = window.setTimeout(() => {
        setViewAnimating(false)
        animTimeoutRef.current = null
      }, TRANSITION_MS + 50)
    } catch (e) {
      console.error('toggleView error:', e)
      setViewAnimating(false)
    }
  }, [viewAnimating])

  const sliderStyle = (value: number, min: number, max: number): React.CSSProperties => ({
    width: '100%',
    accentColor: '#ff7b00',
    cursor: 'pointer',
    height: '6px',
    borderRadius: '3px',
    appearance: 'none',
    background: `linear-gradient(to right, #ff7b00 0%, #ff7b00 ${((value - min) / (max - min)) * 100}%, #3a4b5a ${((value - min) / (max - min)) * 100}%, #3a4b5a 100%)`,
  })

  const buttonStyle = (bg: string): React.CSSProperties => ({
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

  const toolbarButtonStyle = (bg: string, disabled = false): React.CSSProperties => ({
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    background: disabled ? 'rgba(60,70,80,0.5)' : bg,
    color: disabled ? '#6a7b8a' : bg === '#ff7b00' ? '#1a2332' : '#cdd9e0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    opacity: disabled ? 0.7 : 1,
  })

  const glassPanelStyle: React.CSSProperties = {
    background: 'rgba(30, 42, 58, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: isMobile ? '0' : '12px',
    overflow: 'hidden',
  }

  const mainContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    width: '100%',
    height: '100%',
    background: '#1a2332',
    position: 'relative',
    overflow: 'hidden',
  }

  const ControlPanel = () => (
    <div
      style={{
        padding: isMobile ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ color: '#cdd9e0', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
        地形参数
      </div>

      {[
        { key: 'amplitude' as const, label: '起伏幅度', min: 1, max: 10, step: 0.5 },
        { key: 'frequency' as const, label: '频率', min: 0.5, max: 5, step: 0.1 },
        { key: 'seaLevel' as const, label: '海平面偏移', min: -2, max: 2, step: 0.1 },
      ].map(({ key, label, min, max, step }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) handleParamChange(key, v)
            }}
            style={sliderStyle(terrainParams[key], min, max)}
          />
        </div>
      ))}

      <div style={{ height: '1px', background: '#2a3b4a', margin: '8px 0' }} />

      <div style={{ color: '#cdd9e0', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
        路径信息
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9aabb8', fontSize: '13px' }}>
        <span>路径点数</span>
        <span style={{ color: '#ff7b00', fontWeight: 600 }}>{pathPoints.length}</span>
      </div>

      <button
        onClick={handleClearPath}
        disabled={pathPoints.length === 0}
        className="btn-hover"
        style={{
          ...buttonStyle('#3a4b5a'),
          opacity: pathPoints.length === 0 ? 0.5 : 1,
          cursor: pathPoints.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        清空路径
      </button>

      <div style={{ height: '1px', background: '#2a3b4a', margin: '8px 0' }} />

      <button
        onClick={toggleViewMode}
        disabled={viewAnimating}
        className="btn-hover"
        style={buttonStyle('#ff7b00')}
      >
        {viewMode === 'split' ? '全屏 3D 视图' : '分屏视图'}
      </button>
    </div>
  )

  const viewScale = viewAnimating ? 0.97 : 1
  const viewOpacity = viewAnimating ? 0.7 : 1

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
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff7b00;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(255,123,0,0.4);
        }
        input[type="range"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-hover:hover:not(:disabled) { filter: brightness(1.15); transform: scale(1.02); }
        .btn-hover:active:not(:disabled) { transform: scale(0.97); transition: transform 0.1s ease; }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,123,0,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(255,123,0,0); }
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
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
        <button
          className="btn-hover"
          onClick={handleImportClick}
          disabled={isImporting}
          style={toolbarButtonStyle('rgba(30, 42, 58, 0.8)', isImporting)}
        >
          {isImporting ? '导入中...' : '导入'}
        </button>
        <button
          className="btn-hover"
          onClick={handleExport}
          disabled={isExporting || pathPoints.length === 0}
          style={{
            ...toolbarButtonStyle('#ff7b00', isExporting || pathPoints.length === 0),
            animation: pathPoints.length > 0 && !isExporting ? 'none' : undefined,
          }}
        >
          {isExporting ? '导出中...' : '导出'}
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
            boxShadow: '0 2px 10px rgba(255,123,0,0.3)',
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: menuOpen ? '60px' : '60px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                transform: `scale(${viewScale})`,
                opacity: viewOpacity,
                transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
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
                    transform: viewAnimating ? 'scale(0.9)' : 'scale(1)',
                    opacity: viewAnimating ? 0.7 : 1,
                    transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
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
                  flex: 1,
                  position: 'relative',
                  borderTop: '1px solid #2a3b4a',
                  overflow: 'hidden',
                  transform: `scale(${viewScale})`,
                  opacity: viewOpacity,
                  transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease, flex ${TRANSITION_MS}ms ${ELASTIC}`,
                }}
              >
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
            onClick={() => {
              try { setMenuOpen(!menuOpen) } catch (_) { /* ignore */ }
            }}
            style={{
              position: 'absolute',
              bottom: menuOpen ? 'calc(50vh - 60px)' : '16px',
              left: '50%',
              transform: `translateX(-50%) rotate(${menuOpen ? '45deg' : '0deg'})`,
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
              transition: `all ${TRANSITION_MS}ms ${ELASTIC}`,
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
              transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.95)',
              transformOrigin: 'bottom center',
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
              zIndex: 150,
              overflowY: 'auto',
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
              flex: viewMode === 'full3d' ? 1 : 1,
              position: 'relative',
              overflow: 'hidden',
              transform: `scale(${viewScale})`,
              opacity: viewOpacity,
              transition: `flex ${TRANSITION_MS}ms ${ELASTIC}, transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
              minWidth: 0,
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
                  transform: viewAnimating ? 'scale(0.85) translateY(-5px)' : 'scale(1) translateY(0)',
                  opacity: viewAnimating ? 0.6 : 1,
                  transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
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
                flex: 1,
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: '1px solid #2a3b4a',
                transform: `scale(${viewScale}) translateX(${viewAnimating ? '10px' : '0'})`,
                opacity: viewOpacity,
                transition: `flex ${TRANSITION_MS}ms ${ELASTIC}, transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
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
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderRight: 'none',
                  flexShrink: 0,
                  overflowY: 'auto',
                  transform: viewAnimating ? 'translateX(5px) scale(0.98)' : 'translateX(0) scale(1)',
                  opacity: viewAnimating ? 0.85 : 1,
                  transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
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
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 100px)',
                transform: viewAnimating ? 'translateX(20px) scale(0.95)' : 'translateX(0) scale(1)',
                opacity: viewAnimating ? 0.7 : 1,
                transition: `transform ${TRANSITION_MS}ms ${ELASTIC}, opacity ${TRANSITION_MS}ms ease`,
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
                  ? 'rgba(42, 150, 80, 0.92)'
                  : toast.type === 'error'
                  ? 'rgba(200, 60, 60, 0.92)'
                  : 'rgba(60, 100, 150, 0.92)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              animation: `fadeInUp 0.28s ${ELASTIC}, fadeOut 0.3s ease 2.5s forwards`,
              minWidth: '200px',
              maxWidth: '320px',
            }}
          >
            <span style={{ marginRight: '6px', fontWeight: 700 }}>
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
