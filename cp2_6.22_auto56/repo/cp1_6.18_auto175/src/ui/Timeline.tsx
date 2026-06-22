import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import TrackRow from './TrackRow'
import { pxToSec, secToPx } from '@/utils/dom'
import Toolbar from './Toolbar'
import TransportBar from './TransportBar'

const PX_PER_SEC = 100

export default function Timeline() {
  const {
    tracks, playhead, playheadFlash, reorderTrack, addTrack, setPlayhead, selectedClipId, selectClip
  } = useProjectStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalDur = Math.max(16, ...tracks.flatMap((t) =>
    t.clips.map((c) => c.startAt + (c.trimEnd - c.trimStart))
  ), 8) + 4
  const totalW = secToPx(totalDur, PX_PER_SEC)
  const playheadPx = secToPx(playhead, PX_PER_SEC)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const sel = useProjectStore.getState().selectedClipId
      if (!sel) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT') return
        useProjectStore.getState().removeClip(sel)
      }
      if (e.key === 'ArrowLeft') {
        const s = useProjectStore.getState()
        const clip = s.tracks.flatMap((t) => t.clips).find((c) => c.id === sel)
        if (clip) {
          const delta = e.shiftKey ? 1 : 0.1
          useProjectStore.getState().moveClip(sel, Math.max(0, clip.startAt - delta))
        }
      }
      if (e.key === 'ArrowRight') {
        const s = useProjectStore.getState()
        const clip = s.tracks.flatMap((t) => t.clips).find((c) => c.id === sel)
        if (clip) {
          const delta = e.shiftKey ? 1 : 0.1
          useProjectStore.getState().moveClip(sel, clip.startAt + delta)
        }
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        useProjectStore.getState().undo()
      }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && e.shiftKey && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        useProjectStore.getState().redo()
      }
      if (e.code === 'Space') {
        e.preventDefault()
        const s = useProjectStore.getState()
        s.setPlaying(!s.playing)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!scrollRef.current) return
    const inner = scrollRef.current.firstElementChild as HTMLElement | null
    if (!inner) return
    const rect = inner.getBoundingClientRect()
    const y = e.clientY - rect.top
    if (y > 0 && y < inner.clientHeight) {
      const relX = e.clientX - rect.left + scrollRef.current.scrollLeft
      const sec = Math.max(0, pxToSec(relX - 140, PX_PER_SEC))
      setPlayhead(sec, true)
    }
    selectClip(null)
  }

  const beatWidth = (60 / 120) * PX_PER_SEC

  return (
    <div className="timeline-area" onClick={onBackgroundClick}>
      <Toolbar />

      <div
        ref={scrollRef}
        className="tracks-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', width: `calc(140px + ${totalW}px)`, minWidth: '100%' }}>
          {/* 拍号网格标尺 */}
          <div
            style={{
              position: 'sticky', top: 0, zIndex: 12,
              height: 28,
              background: '#1A1A2E',
              borderBottom: '1px solid var(--border-color)',
              marginLeft: 140,
              pointerEvents: 'none'
            }}
          >
            {Array.from({ length: Math.ceil(totalDur / (60 / 120)) }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: i * beatWidth,
                  top: 4,
                  fontSize: 10,
                  color: i % 4 === 0 ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'monospace',
                  width: beatWidth,
                  paddingLeft: 4
                }}
              >
                {i % 4 === 0 ? String(i / 4 + 1) : ''}
              </div>
            ))}
          </div>

          {tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              pxPerSec={PX_PER_SEC}
              onReorder={reorderTrack}
            />
          ))}

          {/* 添加轨道按钮 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 0 8px 140px',
            background: '#12121a',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <button
              className="btn-secondary"
              style={{ height: 32, fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); addTrack() }}
            >
              ＋ 添加轨道
            </button>
            <span className="empty-hint" style={{ padding: '0 16px', textAlign: 'left' }}>
              双击片段编辑效果 · 左右边缘拖动修剪 · 方向键微调位置 · 空格播放/暂停
            </span>
          </div>

          {/* 播放头 */}
          <div
            className={`playhead ${playheadFlash ? 'flash' : ''}`}
            key={playheadFlash ? 'f' : 'n'}
            style={{
              left: 140 + playheadPx,
              top: 28,
              bottom: 0,
              height: 'auto',
              position: 'absolute'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid var(--accent)'
              }}
            />
          </div>

          {/* 垂直拍网格线 */}
          <div
            style={{
              position: 'absolute', top: 28, left: 140, right: 0, bottom: 0,
              pointerEvents: 'none'
            }}
          >
            {Array.from({ length: Math.ceil(totalDur / (60 / 120)) + 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  left: i * beatWidth,
                  width: 1,
                  background: i % 4 === 0 ? 'rgba(233,69,96,0.22)' : 'rgba(42,42,62,0.5)',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <TransportBar />
    </div>
  )
}
