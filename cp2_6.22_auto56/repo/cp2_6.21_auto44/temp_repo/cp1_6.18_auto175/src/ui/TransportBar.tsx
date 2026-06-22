import { useProjectStore } from '@/stores/projectStore'
import { formatTime } from '@/utils/wavEncoder'

export default function TransportBar() {
  const { playing, setPlaying, playhead, bpm, tracks } = useProjectStore()

  const totalDur = Math.max(0, ...tracks.flatMap((t) =>
    t.clips.map((c) => c.startAt + (c.trimEnd - c.trimStart))
  ), 8)

  return (
    <div className="transport-bar">
      <button
        className={`transport-btn ${!playing ? 'play' : ''}`}
        onClick={() => setPlaying(!playing)}
        title={playing ? '暂停' : '播放'}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="1" width="3" height="10" />
            <rect x="7" y="1" width="3" height="10" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1l9 5-9 5V1z" />
          </svg>
        )}
      </button>
      <button
        className="transport-btn"
        onClick={() => { useProjectStore.getState().setPlayhead(0, true) }}
        title="回到起点"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M10 1v10L3 6l7-5zM0 1h2v10H0z" />
        </svg>
      </button>
      <div className="time-display">
        <span style={{ color: 'var(--accent)' }}>{formatTime(playhead)}</span>
        <span style={{ color: 'var(--muted)' }}> / {formatTime(totalDur)}</span>
      </div>
      <div className="bpm-display">♩ = {bpm}</div>
    </div>
  )
}
