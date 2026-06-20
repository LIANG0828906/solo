import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore, ThemeName } from '../store/usePlayerStore';

interface PlayerUIProps {
  visualContainerRef: React.RefObject<HTMLDivElement>;
  onSeek: (time: number) => void;
  onExportGif: () => void;
}

const THEME_LABELS: { key: ThemeName; label: string }[] = [
  { key: 'flame', label: '火焰' },
  { key: 'aurora', label: '极光' },
  { key: 'neon', label: '霓虹' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerUI({ visualContainerRef, onSeek, onExportGif }: PlayerUIProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const audioFile = usePlayerStore((s) => s.audioFile);
  const audioData = usePlayerStore((s) => s.audioData);
  const theme = usePlayerStore((s) => s.theme);
  const particleDensity = usePlayerStore((s) => s.particleDensity);
  const waveSensitivity = usePlayerStore((s) => s.waveSensitivity);
  const rotationSpeed = usePlayerStore((s) => s.rotationSpeed);
  const isExporting = usePlayerStore((s) => s.isExporting);
  const exportProgress = usePlayerStore((s) => s.exportProgress);

  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setAudioFile = usePlayerStore((s) => s.setAudioFile);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const setParticleDensity = usePlayerStore((s) => s.setParticleDensity);
  const setWaveSensitivity = usePlayerStore((s) => s.setWaveSensitivity);
  const setRotationSpeed = usePlayerStore((s) => s.setRotationSpeed);
  const resetParticleDensity = usePlayerStore((s) => s.resetParticleDensity);
  const resetWaveSensitivity = usePlayerStore((s) => s.resetWaveSensitivity);
  const resetRotationSpeed = usePlayerStore((s) => s.resetRotationSpeed);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (file) {
        setAudioFile(file);
        setPlaying(false);
      }
    },
    [setAudioFile, setPlaying]
  );

  const progress =
    audioData.duration > 0
      ? (audioData.currentTime / audioData.duration) * 100
      : 0;

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const freqBars = audioData.frequencies.slice(0, 64);

  return (
    <div style={styles.root}>
      <div style={styles.player} data-player>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel} data-left-panel>
          {/* File Upload */}
          <div
            style={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav"
              style={styles.hiddenInput}
              onChange={handleFileChange}
            />
            {audioFile ? (
              <span style={styles.fileName}>{audioFile.name}</span>
            ) : (
              <span style={styles.uploadText}>📁 点击上传音频</span>
            )}
          </div>

          {/* Theme Switch */}
          <div style={styles.themeRow}>
            {THEME_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  ...styles.themeBtn,
                  ...(theme === key ? styles.themeBtnActive : styles.themeBtnInactive),
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div style={styles.slidersContainer}>
            <SliderControl
              label="粒子密度"
              value={particleDensity}
              min={5}
              max={50}
              step={1}
              onInput={setParticleDensity}
              onReset={resetParticleDensity}
            />
            <SliderControl
              label="波形灵敏度"
              value={waveSensitivity}
              min={1}
              max={5}
              step={0.1}
              onInput={setWaveSensitivity}
              onReset={resetWaveSensitivity}
            />
            <SliderControl
              label="旋转速度"
              value={rotationSpeed}
              min={0}
              max={2}
              step={0.1}
              onInput={setRotationSpeed}
              onReset={resetRotationSpeed}
            />
          </div>

          {/* Play / Pause */}
          <button
            style={styles.playBtn}
            onClick={() => setPlaying(!isPlaying)}
            data-play-btn
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel} data-right-panel>
          {/* Circular Waveform Preview */}
          <div style={styles.waveformOverlay}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              style={{ display: 'block' }}
            >
              {freqBars.map((v, i) => {
                const angle = (i / freqBars.length) * Math.PI * 2 - Math.PI / 2;
                const barLen = 4 + (v / 255) * 14;
                const cx = 40;
                const cy = 40;
                const r1 = 20;
                const r2 = 20 + barLen;
                return (
                  <line
                    key={i}
                    x1={cx + Math.cos(angle) * r1}
                    y1={cy + Math.sin(angle) * r1}
                    x2={cx + Math.cos(angle) * r2}
                    y2={cy + Math.sin(angle) * r2}
                    stroke="#00d4ff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity={0.5 + (v / 255) * 0.5}
                  />
                );
              })}
            </svg>
          </div>

          {/* Export Button */}
          <button
            style={styles.exportBtn}
            onClick={onExportGif}
          >
            {isExporting ? `导出中 ${exportProgress}%` : '导出GIF'}
          </button>

          {/* Export Progress */}
          {isExporting && (
            <div style={styles.exportProgressWrap}>
              <div
                style={{
                  ...styles.exportProgressBar,
                  width: `${exportProgress}%`,
                }}
              />
            </div>
          )}

          {/* Three.js mount point */}
          <div
            ref={visualContainerRef}
            style={styles.visualMount}
          />

          {/* Top overlay - Progress + Time */}
          <div style={styles.topOverlay}>
            <svg width="68" height="68" style={{ display: 'block' }}>
              <circle
                cx="34"
                cy="34"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="34"
                cy="34"
                r="28"
                fill="none"
                stroke="url(#progressGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 34 34)"
              />
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#0088ff" />
                </linearGradient>
              </defs>
            </svg>
            <span style={styles.timeText}>
              {formatTime(audioData.currentTime)} / {formatTime(audioData.duration)}
            </span>
          </div>

          {/* Bottom overlay - Seek bar */}
          <div style={styles.bottomOverlay}>
            <div
              style={styles.seekTrack}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                if (audioData.duration > 0) {
                  onSeek(pct * audioData.duration);
                }
              }}
            >
              <div style={{ ...styles.seekFill, width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <style>{responsiveCSS}</style>
    </div>
  );
}

