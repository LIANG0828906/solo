import { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp, MixerTrack } from '../context/AppContext';

interface Props {
  playbackRate: number;
  isLooping: boolean;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  playPosition: number;
  setPlayPosition: (v: number) => void;
}

export default function MixerPanel({
  isPlaying,
  setIsPlaying,
}: Props) {
  const { mixerTracks, removeTrack, updateTrack, setIsMixerMinimized } = useApp();
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState('');
  const [masterVolume, setMasterVolume] = useState(80);
  const [panDragging, setPanDragging] = useState<string | null>(null);

  const hasSolo = mixerTracks.some(t => t.solo);

  const handleExport = async () => {
    setExporting(true);
    setExportUrl('');
    try {
      const tracks = mixerTracks
        .filter(t => !t.muted && (!hasSolo || t.solo))
        .map(t => ({
          sampleId: t.sampleId,
          volume: t.volume,
          pan: t.pan,
          loopStart: t.loopStart,
          loopEnd: t.loopEnd
        }));

      const res = await axios.post('/api/mixer/export', { tracks });
      setExportUrl(res.data.data.url);
      setExporting(false);

      setTimeout(() => {
        const link = document.createElement('a');
        link.href = res.data.data.url;
        link.download = res.data.data.filename;
        link.click();
      }, 200);
    } catch (err) {
      setExporting(false);
      console.error('Export failed:', err);
    }
  };

  const handlePanMouseDown = (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setPanDragging(trackId);
  };

  useEffect(() => {
    if (!panDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const track = mixerTracks.find(t => t.id === panDragging);
      if (!track) return;
      const delta = e.movementX;
      const newPan = Math.max(-50, Math.min(50, track.pan + delta));
      updateTrack(panDragging, { pan: Math.round(newPan) });
    };

    const handleMouseUp = () => {
      setPanDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [panDragging, mixerTracks, updateTrack]);

  return (
    <div className="mixer-panel">
      <div className="mixer-header">
        <div className="mixer-title">
          <span className="mixer-icon">🎚️</span>
          <h4>混音台</h4>
          <span className="track-count">{mixerTracks.length}/6 轨</span>
        </div>
        <div className="mixer-actions">
          <button
            className={`mixer-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting || mixerTracks.length === 0}
          >
            {exporting ? '导出中...' : '⬇ 导出 WAV'}
          </button>
          <button
            className="minimize-btn"
            onClick={() => setIsMixerMinimized(true)}
            title="最小化"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="mixer-tracks">
        {mixerTracks.length === 0 ? (
          <div className="empty-mixer">
            <p>🎵 混音台为空 - 将采样添加到这里开始混音</p>
          </div>
        ) : (
          mixerTracks.map(track => (
            <MixerTrackComponent
              key={track.id}
              track={track}
              hasSolo={hasSolo}
              onRemove={() => removeTrack(track.id)}
              onUpdate={(updates) => updateTrack(track.id, updates)}
              onPanMouseDown={(e) => handlePanMouseDown(track.id, e)}
              isPanDragging={panDragging === track.id}
            />
          ))
        )}

        {mixerTracks.length < 6 && (
          <div className="master-track">
            <div className="track-label">MASTER</div>
            <div className="volume-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="volume-slider master-volume"
              />
              <span className="volume-value">{masterVolume}</span>
            </div>
            <div className="track-controls">
              <button className="ctrl-btn disabled" disabled>M</button>
              <button className="ctrl-btn disabled" disabled>S</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TrackProps {
  track: MixerTrack;
  hasSolo: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<MixerTrack>) => void;
  onPanMouseDown: (e: React.MouseEvent) => void;
  isPanDragging: boolean;
}

function MixerTrackComponent({
  track,
  hasSolo,
  onRemove,
  onUpdate,
  onPanMouseDown,
  isPanDragging
}: TrackProps) {
  const isAudible = !track.muted && (!hasSolo || track.solo);
  const panRotation = (track.pan / 50) * 135;

  return (
    <div className={`mixer-track ${isAudible ? '' : 'muted'}`}>
      <div className="track-header">
        <span className="track-name" title={track.sample?.name}>
          {track.sample?.name?.slice(0, 12) || '未知'}
        </span>
        <button className="remove-track" onClick={onRemove} title="移除轨道">
          ×
        </button>
      </div>
      <div className="track-body">
        <div className="pan-knob-container">
          <div
            className={`pan-knob ${isPanDragging ? 'dragging' : ''}`}
            onMouseDown={onPanMouseDown}
            style={{ transform: `rotate(${panRotation}deg)` }}
          >
            <div className="knob-indicator" />
          </div>
          <span className="pan-value">
            {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`}
          </span>
        </div>
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={track.volume}
            onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
            className="volume-slider"
          />
          <span className="volume-value">{track.volume}</span>
        </div>
        <div className="track-controls">
          <button
            className={`ctrl-btn mute-btn ${track.muted ? 'active' : ''}`}
            onClick={() => onUpdate({ muted: !track.muted })}
          >
            M
          </button>
          <button
            className={`ctrl-btn solo-btn ${track.solo ? 'active' : ''}`}
            onClick={() => onUpdate({ solo: !track.solo })}
          >
            S
          </button>
        </div>
      </div>
    </div>
  );
}
