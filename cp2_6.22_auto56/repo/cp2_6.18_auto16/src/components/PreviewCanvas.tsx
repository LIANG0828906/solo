import { useEffect, useRef, useState } from 'react'
import { useAnimationStore } from '@/store/animationStore'
import { animationEngine } from '@/engine/AnimationEngine'
import type { TrackProgress } from '@/types'

export function PreviewCanvas() {
  const tracks = useAnimationStore((s) => s.tracks)
  const selectedTrackId = useAnimationStore((s) => s.selectedTrackId)
  const selectTrack = useAnimationStore((s) => s.selectTrack)
  const [progresses, setProgresses] = useState<TrackProgress[]>([])
  const [fps, setFps] = useState(60)
  const engineStarted = useRef(false)

  useEffect(() => {
    if (!engineStarted.current) {
      animationEngine.start()
      engineStarted.current = true
    }
    const unsub = animationEngine.subscribe((p, f) => {
      setProgresses(p)
      setFps(f)
    })
    return () => {
      unsub()
      animationEngine.stop()
      engineStarted.current = false
    }
  }, [])

  useEffect(() => {
    animationEngine.setTracks(tracks)
  }, [tracks])

  const progressMap = new Map(progresses.map((p) => [p.trackId, p]))

  const handleBlockClick = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation()
    if (selectedTrackId === trackId) {
      selectTrack(null)
    } else {
      selectTrack(trackId)
    }
  }

  return (
    <main className="preview-area" onClick={() => selectTrack(null)}>
      <div className="fps-counter" style={{ color: fps < 55 ? '#FF6B6B' : '#888' }}>
        FPS: {fps}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: 'clamp(16px, 1.8vw, 22px)', fontWeight: 600, marginBottom: '4px' }}>
          <span style={{ background: 'linear-gradient(90deg, #00E5FF, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            动画预览区
          </span>
        </h2>
        <p style={{ fontSize: 'clamp(11px, 1vw, 13px)', color: '#888' }}>
          4 条曲线实时并行对比 · 点击方块进入编辑模式 · 运动 2s 后停顿 0.5s 往返循环
        </p>
      </div>

      <div className="preview-canvas">
        {tracks.map((track) => {
          const prog = progressMap.get(track.id)
          const percent = prog?.x ?? 0
          const opacity = prog?.opacity ?? 1
          const rawProgress = prog?.progress ?? 0
          const TRAVEL_PX = 200
          const START_OFFSET = 20
          const left = START_OFFSET + (percent / 100) * TRAVEL_PX
          const isSelected = selectedTrackId === track.id

          return (
            <div key={track.id} className="track-row">
              <div className="track-label" style={{ color: isSelected ? '#FFD700' : undefined, fontWeight: isSelected ? 600 : 400 }}>
                {track.name}
              </div>

              <div className="track-trail">
                <div className="track-trail-line" />

                <div
                  className="track-trail-dot"
                  style={{
                    left: `${left}px`,
                    background: track.color,
                    boxShadow: `0 0 6px ${track.color}60`,
                  }}
                />

                <div
                  className={`animated-block ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${left}px`,
                    background: `linear-gradient(135deg, ${track.color}, #FF6B6B55)`,
                    opacity,
                    border: isSelected ? '2px solid #FFD700' : 'none',
                  }}
                  onClick={(e) => handleBlockClick(e, track.id)}
                  title={`${track.name} - 点击编辑`}
                />
              </div>

              <div className="progress-number">
                {(rawProgress * 100).toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px',
          color: '#888',
          flexWrap: 'wrap',
        }}
      >
        {tracks.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: t.color,
              }}
            />
            <span>{t.name}</span>
            <span style={{ opacity: 0.6 }}>
              cubic-bezier({t.curve.x1}, {t.curve.y1}, {t.curve.x2}, {t.curve.y2})
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}
