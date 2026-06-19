import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  WaveType,
  ChannelKey,
  WAVE_COLORS,
  WAVE_LABELS,
  CHANNEL_COLORS,
  WaveParams,
} from '../types';
import { useWaveformStore } from '../store';
import {
  sliderToFrequency,
  frequencyToSlider,
} from '../utils/waveformEngine';

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  ch1: 'CH1',
  ch2: 'CH2',
  ch3: 'CH3',
  ch4: 'CH4',
};

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  formatValue: (v: number) => string;
  trackColor?: string;
  isLog?: boolean;
  logToVal?: (s: number) => number;
  valToLog?: (v: number) => number;
}

function StyledSlider({
  value,
  min = 0,
  max = 1,
  step = 0.001,
  onChange,
  label,
  formatValue,
  trackColor = '#2A2A3A',
  isLog = false,
  logToVal,
  valToLog,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const displayValue = isDragging ? formatValue(value) : formatValue(value);

  const sliderPos = isLog && valToLog ? valToLog(value) : (value - min) / (max - min);
  const percent = Math.max(0, Math.min(1, sliderPos)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseFloat(e.target.value);
      let v: number;
      if (isLog && logToVal) {
        v = logToVal(raw);
      } else {
        v = min + raw * (max - min);
      }
      onChange(v);
    },
    [onChange, min, max, isLog, logToVal],
  );

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
          fontSize: 12,
          color: '#B8C0CC',
        }}
      >
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            color: '#4FC3F7',
            fontSize: 11,
            background: 'rgba(79, 195, 247, 0.08)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {displayValue}
        </span>
      </div>
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 8,
            background: trackColor,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #4FC3F7, #0288D1)',
              borderRadius: 4,
              transition: isDragging ? 'none' : 'width 0.1s ease',
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={step}
          value={isLog && valToLog ? valToLog(value) : (value - min) / (max - min)}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: 28,
            margin: 0,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 10px)`,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%)',
            boxShadow: isDragging
              ? '0 0 12px rgba(79, 195, 247, 0.6), inset 0 1px 2px rgba(255,255,255,0.4)'
              : '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s ease, box-shadow 0.2s ease',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      </div>
    </div>
  );
}

interface WaveSelectProps {
  value: WaveType;
  onChange: (v: WaveType) => void;
  borderColor: string;
}

function WaveSelect({ value, onChange, borderColor }: WaveSelectProps) {
  const types = [WaveType.SINE, WaveType.SQUARE, WaveType.TRIANGLE, WaveType.SAWTOOTH];
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        marginBottom: 12,
        padding: 4,
        background: '#15192A',
        borderRadius: 8,
        border: `1px solid ${borderColor}33`,
      }}
    >
      {types.map((t) => {
        const isActive = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            title={WAVE_LABELS[t]}
            style={{
              flex: 1,
              height: 28,
              border: 'none',
              borderRadius: 6,
              background: isActive ? WAVE_COLORS[t] : 'transparent',
              color: isActive ? '#fff' : '#8B94A7',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            {t === WaveType.SINE && '∿'}
            {t === WaveType.SQUARE && '⊓'}
            {t === WaveType.TRIANGLE && '△'}
            {t === WaveType.SAWTOOTH && '⋰'}
          </button>
        );
      })}
    </div>
  );
}

interface KnobProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  size?: number;
}

function CircularKnob({ value, onChange, label, size = 80 }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);

  const minAngle = -135;
  const maxAngle = 135;
  const angle = minAngle + value * (maxAngle - minAngle);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const dy = -e.movementY;
      const delta = dy / 150;
      const next = Math.max(0, Math.min(1, value + delta));
      onChange(next);
    },
    [value, onChange],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const percent = Math.round(value * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          cursor: 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#2A2A3A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(270 / 360) * 2 * Math.PI * 42}`}
            strokeDashoffset={0}
            transform="rotate(135 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#knobGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(270 / 360) * 2 * Math.PI * 42}`}
            strokeDashoffset={`${((1 - value) * 270 / 360) * 2 * Math.PI * 42}`}
            transform="rotate(135 50 50)"
          />
          <defs>
            <linearGradient id="knobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4FC3F7" />
              <stop offset="100%" stopColor="#0288D1" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="#1A1D2E"
            stroke={isDragging ? '#4FC3F7' : '#3A3A4A'}
            strokeWidth="2"
            style={{ transition: 'stroke 0.2s ease' }}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="26"
            stroke={isDragging ? '#4FC3F7' : '#FFB74D'}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: 11,
          color: '#8B94A7',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 13,
          color: '#4FC3F7',
          fontWeight: 600,
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

interface ChannelCardProps {
  ch: ChannelKey;
  params: WaveParams;
}

