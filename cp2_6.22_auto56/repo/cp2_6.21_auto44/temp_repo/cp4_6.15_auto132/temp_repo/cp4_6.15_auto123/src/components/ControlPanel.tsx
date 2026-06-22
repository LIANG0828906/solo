import { useState, useEffect, useRef } from 'react';
import type { TerrainParams } from '../utils/terrainGenerator';

interface ControlPanelProps {
  params: TerrainParams;
  onParamsChange: (params: TerrainParams) => void;
  onExport: () => void;
  onRegenerate: () => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
  icon?: string;
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '', icon }: SliderProps) {
  const [showValue, setShowValue] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onChange(v);
    setShowValue(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => setShowValue(false), 900);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div className="slider-wrap">
      <div className="slider-header">
        <div className="slider-label">
          {icon && <span className="slider-icon">{icon}</span>}
          <span>{label}</span>
        </div>
        <div
          className={`slider-value ${showValue ? 'visible' : ''} ${isDragging ? 'dragging' : ''}`}
        >
          {value}
          {unit}
        </div>
      </div>
      <div className="slider-track-wrap" ref={rangeRef}>
        <div className="slider-track-bg" />
        <div
          className="slider-track-fill"
          ref={trackRef}
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onInput={handleInput}
          onChange={handleInput}
          onMouseDown={() => {
            setIsDragging(true);
            setShowValue(true);
          }}
          onMouseUp={() => {
            setIsDragging(false);
            if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = window.setTimeout(() => setShowValue(false), 700);
          }}
          onTouchStart={() => {
            setIsDragging(true);
            setShowValue(true);
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = window.setTimeout(() => setShowValue(false), 700);
          }}
        />
      </div>
      <style>{`
        .slider-wrap {
          margin-bottom: 22px;
          position: relative;
        }
        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 13px;
          letter-spacing: 0.3px;
        }
        .slider-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d4ddee;
          font-weight: 500;
        }
        .slider-icon {
          font-size: 15px;
          opacity: 0.85;
        }
        .slider-value {
          background: linear-gradient(135deg, rgba(100, 180, 255, 0.25), rgba(140, 120, 255, 0.22));
          border: 1px solid rgba(140, 180, 255, 0.35);
          color: #e8f2ff;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          min-width: 48px;
          text-align: center;
          opacity: 0;
          transform: translateY(4px) scale(0.92);
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(8px);
        }
        .slider-value.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .slider-value.dragging {
          background: linear-gradient(135deg, rgba(120, 200, 255, 0.38), rgba(160, 140, 255, 0.34));
          box-shadow: 0 0 14px rgba(120, 180, 255, 0.35);
          border-color: rgba(180, 210, 255, 0.55);
        }
        .slider-track-wrap {
          position: relative;
          height: 28px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .slider-track-bg {
          position: absolute;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: rgba(22, 32, 50, 0.72);
          border: 1px solid rgba(90, 120, 170, 0.18);
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        .slider-track-fill {
          position: absolute;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(90deg, #4d9bff, #8a6bff 60%, #c97bff);
          box-shadow: 0 0 10px rgba(100, 140, 255, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: width 0.08s linear;
        }
        .slider-track-wrap input[type='range'] {
          position: absolute;
          width: 100%;
          height: 28px;
          margin: 0;
          padding: 0;
          background: transparent;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          z-index: 2;
        }
        .slider-track-wrap input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(145deg, #ffffff, #d8e3f2);
          border: 2px solid #4d9bff;
          box-shadow: 0 2px 8px rgba(77, 155, 255, 0.5), 0 0 0 4px rgba(77, 155, 255, 0.15);
          cursor: grab;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slider-track-wrap input[type='range']:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.22);
          box-shadow: 0 3px 12px rgba(77, 155, 255, 0.65), 0 0 0 6px rgba(77, 155, 255, 0.22);
        }
        .slider-track-wrap input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(145deg, #ffffff, #d8e3f2);
          border: 2px solid #4d9bff;
          box-shadow: 0 2px 8px rgba(77, 155, 255, 0.5);
          cursor: grab;
        }
      `}</style>
    </div>
  );
}

