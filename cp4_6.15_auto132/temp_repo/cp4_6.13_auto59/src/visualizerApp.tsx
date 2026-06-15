import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAudioStore, AudioAnalyzer, COLOR_THEMES, VisualMode } from './audioEngine';
import { Visualizer } from './renderEngine';
import './style.css';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VisualizerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const analyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingRafRef = useRef<number>(0);
  const dropRef = useRef<HTMLDivElement>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const store = useAudioStore();
  const {
    isPlaying,
    isLoading,
    isLoaded,
    fileName,
    duration,
    currentTime,
    averageFrequency,
    energyPeak,
    beatIntensity,
    visualMode,
    freqRangeMin,
    freqRangeMax,
    colorThemeIndex,
  } = store;

  const theme = COLOR_THEMES[colorThemeIndex];

  useEffect(() => {
    if (!canvasRef.current) return;
    const viz = new Visualizer(canvasRef.current);
    viz.resize();
    visualizerRef.current = viz;

    const handleResize = () => viz.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      viz.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && visualizerRef.current) {
      visualizerRef.current.start();
    } else if (visualizerRef.current) {
      visualizerRef.current.stop();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isLoading && visualizerRef.current && canvasRef.current) {
      const viz = visualizerRef.current;
      const animate = (time: number) => {
        if (!useAudioStore.getState().isLoading) return;
        viz.drawLoading(time);
        loadingRafRef.current = requestAnimationFrame(animate);
      };
      loadingRafRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(loadingRafRef.current);
  }, [isLoading]);

  useEffect(() => {
    if (isLoaded && !isLoading && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      const rect = canvasRef.current.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [isLoaded, isLoading]);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'mp3' && ext !== 'wav') return;

    const analyzer = analyzerRef.current;
    if (isPlaying) analyzer.pause();
    analyzer.reset();
    store.reset();

    try {
      await analyzer.loadFile(file);
    } catch (e) {
      console.error('Audio load failed', e);
    }
  }, [isPlaying, store]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const togglePlay = useCallback(() => {
    const analyzer = analyzerRef.current;
    if (isPlaying) {
      analyzer.pause();
    } else {
      analyzer.play();
    }
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    const analyzer = analyzerRef.current;
    if (isPlaying) analyzer.pause();
    analyzer.reset();
    store.reset();
  }, [isPlaying, store]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    analyzerRef.current.seek(time);
  }, [duration]);

  const handleFreqMin = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    store.setFreqRangeMin(Number(e.target.value));
  }, [store]);

  const handleFreqMax = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    store.setFreqRangeMax(Number(e.target.value));
  }, [store]);

  const handleColorTheme = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    store.setColorTheme(Number(e.target.value));
  }, [store]);

  return (
    <div className="app" style={{ '--primary': theme.primary, '--accent': theme.accent } as React.CSSProperties}>
      <nav className="navbar">
        <span className="app-title">频谱幻境</span>
        <button className="help-btn" onClick={() => setShowHelp(!showHelp)}>?</button>
      </nav>

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <h3>使用说明</h3>
            <p>1. 点击上传按钮或将音乐文件（mp3/wav）拖拽到虚线框内</p>
            <p>2. 音频加载完成后，点击播放按钮开始可视化</p>
            <p>3. 使用控制按钮切换播放/暂停、重置、视觉样式</p>
            <p>4. 调节频率范围滑块过滤可见频率段</p>
            <p>5. 调节颜色主题滑块切换不同色板</p>
            <p>6. 点击进度条可跳转到对应位置</p>
            <button className="help-close-btn" onClick={() => setShowHelp(false)}>关闭</button>
          </div>
        </div>
      )}

      {!isLoaded && !isLoading && (
        <div
          ref={dropRef}
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
              <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
            </svg>
          </div>
          <p className="upload-text">点击或拖拽音乐文件至此</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {(isLoaded || isLoading) && (
        <div className="visualizer-container">
          {isLoaded && (
            <div className="top-bar">
              <span className="file-info">{fileName}</span>
              <span className="time-info">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          )}

          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="visualizer-canvas" />
            <div className="stats">
              <span className="stat-tag">频率: {averageFrequency.toFixed(2)}</span>
              <span className="stat-tag">能量: {energyPeak.toFixed(2)}</span>
              <span className="stat-tag">节拍: {beatIntensity.toFixed(2)}</span>
            </div>
          </div>

          {isLoaded && (
            <>
              <div className="progress-bar" onClick={handleSeek}>
                <div
                  className="progress-fill"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              <div className="controls">
                <div className="control-buttons">
                  <button className="ctrl-btn" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <rect x="4" y="3" width="4" height="14" rx="1" />
                        <rect x="12" y="3" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <polygon points="5,3 17,10 5,17" />
                      </svg>
                    )}
                  </button>
                  <button className="ctrl-btn" onClick={handleReset} title="重置">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 10a7 7 0 1114 0 7 7 0 01-14 0z" />
                      <path d="M3 5v5h5" />
                    </svg>
                  </button>
                  <button className="ctrl-btn" onClick={store.setVisualMode} title="切换视觉样式">
                    {visualMode === 'full' ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="4" />
                        <path d="M10 2l2 4H8l2-4zM10 18l2-4H8l2 4zM2 10l4-2v4l-4-2zM18 10l-4-2v4l4-2z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="3" />
                        <circle cx="10" cy="3" r="2" />
                        <circle cx="16" cy="14" r="2" />
                        <circle cx="4" cy="14" r="2" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="sliders">
                  <div className="slider-group">
                    <label className="slider-label">频率范围</label>
                    <div className="range-row">
                      <input
                        type="range"
                        min="20"
                        max="20000"
                        step="10"
                        value={freqRangeMin}
                        onChange={handleFreqMin}
                        className="slider"
                      />
                      <input
                        type="range"
                        min="20"
                        max="20000"
                        step="10"
                        value={freqRangeMax}
                        onChange={handleFreqMax}
                        className="slider"
                      />
                    </div>
                    <span className="slider-value">{freqRangeMin}Hz - {freqRangeMax}Hz</span>
                  </div>

                  <div className="slider-group">
                    <label className="slider-label">颜色主题</label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={colorThemeIndex}
                      onChange={handleColorTheme}
                      className="slider"
                    />
                    <span className="slider-value">{theme.name}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
