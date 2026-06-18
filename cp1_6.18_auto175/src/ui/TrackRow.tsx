import { useRef } from 'react'
import { useProjectStore, type Track } from '@/stores/projectStore'
import ClipBlock from './ClipBlock'

interface Props {
  track: Track
  index: number
  pxPerSec: number
  onReorder: (from: number, to: number) => void
}

export default function TrackRow({ track, index, pxPerSec, onReorder }: Props) {
  const { renameTrack, removeTrack, reorderTrack, tracks, setPlayhead } = useProjectStore()
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const sec = Math.max(0, relX / pxPerSec)
    setPlayhead(sec, true)
  }

  return (
    <div
      className="track-row"
      data-track-index={index}
      onDragOver={(e) => { e.preventDefault() }}
      onDrop={(e) => {
        e.preventDefault()
        const fromIdxS = e.dataTransfer.getData('text/track-index')
        const fromIdx = fromIdxS ? parseInt(fromIdxS, 10) : NaN
        if (!isNaN(fromIdx) && fromIdx !== index) {
          onReorder(fromIdx, index)
        }
      }}
    >
      <div
        ref={headerRef}
        className="track-header"
        draggable={!track.isBeatTrack}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/track-index', String(index))
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDoubleClick={(e) => {
          if (e.target instanceof HTMLInputElement) return
          ;(e.currentTarget.querySelector('.track-name') as HTMLInputElement | null)?.focus()
        }}
      >
        <span className="track-color-mark" style={{ background: track.color }} />
        <input
          className="track-name"
          value={track.name}
          onChange={(e) => renameTrack(track.id, e.target.value)}
          onFocus={(e) => { e.currentTarget.select() }}
          readOnly={track.isBeatTrack}
          style={{ cursor: track.isBeatTrack ? 'default' : 'text' }}
        />
        {track.isBeatTrack && (
          <span style={{
            fontSize: 9, padding: '2px 5px', borderRadius: 3,
            background: 'rgba(80,150,255,0.2)', color: '#8CBAFF', flexShrink: 0
          }}>DRUM</span>
        )}
        {tracks.length > 1 && !track.isBeatTrack && (
          <button
            className="track-del-btn"
            title="删除轨道"
            onClick={() => removeTrack(track.id)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            ×
          </button>
        )}
      </div>
      <div
        ref={contentRef}
        className="track-content"
        onClick={handleContentClick}
      >
        {track.clips.map((c) => (
          <ClipBlock
            key={c.id}
            clip={c}
            trackColor={track.color}
            pxPerSec={pxPerSec}
            trackIndex={index}
            onDropToTrack={(toIdx) => {
              if (toIdx !== index && toIdx >= 0 && toIdx < tracks.length) {
                reorderTrack(index, toIdx)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
