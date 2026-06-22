import React, { useState, useRef, useCallback, useEffect } from 'react';
import './styles.css';
import SoundscapeScene from './SoundscapeScene';
import { AudioProcessor } from './AudioProcessor';
import { TerrainGenerator } from './TerrainGenerator';
import type { MarkerEvent, SpectrumFrame, TimeRange, ExportData } from './types';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatFreq = (hz: number): string => {
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1)} kHz`;
  }
  return `${Math.round(hz)} Hz`;
};

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [spectrumData, setSpectrumData] = useState<SpectrumFrame[]>([]);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState<MarkerEvent[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [exportPressed, setExportPressed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const terrainGeneratorRef = useRef<TerrainGenerator | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioProcessorRef.current = new AudioProcessor();
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!audioProcessorRef.current) return;

    setError(null);
    setIsLoading(true);
    setLoadingText('正在解码音频...');
    setSpectrumData([]);
    setMarkers([]);
    setSelectedMarkerId(null);
    setTimeRange(null);
    setCurrentTime(0);
    setIsPlaying(false);

    try {
      const startTime = performance.now();

      const buffer = await audioProcessorRef.current.decodeAudioFile(file);
      setAudioBuffer(buffer);
      setAudioFile(file);

      setLoadingText('正在分析频谱...');
      const spectrum = await audioProcessorRef.current.analyzeSpectrum(buffer, 512);
      setSpectrumData(spectrum);

      const waveform = audioProcessorRef.current.getWaveformData(buffer, 800);
      setWaveformData(waveform);

      const elapsed = (performance.now() - startTime) / 1000;
      console.log(`分析完成，耗时: ${elapsed.toFixed(2)}秒`);

    } catch (err) {
      setError(err instanceof Error ? err.message : '处理音频时发生错误');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleTerrainGenerated = useCallback((generator: TerrainGenerator) => {
    terrainGeneratorRef.current = generator;
  }, []);

  const playAudio = useCallback(() => {
    if (!audioBuffer || !audioProcessorRef.current) return;

    const ctx = audioProcessorRef.current.getAudioContext();
    if (!ctx) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
    }

    audioProcessorRef.current.resumeContext();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startOffset = pausedAtRef.current;
    source.start(0, startOffset);
    startTimeRef.current = ctx.currentTime - startOffset;

    source.onended = () => {
      if (audioSourceRef.current === source) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setCurrentTime(0);
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    audioSourceRef.current = source;
    setIsPlaying(true);

    const updateTime = () => {
      if (ctx && startTimeRef.current >= 0) {
        const time = Math.min(ctx.currentTime - startTimeRef.current, audioBuffer.duration);
        setCurrentTime(time);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [audioBuffer]);

  const pauseAudio = useCallback(() => {
    if (audioSourceRef.current && audioProcessorRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;

      const ctx = audioProcessorRef.current.getAudioContext();
      if (ctx) {
        pausedAtRef.current = ctx.currentTime - startTimeRef.current;
      }
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      if (currentTime >= (audioBuffer?.duration || 0) - 0.01) {
        pausedAtRef.current = 0;
        setCurrentTime(0);
      }
      playAudio();
    }
  }, [isPlaying, currentTime, audioBuffer, playAudio, pauseAudio]);

  const handleMarkerAdd = useCallback((markerData: Omit<MarkerEvent, 'id' | 'index' | 'createdAt'>) => {
    const newMarker: MarkerEvent = {
      ...markerData,
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      index: markers.length + 1,
      createdAt: Date.now()
    };
    setMarkers(prev => [...prev, newMarker]);
    setSelectedMarkerId(newMarker.id);
  }, [markers.length]);

  const handleMarkerSelect = useCallback((id: string | null) => {
    setSelectedMarkerId(id);
  }, []);

  const handleMarkerClick = useCallback((marker: MarkerEvent) => {
    setSelectedMarkerId(marker.id);
    setCurrentTime(marker.time);
    if (audioSourceRef.current && audioProcessorRef.current) {
      pauseAudio();
      pausedAtRef.current = marker.time;
    }
  }, [pauseAudio]);

  const closeInfoCard = useCallback(() => {
    setSelectedMarkerId(null);
  }, []);

  const handleExport = useCallback(() => {
    setExportPressed(true);
    setTimeout(() => setExportPressed(false), 200);

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      audioDuration: audioBuffer?.duration || 0,
      markers: markers.map(({ createdAt, ...rest }) => rest)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soundscape-markers-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markers, audioBuffer]);

  useEffect(() => {
    if (!waveformCanvasRef.current || !waveformData) return;

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = width / waveformData.length;
    for (let i = 0; i < waveformData.length; i++) {
      const x = i * step;
      const amp = waveformData[i] * (height * 0.45);

      ctx.moveTo(x, centerY - amp);
      ctx.lineTo(x, centerY + amp);
    }
    ctx.stroke();

  }, [waveformData]);

  useEffect(() => {
    if (!chartCanvasRef.current || spectrumData.length === 0 || !chartContainerRef.current) return;

    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 15, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    const energies = spectrumData.map(f => f.energy);
    const maxEnergy = Math.max(
      ...energies.map(e => Math.max(e.low, e.mid, e.high)),
      0.001
    );

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      const value = ((4 - i) / 4 * maxEnergy).toFixed(3);
      ctx.fillText(value, padding.left - 6, y + 3);
    }

    const drawLine = (dataKey: 'low' | 'mid' | 'high', color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < energies.length; i++) {
        const x = padding.left + (i / (energies.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (energies[i][dataKey] / maxEnergy) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    drawLine('low', '#4fc3f7');
    drawLine('mid', '#81c784');
    drawLine('high', '#ffb74d');

    if (timeRange && timeRange.start !== timeRange.end) {
      const duration = spectrumData[spectrumData.length - 1]?.time || 1;
      const x1 = padding.left + (timeRange.start / duration) * chartWidth;
      const x2 = padding.left + (timeRange.end / duration) * chartWidth;

      ctx.fillStyle = 'rgba(255, 235, 150, 0.3)';
      ctx.fillRect(
        Math.min(x1, x2),
        padding.top,
        Math.abs(x2 - x1),
        chartHeight
      );
    }

    const playheadX = padding.left + (currentTime / (spectrumData[spectrumData.length - 1]?.time || 1)) * chartWidth;
    if (playheadX >= padding.left && playheadX <= width - padding.right) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, padding.top);
      ctx.lineTo(playheadX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [spectrumData, timeRange, currentTime]);

  const handleChartMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartCanvasRef.current || spectrumData.length === 0) return;

    const rect = chartCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 45, right: 10 };
    const chartWidth = rect.width - padding.left - padding.right;

    const duration = spectrumData[spectrumData.length - 1]?.time || 1;
    const time = Math.max(0, Math.min(duration, ((x - padding.left) / chartWidth) * duration));

    setDragStart(time);
    setTimeRange(null);
  }, [spectrumData]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStart === null || !chartCanvasRef.current || spectrumData.length === 0) return;

    const rect = chartCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 45, right: 10 };
    const chartWidth = rect.width - padding.left - padding.right;

    const duration = spectrumData[spectrumData.length - 1]?.time || 1;
    const currentDragTime = Math.max(0, Math.min(duration, ((x - padding.left) / chartWidth) * duration));

    setTimeRange({
      start: Math.min(dragStart, currentDragTime),
      end: Math.max(dragStart, currentDragTime)
    });
  }, [dragStart, spectrumData]);

  const handleChartMouseUp = useCallback(() => {
    setDragStart(null);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart !== null) {
        setDragStart(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragStart]);

  const selectedMarker = markers.find(m => m.id === selectedMarkerId);
  const duration = audioBuffer?.duration || 0;

  return (
    <div className="app">
      <div className="left-panel">
        <div className="header">
          <div>
            <div className="title">🌊 深海声景分析仪</div>
            <div className="subtitle">Deep Sea Soundscape Analyzer</div>
          </div>
        </div>

        <div
          className={`upload-area ${isDragging ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {audioFile ? audioFile.name : '点击或拖拽上传WAV文件'}
          </div>
          <div className="upload-hint">支持WAV格式，最长30秒</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,audio/wav,audio/x-wav"
            className="upload-input"
            onChange={handleFileInputChange}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(239, 83, 80, 0.15)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#ef5350'
          }}>
            {error}
          </div>
        )}

        {waveformData && (
          <div className="waveform-section">
            <div className="section-label">波形预览</div>
            <div className="waveform-container">
              <canvas ref={waveformCanvasRef} className="waveform-canvas" />
              <div
                className="playback-cursor"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="controls">
              <button
                className="btn btn-primary"
                onClick={togglePlayback}
                disabled={!audioBuffer}
              >
                {isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  pauseAudio();
                  pausedAtRef.current = 0;
                  setCurrentTime(0);
                }}
                disabled={!audioBuffer}
              >
                ↺ 重置
              </button>
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        <div className="markers-section">
          <div className="markers-header">
            <div className="section-label">标记事件 ({markers.length})</div>
            <button
              className={`export-btn ${exportPressed ? 'pressed' : ''}`}
              onClick={handleExport}
              disabled={markers.length === 0}
              title="导出标记为JSON"
            >
              ↓
            </button>
          </div>

          {markers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <div>在3D声景上点击以添加标记</div>
            </div>
          ) : (
            <div className="markers-list">
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className={`marker-item ${marker.id === selectedMarkerId ? 'active' : ''}`}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <span className="marker-index">{marker.index}</span>
                  <div className="marker-info">
                    <span className="marker-time">{formatTime(marker.time)}</span>
                    <span className="marker-freq">
                      {formatFreq(marker.frequencyRange[0])} - {formatFreq(marker.frequencyRange[1])}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="right-panel">
        <div style={{ flex: 1, position: 'relative' }}>
          {spectrumData.length > 0 ? (
            <SoundscapeScene
              spectrumData={spectrumData}
              markers={markers}
              selectedMarkerId={selectedMarkerId}
              timeRange={timeRange}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onMarkerAdd={handleMarkerAdd}
              onMarkerSelect={handleMarkerSelect}
              onTerrainGenerated={handleTerrainGenerated}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '14px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🌊</div>
                <div>上传WAV音频文件以生成3D声景地形</div>
              </div>
            </div>
          )}

          {selectedMarker && (
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-card-title">
                  <span className="marker-index">{selectedMarker.index}</span>
                  声音事件
                </div>
                <button className="info-card-close" onClick={closeInfoCard}>×</button>
              </div>
              <div className="info-card-row">
                <span className="info-card-label">时间戳</span>
                <span className="info-card-value">{formatTime(selectedMarker.time)}</span>
              </div>
              <div className="info-card-row">
                <span className="info-card-label">频率范围</span>
                <span className="info-card-value">
                  {formatFreq(selectedMarker.frequencyRange[0])} - {formatFreq(selectedMarker.frequencyRange[1])}
                </span>
              </div>
              <div className="info-card-row">
                <span className="info-card-label">振幅均值</span>
                <span className="info-card-value">{(selectedMarker.amplitude * 100).toFixed(1)}%</span>
              </div>
              <div className="info-card-row">
                <span className="info-card-label">坐标位置</span>
                <span className="info-card-value">
                  ({selectedMarker.position.x.toFixed(1)}, {selectedMarker.position.y.toFixed(1)}, {selectedMarker.position.z.toFixed(1)})
                </span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">{loadingText}</div>
            </div>
          )}
        </div>

        <div className="chart-container" ref={chartContainerRef}>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot low" />
              低频 (0-500Hz)
            </div>
            <div className="legend-item">
              <span className="legend-dot mid" />
              中频 (500-2000Hz)
            </div>
            <div className="legend-item">
              <span className="legend-dot high" />
              高频 (2000Hz+)
            </div>
            {timeRange && timeRange.start !== timeRange.end && (
              <div style={{ marginLeft: 'auto', color: 'rgba(255, 235, 150, 0.8)', fontSize: '11px' }}>
                已选择: {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
              </div>
            )}
          </div>
          <canvas
            ref={chartCanvasRef}
            className="chart-canvas"
            onMouseDown={handleChartMouseDown}
            onMouseMove={handleChartMouseMove}
            onMouseUp={handleChartMouseUp}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
