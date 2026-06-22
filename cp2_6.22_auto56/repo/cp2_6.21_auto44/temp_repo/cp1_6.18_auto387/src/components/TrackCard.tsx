import { useEffect, useRef, useState } from 'react';
import { renderWaveformThumbnail } from '../waveformRenderer';
import { getBandColor, getBandLabel } from '../waveformRenderer';
import { useMixStore } from '../store';
import type { Track } from '../types';

interface Props {
  track: Track;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDur(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TrackCard({ track }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<{ ctx: AudioContext | null; src: AudioBufferSourceNode | null; gain: GainNode | null }>({
    ctx: null, src: null, gain: null,
  });
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const removeTrack = useMixStore(s => s.removeTrack);
  const setTrackVolume = useMixStore(s => s.setTrackVolume);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (track.channelData.length === 0) return;
    const mono = track.channelData[0];
    if (!mono || mono.length === 0) return;
    try {
      renderWaveformThumbnail(canvasRef.current, mono, 320, 60, ['#64FFDA', '#B388FF']);
    } catch {
      /* noop */
    }
  }, [track.channelData, track.id]);

  const togglePreview = () => {
    const p = previewRef.current;
    if (previewPlaying && p.src) {
      try { p.src.onended = null; p.src.stop(); } catch { /* noop */ }
      p.src = null;
      setPreviewPlaying(false);
      return;
    }
    if (track.channelData.length === 0) return;
    try {
      if (!p.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        p.ctx = new Ctor();
      }
      const ctx = p.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const buf = ctx.createBuffer(track.channels, track.channelData[0].length, track.sampleRate);
      for (let c = 0; c < track.channels; c++) {
        buf.copyToChannel(track.channelData[c] || track.channelData[0], c);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = track.volume;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.onended = () => {
        if (previewRef.current.src === src) setPreviewPlaying(false);
      };
      src.start(0);
      p.src = src;
      p.gain = gain;
      setPreviewPlaying(true);
    } catch (e) {
      console.error(e);
    }
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setTrackVolume(track.id, v);
    const p = previewRef.current;
    if (p.gain && p.ctx) {
      p.gain.gain.setTargetAtTime(v, p.ctx.currentTime, 0.01);
    }
  };

  const isAnalyzing = track.analysisStatus === 'analyzing' || track.analysisStatus === 'pending';

  return (
    <div className="track-card">
      <div className="track-card-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="track-name" title={track.name}>{track.name}</p>
          <div className="track-meta">
            <span className="badge badge-pending mono">{formatDur(track.duration)}</span>
            <span className="badge badge-pending mono">{formatBytes(track.size)}</span>
            {isAnalyzing ? (
              <span className="badge badge-pending">
                <span className="analyzing-spinner" />分析中…
              </span>
            ) : track.analysisStatus === 'error' ? (
              <span className="badge badge-band low" style={{ background: 'rgba(255,107,107,0.18)' }}>
                分析失败
              </span>
            ) : (
              <>
                <span className="badge badge-bpm mono">{track.bpm} BPM</span>
                <span
                  className={`badge badge-band ${track.dominantBand || ''}`}
                  style={{
                    background: `color-mix(in srgb, ${getBandColor(track.dominantBand)} 22%, transparent)`,
                    color: getBandColor(track.dominantBand),
                  }}
                >
                  {getBandLabel(track.dominantBand)}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          className="btn-icon"
          title="移除音频"
          onClick={() => {
            const p = previewRef.current;
            if (p.src) { try { p.src.onended = null; p.src.stop(); } catch { /* noop */ } }
            removeTrack(track.id);
          }}
          aria-label="移除"
        >
          ✕
        </button>
      </div>

      <div className="waveform-container">
        <canvas ref={canvasRef} width={320} height={60} />
      </div>

      <div className="track-controls">
        <button
          className="btn-play"
          title={previewPlaying ? '停止预览' : '预览播放'}
          onClick={togglePreview}
          aria-label={previewPlaying ? '停止预览' : '预览播放'}
          disabled={track.channelData.length === 0}
        >
          {previewPlaying ? '■' : '▶'}
        </button>
        <div className="volume-wrap">
          <div className="volume-label">
            <span>音量</span>
            <span className="volume-value mono">{Math.round(track.volume * 100)}%</span>
          </div>
          <input
            type="range"
            className="slider"
            min={0}
            max={1}
            step={0.01}
            value={track.volume}
            onChange={onVolume}
          />
        </div>
      </div>
    </div>
  );
}

export default TrackCard;
