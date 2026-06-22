import React, { useRef } from 'react';
import { useAudioEngine } from './AudioEngine';
import { EQ_PRESETS } from '../types/audio';
import { formatTime } from '../utils/audioUtils';

const MasterControls: React.FC = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    masterPan,
    activePreset,
    togglePlay,
    stopAll,
    setMasterVolume,
    setMasterPan,
    seekTo,
    applyPreset,
    exportSettings,
    importSettings,
  } = useAudioEngine();

  const importFileRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    seekTo(ratio * duration);
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importSettings(file);
    }
    e.target.value = '';
  };

  return (
    <div className="master-controls">
      <div className="progress-container">
        <div
          className="progress-bar"
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          <div
            className="progress-fill"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="controls-row">
        <div className="slider-group">
          <div className="slider-label">
            <span>总音量</span>
            <span className="slider-value">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="slider-group">
          <div className="slider-label">
            <span>声道平衡</span>
            <span className="slider-value">
              {masterPan === 0 ? '居中' : masterPan < 0 ? `左 ${Math.abs(masterPan)}` : `右 ${masterPan}`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={masterPan}
            onChange={(e) => setMasterPan(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="preset-section">
          <span className="preset-label">EQ预设:</span>
          <div className="preset-buttons">
            {Object.entries(EQ_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                className={`preset-btn ${activePreset === key ? 'active' : ''}`}
                onClick={() => applyPreset(key)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="control-buttons" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => togglePlay()}>
          {isPlaying ? '⏸ 全部暂停' : '▶ 全部播放'}
        </button>
        <button className="btn btn-danger" onClick={stopAll}>
          ⏹ 停止
        </button>
        <button className="btn" onClick={exportSettings}>
          ⬇ 导出配置
        </button>
        <button className="btn" onClick={handleImportClick}>
          ⬆ 导入配置
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept=".json,application/json"
          className="hidden-input"
          onChange={handleImportFile}
        />
      </div>
    </div>
  );
};

export default MasterControls;
