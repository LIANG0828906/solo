import React from 'react';
import {
  STYLE_PRESETS,
  PAPER_PRESETS,
  type CalligraphyStyle,
  type PaperTexture
} from '../modules/styleTransfer';

interface ToolPanelProps {
  selectedStyle: CalligraphyStyle;
  onStyleChange: (style: CalligraphyStyle) => void;
  brushWidth: number;
  onBrushWidthChange: (width: number) => void;
  inkDepth: number;
  onInkDepthChange: (depth: number) => void;
  paperTexture: PaperTexture;
  onPaperTextureChange: (texture: PaperTexture) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  onConvert: () => void;
  isConverting: boolean;
  hasStrokes: boolean;
  hasProcessed: boolean;
  onToggleCompare: () => void;
  showCompare: boolean;
}

const INK_COLORS = [
  { name: '墨黑', value: '#1a1a1a' },
  { name: '焦茶', value: '#4a3728' },
  { name: '赭石', value: '#8b4513' },
  { name: '藏青', value: '#2d4a5e' },
  { name: '朱砂', value: '#b22222' },
  { name: '松绿', value: '#2e5e4a' }
];

const BrushIcon = () => (
  <svg className="panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 2l4 4-10 10-4-4L18 2z" />
    <path d="M9 12l-5 5 1 1 5-5" />
    <path d="M14 17l-2 2c-.7.7-1.7 1-2.7 1H3v-6.3c0-1 .3-2 1-2.7l2-2" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.2 2.5-.5.7-.3 1-.9.7-1.7l-.6-2.1c-.2-.7 0-1.4.5-1.9l1.5-1.5c.6-.6 1.5-.6 2.1 0l1 1c.5.5 1.3.5 1.8 0A10 10 0 0022 12c0-5.5-4.5-10-10-10z" />
  </svg>
);

const PaperIcon = () => (
  <svg className="panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

const MagicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9l1.4-1.4M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
  </svg>
);

const CompareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <path d="M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5" />
  </svg>
);

const ToolPanel: React.FC<ToolPanelProps> = ({
  selectedStyle,
  onStyleChange,
  brushWidth,
  onBrushWidthChange,
  inkDepth,
  onInkDepthChange,
  paperTexture,
  onPaperTextureChange,
  brushColor,
  onBrushColorChange,
  onConvert,
  isConverting,
  hasStrokes,
  hasProcessed,
  onToggleCompare,
  showCompare
}) => {
  const brushWidthDisplay = brushWidth.toFixed(1);

  const safeInkDepth = Math.max(0.1, Math.min(1.0, inkDepth));
  const sliderInkValue = Math.round(Math.sqrt((safeInkDepth - 0.1) / 0.9) * 100);

  const handleInkSliderChange = (value: number) => {
    const t = Math.max(0, Math.min(1, value / 100));
    const mappedDepth = 0.1 + 0.9 * t * t;
    onInkDepthChange(mappedDepth);
  };

  const handleBrushWidthChange = (value: number) => {
    onBrushWidthChange(value);
  };

  return (
    <div className="tool-panel">
      <div className="panel-card">
        <div className="panel-title">
          <BrushIcon />
          画笔设置
        </div>

        <div className="control-item">
          <label className="control-label">
            书法风格
          </label>
          <select
            className="select-input"
            value={selectedStyle}
            onChange={(e) => onStyleChange(e.target.value as CalligraphyStyle)}
          >
            {Object.values(STYLE_PRESETS).map((style) => (
              <option key={style.name} value={style.name}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label className="control-label">
            笔触粗细
            <span className="control-value">{brushWidthDisplay}px</span>
          </label>
          <input
            type="range"
            className="slider-input"
            min={0.5}
            max={20}
            step={0.5}
            value={brushWidth}
            onChange={(e) => handleBrushWidthChange(Number(e.target.value))}
          />
          <div
            style={{
              marginTop: 8,
              height: Math.min(brushWidth, 20),
              background: brushColor,
              borderRadius: Math.min(brushWidth, 20) / 2,
              opacity: 0.8
            }}
          />
        </div>

        <div className="control-item">
          <label className="control-label">
            墨色颜色
          </label>
          <div className="button-group">
            {INK_COLORS.map((color) => (
              <button
                key={color.value}
                className={`btn-option ${brushColor === color.value ? 'active' : ''}`}
                onClick={() => onBrushColorChange(color.value)}
                title={color.name}
                style={{
                  padding: 4,
                  minWidth: 'calc(33.33% - 6px)',
                  flex: '0 0 calc(33.33% - 6px)',
                  background: brushColor === color.value ? color.value : 'transparent',
                  color: brushColor === color.value ? '#fff' : 'inherit'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: color.value,
                    border: brushColor === color.value ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)',
                    marginRight: 4,
                    verticalAlign: 'middle'
                  }}
                />
                <span style={{ fontSize: 12, verticalAlign: 'middle' }}>{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-item">
          <label className="control-label">
            墨色深浅
            <span className="control-value">{Math.round(inkDepth * 100)}%</span>
          </label>
          <input
            type="range"
            className="slider-input"
            min={0}
            max={100}
            value={sliderInkValue}
            onChange={(e) => handleInkSliderChange(Number(e.target.value))}
          />
          <div
            style={{
              marginTop: 8,
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(90deg, #666666 0%, #444444 50%, #1a1a1a 100%)`
            }}
          />
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-title">
          <PaperIcon />
          纸张设置
        </div>

        <div className="control-item">
          <label className="control-label">纸张纹理</label>
          <select
            className="select-input"
            value={paperTexture}
            onChange={(e) => onPaperTextureChange(e.target.value as PaperTexture)}
          >
            {Object.values(PAPER_PRESETS).map((paper) => (
              <option key={paper.name} value={paper.name}>
                {paper.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div
            style={{
              flex: 1,
              aspectRatio: '2 / 1',
              borderRadius: 6,
              background: PAPER_PRESETS[paperTexture].backgroundColor,
              border: '1px solid var(--color-border)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: '70%',
                height: 6,
                background: brushColor,
                borderRadius: 3,
                opacity: inkDepth * 0.7,
                transform: 'rotate(-5deg)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                width: '55%',
                height: 5,
                background: brushColor,
                borderRadius: 3,
                opacity: inkDepth * 0.6,
                transform: 'rotate(3deg)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '75%',
                left: '25%',
                width: '45%',
                height: 5,
                background: brushColor,
                borderRadius: 3,
                opacity: inkDepth * 0.5,
                transform: 'rotate(-2deg)'
              }}
            />
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-title">
          <PaletteIcon />
          风格转换
        </div>

        <button
          className="convert-btn"
          onClick={onConvert}
          disabled={!hasStrokes || isConverting}
        >
          <MagicIcon />
          {isConverting ? '处理中...' : '转换风格'}
        </button>

        {hasProcessed && (
          <button
            className={`btn ${showCompare ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', marginTop: 12 }}
            onClick={onToggleCompare}
          >
            <CompareIcon />
            {showCompare ? '关闭对比视图' : '开启对比视图'}
          </button>
        )}

        {!hasStrokes && (
          <p style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--color-ochre)',
            opacity: 0.6,
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            请先在画布上书写文字或绘制签名
          </p>
        )}
      </div>
    </div>
  );
};

export default ToolPanel;
