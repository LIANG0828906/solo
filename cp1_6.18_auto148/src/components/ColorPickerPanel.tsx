import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { Trash2 } from 'lucide-react';
import type { ColorStop } from '@/types';
import { clampPosition } from '@/engine/gradientEngine';

interface ColorPickerPanelProps {
  selectedStop: ColorStop | null;
  onColorChange: (id: string, color: string) => void;
  onPositionChange: (id: string, position: number) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  selectedStop,
  onColorChange,
  onPositionChange,
  onDelete,
  canDelete,
}) => {
  if (!selectedStop) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <p>点击色标进行编辑</p>
        </div>
      </div>
    );
  }

  const handlePositionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onPositionChange(selectedStop.id, clampPosition(value));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-200">色标编辑</h3>
        <button
          onClick={() => onDelete(selectedStop.id)}
          disabled={!canDelete}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            canDelete
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:scale-105'
              : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
          title={canDelete ? '删除色标' : '至少需要保留2个色标'}
        >
          <Trash2 size={16} />
          <span>删除</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm text-gray-400">颜色选择</label>
        <div className="flex justify-center">
          <HexColorPicker
            color={selectedStop.color}
            onChange={(color) => onColorChange(selectedStop.id, color)}
            style={{ width: '240px', height: '240px' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm text-gray-400">颜色值</label>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-white/20 flex-shrink-0"
            style={{ backgroundColor: selectedStop.color }}
          />
          <input
            type="text"
            value={selectedStop.color.toUpperCase()}
            onChange={(e) => {
              let value = e.target.value;
              if (!value.startsWith('#')) {
                value = '#' + value;
              }
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                onColorChange(selectedStop.id, value);
              }
            }}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm text-gray-400">位置</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={selectedStop.position}
            onChange={(e) => onPositionChange(selectedStop.id, parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={selectedStop.position}
              onChange={handlePositionInput}
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-200 text-sm text-right focus:outline-none focus:border-cyan-400 transition-colors pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/5 rounded-lg">
        <p className="text-xs text-gray-500">
          提示：在画布上点击可添加新色标，拖拽色标可调整位置。最多支持6个色标。
        </p>
      </div>
    </div>
  );
};

export default React.memo(ColorPickerPanel);
