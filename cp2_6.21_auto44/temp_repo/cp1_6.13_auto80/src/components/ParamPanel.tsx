import { PatternParams, BASE_COLOR_PALETTE, SymmetryType, BaseShape, ColorScheme } from '@/types/pattern';
import { usePatternStore } from '@/store/patternStore';
import { Shuffle, RotateCcw } from 'lucide-react';

const symmetryOptions: { value: SymmetryType; label: string }[] = [
  { value: 'rotation', label: '旋转对称' },
  { value: 'reflection', label: '反射对称' },
  { value: 'translation', label: '平移对称' },
];

const shapeOptions: { value: BaseShape; label: string }[] = [
  { value: 'circle', label: '圆形' },
  { value: 'triangle', label: '三角形' },
  { value: 'hexagon', label: '六边形' },
  { value: 'spiral', label: '螺旋' },
];

const schemeOptions: { value: ColorScheme; label: string }[] = [
  { value: 'gradient', label: '渐变' },
  { value: 'complementary', label: '互补色' },
  { value: 'analogous', label: '类比色' },
];

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     cursor-pointer appearance-none pr-8 transition-all duration-200
                     hover:border-indigo-400"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-indigo-400 font-mono font-bold">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </div>
      <div className="relative h-1 bg-gray-700 rounded-full group">
        <div
          className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
        />
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2 -translate-x-1/2 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                     ring-2 ring-indigo-400"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  colors: string[];
  palette: string[];
  onToggleColor: (color: string) => void;
}

function ColorPicker({ label, colors, palette, onToggleColor }: ColorPickerProps) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="grid grid-cols-6 gap-2">
        {palette.map((color) => {
          const isSelected = colors.includes(color);
          return (
            <button
              key={color}
              onClick={() => onToggleColor(color)}
              className={`w-full aspect-square rounded-full transition-all duration-200 relative
                         ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#1a1a2e] ring-indigo-400 scale-110' : 'hover:scale-110'}
                         hover:shadow-lg hover:shadow-current/30`}
              style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 12px ${color}` : 'none' }}
              aria-label={`选择颜色 ${color}`}
            />
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">已选择 {colors.length} 种颜色</p>
    </div>
  );
}

export default function ParamPanel() {
  const { params, setParams, resetParams, randomizeParams, isPanelOpen, togglePanel } = usePatternStore();

  const handleToggleColor = (color: string) => {
    if (params.baseColors.includes(color)) {
      if (params.baseColors.length > 1) {
        setParams({ baseColors: params.baseColors.filter((c) => c !== color) });
      }
    } else {
      if (params.baseColors.length < 6) {
        setParams({ baseColors: [...params.baseColors, color] });
      }
    }
  };

  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30
                   bg-[#1a1a2e] border border-r-0 border-gray-700 rounded-r-lg
                   px-2 py-4 text-gray-400 hover:text-indigo-400 hover:border-indigo-400
                   transition-all duration-300 hover:pl-3"
        aria-label="展开参数面板"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="w-72 h-full bg-[#1a1a2e]/95 backdrop-blur-sm border-r border-gray-800 
                    flex flex-col shadow-2xl z-20 transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-gray-200">参数控制</h2>
        <button
          onClick={togglePanel}
          className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-200
                     transition-colors duration-200"
          aria-label="收起面板"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Select
          label="对称类型"
          value={params.symmetryType}
          options={symmetryOptions}
          onChange={(v) => setParams({ symmetryType: v as SymmetryType })}
        />

        <Select
          label="基础形状"
          value={params.baseShape}
          options={shapeOptions}
          onChange={(v) => setParams({ baseShape: v as BaseShape })}
        />

        <Select
          label="颜色方案"
          value={params.colorScheme}
          options={schemeOptions}
          onChange={(v) => setParams({ colorScheme: v as ColorScheme })}
        />

        <Slider
          label="复杂度"
          value={params.complexity}
          min={1}
          max={20}
          onChange={(v) => setParams({ complexity: v })}
        />

        <Slider
          label="旋转速度"
          value={params.rotationSpeed}
          min={0}
          max={5}
          step={0.5}
          onChange={(v) => setParams({ rotationSpeed: v })}
        />

        <ColorPicker
          label="基础颜色"
          colors={params.baseColors}
          palette={BASE_COLOR_PALETTE}
          onToggleColor={handleToggleColor}
        />
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={randomizeParams}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                     bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                     text-white rounded-lg font-medium
                     transition-all duration-300 ease-out
                     hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5
                     active:translate-y-0"
        >
          <Shuffle className="w-4 h-4" />
          随机生成
        </button>

        <button
          onClick={resetParams}
          className="w-full flex items-center justify-center gap-2 py-2 px-4
                     bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white
                     rounded-lg font-medium transition-all duration-300"
        >
          <RotateCcw className="w-4 h-4" />
          重置参数
        </button>
      </div>
    </div>
  );
}
