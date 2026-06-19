import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toSvg } from 'html-to-image';
import { ControlPanel } from './components/ControlPanel';
import { WaveformCanvas } from './components/WaveformCanvas';
import { useWaveformStore } from './store';
import { TriggerMode, ChannelKey, CHANNEL_COLORS } from './types';
import {
  sliderToTimebase,
  timebaseToSlider,
} from './utils/waveformEngine';

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

interface ToolbarSliderProps {
  value: number;
  isLog?: boolean;
  logToVal?: (s: number) => number;
  valToLog?: (v: number) => number;
  onChange: (v: number) => void;
  label: string;
  formatValue: (v: number) => string;
  min?: number;
  max?: number;
}

function ToolbarSlider({
  value,
  isLog,
  logToVal,
  valToLog,
  onChange,
  label,
  formatValue,
  min = 0,
  max = 1,
}: ToolbarSliderProps) {
  const [dragging, setDragging] = useState(false);
  const sliderPos = isLog && valToLog ? valToLog(value) : (value - min) / (max - min);
  const percent = Math.max(0, Math.min(1, sliderPos)) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        background: '#141828',
        borderRadius: 8,
        border: '1px solid #2A2A3A',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: '#8B94A7',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          minWidth: 70,
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'relative',
          width: 180,
          height: 24,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            background: '#2A2A3A',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #4FC3F7, #0288D1)',
              borderRadius: 3,
              transition: dragging ? 'none' : 'width 0.1s ease',
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={sliderPos}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            const v = isLog && logToVal ? logToVal(raw) : min + raw * (max - min);
            onChange(v);
          }}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: 24,
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
            left: `calc(${percent}% - 8px)`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
            boxShadow: dragging
              ? '0 0 10px rgba(79,195,247,0.6)'
              : '0 2px 4px rgba(0,0,0,0.4)',
            transform: dragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s ease, box-shadow 0.2s ease',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#4FC3F7',
          fontWeight: 600,
          minWidth: 50,
          textAlign: 'right',
        }}
      >
        {formatValue(value)}
      </span>
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}

