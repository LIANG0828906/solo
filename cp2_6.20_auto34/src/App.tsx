import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMixerStore } from './stores/mixerStore';
import { audioEngine } from './utils/audioEngine';
import { apiService } from './services/apiService';
import AudioTrack from './components/AudioTrack';
import EffectPanel from './components/EffectPanel';
import VUMeter from './components/VUMeter';

const MasterOutput: React.FC = () => {
  const { masterVolume, setMasterVolume } = useMixerStore();
  const [vuLevels, setVuLevels] = useState({ left: 0, right: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const updateVU = () => {
      const level = audioEngine.getVULevel();
      const stereoSpread = 0.05;
      const jitter = Math.random() * 0.1;
      setVuLevels({
        left: Math.max(0, Math.min(1, level - stereoSpread + jitter)),
        right: Math.max(0, Math.min(1, level + stereoSpread - jitter)),
      });
      animationRef.current = requestAnimationFrame(updateVU);
    };
    animationRef.current = requestAnimationFrame(updateVU);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const volumeToDb = (vol: number) => {
    if (vol <= 0) return -Infinity;
    return 20 * Math.log10(vol);
  };

  return (
    <div className="master-output">
      <h3 className="panel-title">主输出</h3>
      <div className="master-controls">
        <div className="vu-meters">
          <VUMeter
            levelLeft={vuLevels.left}
            levelRight={vuLevels.right}
            width={40}
            height={150}
          />
        </div>
        <div className="master-fader">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="vertical-slider"
          />
          <span className="db-value">
            {masterVolume === 0 ? '-∞' : volumeToDb(masterVolume).toFixed(1)} dB
          </span>
        </div>
      </div>
    </div>
  );
};

const ExportProgressRing: React.FC<{ progress: number; visible: boolean }> = ({ progress, visible }) => {
  if (!visible) return null;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const gradientId = `progress-gradient-${Date.now()}`;

  return (
    <div className="export-overlay">
      <div className="progress-ring-container">
        <svg className="progress-ring" width="140" height="140">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d2ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
          </defs>
          <circle
            className="progress-ring-bg"
            cx="70"
            cy="70"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            className="progress-ring-fg"
            cx="70"
            cy="70"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="progress-text">
          <span className="progress-percent">{Math.round(progress)}%</span>
          <span className="progress-label">导出中...</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { tracks, playing, bpm, setPlaying, setBpm, addTrack, currentTime, setCurrentTime } = useMixerStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [effectPanelOpen, setEffectPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playheadRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (playing) {
      startTimeRef.current = audioEngine.getContext().currentTime - currentTime;
      const updatePlayhead = () => {
        const ctx = audioEngine.getContext();
        const newTime = ctx.currentTime - startTimeRef.current;
        setCurrentTime(newTime);
        playheadRef.current = requestAnimationFrame(updatePlayhead);
      };
      playheadRef.current = requestAnimationFrame(updatePlayhead);
    } else {
      if (playheadRef.current) {
        cancelAnimationFrame(playheadRef.current);
      }
    }
    return () => {
      if (playheadRef.current) {
        cancelAnimationFrame(playheadRef.current);
      }
    };
  }, [playing, setCurrentTime]);

  const togglePlay = useCallback(() => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    if (newPlaying) {
      audioEngine.resume();
      tracks.forEach((track) => {
        if (track.audioBuffer && !track.muted) {
          const source = audioEngine.getContext().createBufferSource();
          source.buffer = track.audioBuffer;
          const gainNode = audioEngine.getContext().createGain();
          gainNode.gain.value = track.volume;

          let lastNode: AudioNode = gainNode;
          track.effects.forEach((effect) => {
            if (effect.type === 'Echo') {
              const echo = audioEngine.createEchoNode(
                effect.params.delayTime,
                effect.params.feedback,
                effect.params.mix
              );
              lastNode.connect(echo.input);
              lastNode = echo.output;
            } else if (effect.type === 'Compressor') {
              const compressor = audioEngine.createCompressorNode(
                effect.params.threshold,
                effect.params.ratio,
                effect.params.attack,
                effect.params.release
              );
              lastNode.connect(compressor);
              lastNode = compressor;
            } else if (effect.type === 'Filter') {
              const filter = audioEngine.createFilterNode(
                'lowpass',
                effect.params.frequency,
                effect.params.Q,
                effect.params.gain
              );
              lastNode.connect(filter);
              lastNode = filter;
            }
          });

          const masterBus = audioEngine.getMasterBus();
          lastNode.connect(masterBus.gain);
          source.connect(gainNode);

          const ctx = audioEngine.getContext();
          const offset = Math.max(0, currentTime - track.startTime);
          if (offset < track.audioBuffer.duration) {
            source.start(ctx.currentTime, offset);
          }
        }
      });
    } else {
      audioEngine.suspend();
    }
  }, [playing, setPlaying, tracks, currentTime]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(parseInt(e.target.value));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioEngine.decodeAudio(arrayBuffer);
          addTrack({
            name: file.name.replace(/\.[^/.]+$/, ''),
            audioBuffer,
            startTime: 0,
          });
        } catch (error) {
          console.error('Failed to load audio file:', error);
        }
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const interval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);

      const exportTracks = tracks.map((track) => ({
        file_id: track.id,
        name: track.name,
        position: track.startTime,
        volume: track.volume,
        effects: track.effects.map((e) => ({
          type: e.type,
          params: e.params,
        })),
      }));

      const blob = await apiService.exportMix({
        tracks: exportTracks,
        bpm,
        masterVolume: useMixerStore.getState().masterVolume,
        sample_rate: 44100,
      });

      setExportProgress(100);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mix_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        clearInterval(interval);
      }, 800);
    } catch (error) {
      console.error('Export failed:', error);
      const localBlob = await audioEngine.renderToWAV(tracks[0]?.audioBuffer || new AudioBuffer({ length: 1, sampleRate: 44100 }));
      const url = URL.createObjectURL(localBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mix_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 800);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div
      className={`app-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="toolbar">
        <div className="toolbar-left">
          <button className="upload-btn" onClick={handleUploadClick}>
            <span className="btn-icon">📁</span>
            上传音频
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="file-input"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>

        <div className="toolbar-center">
          <div className="bpm-control">
            <label className="bpm-label">BPM</label>
            <input
              type="range"
              min="20"
              max="300"
              value={bpm}
              onChange={handleBpmChange}
              className="bpm-slider"
            />
            <span className="bpm-value">{bpm}</span>
          </div>

          <button
            className={`play-btn ${playing ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {playing ? (
              <svg className="play-icon" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" fill="white" />
                <rect x="14" y="4" width="4" height="16" fill="white" />
              </svg>
            ) : (
              <svg className="play-icon" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" fill="white" />
              </svg>
            )}
          </button>
        </div>

        <div className="toolbar-right">
          <button className="export-btn" onClick={handleExport} disabled={isExporting}>
            <span className="btn-icon">💾</span>
            导出
          </button>
          <button
            className="effect-toggle-btn"
            onClick={() => setEffectPanelOpen(!effectPanelOpen)}
          >
            <span className="btn-icon">🎛️</span>
            效果器
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="track-list">
          {tracks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">拖拽音频文件到此处或点击上传按钮</p>
              <p className="empty-hint">支持 MP3, WAV 格式</p>
            </div>
          ) : (
            tracks.map((track) => (
              <div key={track.id} className="track-wrapper">
                <AudioTrack track={track} width={window.innerWidth > 1200 ? window.innerWidth - 420 : window.innerWidth - 48} />
                <div className="track-divider" />
              </div>
            ))
          )}
        </div>

        <aside className={`effect-panel-container ${effectPanelOpen ? 'open' : ''}`}>
          <EffectPanel />
          <MasterOutput />
        </aside>
      </main>

      <ExportProgressRing progress={exportProgress} visible={isExporting} />

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-content">
            <span className="drag-icon">🎵</span>
            <p className="drag-text">释放以上传音频文件</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