/* ── Slider sub-component ─────────────────────────────────── */

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onInput: (v: number) => void;
  onReset: () => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onInput,
  onReset,
}: SliderControlProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={styles.sliderGroup}>
      <div style={styles.sliderHeader}>
        <span style={styles.sliderLabel}>{label}</span>
        <span style={styles.sliderValue}>{value}</span>
        <button style={styles.resetBtn} onClick={onReset} title="重置">
          ⟳
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onInput(Number((e.target as HTMLInputElement).value))}
        style={{
          ...styles.slider,
          background: `linear-gradient(to right, #00d4ff 0%, #0088ff ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
        }}
      />
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a1a, #1a0a2e)',
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#fff',
  },

  player: {
    maxWidth: 900,
    width: '100%',
    height: 600,
    display: 'flex',
    flexDirection: 'row' as const,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(15px)',
    border: '2px solid #ffffff15',
    borderRadius: 24,
    overflow: 'hidden',
  },

  leftPanel: {
    width: 280,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    overflowY: 'auto' as const,
  },

  uploadArea: {
    border: '2px dashed rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: '18px 12px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },

  hiddenInput: {
    display: 'none',
  },

  fileName: {
    fontSize: 13,
    color: '#00d4ff',
    wordBreak: 'break-all' as const,
  },

  uploadText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  themeRow: {
    display: 'flex',
    gap: 8,
  },

  themeBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  themeBtnActive: {
    background: 'linear-gradient(135deg, #00d4ff, #0088ff)',
    boxShadow: '0 0 12px rgba(0,212,255,0.4)',
  },

  themeBtnInactive: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
  },

  slidersContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  },

  sliderGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },

  sliderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  sliderLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },

  sliderValue: {
    fontSize: 12,
    color: '#00d4ff',
    minWidth: 28,
    textAlign: 'right' as const,
  },

  resetBtn: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: '20px',
    transition: 'background 0.2s',
  },

  slider: {
    width: '100%',
    height: 4,
    appearance: 'none' as never,
    outline: 'none',
    borderRadius: 2,
    cursor: 'pointer',
  },

  playBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff, #0088ff)',
    color: '#fff',
    fontSize: 22,
    cursor: 'pointer',
    alignSelf: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '56px',
  },

  rightPanel: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: '0 24px 24px 0',
  },

  waveformOverlay: {
    position: 'absolute' as const,
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 3,
    pointerEvents: 'none' as const,
  },

  exportBtn: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    zIndex: 4,
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.4)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  exportProgressWrap: {
    position: 'absolute' as const,
    top: 44,
    left: 12,
    width: 120,
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    zIndex: 4,
    overflow: 'hidden',
  },

  exportProgressBar: {
    height: '100%',
    borderRadius: 2,
    background: 'linear-gradient(90deg, #00d4ff, #0088ff)',
    transition: 'width 0.2s',
  },

  visualMount: {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 1,
  },

  topOverlay: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 3,
    pointerEvents: 'none' as const,
  },

  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    whiteSpace: 'nowrap' as const,
  },

  bottomOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0 16px 12px',
    zIndex: 3,
  },

  seekTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },

  seekFill: {
    height: '100%',
    borderRadius: 2,
    background: 'linear-gradient(90deg, #00d4ff, #0088ff)',
    transition: 'width 0.1s',
  },
};

/* ── Responsive CSS ───────────────────────────────────────── */

const responsiveCSS = `
@media (max-width: 768px) {
  [data-player] {
    flex-direction: column !important;
    height: auto !important;
    max-height: 100vh !important;
  }
  [data-left-panel] {
    width: 100% !important;
    flex-shrink: 0;
    border-radius: 24px 24px 0 0 !important;
  }
  [data-right-panel] {
    height: 400px !important;
    border-radius: 0 0 24px 24px !important;
  }
}

/* Range input cross-browser styling */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00d4ff;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(0,212,255,0.6);
}
input[type=range]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00d4ff;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 6px rgba(0,212,255,0.6);
}

/* Button hover / active effects */
button:hover {
  transform: scale(1.05);
}
button:active {
  transform: scale(0.98);
}
[data-play-btn]:hover {
  box-shadow: 0 0 20px rgba(0,212,255,0.5);
}
`;