function ToggleButton({ active, onClick, children, color = '#4FC3F7' }: ToggleButtonProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '6px 14px',
        border: `1px solid ${active ? color : '#3A3A4A'}`,
        borderRadius: 6,
        background: active ? `${color}22` : '#1A1D2E',
        color: active ? color : '#B8C0CC',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  onClick,
  children,
  iconOnly = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  iconOnly?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: iconOnly ? '6px 10px' : '6px 14px',
        border: '1px solid #3A3A4A',
        borderRadius: 6,
        background: '#1A1D2E',
        color: '#B8C0CC',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const sampleRate = useWaveformStore((s) => s.sampleRate);
  const triggerMode = useWaveformStore((s) => s.triggerMode);
  const triggerSource = useWaveformStore((s) => s.triggerSource);
  const triggerLevel = useWaveformStore((s) => s.triggerLevel);
  const timeBase = useWaveformStore((s) => s.timeBase);
  const showIndividual = useWaveformStore((s) => s.showIndividualWaves);
  const showCursors = useWaveformStore((s) => s.showCursors);

  const setTriggerMode = useWaveformStore((s) => s.setTriggerMode);
  const setTriggerSource = useWaveformStore((s) => s.setTriggerSource);
  const setTriggerLevel = useWaveformStore((s) => s.setTriggerLevel);
  const setTimeBase = useWaveformStore((s) => s.setTimeBase);
  const toggleShowIndividual = useWaveformStore((s) => s.toggleShowIndividual);
  const toggleShowCursors = useWaveformStore((s) => s.toggleShowCursors);

  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const node = document.getElementById('canvasWrapper');
      if (!node) throw new Error('canvas not found');
      const dataUrl = await toSvg(node, {
        backgroundColor: '#0D1117',
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `waveform_${formatTimestamp()}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }, []);

  const triggerModes: { v: TriggerMode; label: string }[] = [
    { v: TriggerMode.AUTO, label: 'AUTO' },
    { v: TriggerMode.NORMAL, label: 'NORMAL' },
    { v: TriggerMode.SINGLE, label: 'SINGLE' },
  ];
  const sources: ChannelKey[] = ['ch1', 'ch2', 'ch3', 'ch4'];

  const panelContent = !isMobile || panelOpen ? <ControlPanel /> : null;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D1117',
        color: '#e6edf3',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          background: 'linear-gradient(180deg, #1A1D2E 0%, #15192A 100%)',
          borderBottom: '1px solid #2A2A3A',
          gap: 14,
        }}
      >
        {isMobile && (
          <button
            onClick={() => setPanelOpen((o) => !o)}
            style={{
              background: 'transparent',
              border: '1px solid #3A3A4A',
              color: '#fff',
              width: 32,
              height: 32,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginRight: 'auto',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 14,
              color: '#fff',
              boxShadow: '0 0 10px rgba(79,195,247,0.4)',
            }}
          >
            ∿
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
              WAVEFORM DEBUGGER
            </div>
            <div style={{ fontSize: 9, color: '#6B7280', marginTop: -2 }}>
              微型信号波形调试台
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'rgba(79,195,247,0.06)',
            border: '1px solid rgba(79,195,247,0.2)',
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#4FC3F7',
              boxShadow: '0 0 6px #4FC3F7',
            }}
          />
          <span style={{ fontSize: 10, color: '#8B94A7', marginRight: 4 }}>SR:</span>
          <span style={{ fontSize: 11, color: '#4FC3F7', fontWeight: 700 }}>
            {sampleRate} pts
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background:
              triggerMode === TriggerMode.AUTO
                ? 'rgba(129,199,132,0.06)'
                : triggerMode === TriggerMode.SINGLE
                  ? 'rgba(255,183,77,0.06)'
                  : 'rgba(79,195,247,0.06)',
            border: `1px solid ${
              triggerMode === TriggerMode.AUTO
                ? 'rgba(129,199,132,0.3)'
                : triggerMode === TriggerMode.SINGLE
                  ? 'rgba(255,183,77,0.3)'
                  : 'rgba(79,195,247,0.2)'
            }`,
            borderRadius: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background:
                triggerMode === TriggerMode.AUTO
                  ? '#81C784'
                  : triggerMode === TriggerMode.SINGLE
                    ? '#FFB74D'
                    : '#4FC3F7',
              boxShadow: `0 0 6px ${
                triggerMode === TriggerMode.AUTO
                  ? '#81C784'
                  : triggerMode === TriggerMode.SINGLE
                    ? '#FFB74D'
                    : '#4FC3F7'
              }`,
            }}
          />
          <span style={{ fontSize: 10, color: '#8B94A7', marginRight: 4 }}>TRG:</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color:
                triggerMode === TriggerMode.AUTO
                  ? '#81C784'
                  : triggerMode === TriggerMode.SINGLE
                    ? '#FFB74D'
                    : '#4FC3F7',
            }}
          >
            {triggerMode.toUpperCase()}
          </span>
        </div>

        <ToolbarButton onClick={toggleShowIndividual}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: showIndividual ? '#81C784' : '#555',
            }}
          />
          {!isMobile && (showIndividual ? '隐藏分波' : '显示分波')}
        </ToolbarButton>

        <ToolbarButton onClick={toggleShowCursors}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: showCursors ? '#FFB74D' : '#555',
            }}
          />
          {!isMobile && (showCursors ? '隐藏游标' : '测量游标')}
        </ToolbarButton>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '7px 16px',
            border: 'none',
            borderRadius: 6,
            background: exporting
              ? '#2A2A3A'
              : 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: exporting ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            transform: exporting ? 'scale(1)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: exporting ? 'none' : '0 2px 10px rgba(79,195,247,0.3)',
            fontFamily: 'inherit',
          }}
          onMouseDown={(e) => {
            if (!exporting) (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          {exporting ? (
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            '⬇'
          )}
          {!isMobile && (exporting ? '导出中...' : '导出 SVG')}
        </button>
      </motion.div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isMobile ? (
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, maxHeight: '60vh' }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  flexShrink: 0,
                  overflow: 'hidden',
                  padding: 10,
                }}
              >
                {panelContent}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div
            style={{
              padding: '10px 0 10px 10px',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {panelContent}
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 10,
            gap: 10,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <WaveformCanvas />
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(20,20,30,0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              border: '1px solid #2A2A3A',
            }}
          >
            <ToolbarSlider
              label="时基 (Time/Div)"
              value={timeBase}
              isLog
              logToVal={sliderToTimebase}
              valToLog={timebaseToSlider}
              onChange={setTimeBase}
              formatValue={(v) => `${v.toFixed(1)} ms`}
            />

            <div
              style={{
                width: 2,
                height: 36,
                background: '#3A3A4A',
                borderRadius: 1,
                margin: '0 4px',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: '#6B7280',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  paddingLeft: 2,
                }}
              >
                TRIGGER MODE
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {triggerModes.map(({ v, label }) => (
                  <ToggleButton
                    key={v}
                    active={triggerMode === v}
                    onClick={() => setTriggerMode(v)}
                  >
                    {isMobile ? label.slice(0, 1) : label}
                  </ToggleButton>
                ))}
              </div>
            </div>

            <div
              style={{
                width: 2,
                height: 36,
                background: '#3A3A4A',
                borderRadius: 1,
                margin: '0 4px',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: '#6B7280',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  paddingLeft: 2,
                }}
              >
                SOURCE
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {sources.map((s) => (
                  <ToggleButton
                    key={s}
                    active={triggerSource === s}
                    onClick={() => setTriggerSource(s)}
                    color={CHANNEL_COLORS[s]}
                  >
                    {s.toUpperCase()}
                  </ToggleButton>
                ))}
              </div>
            </div>

            <div
              style={{
                width: 2,
                height: 36,
                background: '#3A3A4A',
                borderRadius: 1,
                margin: '0 4px',
              }}
            />

            <ToolbarSlider
              label="触发电平"
              value={triggerLevel}
              min={-1}
              max={1}
              onChange={setTriggerLevel}
              formatValue={(v) => `${v.toFixed(2)}V`}
            />
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0D1117;
        }
        ::-webkit-scrollbar-thumb {
          background: #2A2A3A;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3A3A4A;
        }
      `}</style>
    </div>
  );
}
