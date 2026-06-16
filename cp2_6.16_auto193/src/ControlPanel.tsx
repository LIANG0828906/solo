import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, Volume2, Clock, Filter } from 'lucide-react';

interface ControlPanelProps {
  isRecording: boolean;
  isPlaying: boolean;
  reverb: number;
  delayTime: number;
  lowpassFreq: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  onReverbChange: (value: number) => void;
  onDelayChange: (value: number) => void;
  onLowpassChange: (value: number) => void;
  onPlay: () => void;
  onStop: () => void;
  currentFileName?: string;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon: React.ReactNode;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  icon,
  onChange,
  formatValue,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#58A6FF', fontSize: '16px' }}>{icon}</span>
          <span style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: 500 }}>{label}</span>
        </div>
        <span style={{
          color: '#58A6FF',
          fontSize: '13px',
          fontVariantNumeric: 'tabular-nums',
          backgroundColor: '#1A202C',
          padding: '2px 8px',
          borderRadius: '4px',
          opacity: isHovered ? 1 : 0.8,
          transition: 'opacity 0.2s',
        }}>
          {formatValue ? formatValue(value) : value}{unit}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: '6px',
          backgroundColor: '#1A202C',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #58A6FF, #1E90FF)',
            borderRadius: '3px',
            transition: 'width 0.1s ease-out',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${percentage}%`,
            transform: 'translate(-50%, -50%)',
            width: isHovered ? '16px' : '12px',
            height: isHovered ? '16px' : '12px',
            backgroundColor: '#58A6FF',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(88, 166, 255, 0.5)',
            transition: 'width 0.2s, height 0.2s',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRecording,
  isPlaying,
  reverb,
  delayTime,
  lowpassFreq,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onReverbChange,
  onDelayChange,
  onLowpassChange,
  onPlay,
  onStop,
  currentFileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return (freq / 1000).toFixed(1) + 'k';
    }
    return freq.toString();
  };

  const formatDelay = (delay: number): string => {
    return delay.toFixed(2);
  };

  return (
    <div style={{
      backgroundColor: '#1A202C',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #2D3748',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#E2E8F0',
        margin: '0 0 20px 0',
      }}>
        控制面板
      </h3>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
      }}>
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isRecording ? '#6B7280' : '#FF3B30',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, background-color 0.2s',
            boxShadow: isRecording 
              ? '0 0 20px rgba(255, 59, 48, 0)' 
              : '0 0 20px rgba(255, 59, 48, 0.4)',
            animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={isRecording ? '停止录音' : '开始录音'}
        >
          {isRecording ? (
            <Square size={24} fill="white" />
          ) : (
            <Mic size={24} />
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#2D3748',
            color: '#E2E8F0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, background-color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#3D4A5C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#2D3748';
          }}
          title="上传音频文件"
        >
          <Upload size={22} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mp3,audio/ogg,audio/mpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {currentFileName && (
        <div style={{
          backgroundColor: '#0D1117',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '20px',
          border: '1px solid #2D3748',
          fontSize: '13px',
          color: '#9CA3AF',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🎵 {currentFileName}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#9CA3AF',
          margin: '0 0 12px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          音效调节
        </h4>

        <Slider
          label="混响强度"
          value={reverb}
          min={0}
          max={100}
          unit="%"
          icon={<Volume2 size={16} />}
          onChange={onReverbChange}
        />

        <Slider
          label="延迟时间"
          value={delayTime}
          min={0}
          max={2}
          step={0.01}
          unit="s"
          icon={<Clock size={16} />}
          onChange={onDelayChange}
          formatValue={formatDelay}
        />

        <Slider
          label="低通滤波"
          value={lowpassFreq}
          min={20}
          max={20000}
          step={10}
          unit="Hz"
          icon={<Filter size={16} />}
          onChange={onLowpassChange}
          formatValue={formatFrequency}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(255, 59, 48, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
