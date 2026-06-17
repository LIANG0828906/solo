import { useState, useRef, useEffect } from 'react'
import { useAnimationStore } from '@/store/animationStore'
import type { Keyframe } from '@/types'

const PRESET_CURVES: Array<{ name: string; x1: number; y1: number; x2: number; y2: number }> = [
  { name: 'ease', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  { name: 'ease-in', x1: 0.42, y1: 0, x2: 1, y2: 1 },
  { name: 'ease-out', x1: 0, y1: 0, x2: 0.58, y2: 1 },
  { name: 'ease-in-out', x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  { name: 'linear', x1: 0, y1: 0, x2: 1, y2: 1 },
  { name: 'elastic', x1: 0.68, y1: -0.55, x2: 0.27, y2: 1.55 },
]

export function ControlPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null)
  const tracks = useAnimationStore((s) => s.tracks)
  const selectedTrackId = useAnimationStore((s) => s.selectedTrackId)
  const selectTrack = useAnimationStore((s) => s.selectTrack)
  const updateBezier = useAnimationStore((s) => s.updateBezier)
  const setTrackDuration = useAnimationStore((s) => s.setTrackDuration)
  const addKeyframe = useAnimationStore((s) => s.addKeyframe)
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe)
  const removeKeyframe = useAnimationStore((s) => s.removeKeyframe)
  const toggleExportPanel = useAnimationStore((s) => s.toggleExportPanel)

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId)
  const timelineRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ kfId: string; startX: number; startY: number; startLeft: number; startTime: number; startPos: number } | null>(null)

  useEffect(() => {
    if (!collapsed && !selectedTrackId) {
      setCollapsed(window.innerWidth < 900)
    }
    const onResize = () => setCollapsed(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onUp = () => {
      draggingRef.current = null
    }
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !timelineRef.current || !selectedTrackId) return
      const rect = timelineRef.current.getBoundingClientRect()
      const padding = 12
      const trackWidth = rect.width - padding * 2
      const deltaX = e.clientX - draggingRef.current.startX
      const deltaY = e.clientY - draggingRef.current.startY
      const newTimeRaw = draggingRef.current.startTime + (deltaX / trackWidth) * 100
      const newPosRaw = draggingRef.current.startPos - (deltaY / 40) * 100
      const newTime = Math.max(0.1, Math.min(99.9, Math.round(newTimeRaw * 10) / 10))
      const newPos = Math.max(0, Math.min(100, Math.round(newPosRaw)))
      updateKeyframe(selectedTrackId, draggingRef.current.kfId, { time: newTime, position: newPos })
    }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
    }
  }, [selectedTrackId, updateKeyframe])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !selectedTrackId) return
    const target = e.target as HTMLElement
    if (target.classList.contains('keyframe-marker')) return
    const rect = timelineRef.current.getBoundingClientRect()
    const padding = 12
    const trackWidth = rect.width - padding * 2
    const x = e.clientX - rect.left - padding
    const time = Math.max(0.1, Math.min(99.9, Math.round((x / trackWidth) * 1000) / 10))
    addKeyframe(selectedTrackId, time)
  }

  const handleKfMouseDown = (e: React.MouseEvent, kf: Keyframe) => {
    e.stopPropagation()
    if (!timelineRef.current || !selectedTrackId) return
    const rect = timelineRef.current.getBoundingClientRect()
    const padding = 12
    const trackWidth = rect.width - padding * 2
    const leftPx = padding + (kf.time / 100) * trackWidth
    setSelectedKfId(kf.id)
    draggingRef.current = {
      kfId: kf.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: leftPx,
      startTime: kf.time,
      startPos: kf.position,
    }
  }

  const handleKfDoubleClick = (e: React.MouseEvent, kfId: string) => {
    e.stopPropagation()
    if (!selectedTrackId) return
    removeKeyframe(selectedTrackId, kfId)
    if (selectedKfId === kfId) setSelectedKfId(null)
  }

  if (collapsed) {
    return (
      <aside className="control-panel collapsed">
        <div className="collapsed-icon" title="展开面板" onClick={() => setCollapsed(false)}>
          ⚙
        </div>
      </aside>
    )
  }

  const selectedKf = selectedTrack?.keyframes.find((k) => k.id === selectedKfId)

  return (
    <aside className="control-panel">
      <div className="panel-header">
        <h1 className="panel-title">MotionLab</h1>
        <button className="code-exporter-close" title="折叠面板" onClick={() => setCollapsed(true)}>
          ×
        </button>
      </div>

      <div className="section">
        <div className="section-title">选择曲线</div>
        <select
          className="curve-select"
          value={selectedTrackId ?? ''}
          onChange={(e) => selectTrack(e.target.value || null)}
        >
          <option value="">-- 选择编辑对象 --</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTrack ? (
        <>
          <div className="section">
            <div className="section-title">预设曲线</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PRESET_CURVES.map((p) => (
                <button
                  key={p.name}
                  className="btn btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() =>
                    updateBezier(selectedTrack.id, {
                      x1: p.x1,
                      y1: p.y1,
                      x2: p.x2,
                      y2: p.y2,
                    })
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">贝塞尔参数</div>
            <div className="form-row-inline">
              <div className="form-row">
                <label className="form-label">X1</label>
                <input
                  type="number"
                  className="input-field"
                  min="-1"
                  max="2"
                  step="0.01"
                  value={selectedTrack.curve.x1}
                  onChange={(e) =>
                    updateBezier(selectedTrack.id, {
                      ...selectedTrack.curve,
                      x1: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">Y1</label>
                <input
                  type="number"
                  className="input-field"
                  min="-1"
                  max="2"
                  step="0.01"
                  value={selectedTrack.curve.y1}
                  onChange={(e) =>
                    updateBezier(selectedTrack.id, {
                      ...selectedTrack.curve,
                      y1: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">X2</label>
                <input
                  type="number"
                  className="input-field"
                  min="-1"
                  max="2"
                  step="0.01"
                  value={selectedTrack.curve.x2}
                  onChange={(e) =>
                    updateBezier(selectedTrack.id, {
                      ...selectedTrack.curve,
                      x2: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">Y2</label>
                <input
                  type="number"
                  className="input-field"
                  min="-1"
                  max="2"
                  step="0.01"
                  value={selectedTrack.curve.y2}
                  onChange={(e) =>
                    updateBezier(selectedTrack.id, {
                      ...selectedTrack.curve,
                      y2: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">动画时长 (ms)</div>
            <div className="form-row">
              <input
                type="range"
                className="slider"
                min="200"
                max="5000"
                step="100"
                value={selectedTrack.duration}
                onChange={(e) => setTrackDuration(selectedTrack.id, parseInt(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '11px', fontFamily: 'Consolas, monospace' }}>
                <span>200</span>
                <span style={{ color: '#00E5FF' }}>{selectedTrack.duration}ms</span>
                <span>5000</span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">关键帧时间轴</div>
            <div
              ref={timelineRef}
              className="timeline"
              onClick={handleTimelineClick}
              style={{ userSelect: 'none' }}
            >
              <div className="timeline-track" />
              {selectedTrack.keyframes.map((kf) => {
                const padding = 12
                const trackWidth = 300 - padding * 2
                const left = padding + (kf.time / 100) * trackWidth
                const bottom = 30 - (kf.position / 100) * 24
                return (
                  <div
                    key={kf.id}
                    className={`keyframe-marker ${selectedKfId === kf.id ? 'selected' : ''}`}
                    style={{
                      left: `${left}px`,
                      top: `${bottom}px`,
                    }}
                    onMouseDown={(e) => handleKfMouseDown(e, kf)}
                    onDoubleClick={(e) => handleKfDoubleClick(e, kf.id)}
                  />
                )
              })}
            </div>
            <div className="timeline-labels">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
              点击时间轴添加关键帧 · 拖动调整 · 双击删除
            </div>
          </div>

          {selectedKf ? (
            <div className="section">
              <div className="section-title">关键帧编辑 {selectedKf.time.toFixed(1)}%</div>
              <div className="kf-editor-grid">
                <div className="form-row">
                  <label className="form-label">时间 (%)</label>
                  <input
                    type="number"
                    className="input-field"
                    min="0.1"
                    max="99.9"
                    step="0.1"
                    value={selectedKf.time}
                    onChange={(e) =>
                      updateKeyframe(selectedTrack.id, selectedKf.id, {
                        time: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">位置 (%)</label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    max="100"
                    step="1"
                    value={selectedKf.position}
                    onChange={(e) =>
                      updateKeyframe(selectedTrack.id, selectedKf.id, {
                        position: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">透明度</label>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedKf.opacity}
                    onChange={(e) =>
                      updateKeyframe(selectedTrack.id, selectedKf.id, {
                        opacity: parseFloat(e.target.value),
                      })
                    }
                  />
                  <div style={{ textAlign: 'center', color: '#888', fontSize: '11px', fontFamily: 'Consolas, monospace' }}>
                    {selectedKf.opacity.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-hint">
              选中菱形标记可编辑该关键帧
            </div>
          )}

          <button className="btn btn-primary" onClick={() => toggleExportPanel(true)}>
            ✨ Export CSS
          </button>
        </>
      ) : (
        <div className="empty-hint" style={{ padding: '20px', lineHeight: 1.8 }}>
          👈 点击右侧预览区域中的方块，
          <br />
          或使用上方下拉选择编辑对象
        </div>
      )}
    </aside>
  )
}
