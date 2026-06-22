import React, { useCallback } from 'react';
import type { GradientScheme } from '@/utils/history';

interface ColorPickerProps {
  scheme: GradientScheme;
  onChange: (updates: Partial<GradientScheme>) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ scheme, onChange }) => {
  const handleStartColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ startColor: e.target.value });
    },
    [onChange]
  );

  const handleEndColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ endColor: e.target.value });
    },
    [onChange]
  );

  const handleHexInput = useCallback(
    (field: 'startColor' | 'endColor', value: string) => {
      if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
        onChange({ [field]: value });
      }
    },
    [onChange]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ gradientType: e.target.value as GradientScheme['gradientType'] });
    },
    [onChange]
  );

  const handleDirectionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ direction: Number(e.target.value) });
    },
    [onChange]
  );

  const handleStepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ steps: Math.max(2, Math.min(20, Number(e.target.value))) });
    },
    [onChange]
  );

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <h3 className="font-display font-semibold text-gray-800 text-base flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-500" />
        渐变配置
      </h3>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">起始颜色</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={scheme.startColor}
              onChange={handleStartColorChange}
              className="w-12 h-12 rounded-full interactive-element cursor-pointer shadow-md"
            />
            <input
              type="text"
              value={scheme.startColor}
              onChange={(e) => handleHexInput('startColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-gray-200 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all"
              maxLength={7}
              placeholder="#6366f1"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">结束颜色</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={scheme.endColor}
              onChange={handleEndColorChange}
              className="w-12 h-12 rounded-full interactive-element cursor-pointer shadow-md"
            />
            <input
              type="text"
              value={scheme.endColor}
              onChange={(e) => handleHexInput('endColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-gray-200 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all"
              maxLength={7}
              placeholder="#8b5cf6"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">渐变样式</label>
          <select
            value={scheme.gradientType}
            onChange={handleTypeChange}
            className="w-full px-3 py-2.5 rounded-lg bg-white/50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all cursor-pointer interactive-element"
          >
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
            <option value="conic">锥形渐变</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            方向角度 <span className="text-brand-500 font-semibold">{scheme.direction}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={scheme.direction}
            onChange={handleDirectionChange}
            className="w-full mt-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            渐变步数 <span className="text-brand-500 font-semibold">{scheme.steps}</span>
          </label>
          <input
            type="range"
            min="2"
            max="20"
            value={scheme.steps}
            onChange={handleStepsChange}
            className="w-full mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
