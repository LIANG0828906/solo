import { useRef, useCallback, useState } from 'react';
import { useStore } from './store';
import { audioEngine } from './audioEngine';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function Controls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPlaying, currentTime, duration, volume, isLoaded } = useStore(
    (state) => state.playbackState
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3'];
      if (!validTypes.includes(file.type) && 
          !file.name.endsWith('.mp3') && 
          !file.name.endsWith('.wav')) {
        alert('请上传MP3或WAV格式的音频文件');
        return;
      }

      try {
        await audioEngine.loadAudioFile(file);
      } catch (error) {
        console.error('音频加载失败:', error);
        alert('音频加载失败，请尝试其他文件');
      }
    },
    []
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!isLoaded) return;
    audioEngine.togglePlay();
  }, [isLoaded]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setDragTime(value);
    },
    []
  );

  const handleProgressMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressMouseUp = useCallback(() => {
    if (isDragging) {
      audioEngine.seek(dragTime);
      setIsDragging(false);
    }
  }, [isDragging, dragTime]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      audioEngine.setVolume(value);
    },
    []
  );

  const displayTime = isDragging ? dragTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="controls-panel">
      <h2 className="panel-title">音乐控制台</h2>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          className="upload-btn"
          onClick={handleUploadClick}
          disabled={false}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>上传音频文件</span>
        </button>
        <p className="formats-text">支持 MP3、WAV 格式</p>
      </div>

      <div className="playback-section">
        <button
          className="play-btn"
          onClick={handlePlayPause}
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>

      <div className="progress-section">
        <div className="time-display">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={displayTime}
            onChange={handleProgressChange}
            onMouseDown={handleProgressMouseDown}
            onMouseUp={handleProgressMouseUp}
            onTouchStart={handleProgressMouseDown}
            onTouchEnd={handleProgressMouseUp}
            disabled={!isLoaded}
            className="progress-slider"
          />
        </div>
      </div>

      <div className="volume-section">
        <div className="volume-label">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <span>音量</span>
        </div>
        <div className="volume-container">
          <div
            className="volume-bar"
            style={{ width: `${volume * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
        <span className="volume-value">{Math.round(volume * 100)}%</span>
      </div>

      <style>{`
        .controls-panel {
          height: 100%;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          backdrop-filter: blur(10px);
          background: rgba(20, 20, 40, 0.7);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-title {
          color: #fff;
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .upload-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .upload-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6),
                      0 0 30px rgba(102, 126, 234, 0.3);
        }

        .upload-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .formats-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        .playback-section {
          display: flex;
          justify-content: center;
          padding: 1rem 0;
        }

        .play-btn {
          width: 80px;
          height: 80px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
          padding-left: 4px;
        }

        .play-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(245, 87, 108, 0.6),
                      0 0 40px rgba(245, 87, 108, 0.3);
        }

        .play-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .play-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .time-display {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
        }

        .progress-container {
          position: relative;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: visible;
        }

        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f5576c 100%);
          border-radius: 4px;
          transition: width 0.1s linear;
          pointer-events: none;
        }

        .progress-slider {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 20px;
          margin: 0;
          padding: 0;
          transform: translateY(-50%);
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          opacity: 0;
        }

        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          border: 3px solid #764ba2;
        }

        .progress-container:hover .progress-slider {
          opacity: 1;
        }

        .progress-slider:disabled {
          cursor: not-allowed;
        }

        .volume-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .volume-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          min-width: 60px;
        }

        .volume-container {
          position: relative;
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .volume-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          pointer-events: none;
        }

        .volume-slider {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 20px;
          margin: 0;
          transform: translateY(-50%);
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #667eea;
          transition: transform 0.2s ease;
        }

        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .volume-value {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          min-width: 40px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 1440px) {
          .controls-panel {
            padding: 1.5rem;
            gap: 1.5rem;
          }
          
          .play-btn {
            width: 70px;
            height: 70px;
          }
        }

        @media (max-width: 1080px) {
          .controls-panel {
            padding: 1rem;
            gap: 1rem;
          }
          
          .panel-title {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
          }
          
          .upload-btn {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
          
          .play-btn {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
}
