import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { MapGenerator } from './MapModule/MapGenerator'
import type { MapRenderer as MapRendererClass } from './MapModule/MapRenderer'
import { RoutePlanner } from './ExplorationModule/RoutePlanner'
import { EncounterController } from './ExplorationModule/EncounterController'
import type { EncounterEvent, PathPoint } from '../types'
import { EncounterType } from '../types'

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#1a1a2e',
    boxSizing: 'border-box',
  },
  mapContainer: {
    flex: '0 0 70%',
    position: 'relative',
    backgroundColor: '#0D1117',
    border: '2px solid #D4AF37',
    borderRadius: 8,
    overflow: 'hidden',
    backdropFilter: 'blur(2px)',
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
    imageRendering: 'pixelated',
  },
  scaleLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: '4px 10px',
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#FFD700',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 4,
    border: '1px solid rgba(212,175,55,0.5)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1C1C2E',
    border: '1px solid #2C3E50',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 0,
  },
  controlSection: {
    padding: 12,
    borderBottom: '1px solid #2C3E50',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flexShrink: 0,
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#B8B8B8',
    fontSize: 12,
    minWidth: 56,
  },
  input: {
    flex: 1,
    padding: '6px 10px',
    backgroundColor: '#0D1117',
    border: '1px solid #3E5064',
    borderRadius: 4,
    color: '#E0E0E0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'monospace',
  },
  button: {
    padding: '8px 14px',
    backgroundColor: '#D4AF37',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    transition: 'background-color 0.15s',
  },
  buttonSecondary: {
    padding: '6px 12px',
    backgroundColor: '#2C3E50',
    color: '#E0E0E0',
    border: '1px solid #3E5064',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 12,
  },
  logHeader: {
    padding: '10px 12px',
    backgroundColor: '#15152a',
    borderBottom: '1px solid #2C3E50',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  logTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 600,
  },
  logCount: {
    color: '#888',
    fontSize: 12,
  },
  logList: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    scrollbarWidth: 'thin',
    scrollbarColor: '#D4AF37 #1a1a2e',
  },
  logItem: {
    backgroundColor: '#0D1117',
    border: '1px solid #2C3E50',
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  logItemHeader: {
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  logItemTitle: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: 600,
    flex: 1,
  },
  logItemCoords: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logItemBody: {
    padding: '0 10px 10px 10px',
  },
  logItemDesc: {
    color: '#B0B0B0',
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  logActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  actionTag: {
    padding: '3px 8px',
    backgroundColor: '#2C3E50',
    border: '1px solid #3E5064',
    borderRadius: 4,
    color: '#E0E0E0',
    fontSize: 11,
  },
  noteInput: {
    width: '100%',
    padding: '6px 10px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid #3E5064',
    borderRadius: 4,
    color: '#E0E0E0',
    fontSize: 12,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    textAlign: 'right',
    direction: 'rtl' as const,
    unicodeBidi: 'plaintext' as const,
    minHeight: 32,
  },
  coordDisplay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    padding: '4px 10px',
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#B0B0B0',
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  tooltip: {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 1000,
    padding: '6px 10px',
    backgroundColor: '#1A1A2E',
    color: '#E0E0E0',
    fontSize: 12,
    borderRadius: 4,
    borderLeft: '3px solid #FF9800',
    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
    maxWidth: 240,
    lineHeight: 1.5,
  },
  emptyHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  statsBar: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: '4px 10px',
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 11,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    pointerEvents: 'none',
    zIndex: 10,
  },
}

const EncounterIcon: React.FC<{ type: EncounterType }> = ({ type }) => {
  const colors: Record<EncounterType, string> = {
    [EncounterType.COMBAT]: '#E53935',
    [EncounterType.TRADE]: '#1976D2',
    [EncounterType.DISCOVERY]: '#2E7D32',
  }
  const icons: Record<EncounterType, string> = {
    [EncounterType.COMBAT]: '⚔',
    [EncounterType.TRADE]: '¥',
    [EncounterType.DISCOVERY]: '★',
  }
  return (
    <span style={{ ...styles.iconBadge, backgroundColor: colors[type] }}>
      {icons[type]}
    </span>
  )
}