export default function ControlPanel({
  params,
  onParamsChange,
  onExport,
  onRegenerate,
}: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!exportBtnRef.current) return;
    const rect = exportBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipple({ x, y, id });
    setExporting(true);
    window.setTimeout(() => {
      setRipple(null);
      setExporting(false);
      onExport();
    }, 520);
  };

  const handleParamChange = <K extends keyof TerrainParams>(key: K, value: TerrainParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className={`panel-container ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '展开面板' : '折叠面板'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          {collapsed ? (
            <polyline points="15 18 9 12 15 6" />
          ) : (
            <polyline points="9 18 15 12 9 6" />
          )}
        </svg>
      </button>

      <div className="panel-glass">
        <div className="panel-header">
          <div className="logo-row">
            <div className="logo-dot" />
            <h1 className="panel-title">深渊回响</h1>
          </div>
          <div className="panel-subtitle">体素世界生成器 · v1.0</div>
        </div>

        <div className="panel-divider" />

        <div className="panel-section-title">地形参数</div>

        <Slider
          label="地形起伏度"
          icon="⛰️"
          value={params.amplitude}
          min={0}
          max={100}
          onChange={(v) => handleParamChange('amplitude', v)}
        />
        <Slider
          label="树木密度"
          icon="🌲"
          value={params.treeDensity}
          min={0}
          max={100}
          onChange={(v) => handleParamChange('treeDensity', v)}
        />
        <Slider
          label="水体覆盖比"
          icon="🌊"
          value={params.waterRatio}
          min={0}
          max={100}
          onChange={(v) => handleParamChange('waterRatio', v)}
        />
        <Slider
          label="洞穴复杂度"
          icon="🕳️"
          value={params.caveComplexity}
          min={0}
          max={3}
          step={1}
          onChange={(v) => handleParamChange('caveComplexity', v)}
        />

        <div className="panel-divider" />

        <button className="regen-btn" onClick={onRegenerate}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          重新生成世界
        </button>

        <button
          ref={exportBtnRef}
          className={`export-btn ${exporting ? 'exporting' : ''}`}
          onClick={handleExportClick}
          disabled={exporting}
        >
          {ripple && (
            <span
              key={ripple.id}
              className="ripple"
              style={{ left: ripple.x, top: ripple.y }}
            />
          )}
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出高度图 JSON
        </button>

        <div className="panel-tips">
          <div className="tips-title">操作指南</div>
          <ul>
            <li>拖拽 · 旋转视角</li>
            <li>滚轮 · 缩放距离</li>
            <li>右键拖拽 · 平移轨道</li>
          </ul>
        </div>
      </div>

      <style>{`
        .panel-container {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          z-index: 100;
          display: flex;
          pointer-events: none;
        }
        .panel-container.collapsed .panel-glass {
          transform: translateX(calc(100% + 12px));
          opacity: 0.4;
        }
        .panel-container.collapsed .collapse-btn {
          transform: rotate(180deg);
          background: rgba(20, 32, 56, 0.75);
        }
        .collapse-btn {
          pointer-events: auto;
          position: absolute;
          left: -36px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 68px;
          background: rgba(22, 38, 66, 0.55);
          border: 1px solid rgba(120, 160, 230, 0.28);
          border-right: none;
          border-radius: 14px 0 0 14px;
          color: #c9d7ee;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(14px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -4px 2px 16px rgba(0, 0, 0, 0.35);
        }
        .collapse-btn:hover {
          background: rgba(38, 62, 105, 0.75);
          color: #ffffff;
          box-shadow: -6px 2px 20px rgba(80, 140, 255, 0.25);
        }
        .panel-glass {
          pointer-events: auto;
          width: 340px;
          height: 100vh;
          padding: 28px 24px 24px;
          background: linear-gradient(
            160deg,
            rgba(24, 40, 72, 0.58) 0%,
            rgba(18, 28, 52, 0.62) 50%,
            rgba(28, 36, 68, 0.54) 100%
          );
          backdrop-filter: blur(26px) saturate(140%);
          -webkit-backdrop-filter: blur(26px) saturate(140%);
          border-left: 1px solid rgba(130, 170, 240, 0.22);
          box-shadow:
            -10px 0 40px rgba(0, 0, 0, 0.45),
            inset 1px 0 0 rgba(255, 255, 255, 0.05);
          overflow-y: auto;
          transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
          position: relative;
        }
        .panel-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 0%, rgba(100, 160, 255, 0.08), transparent 50%),
            radial-gradient(circle at 100% 80%, rgba(170, 120, 255, 0.06), transparent 45%);
          pointer-events: none;
        }
        .panel-glass::-webkit-scrollbar { width: 5px; }
        .panel-glass::-webkit-scrollbar-thumb {
          background: rgba(120, 150, 200, 0.3);
          border-radius: 3px;
        }
        .panel-header { position: relative; margin-bottom: 6px; }
        .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .logo-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: linear-gradient(135deg, #4d9bff, #c97bff);
          box-shadow: 0 0 10px rgba(100, 140, 255, 0.6), 0 0 20px rgba(170, 120, 255, 0.35);
          animation: pulseDot 2.6s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(100,140,255,0.6), 0 0 20px rgba(170,120,255,0.35); }
          50% { transform: scale(1.25); box-shadow: 0 0 14px rgba(100,140,255,0.8), 0 0 28px rgba(170,120,255,0.5); }
        }
        .panel-title {
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #a8c5ff 60%, #c4a8ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 1px;
          margin: 0;
        }
        .panel-subtitle {
          font-size: 11.5px;
          color: #7a8cb0;
          letter-spacing: 0.8px;
          margin-left: 1px;
        }
        .panel-divider {
          height: 1px;
          margin: 20px 0 22px;
          background: linear-gradient(90deg, transparent, rgba(120, 160, 230, 0.35), transparent);
        }
        .panel-section-title {
          font-size: 11px;
          color: #6f86ab;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          margin-bottom: 18px;
          font-weight: 600;
          padding-left: 2px;
        }
        .regen-btn {
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 12px;
          border-radius: 12px;
          border: 1px solid rgba(130, 170, 230, 0.3);
          background: rgba(38, 58, 98, 0.5);
          color: #dbe6f8;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
          letter-spacing: 0.3px;
        }
        .regen-btn:hover {
          background: rgba(56, 84, 138, 0.6);
          border-color: rgba(150, 190, 255, 0.5);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(80, 120, 200, 0.25);
        }
        .regen-btn:active { transform: translateY(0); }
        .export-btn {
          position: relative;
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #3a7bff 0%, #7b5cff 55%, #b86bff 100%);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          overflow: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 4px 18px rgba(90, 110, 230, 0.45);
          letter-spacing: 0.4px;
        }
        .export-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(110, 130, 255, 0.55);
          filter: brightness(1.08);
        }
        .export-btn:active:not(:disabled) { transform: translateY(0); }
        .export-btn.exporting { transform: scale(0.98); filter: brightness(1.15); }
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          transform: translate(-50%, -50%);
          animation: rippleAnim 0.52s ease-out forwards;
          pointer-events: none;
        }
        @keyframes rippleAnim {
          0% { width: 0; height: 0; opacity: 0.7; }
          100% { width: 420px; height: 420px; opacity: 0; }
        }
        .panel-tips {
          margin-top: 24px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(16, 26, 46, 0.45);
          border: 1px solid rgba(100, 140, 200, 0.15);
        }
        .tips-title {
          font-size: 10.5px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6f86ab;
          margin-bottom: 9px;
          font-weight: 600;
        }
        .panel-tips ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .panel-tips li {
          font-size: 12px;
          color: #9eb0ce;
          padding: 3px 0 3px 16px;
          position: relative;
          line-height: 1.55;
        }
        .panel-tips li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4d9bff, #c97bff);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
