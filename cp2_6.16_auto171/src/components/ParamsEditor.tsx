import React from 'react';
import { Block, ShapeTypes, AnimationTypes, ShapeParams, AnimationParams } from '../types';
import { useAnimStore } from '../store';

interface ParamsEditorProps {
  block: Block;
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'number' | 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const getShapeFields = (shapeType?: ShapeTypes): FieldConfig[] => {
  switch (shapeType) {
    case ShapeTypes.CIRCLE:
      return [
        { key: 'radius', label: '半径', type: 'range', min: 10, max: 100, step: 1, unit: 'px' },
        { key: 'fill', label: '填充色', type: 'color' }
      ];
    case ShapeTypes.RECTANGLE:
      return [
        { key: 'width', label: '宽度', type: 'range', min: 20, max: 200, step: 1, unit: 'px' },
        { key: 'height', label: '高度', type: 'range', min: 20, max: 200, step: 1, unit: 'px' },
        { key: 'fill', label: '填充色', type: 'color' }
      ];
    case ShapeTypes.TRIANGLE:
      return [
        { key: 'sideLength', label: '边长', type: 'range', min: 30, max: 150, step: 1, unit: 'px' },
        { key: 'fill', label: '填充色', type: 'color' }
      ];
    case ShapeTypes.STAR:
      return [
        { key: 'points', label: '顶点数', type: 'range', min: 3, max: 10, step: 1 },
        { key: 'outerRadius', label: '外半径', type: 'range', min: 10, max: 100, step: 1, unit: 'px' },
        { key: 'innerRadius', label: '内半径', type: 'range', min: 5, max: 80, step: 1, unit: 'px' },
        { key: 'fill', label: '填充色', type: 'color' }
      ];
    default:
      return [];
  }
};

const getAnimationFields = (animationType?: AnimationTypes): FieldConfig[] => {
  const common: FieldConfig[] = [
    { key: 'duration', label: '时长', type: 'range', min: 100, max: 5000, step: 100, unit: 'ms' },
    { key: 'repeat', label: '重复', type: 'range', min: 1, max: 10, step: 1, unit: '次' }
  ];

  switch (animationType) {
    case AnimationTypes.MOVE:
      return [
        { key: 'dx', label: 'X偏移', type: 'range', min: -200, max: 200, step: 5, unit: 'px' },
        { key: 'dy', label: 'Y偏移', type: 'range', min: -200, max: 200, step: 5, unit: 'px' },
        ...common
      ];
    case AnimationTypes.ROTATE:
      return [
        { key: 'angle', label: '角度', type: 'range', min: 0, max: 720, step: 10, unit: '°' },
        ...common
      ];
    case AnimationTypes.SCALE:
      return [
        { key: 'factor', label: '缩放倍数', type: 'range', min: 0.1, max: 3, step: 0.1, unit: 'x' },
        ...common
      ];
    case AnimationTypes.COLOR:
      return [
        { key: 'targetColor', label: '目标颜色', type: 'color' },
        ...common
      ];
    case AnimationTypes.BLINK:
      return [
        { key: 'frequency', label: '频率', type: 'range', min: 1, max: 10, step: 1, unit: 'Hz' },
        ...common
      ];
    default:
      return common;
  }
};

export const ParamsEditor: React.FC<ParamsEditorProps> = ({ block }) => {
  const updateBlockParams = useAnimStore(s => s.updateBlockParams);

  const fields = block.type === 'shape'
    ? getShapeFields(block.shapeType)
    : getAnimationFields(block.animationType);

  const params = block.params as Record<string, any>;

  const handleChange = (key: string, value: number | string) => {
    updateBlockParams(block.id, { [key]: value });
  };

  return (
    <div className="space-y-3 py-2">
      {fields.map(field => (
        <div key={field.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="text-white/70 font-medium">{field.label}</label>
            {field.type !== 'color' && (
              <span className="text-[#e94560] font-mono text-[11px]">
                {params[field.key] ?? '-'}
                {field.unit ?? ''}
              </span>
            )}
          </div>

          {field.type === 'range' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={params[field.key] ?? 0}
                onChange={e => handleChange(field.key, Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                  bg-gradient-to-r from-white/10 to-[#e94560]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#e94560]
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-[#e94560]/50
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={params[field.key] ?? 0}
                onChange={e => handleChange(field.key, Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 text-xs rounded bg-white/5 border border-white/10
                  text-[#e0e0e0] font-mono text-right
                  focus:outline-none focus:border-[#e94560]/50"
              />
            </div>
          )}

          {field.type === 'color' && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={params[field.key] ?? '#ffffff'}
                onChange={e => handleChange(field.key, e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white/10
                  bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0
                  [&::-webkit-color-swatch]:rounded-md"
              />
              <input
                type="text"
                value={params[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className="flex-1 px-2 py-1 text-xs rounded bg-white/5 border border-white/10
                  text-[#e0e0e0] font-mono uppercase
                  focus:outline-none focus:border-[#e94560]/50"
                maxLength={7}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
