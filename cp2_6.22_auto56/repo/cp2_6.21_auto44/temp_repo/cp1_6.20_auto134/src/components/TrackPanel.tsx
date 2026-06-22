import { useStore } from '@/store'
import { ChevronLeft, ChevronRight, Plus, Trash2, Volume2, VolumeX, Settings2 } from 'lucide-react'

export default function TrackPanel() {
  const currentProject = useStore((s) => s.currentProject)
  const trackPanelOpen = useStore((s) => s.trackPanelOpen)
  const setTrackPanelOpen = useStore((s) => s.setTrackPanelOpen)
  const selectedTrackId = useStore((s) => s.selectedTrackId)
  const setSelectedTrackId = useStore((s) => s.setSelectedTrackId)
  const updateTrack = useStore((s) => s.updateTrack)
  const addTrack = useStore((s) => s.addTrack)
  const removeTrack = useStore((s) => s.removeTrack)

  const tracks = currentProject?.tracks ?? []

  return (
    <div
      className="bg-panel flex flex-col border-l border-white/5 transition-all duration-200 ease-in-out"
      style={{ width: trackPanelOpen ? 280 : 44 }}
    >
      <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
        {trackPanelOpen && <span className="text-fg text-sm font-semibold flex items-center gap-1.5"><Settings2 size={14} />Tracks</span>}
        <button
          onClick={() => setTrackPanelOpen(!trackPanelOpen)}
          className="text-muted hover:text-fg p-1 rounded transition-colors"
        >
          {trackPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`border-b border-white/5 transition-colors ${
              selectedTrackId === track.id ? 'bg-panelHover' : ''
            }`}
            style={{ borderLeftWidth: 3, borderLeftColor: track.color }}
            onClick={() => setSelectedTrackId(track.id)}
          >
            {!trackPanelOpen ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
                <button
                  onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }) }}
                  className="text-muted hover:text-fg"
                >
                  {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: track.color }} />
                  <input
                    value={track.name}
                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-fg text-sm font-medium outline-none border-b border-transparent focus:border-accent flex-1 px-0.5"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }) }}
                      className={`p-1 rounded transition-colors ${track.muted ? 'text-accent' : 'text-muted hover:text-fg'}`}
                    >
                      {track.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { solo: !track.solo }) }}
                      className={`w-5 h-5 text-[10px] font-bold rounded transition-colors ${
                        track.solo ? 'bg-accent text-white' : 'text-muted hover:text-fg'
                      }`}
                    >
                      S
                    </button>
                    {tracks.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeTrack(track.id) }}
                        className="text-muted hover:text-accent p-1 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>Vol</span><span>{track.volume}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={track.volume}
                    onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>Pan</span><span>{track.pan.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min={-1} max={1} step={0.1} value={track.pan}
                    onChange={(e) => updateTrack(track.id, { pan: Number(e.target.value) })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {trackPanelOpen && (
        <div className="p-2 border-t border-white/5">
          <button
            onClick={addTrack}
            disabled={tracks.length >= 4}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-muted hover:text-fg bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={13} />Add Track
          </button>
        </div>
      )}
    </div>
  )
}