function ChannelCard({ ch, params }: ChannelCardProps) {
  const setParam = useWaveformStore((s) => s.setChannelParam);
  const borderColor = WAVE_COLORS[params.type];
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 14,
        borderRadius: 12,
        background: '#141828',
        border: `2px solid ${hover ? borderColor : '#2A2A3A'}`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hover
          ? `0 0 18px ${borderColor}22, inset 0 0 20px ${borderColor}08`
          : 'none',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: params.enabled ? CHANNEL_COLORS[ch] : '#555',
              boxShadow: params.enabled ? `0 0 6px ${CHANNEL_COLORS[ch]}` : 'none',
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: params.enabled ? '#fff' : '#666',
            }}
          >
            {CHANNEL_LABELS[ch]}
          </span>
          <span style={{ fontSize: 11, color: '#8B94A7' }}>
            {WAVE_LABELS[params.type]}
          </span>
        </div>
        <button
          onClick={() => setParam(ch, 'enabled', !params.enabled)}
          style={{
            width: 36,
            height: 18,
            borderRadius: 9,
            border: 'none',
            cursor: 'pointer',
            background: params.enabled
              ? 'linear-gradient(90deg, #4FC3F7, #0288D1)'
              : '#2A2A3A',
            position: 'relative',
            transition: 'background 0.2s ease',
            padding: 0,
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: params.enabled ? 20 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      <WaveSelect
        value={params.type}
        onChange={(v) => setParam(ch, 'type', v)}
        borderColor={borderColor}
      />

      <StyledSlider
        label="频率 (Freq)"
        value={params.frequency}
        isLog
        logToVal={sliderToFrequency}
        valToLog={frequencyToSlider}
        onChange={(v) => setParam(ch, 'frequency', v)}
        formatValue={(v) => `${v >= 1000 ? (v / 1000).toFixed(2) + 'k' : v.toFixed(0)}Hz`}
      />

      <StyledSlider
        label="振幅 (Amp)"
        value={params.amplitude}
        onChange={(v) => setParam(ch, 'amplitude', v)}
        formatValue={(v) => v.toFixed(3)}
      />

      <StyledSlider
        label="相位 (Phase)"
        value={params.phase}
        min={0}
        max={360}
        onChange={(v) => setParam(ch, 'phase', v)}
        formatValue={(v) => `${v.toFixed(0)}°`}
      />

      {params.type === WaveType.SQUARE && (
        <StyledSlider
          label="占空比"
          value={params.dutyCycle}
          onChange={(v) => setParam(ch, 'dutyCycle', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}

      <StyledSlider
        label="噪声强度"
        value={params.noiseLevel}
        onChange={(v) => setParam(ch, 'noiseLevel', v)}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <StyledSlider
        label="混音比例"
        value={params.mix}
        onChange={(v) => setParam(ch, 'mix', v)}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    </motion.div>
  );
}

export function ControlPanel() {
  const ch1 = useWaveformStore((s) => s.ch1);
  const ch2 = useWaveformStore((s) => s.ch2);
  const ch3 = useWaveformStore((s) => s.ch3);
  const ch4 = useWaveformStore((s) => s.ch4);
  const masterMix = useWaveformStore((s) => s.masterMix);
  const setMasterMix = useWaveformStore((s) => s.setMasterMix);

  const channels: [ChannelKey, WaveParams][] = [
    ['ch1', ch1],
    ['ch2', ch2],
    ['ch3', ch3],
    ['ch4', ch4],
  ];

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: 280,
        minWidth: 280,
        background: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 14,
        overflowY: 'auto',
        overflowX: 'hidden',
        border: '1px solid #2A2A3A',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          paddingBottom: 8,
          borderBottom: '2px solid #3A3A4A',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: '#4FC3F7',
            letterSpacing: 1,
          }}
        >
          ◎ WAVEFORM CONTROLLER
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6B7280' }}>
          四通道信号发生器
        </p>
      </div>

      {channels.map(([key, params], i) => (
        <div key={key}>
          {i > 0 && (
            <div
              style={{
                height: 2,
                background: '#3A3A4A',
                marginBottom: 10,
              }}
            />
          )}
          <ChannelCard ch={key} params={params} />
        </div>
      ))}

      <div
        style={{
          padding: '14px 10px',
          background: 'linear-gradient(180deg, #15192A 0%, #0F1320 100%)',
          borderRadius: 12,
          border: '1px solid #2A2A3A',
          marginTop: 6,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#8B94A7',
            marginBottom: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          ⚙ MASTER OUTPUT
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CircularKnob
            value={masterMix}
            onChange={setMasterMix}
            label="总输出比例"
            size={96}
          />
        </div>
      </div>

      <div style={{ height: 12 }} />
    </motion.div>
  );
}
