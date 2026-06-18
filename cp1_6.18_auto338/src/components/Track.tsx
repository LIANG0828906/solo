import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Track, EffectType } from '../store/audioStore';
import { COLOR_PALETTE } from '../store/audioStore';
import { WaveformRenderer } from '../audio/waveformRenderer';
import { audioEngine } from '../audio/audioEngine';

interface TrackProps {
  track: Track;
  onTitleChange: (id: string, title: string) => void;
  onColorChange: (id: string, color: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onClipChange: (id: string, start: number, end: number) => void;
  onFileUpload: (id: string, file: File) => void;
  onEffectTypeChange: (trackId: string, slotId: string, type: EffectType) => void;
  onEffectEnabledChange: (trackId: string, slotId: string, enabled: boolean) => void;
  onEffectPositionChange: (trackId: string, slotId: string, position: 'pre' | 'post') => void;
  onEffectParamChange: (trackId: string, slotId: string, param: string, value: number) => void;
}

const EFFECT_TYPES: { value: EffectType; label: string }[] = [
  { value: 'none', label: '无效果' },
  { value: 'lowcut', label: '低切滤波' },
  { value: 'reverb', label: '混响' },
  { value: 'delay', label: '延迟' },
  { value: 'compressor', label: '压缩器' }
];

const TrackComponent: React.FC<TrackProps> = ({
  track,
  onTitleChange,
  onColorChange,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onClipChange,
  onFileUpload,
  onEffectTypeChange,
  onEffectEnabledChange,
  onEffectPositionChange,
  onEffectParamChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WaveformRenderer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new WaveformRenderer(canvasRef.current);
      rendererRef.current.setColor(track.color);
      setTimeout(() => rendererRef.current?.resize(), 0);
    }

    return () => {
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColor(track.color);
    }
  }, [track.color]);

  useEffect(() => {
    if (rendererRef.current && track.duration > 0) {
      rendererRef.current.setClipRange(track.clipStart, track.clipEnd, track.duration);
    }
  }, [track.clipStart, track.clipEnd, track.duration]);

  useEffect(() => {
    if (track.audioBufferId) {
      const buffer = audioEngine.getBuffer(track.audioBufferId);
      if (buffer && rendererRef.current) {
        rendererRef.current.loadAudioBuffer(buffer);
      }
    }
  }, [track.audioBufferId]);

  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'audio/mpeg' && file.size <= 15 * 1024 * 1024) {
      onFileUpload(track.id, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [track.id, onFileUpload]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current || track.duration === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPos = rendererRef.current.getClipPositionFromX(x);

    const startDist = Math.abs(clickPos - track.clipStart);
    const endDist = Math.abs(clickPos - track.clipEnd);

    if (startDist < endDist && startDist < track.duration * 0.05) {
      setIsDragging('start');
    } else if (endDist < track.duration * 0.05) {
      setIsDragging('end');
    }
  }, [track.clipStart, track.clipEnd, track.duration]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !rendererRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = rendererRef.current.getClipPositionFromX(x);

    const minDuration = 1;

    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(position, track.clipEnd - minDuration));
      onClipChange(track.id, newStart, track.clipEnd);
    } else if (isDragging === 'end') {
      const newEnd = Math.min(track.duration, Math.max(position, track.clipStart + minDuration));
      onClipChange(track.id, track.clipStart, newEnd);
    }
  }, [isDragging, track.id, track.clipStart, track.clipEnd, track.duration, onClipChange]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const clipDuration = track.clipEnd - track.clipStart;

  return (
    <div
      className="track-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="track-main">
        <div className="track-info">
          <div
            className="color-indicator"
            style={{ backgroundColor: track.color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          <input
            type="text"
            className="track-title-input"
            value={track.title}
            onChange={(e) => onTitleChange(track.id, e.target.value)}
          />
          {showColorPicker && (
            <div className="color-picker-popup">
              {COLOR_PALETTE.map((color) => (
                <div
                  key={color}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onColorChange(track.id, color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="track-controls-col">
          <div className="volume-slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={track.volume}
              onChange={(e) => onVolumeChange(track.id, Number(e.target.value))}
              className="volume-slider-v"
            />
          </div>
          <span className="volume-label">{track.volume}</span>
        </div>

        <div className="track-buttons-col">
          <button
            className={`mute-button ${track.muted ? 'active' : ''}`}
            onClick={() => onMuteToggle(track.id)}
            title="静音"
          >
            M
          </button>
          <button
            className={`solo-button ${track.solo ? 'active' : ''}`}
            onClick={() => onSoloToggle(track.id)}
            title="独奏"
          >
            S
          </button>
        </div>

        <div className="waveform-area">
          <canvas
            ref={canvasRef}
            className="waveform-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            {track.audioBufferId ? '更换音频' : '上传MP3'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {track.duration > 0 && (
            <span className="clip-duration-label">
              {clipDuration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      <div className="effects-row">
        <span className="effects-label">效果插槽</span>
        <div className="effect-slots-row">
          {track.effectSlots.map((slot, index) => (
            <div key={slot.id} className="effect-slot-card">
              <div className="effect-slot-head">
                <span className="slot-num">插槽{index + 1}</span>
                <div className="pos-toggle">
                  <button
                    className={`pos-btn ${slot.position === 'pre' ? 'active' : ''}`}
                    onClick={() => onEffectPositionChange(track.id, slot.id, 'pre')}
                  >
                    推子前
                  </button>
                  <button
                    className={`pos-btn ${slot.position === 'post' ? 'active' : ''}`}
                    onClick={() => onEffectPositionChange(track.id, slot.id, 'post')}
                  >
                    推子后
                  </button>
                </div>
              </div>

              <div className="effect-slot-body">
                <select
                  className="effect-type-select"
                  value={slot.type}
                  onChange={(e) => onEffectTypeChange(track.id, slot.id, e.target.value as EffectType)}
                >
                  {EFFECT_TYPES.map((effect) => (
                    <option key={effect.value} value={effect.value}>
                      {effect.label}
                    </option>
                  ))}
                </select>

                {slot.type !== 'none' && (
                  <div className="effect-params">
                    <label className="enable-switch">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => onEffectEnabledChange(track.id, slot.id, e.target.checked)}
                      />
                      <span className="switch-track" />
                      <span className="switch-text">{slot.enabled ? '开启' : '关闭'}</span>
                    </label>

                    {slot.type === 'lowcut' && (
                      <div className="param-row">
                        <span className="param-label">截止频率</span>
                        <input
                          type="range"
                          min="20"
                          max="500"
                          step="1"
                          value={slot.params.cutoff || 200}
                          onChange={(e) => onEffectParamChange(track.id, slot.id, 'cutoff', Number(e.target.value))}
                          className="param-slider"
                        />
                        <span className="param-value">{slot.params.cutoff || 200}Hz</span>
                      </div>
                    )}

                    {slot.type === 'reverb' && (
                      <div className="param-row">
                        <span className="param-label">干湿比</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={slot.params.wetDry || 30}
                          onChange={(e) => onEffectParamChange(track.id, slot.id, 'wetDry', Number(e.target.value))}
                          className="param-slider"
                        />
                        <span className="param-value">{slot.params.wetDry || 30}%</span>
                      </div>
                    )}

                    {slot.type === 'delay' && (
                      <div className="param-row">
                        <span className="param-label">反馈量</span>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="1"
                          value={slot.params.feedback || 30}
                          onChange={(e) => onEffectParamChange(track.id, slot.id, 'feedback', Number(e.target.value))}
                          className="param-slider"
                        />
                        <span className="param-value">{slot.params.feedback || 30}%</span>
                      </div>
                    )}

                    {slot.type === 'compressor' && (
                      <div className="param-row">
                        <span className="param-label">阈值</span>
                        <input
                          type="range"
                          min="-30"
                          max="0"
                          step="1"
                          value={slot.params.threshold || -12}
                          onChange={(e) => onEffectParamChange(track.id, slot.id, 'threshold', Number(e.target.value))}
                          className="param-slider"
                        />
                        <span className="param-value">{slot.params.threshold || -12}dB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .track-wrapper {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #3D3D3D;
          background-color: ${isHovered ? '#2A2A2A' : '#1E1E1E'};
          transition: background-color 0.2s ease;
        }

        .track-main {
          height: 80px;
          display: flex;
          align-items: stretch;
        }

        .track-info {
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-right: 1px solid #333333;
          position: relative;
          flex-shrink: 0;
        }

        .color-indicator {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #333333;
          transition: transform 0.1s ease;
        }

        .color-indicator:hover {
          transform: scale(1.2);
        }

        .color-indicator:active {
          transform: scale(0.95);
        }

        .track-title-input {
          width: 100%;
          background: #2D2D2D;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 4px 6px;
          font-size: 12px;
          border-radius: 4px;
          text-align: center;
          outline: none;
          font-family: inherit;
        }

        .track-title-input:focus {
          border-color: #4ECDC4;
        }

        .color-picker-popup {
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          margin-left: 4px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 8px;
          background: #2D2D2D;
          border: 1px solid #333333;
          border-radius: 6px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .color-option {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .color-option:hover {
          transform: scale(1.15);
        }

        .track-controls-col {
          width: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 4px;
          border-right: 1px solid #333333;
          flex-shrink: 0;
        }

        .volume-slider-wrapper {
          height: 40px;
          display: flex;
          align-items: center;
        }

        .volume-slider-v {
          width: 40px;
          height: 6px;
          writing-mode: vertical-lr;
          direction: rtl;
          appearance: slider-vertical;
        }

        .volume-slider-v::-webkit-slider-track {
          width: 4px;
          height: 40px;
        }

        .volume-slider-v::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          margin-left: -4px;
        }

        .volume-label {
          font-size: 10px;
          color: #888888;
        }

        .track-buttons-col {
          width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 4px;
          border-right: 1px solid #333333;
          flex-shrink: 0;
        }

        .mute-button, .solo-button {
          width: 26px;
          height: 26px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          background: #333333;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mute-button.active {
          background: #F44336;
        }

        .solo-button.active {
          background: #FFEB3B;
          color: #121212;
        }

        .waveform-area {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          padding: 8px;
          min-width: 200px;
        }

        .waveform-canvas {
          width: 100%;
          height: 60px;
          border-radius: 4px;
          cursor: ew-resize;
        }

        .upload-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          padding: 5px 12px;
          background: #4ECDC4;
          color: #121212;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-family: inherit;
        }

        .track-wrapper:hover .upload-button {
          opacity: 1;
        }

        .clip-duration-label {
          position: absolute;
          right: 12px;
          bottom: 4px;
          font-size: 10px;
          color: #888888;
        }

        .effects-row {
          display: flex;
          align-items: stretch;
          padding: 8px;
          gap: 12px;
          background: #1A1A1A;
          border-top: 1px solid #333333;
        }

        .effects-label {
          writing-mode: vertical-lr;
          text-orientation: mixed;
          font-size: 10px;
          color: #666666;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          letter-spacing: 1px;
        }

        .effect-slots-row {
          flex: 1;
          display: flex;
          gap: 8px;
        }

        .effect-slot-card {
          flex: 1;
          min-width: 0;
          background: #252525;
          border: 1px solid #333333;
          border-radius: 6px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .effect-slot-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slot-num {
          font-size: 10px;
          color: #888888;
          font-weight: 500;
        }

        .pos-toggle {
          display: flex;
          gap: 2px;
        }

        .pos-btn {
          padding: 2px 6px;
          font-size: 9px;
          background: #333333;
          color: #999999;
          border-radius: 3px;
          font-family: inherit;
        }

        .pos-btn.active {
          background: #4ECDC4;
          color: #121212;
        }

        .effect-slot-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .effect-type-select {
          width: 100%;
          background: #333333;
          border: none;
          color: #ffffff;
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 4px;
          outline: none;
          font-family: inherit;
        }

        .effect-params {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .enable-switch {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 10px;
          color: #999999;
        }

        .enable-switch input {
          display: none;
        }

        .switch-track {
          position: relative;
          width: 28px;
          height: 14px;
          background: #555555;
          border-radius: 7px;
          transition: background-color 0.2s ease;
        }

        .switch-track:before {
          position: absolute;
          content: "";
          height: 10px;
          width: 10px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }

        .enable-switch input:checked + .switch-track {
          background-color: #4CAF50;
        }

        .enable-switch input:checked + .switch-track:before {
          transform: translateX(14px);
        }

        .switch-text {
          font-size: 10px;
        }

        .param-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .param-label {
          font-size: 10px;
          color: #888888;
          min-width: 48px;
          flex-shrink: 0;
        }

        .param-slider {
          flex: 1;
          min-width: 0;
          height: 16px;
        }

        .param-value {
          font-size: 10px;
          color: #ffffff;
          min-width: 40px;
          text-align: right;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default TrackComponent;
