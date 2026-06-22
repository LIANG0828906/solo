import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioAnalyzer } from './AudioAnalyzer';
import { ParticleScene, VisualStyle } from './ParticleScene';
import './App.css';

const STYLE_NAMES: Record<VisualStyle, string> = {
  flame: '火焰',
  nebula: '星云',
  aurora: '极光',
};

const STYLE_GRADIENTS: Record<VisualStyle, string[]> = {
  flame: ['#ff3300', '#ffcc00'],
  nebula: ['#3300ff', '#ff00ff'],
  aurora: ['#00ff88', '#00aaff'],
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const particleSceneRef = useRef<ParticleScene | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<VisualStyle>('flame');

  const {
    dataArray,
    isPlaying,
    currentTime,
    duration,
    volume,
    fileName,
    loadAudio,
    togglePlay,
    setVolume,
    seek,
  } = useAudioAnalyzer();

  useEffect(() => {
    if (sceneContainerRef.current && !particleSceneRef.current) {
      const scene = new ParticleScene();
      scene.init(sceneContainerRef.current);
      scene.start();
      particleSceneRef.current = scene;
    }

    return () => {
      if (particleSceneRef.current) {
        particleSceneRef.current.dispose();
        particleSceneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (particleSceneRef.current && dataArray) {
      particleSceneRef.current.update(dataArray);
    }
  }, [dataArray]);

  useEffect(() => {
    if (particleSceneRef.current) {
      particleSceneRef.current.setStyle(currentStyle);
    }
  }, [currentStyle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSpectrum = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(13, 13, 13, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (dataArray && dataArray.length > 0) {
        const barCount = 64;
        const barWidth = width / barCount - 2;
        const step = Math.floor(dataArray.length / barCount);

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, STYLE_GRADIENTS[currentStyle][0]);
        gradient.addColorStop(1, STYLE_GRADIENTS[currentStyle][1]);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          const value = sum / step;
          const barHeight = (value / 255) * height * 0.9;

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawSpectrum);
    };

    drawSpectrum();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dataArray, currentStyle]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        loadAudio(file);
        setHasAudio(true);
      }
    }
  }, [loadAudio]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadAudio(files[0]);
      setHasAudio(true);
    }
  }, [loadAudio]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      seek(percent * duration);
    }
  }, [duration, seek]);

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStyleChange = (style: VisualStyle) => {
    setCurrentStyle(style);
  };

  return (
    <div className="app">
      <div
        ref={sceneContainerRef}
        className="scene-container"
      />

      <div className="info-panel">
        <div className="info-text">
          {hasAudio ? fileName : '未选择音频'}
        </div>
        <div className="info-text info-style">
          风格: {STYLE_NAMES[currentStyle]}
        </div>
      </div>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${hasAudio ? 'minimized' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {hasAudio ? (
          <div className="upload-minimized-text">更换音频</div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">🎵</div>
            <div className="upload-text">拖拽或点击上传音频文件</div>
            <div className="upload-hint">支持 MP3、WAV 格式</div>
          </div>
        )}
      </div>

      <div className="style-panel">
        <div className="style-title">可视化风格</div>
        <button
          className={`style-btn ${currentStyle === 'flame' ? 'active' : ''}`}
          onClick={() => handleStyleChange('flame')}
          style={{
            '--style-color': '#ff6600',
          } as React.CSSProperties}
        >
          🔥 火焰
        </button>
        <button
          className={`style-btn ${currentStyle === 'nebula' ? 'active' : ''}`}
          onClick={() => handleStyleChange('nebula')}
          style={{
            '--style-color': '#9933ff',
          } as React.CSSProperties}
        >
          🌌 星云
        </button>
        <button
          className={`style-btn ${currentStyle === 'aurora' ? 'active' : ''}`}
          onClick={() => handleStyleChange('aurora')}
          style={{
            '--style-color': '#00ddaa',
          } as React.CSSProperties}
        >
          ✨ 极光
        </button>
      </div>

      <div className="spectrum-container">
        <canvas ref={canvasRef} width={800} height={100} className="spectrum-canvas" />
      </div>

      <div className="control-bar">
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              background: `linear-gradient(to right, ${STYLE_GRADIENTS[currentStyle][0]}, ${STYLE_GRADIENTS[currentStyle][1]})`,
            }}
          />
          <div
            className="progress-thumb"
            style={{
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
