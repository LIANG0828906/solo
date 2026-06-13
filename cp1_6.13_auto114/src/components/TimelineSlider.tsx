import useSimulationStore from '@/store/useSimulationStore';

export default function TimelineSlider() {
  const { playbackTime, maxTrajectoryTime, setPlaybackTime, panelCollapsed } =
    useSimulationStore();

  const max = maxTrajectoryTime || 1;

  return (
    <div
      className="absolute bottom-5 transition-all duration-300 z-[100] rounded-xl px-4 py-3"
      style={{
        left: panelCollapsed ? 70 : 330,
        right: 20,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.2)',
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[#00d4ff] text-sm font-semibold whitespace-nowrap"
          style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem' }}
        >
          {playbackTime.toFixed(2)}s
        </span>
        <input
          type="range"
          min={0}
          max={max}
          step={0.01}
          value={playbackTime}
          onChange={(e) => setPlaybackTime(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#00d4ff]"
          style={{
            background: `linear-gradient(to right, #00d4ff ${(playbackTime / max) * 100}%, rgba(255,255,255,0.15) ${(playbackTime / max) * 100}%)`,
          }}
        />
        <span className="text-white/40 text-xs whitespace-nowrap">
          {max.toFixed(2)}s
        </span>
      </div>
    </div>
  );
}
