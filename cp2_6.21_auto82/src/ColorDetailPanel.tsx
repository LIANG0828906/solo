import React, { useMemo } from 'react';
import { Info, Palette, Target, Triangle } from 'lucide-react';
import {
  PaletteColor,
  getMonochromatic,
  getComplementary,
  getTriadic,
  hexToRgb,
  hexToHsl,
} from './colorEngine';

export interface ColorDetailPanelProps {
  color: PaletteColor | null;
  onPickHarmony: (hex: string) => void;
}

const ColorDetailPanel: React.FC<ColorDetailPanelProps> = ({ color, onPickHarmony }) => {
  const mono = useMemo(() => (color?.hex ? getMonochromatic(color.hex, 3) : []), [color]);
  const comp = useMemo(() => (color?.hex ? getComplementary(color.hex, 2) : []), [color]);
  const triadic = useMemo(() => (color?.hex ? getTriadic(color.hex) : []), [color]);

  if (!color || !color.hex) {
    return (
      <div className="detail-section">
        <div className="panel-title">
          <Info className="panel-title-icon" size={18} />
          颜色详情
        </div>
        <div className="section-empty">
          <div className="section-empty-icon">🎨</div>
          <div>点击调色板中的颜色查看详情</div>
        </div>
      </div>
    );
  }

  const rgb = hexToRgb(color.hex);
  const hsl = hexToHsl(color.hex);
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const renderHarmonySwatches = (colors: string[]) => (
    <div className="harmony-row">
      {colors.map((c) => (
        <div
          key={c}
          className="harmony-swatch"
          style={{ backgroundColor: c }}
          data-hex={c}
          title={`点击添加: ${c}`}
          onClick={() => onPickHarmony(c)}
        />
      ))}
    </div>
  );

  return (
    <div className="detail-section">
      <div className="panel-title">
        <Info className="panel-title-icon" size={18} />
        颜色详情 - {color.hex}
      </div>

      <div className="detail-values">
        <div className="value-card">
          <div className="value-card-label">HEX</div>
          <div className="value-card-content">{color.hex}</div>
        </div>
        <div className="value-card">
          <div className="value-card-label">RGB</div>
          <div className="value-card-content">{rgbStr}</div>
        </div>
        <div className="value-card">
          <div className="value-card-label">HSL</div>
          <div className="value-card-content">{hslStr}</div>
        </div>
      </div>

      <div className="harmony-section">
        <div className="harmony-group">
          <div className="harmony-group-title">
            <Palette size={14} />
            单色调和色 (3色)
          </div>
          {renderHarmonySwatches(mono)}
        </div>

        <div className="harmony-group">
          <div className="harmony-group-title">
            <Target size={14} />
            互补色方案 (2色)
          </div>
          {renderHarmonySwatches(comp)}
        </div>

        <div className="harmony-group">
          <div className="harmony-group-title">
            <Triangle size={14} />
            三角色方案 (3色)
          </div>
          {renderHarmonySwatches(triadic)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ColorDetailPanel);