const BorderLeft: React.FC<{ type: EncounterType; children: React.ReactNode }> = ({ type, children }) => {
  const colors: Record<EncounterType, string> = {
    [EncounterType.COMBAT]: '#E53935',
    [EncounterType.TRADE]: '#1976D2',
    [EncounterType.DISCOVERY]: '#2E7D32',
  }
  return (
    <div style={{ ...styles.logItemHeader, borderLeftColor: colors[type] }}>
      {children}
    </div>
  )
}

const MainUI: React.FC = () => {
  const store = useGameStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<MapRendererClass | null>(null)
  const [seedInput, setSeedInput] = useState(String(store.seed))
  const [sizeInput, setSizeInput] = useState(String(store.mapSize))
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [hoverEncounter, setHoverEncounter] = useState<EncounterEvent | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [coordText, setCoordText] = useState('')
  const [isViewportSmall, setIsViewportSmall] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [fps, setFps] = useState(0)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })
  const rippleIntervalRef = useRef<number | null>(null)
  const MapRendererModuleRef = useRef<typeof import('./MapModule/MapRenderer') | null>(null)

  useEffect(() => {
    const loadMapRenderer = async () => {
      const mod = await import('./MapModule/MapRenderer')
      MapRendererModuleRef.current = mod
    }
    loadMapRenderer()
  }, [])

  useEffect(() => {
    const onResize = () => {
      setIsViewportSmall(window.innerWidth < 768)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const initRenderer = useCallback(() => {
    if (!canvasRef.current || !containerRef.current || !MapRendererModuleRef.current) return
    if (rendererRef.current) {
      rendererRef.current.destroy()
    }
    const { MapRenderer } = MapRendererModuleRef.current
    const renderer = new MapRenderer({
      canvas: canvasRef.current,
      onCellClick: (x, y, canvasX, canvasY) => {
        store.addRipple(canvasX, canvasY)
        if (!store.mapData) return
        let startPoint: PathPoint
        if (store.anchorPoint) {
          startPoint = store.anchorPoint
        } else {
          startPoint = { x, y }
          store.setAnchorPoint({ x, y })
          return
        }
        const planner = new RoutePlanner(store.mapData)
        const route = planner.findPath(startPoint.x, startPoint.y, x, y)
        if (route.length > 0) {
          store.setRoute(route)
          const encounterGen = new EncounterController(store.seed + Date.now() % 10000)
          const encounters = encounterGen.generateEncounters(route)
          store.addEncounters(encounters)
          store.setAnchorPoint({ x, y })
        }
      },
      onCellHover: (x, y, cx, cy) => {
        if (!store.mapData || y === null) {
          setCoordText('')
          return
        }
        const cell = store.mapData.cells[y]?.[x]
        if (!cell) return
        const typeNames: Record<string, string> = {
          grassland: '草原',
          forest: '森林',
          mountain: '山脉',
          water: '水域',
        }
        const extra = cell.isRiver ? ' [河流]' : ''
        setCoordText(`(${x}, ${y}) ${typeNames[cell.type]}${extra}`)
        const enc = store.encounters.find((e) => e.x === x && e.y === y)
        if (enc) {
          setHoverEncounter(enc)
          setTooltipPos({
            x: cx + containerRef.current!.getBoundingClientRect().left + 12,
            y: cy + containerRef.current!.getBoundingClientRect().top + 12,
          })
          setTooltipVisible(true)
        } else {
          setHoverEncounter(null)
          setTooltipVisible(false)
        }
      },
    })
    rendererRef.current = renderer
    const rect = containerRef.current.getBoundingClientRect()
    renderer.resize(Math.floor(rect.width), Math.floor(rect.height))
    renderer.startAnimationLoop()
  }, [store])

  useEffect(() => {
    if (!MapRendererModuleRef.current) return
    initRenderer()
    const timer = setTimeout(() => {
      if (rendererRef.current) return
      initRenderer()
    }, 100)

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      rendererRef.current.resize(Math.floor(rect.width), Math.floor(rect.height))
    }
    window.addEventListener('resize', handleResize)
    const interval = setInterval(handleResize, 500)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
      if (rendererRef.current) rendererRef.current.destroy()
    }
  }, [initRenderer, MapRendererModuleRef.current])

  useEffect(() => {
    if (!MapRendererModuleRef.current || !rendererRef.current) return
    const check = setInterval(() => {
      if (rendererRef.current && !rendererRef.current.getScale) return
      if (rendererRef.current && store.mapData) {
        rendererRef.current.setMapData(store.mapData)
        const w = store.mapData.width
        const h = store.mapData.height
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const cs = 4
          const sx = rect.width / (w * cs)
          const sy = rect.height / (h * cs)
          const s = Math.min(1, Math.min(sx, sy))
          rendererRef.current.setScale(s)
          const ox = (rect.width - w * cs * s) / 2
          const oy = (rect.height - h * cs * s) / 2
          rendererRef.current.setOffset(ox, oy)
        }
        clearInterval(check)
      }
    }, 50)
    return () => clearInterval(check)
  }, [store.mapData, MapRendererModuleRef.current])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setRoute(store.route)
    }
  }, [store.route])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setEncounters(store.encounters)
    }
  }, [store.encounters])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setRipples(store.ripples)
    }
  }, [store.ripples])

  useEffect(() => {
    rippleIntervalRef.current = window.setInterval(() => {
      store.removeOldRipples()
    }, 100)
    return () => {
      if (rippleIntervalRef.current) clearInterval(rippleIntervalRef.current)
    }
  }, [store])

  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now()
      const elapsed = now - fpsRef.current.lastTime
      if (elapsed >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / elapsed))
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }
    }, 500)
    const countFrame = () => {
      fpsRef.current.frames++
      requestAnimationFrame(countFrame)
    }
    const rafId = requestAnimationFrame(countFrame)
    return () => {
      clearInterval(id)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const seed = store.seed
    const size = store.mapSize
    const run = async () => {
      await Promise.resolve()
      const t0 = performance.now()
      const generator = new MapGenerator(seed, size)
      const data = generator.generate()
      const elapsed = performance.now() - t0
      console.log(`地图生成: ${elapsed.toFixed(0)}ms`)
      store.setMapData(data)
    }
    run()
  }, [store.seed, store.mapSize, store])

  const handleGenerate = () => {
    const s = parseInt(seedInput, 10) || Date.now() % 100000
    let sz = parseInt(sizeInput, 10) || 128
    sz = Math.max(64, Math.min(256, sz))
    store.generateMap(s, sz)
    setExpandedIds(new Set())
  }

  const handleRandomSeed = () => {
    const s = Math.floor(Math.random() * 100000)
    setSeedInput(String(s))
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
    store.setSelectedEncounter(id)
  }

  const handleNoteChange = (id: string, note: string) => {
    store.updateEncounterNote(id, note)
  }

  const encounterTypeLabel: Record<EncounterType, string> = useMemo(() => ({
    [EncounterType.COMBAT]: '战斗',
    [EncounterType.TRADE]: '交易',
    [EncounterType.DISCOVERY]: '发现',
  }), [])

  const layoutStyle = isViewportSmall
    ? { ...styles.container, flexDirection: 'column' as const }
    : styles.container
  const mapStyle = isViewportSmall
    ? { ...styles.mapContainer, flex: '0 0 60%' }
    : styles.mapContainer

  return (
    <div style={layoutStyle}>
      <div ref={containerRef} style={mapStyle}>
        <canvas ref={canvasRef} style={styles.canvas} />
        <div style={styles.scaleLabel}>
          缩放: {(rendererRef.current?.getScale() ?? store.scale).toFixed(2)}x
        </div>
        <div style={styles.statsBar}>
          {fps} FPS · {store.mapSize}×{store.mapSize}
        </div>
        {coordText && <div style={styles.coordDisplay}>{coordText}</div>}
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.controlSection}>
          <div style={styles.controlRow}>
            <span style={styles.label}>种子:</span>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button onClick={handleRandomSeed} style={styles.buttonSecondary} title="随机种子">
              🎲
            </button>
          </div>
          <div style={styles.controlRow}>
            <span style={styles.label}>尺寸:</span>
            <input
              type="number"
              min={64}
              max={256}
              step={32}
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <span style={{ ...styles.label, minWidth: 'auto', fontSize: 11 }}>64-256</span>
          </div>
          <div style={{ ...styles.controlRow, gap: 8, marginTop: 2 }}>
            <button
              onClick={handleGenerate}
              style={{ ...styles.button, flex: 1 }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C9A227')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#D4AF37')}
            >
              生成新地图
            </button>
            <button
              onClick={store.exportEncountersJSON}
              style={{
                ...styles.buttonSecondary,
                opacity: store.encounters.length ? 1 : 0.5,
                cursor: store.encounters.length ? 'pointer' : 'not-allowed',
              }}
              disabled={store.encounters.length === 0}
            >
              导出JSON
            </button>
          </div>
        </div>

        <div style={styles.logHeader}>
          <span style={styles.logTitle}>📜 事件日志</span>
          <span style={styles.logCount}>{store.encounters.length} 条记录</span>
        </div>

        <div
          style={styles.logList}
          className="custom-scrollbar"
          ref={(el) => {
            if (el) {
              el.style.scrollbarWidth = 'thin'
              el.style.scrollbarColor = '#D4AF37 #1a1a2e'
            }
          }}
        >
          {store.encounters.length === 0 && (
            <div style={styles.emptyHint}>
              <p>🗺️ 点击地图设置起点</p>
              <p style={{ marginTop: 8 }}>然后再次点击目标点开始探险</p>
              <p style={{ marginTop: 8, fontSize: 11 }}>滚轮缩放 · 拖拽平移</p>
            </div>
          )}
          {store.encounters.map((enc, idx) => {
            const expanded = expandedIds.has(enc.id)
            return (
              <div
                key={enc.id}
                style={{
                  ...styles.logItem,
                  borderColor: store.selectedEncounterId === enc.id ? '#D4AF37' : undefined,
                }}
                onClick={() => toggleExpand(enc.id)}
              >
                <BorderLeft type={enc.type}>
                  <EncounterIcon type={enc.type} />
                  <span style={styles.logItemTitle}>
                    #{idx + 1} · {enc.title}
                  </span>
                  <span style={styles.logItemCoords}>
                    [{enc.x},{enc.y}]
                  </span>
                </BorderLeft>
                {expanded && (
                  <div style={styles.logItemBody} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.logItemDesc}>{enc.description}</div>
                    <div style={{ marginBottom: 6, color: '#888', fontSize: 11 }}>
                      类型: {encounterTypeLabel[enc.type]}
                    </div>
                    <div style={styles.logActions}>
                      {enc.actions.map((a, i) => (
                        <span key={i} style={styles.actionTag}>
                          {a}
                        </span>
                      ))}
                    </div>
                    <textarea
                      value={enc.note}
                      onChange={(e) => handleNoteChange(enc.id, e.target.value)}
                      placeholder="添加自定义备注..."
                      style={styles.noteInput}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {tooltipVisible && hoverEncounter && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltipPos.x,
            top: tooltipPos.y,
            opacity: store.tooltip.visible ? 1 : 1,
          }}
        >
          <div style={{ color: '#FF9800', fontWeight: 600, marginBottom: 3 }}>
            {encounterTypeLabel[hoverEncounter.type]} · {hoverEncounter.title}
          </div>
          <div>{hoverEncounter.description.slice(0, 60)}...</div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a2e;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 4px;
          border: 1px solid #1a1a2e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FFD700;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1a1a2e;
        }
        input:focus, textarea:focus, button:focus {
          outline: 1px solid #D4AF37;
          outline-offset: 1px;
        }
        @media (max-width: 768px) {
          html, body { overflow: auto !important; }
        }
      `}</style>
    </div>
  )
}

export default MainUI
