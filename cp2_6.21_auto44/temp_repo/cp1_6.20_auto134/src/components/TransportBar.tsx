import { Play, Pause, Square, SkipBack, SkipForward } from "lucide-react"

interface TransportBarProps {
  isPlaying: boolean
  onTogglePlay: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  playheadTick: number
  onSeek: (tick: number) => void
  totalBeats: number
}

export default function TransportBar({
  isPlaying,
  onTogglePlay,
  bpm,
  onBpmChange,
  playheadTick,
  onSeek,
  totalBeats,
}: TransportBarProps) {
  const currentBeat = Math.floor(playheadTick) + 1

  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#16213e] px-6 py-3 shadow-lg">
      <button
        onClick={() => onSeek(0)}
        className="transition-transform hover:scale-105"
      >
        <Square size={20} />
      </button>

      <button
        onClick={() => onSeek(Math.max(0, playheadTick - 1))}
        className="transition-transform hover:scale-105"
      >
        <SkipBack size={20} />
      </button>

      <button
        onClick={onTogglePlay}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 ${
          isPlaying
            ? "bg-[#e94560] shadow-[0_0_16px_#e9456080] animate-[spin_4s_linear_infinite]"
            : "bg-muted"
        }`}
        style={
          isPlaying
            ? { animationDuration: `${60 / bpm}s` }
            : undefined
        }
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <button
        onClick={() => onSeek(Math.min(totalBeats - 1, playheadTick + 1))}
        className="transition-transform hover:scale-105"
      >
        <SkipForward size={20} />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">BPM</span>
        <input
          type="range"
          min={30}
          max={240}
          step={1}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-24 accent-[#e94560]"
        />
        <span className="font-mono text-sm w-8 text-center">{bpm}</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm">
          Beat {currentBeat}/{totalBeats}
        </span>
        <button
          onClick={() => onSeek(Math.max(0, playheadTick - 1))}
          className="ml-1 transition-transform hover:scale-105 text-xs px-1 border border-gray-600 rounded"
        >
          −
        </button>
        <button
          onClick={() => onSeek(Math.min(totalBeats - 1, playheadTick + 1))}
          className="transition-transform hover:scale-105 text-xs px-1 border border-gray-600 rounded"
        >
          +
        </button>
      </div>
    </div>
  )
}
