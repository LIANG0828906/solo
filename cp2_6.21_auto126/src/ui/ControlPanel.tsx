import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../data/store';
import { InstrumentType } from '../engine/audioEngine';
import { audioEngine } from '../engine/audioEngine';

const INSTRUMENTS: { type: InstrumentType; label: string; color: string }[] = [
  { type: 'drums', label: '🥁 鼓', color: '#ff6b6b' },
  { type: 'bass', label: '🎸 贝斯', color: '#4ecdc4' },
  { type: 'synth', label: '🎹 合成器', color: '#45b7d1' },
  { type: 'effects', label: '✨ 效果器', color: '#f9ca24' },
];

const PRESETS = [
  { id: 'house', label: 'House' },
  { id: 'techno', label: 'Techno' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'dubstep', label: 'Dubstep' },
];

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  color: string;
  label: string;
}

const Knob = ({ value, onChange, color, label }: KnobProps) => {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    e.preventDefault();
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = startY.current - e.clientY;
      const sensitivity = 0.005;
      const newValue = Math.max(0, Math.min(1, startValue.current + deltaY * sensitivity));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onChange]);

  const rotation = value * 270 - 135;

  return (
    <div className="knob-container">
      <div
        ref={containerRef}
        className="knob"
        onMouseDown={handleMouseDown}
        style={{ '--knob-color': color } as React.CSSProperties}
      >
        <div className="knob-base">
          <div className="knob-inner" style={{ transform: `rotate(${rotation}deg)` }}>
            <div className="knob-indicator" style={{ backgroundColor: color }} />
          </div>
          <div className="knob-ticks">
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="knob-tick"
                style={{
                  transform: `rotate(${i * 27 - 135}deg)`,
                  backgroundColor: i <= value * 10 ? color : '#0f3460',
                }}
              />
            ))}
          </div>
        </div>
        <div className="knob-value" style={{ color }}>
          {Math.round(value * 100)}
        </div>
      </div>
      <div className="knob-label">{label}</div>
    </div>
  );
};

export const ControlPanel = () => {
  const bpm = useStore(state => state.bpm);
  const masterVolume = useStore(state => state.masterVolume);
  const tracks = useStore(state => state.tracks);
  const isPlaying = useStore(state => state.isPlaying);
  const isRecording = useStore(state => state.isRecording);
  const isLoadingPreset = useStore(state => state.isLoadingPreset);
  const shareLink = useStore(state => state.shareLink);
  
  const setBPM = useStore(state => state.setBPM);
  const setMasterVolume = useStore(state => state.setMasterVolume);
  const setTrackVolume = useStore(state => state.setTrackVolume);
  const togglePlay = useStore(state => state.togglePlay);
  const loadPreset = useStore(state => state.loadPreset);
  const startRecording = useStore(state => state.startRecording);
  const stopRecording = useStore(state => state.stopRecording);

  const recordingProgress = useRef<number | null>(null);
  const recordingBars = 16;
  const [recordingProgressVal, setRecordingProgressVal] = useState(0);

  const handleRecordClick = useCallback(() => {
    if (isRecording) {
      if (recordingProgress.current) {
        clearInterval(recordingProgress.current);
        recordingProgress.current = null;
      }
      stopRecording();
    } else {
      startRecording();
      setRecordingProgressVal(0);
      
      const barDuration = (8 * 60) / (bpm * 2);
      const totalDuration = recordingBars * barDuration;
      const interval = 100;
      const increment = (interval / 1000) / totalDuration;
      
      recordingProgress.current = window.setInterval(() => {
        setRecordingProgressVal(prev => {
          const next = prev + increment;
          if (next >= 1) {
            if (recordingProgress.current) {
              clearInterval(recordingProgress.current);
              recordingProgress.current = null;
            }
            stopRecording();
            return 0;
          }
          return next;
        });
      }, interval);
    }
  }, [isRecording, startRecording, stopRecording, bpm]);

  const handleCopyLink = useCallback(() => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
    }
  }, [shareLink]);

  return (
    <div 
      className={`control-panel ${isLoadingPreset ? 'preset-loading' : ''}`}
    >
      <div className="control-section">
        <div className="control-title">播放控制</div>
        <button
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          <span>{isPlaying ? '停止' : '播放'}</span>
        </button>
      </div>

      <div className="control-section">
        <div className="control-title">BPM</div>
        <div className="bpm-control">
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBPM(Number(e.target.value))}
            className="bpm-slider"
          />
          <div className="bpm-value">{bpm}</div>
        </div>
      </div>

      <div className="control-section">
        <div className="control-title">主音量</div>
        <div className="volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="volume-slider"
          />
          <div className="volume-value">{Math.round(masterVolume * 100)}%</div>
        </div>
      </div>

      <div className="control-section">
        <div className="control-title">乐器音量</div>
        <div className="knobs-container">
          {INSTRUMENTS.map((inst) => (
            <Knob
              key={inst.type}
              value={tracks[inst.type].volume}
              onChange={(value) => setTrackVolume(inst.type, value)}
              color={inst.color}
              label={inst.label}
            />
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="control-title">预设模板</div>
        <div className="preset-buttons">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-button ${isLoadingPreset ? 'loading' : ''}`}
              onClick={() => loadPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="control-title">录制分享</div>
        <div className="record-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordClick}
          >
            <div className="record-icon" />
            <span>{isRecording ? '停止录制' : '开始录制'}</span>
          </button>
          {isRecording && (
            <div className="recording-progress">
              <div 
                className="recording-progress-bar"
                style={{ width: `${recordingProgressVal * 100}%` }}
              />
            </div>
          )}
          {shareLink && (
            <div className="share-link-container">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="share-link-input"
              />
              <button className="copy-button" onClick={handleCopyLink}>
                复制
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
