import { TrackType, TRACK_COLORS, TRACK_LABELS, WaveformType, TRACK_WAVEFORMS } from '../types';
import { WaveformCanvas } from './WaveformCanvas';

interface TrackRowState {
  type: TrackType;
  enabled: boolean;
  volume: number;
  lastBeat: number;
}

interface TrackPanelProps {
  tracks: TrackRowState[];
  onToggle: (type: TrackType) => void;
  onVolumeChange: (type: TrackType, volume: number) => void;
}

export function TrackPanel({ tracks, onToggle, onVolumeChange }: TrackPanelProps) {
  return (
    <div className="track-panel">
      <div className="track-panel-title font-display">音轨控制</div>
      {tracks.map((t) => {
        const color = TRACK_COLORS[t.type];
        const enabledClass = t.enabled ? `enabled-${t.type}` : '';
        return (
          <div key={t.type} className="track-row">
            <div className="track-header">
              <button
                className={`track-toggle ${enabledClass}`}
                onClick={() => onToggle(t.type)}
                title={`${TRACK_LABELS[t.type]} 开关`}
              >
                <div
                  className="track-toggle-icon"
                  style={{ opacity: t.enabled ? 1 : 0.3 }}
                />
              </button>
              <div className="track-name" style={{ color: t.enabled ? color : '#535C68' }}>
                {TRACK_LABELS[t.type]}
              </div>
              <div className="track-vol-label">{Math.round(t.volume * 100)}%</div>
            </div>

            <div className="volume-slider-wrapper">
              <div
                className="volume-slider-track"
                style={{
                  background: `linear-gradient(90deg, rgba(255,255,255,0.18) 0%, ${color} ${t.volume * 100}%, rgba(255,255,255,0.08) ${t.volume * 100}%)`,
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={t.volume}
                onChange={(e) => onVolumeChange(t.type, parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            <WaveformCanvas
              track={t.type}
              waveform={TRACK_WAVEFORMS[t.type] as WaveformType}
              enabled={t.enabled}
              active={performance.now() - t.lastBeat < 200}
              beatCount={Math.floor(t.lastBeat / 100)}
            />
          </div>
        );
      })}
    </div>
  );
}
