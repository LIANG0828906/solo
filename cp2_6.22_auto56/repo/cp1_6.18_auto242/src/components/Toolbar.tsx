import { Waves, Tornado, SprayCan, Save, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  INK_COLORS,
  INK_COLOR_NAMES,
  BRUSH_STYLES,
  DIFFUSION_SPEEDS,
  type InkColor,
  type BrushStyle,
  type DiffusionSpeed,
} from '@/types';

interface ToolbarProps {
  onSave: () => void;
  onClear: () => void;
}

const brushIconMap = {
  waves: Waves,
  tornado: Tornado,
  'spray-can': SprayCan,
};

export function Toolbar({ onSave, onClear }: ToolbarProps) {
  const brushConfig = useAppStore((s) => s.brushConfig);
  const setInkColor = useAppStore((s) => s.setInkColor);
  const setBrushStyle = useAppStore((s) => s.setBrushStyle);
  const setDiffusionSpeed = useAppStore((s) => s.setDiffusionSpeed);

  const sliderMin = 0;
  const sliderMax = DIFFUSION_SPEEDS.length - 1;
  const sliderValue = DIFFUSION_SPEEDS.indexOf(brushConfig.diffusionSpeed);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Math.max(0, Math.min(sliderMax, parseInt(e.target.value, 10)));
    setDiffusionSpeed(DIFFUSION_SPEEDS[idx] as DiffusionSpeed);
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="创作工具栏">
      <div className="toolbar-group">
        <div className="ink-palette" aria-label="墨色选择">
          {INK_COLORS.map((color: InkColor) => (
            <button
              key={color}
              type="button"
              className={`ink-swatch ${brushConfig.inkColor === color ? 'active' : ''}`}
              style={{ background: color, color }}
              onClick={() => setInkColor(color)}
              aria-label={`${INK_COLOR_NAMES[color]}(${color})`}
              aria-pressed={brushConfig.inkColor === color}
            >
              <span className="ink-swatch-label">{INK_COLOR_NAMES[color]}</span>
            </button>
          ))}
        </div>

        <div className="tool-divider" />

        <div className="brush-buttons" aria-label="笔触样式">
          {BRUSH_STYLES.map((s) => {
            const Icon = brushIconMap[s.icon as keyof typeof brushIconMap];
            const active = brushConfig.brushStyle === s.value;
            return (
              <button
                key={s.value}
                type="button"
                className={`brush-btn ${active ? 'active' : ''}`}
                onClick={() => setBrushStyle(s.value as BrushStyle)}
                aria-label={s.label}
                aria-pressed={active}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span className="brush-btn-label">{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="tool-divider" />

        <div className="speed-control" aria-label="扩散速度">
          <span className="speed-label">扩散</span>
          <input
            type="range"
            className="speed-slider"
            min={sliderMin}
            max={sliderMax}
            step={1}
            value={sliderValue}
            onChange={handleSliderChange}
            aria-valuemin={sliderMin}
            aria-valuemax={sliderMax}
            aria-valuenow={sliderValue}
          />
          <span className="speed-value">{brushConfig.diffusionSpeed}x</span>
        </div>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className="icon-btn"
          onClick={onClear}
          aria-label="清空画布"
          title="清空画布"
        >
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          className="save-btn"
          onClick={onSave}
          aria-label="保存作品"
          title="保存作品并生成分享码"
        >
          <Save size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
