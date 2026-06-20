import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { GradientStop, GradientType, HistoryItem } from './types'
import { recommendPalettes, paletteToGradientStops, type Palette } from './utils/paletteRecommender'
import GradientEditor from './components/GradientEditor'
import PreviewPanel from './components/PreviewPanel'

const DEFAULT_STOPS: GradientStop[] = [
  { id: 'stop-default-1', color: '#6366F1', position: 0 },
  { id: 'stop-default-2', color: '#EC4899', position: 100 },
]

const MAX_HISTORY = 10

const genId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const configsEqual = (a: { stops: GradientStop[]; type: GradientType; angle: number }, b: { stops: GradientStop[]; type: GradientType; angle: number }): boolean => {
  if (a.type !== b.type || a.angle !== b.angle || a.stops.length !== b.stops.length) return false
  return a.stops.every((s, i) =>
    s.color.toLowerCase() === b.stops[i].color.toLowerCase() &&
    Math.abs(s.position - b.stops[i].position) < 0.5
  )
}

const App: React.FC = () => {
  const [type, setType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<GradientStop[]>(DEFAULT_STOPS)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [animatingStops, setAnimatingStops] = useState(false)

  useEffect(() => {
    const t0 = performance.now()
    const results = recommendPalettes(stops, 5)
    const elapsed = performance.now() - t0
    if (elapsed > 80) {
      console.warn(`[paletteRecommender] 耗时 ${elapsed.toFixed(1)}ms，接近阈值`)
    }
    setPalettes(results)
  }, [stops])

  const addToHistory = useCallback(() => {
    setHistory(prev => {
      const lastItem = prev.find(h => !h.favorite) || prev[0]
      if (lastItem && configsEqual(lastItem.config, { stops, type, angle })) {
        return prev
      }
      const newItem: HistoryItem = {
        id: genId(),
        timestamp: Date.now(),
        config: { type, angle, stops: stops.map(s => ({ ...s })) },
        favorite: false,
      }
      let next: HistoryItem[]
      const favs = prev.filter(h => h.favorite)
      const nonFavs = prev.filter(h => !h.favorite)
      nonFavs.unshift(newItem)
      while (nonFavs.length > MAX_HISTORY) {
        nonFavs.shift()
      }
      next = [...favs, ...nonFavs]
      return next
    })
  }, [stops, type, angle])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      addToHistory()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [stops, type, angle, addToHistory])

  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev =>
      prev.map(h => (h.id === id ? { ...h, favorite: !h.favorite } : h))
    )
  }, [])

  const applyHistory = useCallback((item: HistoryItem) => {
    setType(item.config.type)
    setAngle(item.config.angle)
    setStops(item.config.stops.map(s => ({ ...s, id: `${s.id}-${genId()}` })))
  }, [])

  const applyPalette = useCallback((palette: Palette) => {
    setAnimatingStops(true)
    const newStops = paletteToGradientStops(palette, stops.length)
    const mappedStops: GradientStop[] = stops.map((s, i) => ({
      ...s,
      color: newStops[i]?.color ?? s.color,
    }))
    setStops(mappedStops)
    window.setTimeout(() => setAnimatingStops(false), 400)
  }, [stops])

  const handleCssChange = useCallback((css: string) => {
    try {
      const linMatch = css.match(/linear-gradient\(\s*(-?\d+)deg\s*,\s*([^)]+)\)/i)
      const radMatch = css.match(/radial-gradient\(\s*circle\s*,\s*([^)]+)\)/i)

      if (linMatch) {
        setType('linear')
        setAngle(Number(linMatch[1]) || 0)
        const stopsStr = linMatch[2]
        const parsed = parseColorStops(stopsStr)
        if (parsed) setStops(parsed)
      } else if (radMatch) {
        setType('radial')
        const parsed = parseColorStops(radMatch[1])
        if (parsed) setStops(parsed)
      }
    } catch {
      // 忽略无效输入
    }
  }, [])

  const buildGradientStyle = useCallback((cfg: { type: GradientType; angle: number; stops: GradientStop[] }) => {
    const sorted = [...cfg.stops].sort((a, b) => a.position - b.position)
    const parts = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
    return cfg.type === 'linear'
      ? `linear-gradient(${cfg.angle}deg, ${parts})`
      : `radial-gradient(circle, ${parts})`
  }, [])

  const favoriteItems = useMemo(() => history.filter(h => h.favorite), [history])
  const recentItems = useMemo(() => history.filter(h => !h.favorite), [history])
  const activeConfigStr = useMemo(() => `${type}-${angle}-${stops.map(s => s.color + s.position).join('|')}`, [type, angle, stops])

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">渐变调色板探索器</h1>
        <button className="mobile-toggle" onClick={() => setEditorCollapsed(c => !c)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          {editorCollapsed ? '展开编辑器' : '收起编辑器'}
        </button>
      </header>

      <div className="main-layout">
        <aside className={`editor-section ${editorCollapsed ? 'collapsed' : ''}`}>
          <GradientEditor
            type={type}
            angle={angle}
            stops={stops}
            onTypeChange={setType}
            onAngleChange={setAngle}
            onStopsChange={setStops}
          />
        </aside>

        <main className="preview-section">
          <PreviewPanel
            type={type}
            angle={angle}
            stops={animatingStops ? stops : stops}
            onCssChange={handleCssChange}
          />

          <section className="palette-section">
            <div className="section-title" style={{ marginBottom: 0 }}>
              配色推荐
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8, fontWeight: 400, textTransform: 'none' }}>
                点击方案自动应用到色标
              </span>
            </div>
            <div className="palette-list">
              {palettes.map(palette => (
                <div
                  key={palette.id}
                  className="palette-card"
                  onClick={() => applyPalette(palette)}
                  title={`应用「${palette.name}」`}
                >
                  <div className="palette-name">{palette.name}</div>
                  <div className="palette-colors">
                    <div className="palette-swatch" style={{ background: palette.primary }}>
                      <div className="color-tooltip">{palette.primary}</div>
                    </div>
                    <div className="palette-swatch" style={{ background: palette.secondary }}>
                      <div className="color-tooltip">{palette.secondary}</div>
                    </div>
                    <div className="palette-swatch" style={{ background: palette.accent }}>
                      <div className="color-tooltip">{palette.accent}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="history-section">
            {favoriteItems.length > 0 && (
              <div className="favorites-section">
                <div className="history-row-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  我的收藏 ({favoriteItems.length})
                </div>
                <div className="history-scroll">
                  {favoriteItems.map(item => (
                    <HistoryThumb
                      key={item.id}
                      item={item}
                      isActive={activeConfigStr === `${item.config.type}-${item.config.angle}-${item.config.stops.map(s => s.color + s.position).join('|')}`}
                      onApply={() => applyHistory(item)}
                      onToggleFav={() => toggleFavorite(item.id)}
                      buildStyle={buildGradientStyle}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="history-row-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                最近使用 ({recentItems.length}/{MAX_HISTORY})
              </div>
              {recentItems.length === 0 ? (
                <div className="empty-history">暂无历史记录，调整渐变后会自动保存</div>
              ) : (
                <div className="history-scroll">
                  {recentItems.map(item => (
                    <HistoryThumb
                      key={item.id}
                      item={item}
                      isActive={activeConfigStr === `${item.config.type}-${item.config.angle}-${item.config.stops.map(s => s.color + s.position).join('|')}`}
                      onApply={() => applyHistory(item)}
                      onToggleFav={() => toggleFavorite(item.id)}
                      buildStyle={buildGradientStyle}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

interface HistoryThumbProps {
  item: HistoryItem
  isActive: boolean
  onApply: () => void
  onToggleFav: () => void
  buildStyle: (cfg: { type: GradientType; angle: number; stops: GradientStop[] }) => string
}

const HistoryThumb: React.FC<HistoryThumbProps> = ({ item, isActive, onApply, onToggleFav, buildStyle }) => (
  <div
    className={`history-thumb ${isActive ? 'active' : ''}`}
    style={{ background: buildStyle(item.config) }}
    onClick={onApply}
    title={`${item.config.type} · ${item.config.angle}° · ${item.config.stops.length}个色标`}
  >
    <button
      className={`fav-btn ${item.favorite ? 'favorited' : ''}`}
      onClick={e => { e.stopPropagation(); onToggleFav() }}
      title={item.favorite ? '取消收藏' : '收藏'}
    >
      <svg className="heart-icon heart-empty" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <svg className="heart-icon heart-filled" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  </div>
)

function parseColorStops(str: string): GradientStop[] | null {
  const parts = str.split(/,(?![^()]*\))/).map(p => p.trim())
  const result: GradientStop[] = []
  for (const part of parts) {
    const m = part.match(/(#[0-9a-f]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|\w+)\s+(\d*\.?\d+)%?/i)
    if (m) {
      result.push({
        id: genId(),
        color: m[1].startsWith('#') ? m[1].toUpperCase() : m[1],
        position: Number(m[2]),
      })
    }
  }
  return result.length >= 2 ? result : null
}

export default App
