import { useRef, useState, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useStore, Track } from '@/store';
import './TrackList.css';

const WAVEFORMS = [
  { value: 'sine', label: '正弦波' },
  { value: 'square', label: '方波' },
  { value: 'sawtooth', label: '锯齿波' },
  { value: 'triangle', label: '三角波' },
] as const;

interface PanKnobProps {
  value: number;
  onChange: (value: number) => void;
}

function PanKnob({ value, onChange }: PanKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startValueRef.current = value;
      setIsDragging(true);
      e.preventDefault();

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = startYRef.current - ev.clientY;
        const newValue = Math.max(-100, Math.min(100, startValueRef.current + deltaY * 1.5));
        onChange(Math.round(newValue));
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, onChange]
  );

  const rotation = (value / 100) * 135;
  const positionLabel = value === 0 ? 'C' : value < 0 ? 'L' : 'R';
  const valueLabel = value === 0 ? 'CENTER' : `${Math.abs(value)}%`;

  return (
    <div className="pan-knob-wrapper">
      <div
        ref={knobRef}
        className={`pan-knob ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="0 0 40 40" width="36" height="36">
          <defs>
            <linearGradient id="knobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a4e" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f3460" />
              <stop offset="100%" stopColor="#e94560" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="url(#knobGradient)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="url(#activeGradient)"
            strokeWidth="3"
            strokeDasharray="80.1 106.8"
            strokeDashoffset={-53.4 + ((value + 100) / 200) * 80.1}
            transform="rotate(135 20 20)"
            strokeLinecap="round"
          />
          <circle
            cx="20"
            cy="20"
            r="12"
            fill="#1a1a2e"
            stroke="#3a3a5e"
            strokeWidth="1"
          />
          <circle
            cx="20"
            cy="20"
            r="4"
            fill={isDragging ? '#e94560' : '#3a3a5e'}
            style={{ transition: 'fill 0.2s ease' }}
          />
          <line
            x1="20"
            y1="12"
            x2="20"
            y2="6"
            stroke={isDragging ? '#ffd700' : '#e94560'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="pan-labels-row">
        <span className="pan-label-l">L</span>
        <span className="pan-label-c">{positionLabel}</span>
        <span className="pan-label-r">R</span>
      </div>
      <span className="pan-value-display">{valueLabel}</span>
    </div>
  );
}

export default function TrackList() {
  const currentProject = useStore((s) => s.currentProject);
  const selectedTrackId = useStore((s) => s.selectedTrackId);
  const setSelectedTrackId = useStore((s) => s.setSelectedTrackId);
  const addTrack = useStore((s) => s.addTrack);
  const updateTrack = useStore((s) => s.updateTrack);
  const removeTrack = useStore((s) => s.removeTrack);
  const addToast = useStore((s) => s.addToast);
  const [shakeTrackId, setShakeTrackId] = useState<string | null>(null);

  const tracks = currentProject?.tracks || [];

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: `轨道 ${tracks.length + 1}`,
      waveform: 'sine',
      volume: 80,
      pan: 0,
      effectsEnabled: false,
    };
    addTrack(newTrack);
    setSelectedTrackId(newTrack.id);
    addToast(`你添加了轨道 ${newTrack.name}`);
  };

  const handleRemoveTrack = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      removeTrack(trackId);
      addToast(`你删除了轨道 ${track.name}`);
      if (selectedTrackId === trackId && tracks.length > 1) {
        const remaining = tracks.filter((t) => t.id !== trackId);
        setSelectedTrackId(remaining[0]?.id ?? null);
      }
    }
  };

  const handleToggleEffects = (trackId: string, enabled: boolean) => {
    updateTrack(trackId, { effectsEnabled: enabled });
    const track = tracks.find((t) => t.id === trackId);
    if (enabled) {
      setShakeTrackId(trackId);
      setTimeout(() => setShakeTrackId(null), 600);
    }
    addToast(`你${enabled ? '启用' : '禁用'}了 ${track?.name} 的效果器`);
  };

  const handleTrackNameChange = (trackId: string, name: string) => {
    updateTrack(trackId, { name });
  };

  const handleWaveformChange = (trackId: string, waveform: Track['waveform']) => {
    updateTrack(trackId, { waveform });
    const track = tracks.find((t) => t.id === trackId);
    addToast(`你修改了 ${track?.name} 的波形`);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    updateTrack(trackId, { volume });
  };

  const handlePanChange = (trackId: string, pan: number) => {
    updateTrack(trackId, { pan });
  };

  return (
    <div className="track-list">
      <div className="track-list-header">
        <h3 className="track-list-title">轨道列表</h3>
        <button className="add-track-btn" onClick={handleAddTrack}>
          <Plus size={16} />
          <span>添加轨道</span>
        </button>
      </div>

      <div className="tracks-scroll">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`track-item ${selectedTrackId === track.id ? 'selected' : ''} ${
              shakeTrackId === track.id ? 'shake' : ''
            } ${track.effectsEnabled ? 'effects-active' : ''}`}
            onClick={() => setSelectedTrackId(track.id)}
          >
            <div className="track-row track-row-top">
              <input
                type="text"
                className="track-name-input"
                value={track.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleTrackNameChange(track.id, e.target.value)}
              />
              <select
                className="waveform-select"
                value={track.waveform}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  handleWaveformChange(track.id, e.target.value as Track['waveform'])
                }
              >
                {WAVEFORMS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="track-row track-row-mid">
              <div className="volume-control">
                <div className="volume-number-display">
                  <span className="volume-current-value">{track.volume}</span>
                  <span className="volume-unit">%</span>
                </div>
                <div className="volume-row">
                  <span className="control-label">音量</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleVolumeChange(track.id, parseInt(e.target.value))
                    }
                    className="volume-slider"
                    style={{ backgroundSize: `${track.volume}% 100%` }}
                  />
                </div>
              </div>

              <div className="pan-control">
                <div className="pan-header">
                  <span className="control-label">声像</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <PanKnob
                    value={track.pan}
                    onChange={(v) => handlePanChange(track.id, v)}
                  />
                </div>
              </div>
            </div>

            <div className="track-row track-row-bot">
              <label className="effects-switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={track.effectsEnabled}
                  onChange={(e) => handleToggleEffects(track.id, e.target.checked)}
                />
                <span className="effects-slider" />
                <span className="effects-label">启用效果器</span>
              </label>

              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTrack(track.id);
                }}
                disabled={tracks.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
