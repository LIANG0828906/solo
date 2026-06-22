import { useMemo } from 'react';
import FileUploader from './components/FileUploader';
import TrackCard from './components/TrackCard';
import MixCanvas from './components/MixCanvas';
import { useMixStore } from './store';
import { computeTotalDuration, formatTime } from './audioMixer';
import './index.css';

export default function App() {
  const {
    tracks, trackOrder, crossfadeDuration,
    setCrossfadeDuration, isPlaying, playMix, pauseMix,
    currentPlayTime, exportMix, isExporting, exportProgress,
  } = useMixStore();

  const orderedTracks = useMemo(
    () => trackOrder.map(id => tracks.find(t => t.id === id)!).filter(Boolean),
    [tracks, trackOrder]
  );

  const totalDuration = useMemo(
    () => computeTotalDuration(tracks, trackOrder, crossfadeDuration),
    [tracks, trackOrder, crossfadeDuration]
  );

  const canPlay = orderedTracks.length >= 2
    && orderedTracks.every(t => t.channelData.length > 0);
  const canExport = canPlay;

  const progressPct = totalDuration > 0
    ? Math.min(100, (currentPlayTime / totalDuration) * 100)
    : 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎚 Audio Mix Studio</h1>
        <p>上传多段音频，自动分析节奏与频段，一键生成无缝拼接混音</p>
      </header>

      <section>
        <h2 className="section-title">
          上传音频
          {tracks.length > 0 && (
            <span className="count-badge mono">{tracks.length}/6</span>
          )}
        </h2>
        <FileUploader />
      </section>

      {tracks.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 className="section-title">
            轨道列表
            <span className="count-badge mono">{tracks.length}</span>
          </h2>
          <div className="tracks-list">
            {orderedTracks.map(t => (
              <TrackCard key={t.id} track={t} />
            ))}
          </div>
          {tracks.length < 2 && (
            <div className="empty-hint">请至少上传 2 个音频，才能进行混音预览或导出</div>
          )}
        </section>
      )}

      {tracks.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 className="section-title">混音画布</h2>
          <div className="card" style={{ padding: '16px 14px 20px' }}>
            <MixCanvas />

            <div className="controls-row">
              <div className="fade-control">
                <div className="fade-label">
                  <span>交叉淡入淡出时长</span>
                  <span className="fade-value mono">{crossfadeDuration.toFixed(2)} s</span>
                </div>
                <input
                  type="range"
                  className="slider"
                  min={0.1}
                  max={1.0}
                  step={0.01}
                  value={crossfadeDuration}
                  onChange={e => setCrossfadeDuration(parseFloat(e.target.value))}
                />
              </div>

              <div className="playback-buttons">
                <span className="time-display mono">
                  {formatTime(currentPlayTime)} / {formatTime(totalDuration)}
                </span>
                <button
                  className="btn-primary btn-playback"
                  onClick={() => (isPlaying ? pauseMix() : playMix())}
                  disabled={!canPlay}
                >
                  {isPlaying ? '⏸ 暂停' : '▶ 播放混音'}
                </button>
                <button
                  className="btn-primary btn-export"
                  onClick={exportMix}
                  disabled={!canExport || isExporting}
                >
                  {isExporting ? '导出中…' : '⬇ 导出 WAV'}
                </button>
              </div>
            </div>

            {totalDuration > 0 && (
              <div className="progress-container">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="progress-times mono">
                  <span>00:00.0</span>
                  <span>总长 {formatTime(totalDuration)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {isExporting && (
        <div className="export-overlay">
          <div className="export-modal">
            <h3>正在导出混音</h3>
            <p>请稍候，正在按序合并并编码为 WAV…</p>
            <div className="export-progress-track">
              <div className="export-progress-fill" style={{ width: `${exportProgress}%` }} />
            </div>
            <div className="export-pct mono">{Math.floor(exportProgress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
