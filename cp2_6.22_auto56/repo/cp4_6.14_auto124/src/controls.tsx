import React, { useState } from 'react'
import { useVisualizerStore, presetColors, type VisualizerMode } from './store'
import {
  Music,
  Radio,
  CircleDot,
  Sparkles,
  Play,
  Pause,
  Upload,
  Sun,
  Moon
} from 'lucide-react'

const modes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
  { id: 'waveform', label: '波形', icon: <Music size={18} /> },
  { id: 'spectrum', label: '频谱', icon: <Radio size={18} /> },
  { id: 'circular', label: '环形频谱', icon: <CircleDot size={18} /> },
  { id: 'particle', label: '粒子和弦', icon: <Sparkles size={18} /> }
]

interface ControlPanelProps {
  onFileUpload: (file: File) => void
  onPlayPause: () => void
  isPlaying: boolean
  hasAudio: boolean
  currentTime: number
  duration: number
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileUpload,
  onPlayPause,
  isPlaying,
  hasAudio,
  currentTime,
  duration
}) => {
  const {
    mode,
    primaryColor,
    theme,
    waveformLineWidth,
    fftSize,
    spectrumBarWidth,
    spectrumColorMode,
    circularRadius,
    particleCount,
    audioFileName,
    setMode,
    setPrimaryColor,
    setTheme,
    setParam
  } = useVisualizerStore()

  const [hoveredColor, setHoveredColor] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
    e.target.value = ''
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`control-panel theme-${theme}`}>
      <div className="panel-header">
        <h1 className="panel-title">
          <span className="title-icon">🎵</span>
          音画互动工具
        </h1>
        <p className="panel-subtitle">自由组合音乐波形与频谱图案</p>
      </div>

      <div className="divider" />

      <div className="section">
        <h3 className="section-title">音频文件</h3>
        <label className="upload-btn" htmlFor="audio-upload">
          <Upload size={16} />
          <span>{audioFileName || '上传 MP3 / WAV 文件'}</span>
        </label>
        <input
          id="audio-upload"
          type="file"
          accept="audio/mp3,audio/wav,audio/mpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {hasAudio && (
          <div className="player-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <button
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              <span>{isPlaying ? '暂停' : '播放'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="section">
        <h3 className="section-title">可视化模式</h3>
        <div className="mode-grid">
          {modes.map((m) => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="section">
        <h3 className="section-title">参数调节</h3>

        {mode === 'waveform' && (
          <div className="param-group">
            <label className="param-label">
              线条宽度: <span className="param-value">{waveformLineWidth}px</span>
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={waveformLineWidth}
              onChange={(e) => setParam('waveformLineWidth', Number(e.target.value))}
            />
          </div>
        )}

        {mode === 'spectrum' && (
          <>
            <div className="param-group">
              <label className="param-label">
                FFT 大小: <span className="param-value">{fftSize}</span>
              </label>
              <input
                type="range"
                min="64"
                max="2048"
                step="64"
                value={fftSize}
                onChange={(e) => setParam('fftSize', Number(e.target.value))}
              />
            </div>
            <div className="param-group">
              <label className="param-label">
                频谱条宽度: <span className="param-value">{spectrumBarWidth}px</span>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={spectrumBarWidth}
                onChange={(e) => setParam('spectrumBarWidth', Number(e.target.value))}
              />
            </div>
            <div className="param-group">
              <label className="param-label">频谱颜色模式</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="colorMode"
                    value="solid"
                    checked={spectrumColorMode === 'solid'}
                    onChange={(e) => setParam('spectrumColorMode', e.target.value)}
                  />
                  <span className="radio-custom" style={{ background: primaryColor }} />
                  <span>单色</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="colorMode"
                    value="rainbow"
                    checked={spectrumColorMode === 'rainbow'}
                    onChange={(e) => setParam('spectrumColorMode', e.target.value)}
                  />
                  <span className="radio-custom rainbow" />
                  <span>彩虹</span>
                </label>
              </div>
            </div>
          </>
        )}

        {mode === 'circular' && (
          <>
            <div className="param-group">
              <label className="param-label">
                FFT 大小: <span className="param-value">{fftSize}</span>
              </label>
              <input
                type="range"
                min="64"
                max="2048"
                step="64"
                value={fftSize}
                onChange={(e) => setParam('fftSize', Number(e.target.value))}
              />
            </div>
            <div className="param-group">
              <label className="param-label">
                环形半径: <span className="param-value">{circularRadius}px</span>
              </label>
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={circularRadius}
                onChange={(e) => setParam('circularRadius', Number(e.target.value))}
              />
            </div>
          </>
        )}

        {mode === 'particle' && (
          <div className="param-group">
            <label className="param-label">
              粒子数量: <span className="param-value">{particleCount}</span>
            </label>
            <input
              type="range"
              min="30"
              max="200"
              step="10"
              value={particleCount}
              onChange={(e) => setParam('particleCount', Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="section">
        <h3 className="section-title">颜色选择</h3>
        <div className="color-picker-wrapper">
          <label className="param-label">主色调</label>
          <div className="color-grid">
            {presetColors.map((color) => (
              <button
                key={color}
                className={`color-swatch ${primaryColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setPrimaryColor(color)}
                onMouseEnter={() => setHoveredColor(color)}
                onMouseLeave={() => setHoveredColor(null)}
                title={color}
              >
                {hoveredColor === color && (
                  <span className="color-tooltip">{color}</span>
                )}
                {primaryColor === color && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
          <div className="custom-color-row">
            <label className="param-label">自定义颜色</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="color-input"
            />
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="section">
        <h3 className="section-title">主题设置</h3>
        <div className="theme-toggle">
          <label className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            />
            <span className="theme-icon"><Moon size={18} /></span>
            <span>深色</span>
          </label>
          <label className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            />
            <span className="theme-icon"><Sun size={18} /></span>
            <span>浅色</span>
          </label>
        </div>
      </div>

      <style>{`
        .control-panel {
          width: 320px;
          height: 100vh;
          padding: 24px;
          overflow-y: auto;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: background 0.5s ease, color 0.5s ease;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .control-panel.theme-dark {
          background: rgba(30, 41, 59, 0.85);
          color: #f1f5f9;
        }

        .control-panel.theme-light {
          background: rgba(255, 255, 255, 0.85);
          color: #0f172a;
        }

        .panel-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .panel-title {
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .title-icon {
          font-size: 24px;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .panel-subtitle {
          font-size: 12px;
          opacity: 0.7;
          font-weight: 400;
        }

        .divider {
          height: 1px;
          background: #334155;
          margin: 16px 0;
          transition: background 0.5s ease;
        }

        .theme-light .divider {
          background: #e2e8f0;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 10px;
          border: 2px dashed #475569;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .theme-light .upload-btn {
          border-color: #cbd5e1;
        }

        .upload-btn:hover {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.1);
          transform: scale(1.02);
        }

        .upload-btn:active {
          transform: scale(0.98);
        }

        .player-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .progress-bar {
          height: 4px;
          background: rgba(148, 163, 184, 0.3);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), #8b5cf6);
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        .time-display {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          opacity: 0.7;
        }

        .play-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--primary), #8b5cf6);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .play-btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        .play-btn:active {
          transform: scale(0.95);
        }

        .mode-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 10px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: rgba(71, 85, 105, 0.3);
          color: inherit;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .theme-light .mode-btn {
          background: rgba(226, 232, 240, 0.5);
        }

        .mode-btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
        }

        .mode-btn:active {
          transform: scale(0.95);
        }

        .mode-btn.active {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.2);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }

        .mode-icon {
          color: var(--primary);
        }

        .param-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .param-label {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .param-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--primary);
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .radio-group {
          display: flex;
          gap: 16px;
          margin-top: 4px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .radio-option input {
          display: none;
        }

        .radio-custom {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #475569;
          transition: all 0.2s ease;
          position: relative;
        }

        .radio-custom.rainbow {
          background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6);
        }

        .radio-option input:checked + .radio-custom {
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
        }

        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 2px solid transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-swatch:hover {
          transform: scale(1.2);
          z-index: 10;
        }

        .color-swatch.selected {
          border-color: white;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .theme-light .color-swatch.selected {
          border-color: #0f172a;
          box-shadow: 0 0 10px rgba(15, 23, 42, 0.3);
        }

        .color-tooltip {
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.9);
          color: white;
          font-size: 10px;
          padding: 4px 6px;
          border-radius: 4px;
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
          z-index: 100;
          pointer-events: none;
        }

        .check-mark {
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .custom-color-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .color-input {
          width: 40px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: none;
        }

        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-input::-webkit-color-swatch {
          border-radius: 4px;
          border: 2px solid #475569;
        }

        .theme-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .theme-option {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: rgba(71, 85, 105, 0.3);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          user-select: none;
        }

        .theme-light .theme-option {
          background: rgba(226, 232, 240, 0.5);
        }

        .theme-option input {
          display: none;
        }

        .theme-option:hover {
          filter: brightness(1.2);
        }

        .theme-option.active {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.2);
        }

        .theme-icon {
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .control-panel {
            width: 100%;
            height: auto;
            max-height: 45vh;
            padding: 16px;
            overflow-x: auto;
            overflow-y: visible;
            flex-direction: row;
            gap: 16px;
          }

          .control-panel > * {
            flex-shrink: 0;
            min-width: 280px;
          }

          .divider {
            width: 1px;
            height: auto;
            margin: 0;
            min-width: 1px;
          }

          .section {
            min-width: 260px;
          }

          .mode-grid {
            grid-template-columns: 1fr 1fr;
          }

          .color-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }
      `}</style>
    </div>
  )
}

export default ControlPanel
