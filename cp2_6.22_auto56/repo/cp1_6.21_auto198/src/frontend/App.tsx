import { useState, useEffect, useRef } from 'react';
import SampleBrowser from './components/SampleBrowser';
import MixerPanel from './components/MixerPanel';
import { useApp } from './context/AppContext';
import axios from 'axios';
import './styles.css';

export default function App() {
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setSamples,
    setSelectedSampleId,
    isMixerMinimized,
    setIsMixerMinimized,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    selectedSample,
    addTrack,
    setFilters
  } = useApp();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playPosition, setPlayPosition] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(1);

  const largeCanvasRef = useRef<HTMLCanvasElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  const allTags = ['drum', 'kick', 'snare', 'hihat', 'bass', 'piano', 'synth', 'vocal', 'pad', 'ambient', 'trap', 'house', 'edm', 'chill'];
  const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  useEffect(() => {
    fetchSamples();
  }, [searchQuery, filters]);

  useEffect(() => {
    if (selectedSample) {
      setLoopStart(0);
      setLoopEnd(selectedSample.duration);
      setPlayPosition(0);
    }
  }, [selectedSample?.id]);

  useEffect(() => {
    if (selectedSample && largeCanvasRef.current) {
      drawLargeWaveform();
    }
  }, [selectedSample, loopStart, loopEnd, playPosition]);

  useEffect(() => {
    if (isPlaying && selectedSample) {
      playIntervalRef.current = window.setInterval(() => {
        setPlayPosition(prev => {
          const next = prev + (0.05 * playbackRate);
          if (next >= loopEnd) {
            if (isLooping) {
              return loopStart;
            } else {
              setIsPlaying(false);
              return loopEnd;
            }
          }
          return next;
        });
      }, 50);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, selectedSample, isLooping, loopStart, loopEnd, playbackRate]);

  const fetchSamples = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.bpmMin !== null) params.append('bpmMin', String(filters.bpmMin));
      if (filters.bpmMax !== null) params.append('bpmMax', String(filters.bpmMax));
      if (filters.keys.length > 0) params.append('keys', filters.keys.join(','));
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

      const res = await axios.get(`/api/samples?${params.toString()}`);
      setSamples(res.data.data);
      if (res.data.data.length > 0 && !selectedSample) {
        setSelectedSampleId(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch samples:', err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout((window as any).searchTimer);
    (window as any).searchTimer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const drawLargeWaveform = () => {
    const canvas = largeCanvasRef.current;
    if (!canvas || !selectedSample) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const data = selectedSample.waveformData;
    const barWidth = w / data.length;

    ctx.fillStyle = '#18181B';
    ctx.fillRect(0, 0, w, h);

    const selStartPct = loopStart / selectedSample.duration;
    const selEndPct = loopEnd / selectedSample.duration;

    ctx.fillStyle = '#3F3F46';
    data.forEach((val, i) => {
      const xPct = i / data.length;
      if (xPct >= selStartPct && xPct <= selEndPct) return;
      const barHeight = val * h * 0.7;
      const x = i * barWidth;
      const y = (h - barHeight) / 2;
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    ctx.fillStyle = '#A78BFA';
    data.forEach((val, i) => {
      const xPct = i / data.length;
      if (xPct < selStartPct || xPct > selEndPct) return;
      const barHeight = val * h * 0.7;
      const x = i * barWidth;
      const y = (h - barHeight) / 2;
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    if (selectedSample.duration > 0) {
      const playheadX = (playPosition / selectedSample.duration) * w;
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('bpm', '120');
    formData.append('key', 'C');
    formData.append('tags', 'uploaded');
    formData.append('duration', '2.0');

    try {
      await axios.post('/api/samples', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percent);
          }
        }
      });
      setUploading(false);
      setUploadProgress(100);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadProgress(0);
        fetchSamples();
      }, 500);
    } catch (err: any) {
      setUploadError(err.response?.data?.error || '上传失败');
      setUploading(false);
    }
  };

  const handleAddToMixer = () => {
    if (selectedSample) {
      addTrack(selectedSample);
    }
  };

  const toggleKey = (key: string) => {
    setFilters({
      ...filters,
      keys: filters.keys.includes(key)
        ? filters.keys.filter(k => k !== key)
        : [...filters.keys, key]
    });
  };

  const toggleTag = (tag: string) => {
    setFilters({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <button
          className="menu-toggle"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        >
          ☰
        </button>
        <div className="logo">🎵 SampleLab</div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="搜索采样..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
            筛选
          </button>
          {showFilters && (
            <div className="filter-dropdown">
              <div className="filter-section">
                <label>BPM 最小值</label>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="最小"
                  value={filters.bpmMin ?? ''}
                  onChange={(e) => setFilters({ ...filters, bpmMin: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="filter-section">
                <label>BPM 最大值</label>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="最大"
                  value={filters.bpmMax ?? ''}
                  onChange={(e) => setFilters({ ...filters, bpmMax: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="filter-section">
                <label>调性</label>
                <div className="chip-group">
                  {allKeys.map(k => (
                    <span
                      key={k}
                      className={`chip ${filters.keys.includes(k) ? 'chip-active' : ''}`}
                      onClick={() => toggleKey(k)}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <label>标签</label>
                <div className="chip-group">
                  {allTags.map(tag => (
                    <span
                      key={tag}
                      className={`chip chip-small ${filters.tags.includes(tag) ? 'chip-active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
          + 上传
        </button>
      </nav>

      <div className="main-content">
        <SampleBrowser
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        <div className="detail-panel">
          {selectedSample ? (
            <>
              <div className="detail-header">
                <h2>{selectedSample.name}</h2>
                <div className="detail-meta">
                  <span className="meta-tag">{selectedSample.bpm} BPM</span>
                  <span className="meta-tag">{selectedSample.key}</span>
                  {selectedSample.tags.map(t => (
                    <span key={t} className="meta-tag meta-tag-light">#{t}</span>
                  ))}
                </div>
              </div>

              <div className="waveform-large">
                <canvas
                  ref={largeCanvasRef}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div className="playback-controls">
                <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  className={`control-btn ${isLooping ? 'control-btn-active' : ''}`}
                  onClick={() => setIsLooping(!isLooping)}
                >
                  🔁 循环
                </button>
                <div className="speed-control">
                  <span>速度</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  />
                  <span>{playbackRate.toFixed(1)}x</span>
                </div>
                <button className="add-mixer-btn" onClick={handleAddToMixer}>
                  + 添加到混音
                </button>
              </div>

              <div className="sample-info-grid">
                <div className="info-card">
                  <span className="info-label">时长</span>
                  <span className="info-value">{selectedSample.duration.toFixed(2)}s</span>
                </div>
                <div className="info-card">
                  <span className="info-label">BPM</span>
                  <span className="info-value">{selectedSample.bpm}</span>
                </div>
                <div className="info-card">
                  <span className="info-label">调性</span>
                  <span className="info-value">{selectedSample.key}</span>
                </div>
                <div className="info-card">
                  <span className="info-label">采样率</span>
                  <span className="info-value">44.1kHz</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <div className="empty-icon">🎵</div>
              <p>选择左侧的采样开始创作</p>
            </div>
          )}
        </div>
      </div>

      {!isMixerMinimized && (
        <MixerPanel
          playbackRate={playbackRate}
          isLooping={isLooping}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playPosition={playPosition}
          setPlayPosition={setPlayPosition}
        />
      )}

      {isMixerMinimized && (
        <button
          className="restore-mixer-btn"
          onClick={() => setIsMixerMinimized(false)}
        >
          ▲ 展开混音台
        </button>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传采样</h3>
              {!uploading && (
                <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
              )}
            </div>
            {uploading ? (
              <div className="upload-progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">{uploadProgress}%</p>
                {uploadError && <p className="error-text">{uploadError}</p>}
              </div>
            ) : (
              <div
                className="drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="drop-icon">📁</div>
                <p>拖拽文件到这里或点击选择</p>
                <p className="drop-hint">支持 WAV, MP3, OGG, FLAC 格式</p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".wav,.mp3,.ogg,.flac,.aac"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
