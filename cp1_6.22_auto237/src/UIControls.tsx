import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Maximize2,
  ChevronDown,
  CheckSquare,
  Square,
  Menu,
} from 'lucide-react';
import { City, DataCategory, CameraPreset } from './types';
import { cn } from './lib/utils';

interface UIControlsProps {
  cities: City[];
  selectedCities: string[];
  category: DataCategory;
  yearRange: [number, number];
  isPlaying: boolean;
  autoRotate: boolean;
  onCityToggle: (cityId: string) => void;
  onCategoryChange: (category: DataCategory) => void;
  onYearRangeChange: (range: [number, number]) => void;
  onPlayToggle: () => void;
  onAutoRotateToggle: () => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
  onSelectAllCities: () => void;
  onDeselectAllCities: () => void;
}

const categoryOptions: { value: DataCategory; label: string; color: string }[] = [
  { value: 'temperature', label: '温度', color: '#EF4444' },
  { value: 'precipitation', label: '降水', color: '#3B82F6' },
  { value: 'windSpeed', label: '风速', color: '#10B981' },
];

const cameraPresets: { value: CameraPreset; label: string; icon: typeof Eye }[] = [
  { value: 'front', label: '正面', icon: Eye },
  { value: 'top45', label: '俯视45°', icon: Maximize2 },
  { value: 'side', label: '侧视', icon: Eye },
  { value: 'birdseye', label: '鸟瞰', icon: Maximize2 },
];

const getCityColor = (index: number): string => {
  const hue = (index * 36) % 360;
  return `hsl(${hue}, 70%, 55%)`;
};

export default function UIControls({
  cities,
  selectedCities,
  category,
  yearRange,
  isPlaying,
  autoRotate,
  onCityToggle,
  onCategoryChange,
  onYearRangeChange,
  onPlayToggle,
  onAutoRotateToggle,
  onCameraPresetChange,
  onSelectAllCities,
  onDeselectAllCities,
}: UIControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const handleMinYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value, 10);
    if (newMin <= yearRange[1]) {
      onYearRangeChange([newMin, yearRange[1]]);
    }
  };

  const handleMaxYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value, 10);
    if (newMax >= yearRange[0]) {
      onYearRangeChange([yearRange[0], newMax]);
    }
  };

  const selectedCategory = categoryOptions.find((c) => c.value === category);

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'fixed left-0 top-4 z-50 hidden items-center justify-center rounded-r-lg bg-slate-800 p-3 text-white transition-all duration-300 hover:bg-slate-700 md:hidden',
          isExpanded ? 'left-[280px]' : 'left-0'
        )}
      >
        <Menu size={20} />
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-[280px] overflow-y-auto border-r border-slate-600 bg-slate-800 transition-all duration-300',
          'rounded-r-[12px]',
          'md:translate-x-0',
          isExpanded ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1E293B' }}
      >
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3B82F6;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3B82F6;
            cursor: pointer;
            border: none;
            transition: transform 0.2s ease;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-webkit-slider-runnable-track {
            background: #475569;
            height: 6px;
            border-radius: 3px;
          }
          input[type="range"]::-moz-range-track {
            background: #475569;
            height: 6px;
            border-radius: 3px;
          }
          aside::-webkit-scrollbar {
            width: 6px;
          }
          aside::-webkit-scrollbar-track {
            background: #1E293B;
          }
          aside::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 3px;
          }
        `}</style>

        <h2 className="p-4 text-[16px] font-semibold text-white">控制面板</h2>

        <div className="space-y-6 px-4 pb-6">
          <section>
            <label className="mb-2 block text-[12px] text-gray-400">城市选择</label>
            <div className="mb-3 flex gap-2">
              <button
                onClick={onSelectAllCities}
                className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-[12px] text-gray-100 transition-all duration-200 hover:bg-slate-600 active:scale-95"
              >
                <CheckSquare size={14} />
                全选
              </button>
              <button
                onClick={onDeselectAllCities}
                className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-[12px] text-gray-100 transition-all duration-200 hover:bg-slate-600 active:scale-95"
              >
                <Square size={14} />
                全不选
              </button>
            </div>
            <div className="space-y-2">
              {cities.slice(0, 10).map((city, index) => (
                <label
                  key={city.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city.id)}
                    onChange={() => onCityToggle(city.id)}
                    className="h-4 w-4 cursor-pointer accent-blue-500"
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getCityColor(index) }}
                  />
                  <span className="text-[13px] text-gray-200">{city.name}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <label className="mb-2 block text-[12px] text-gray-400">数据类别</label>
            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex w-full items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-gray-100 transition-all duration-200 hover:bg-slate-600 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedCategory?.color }}
                  />
                  {selectedCategory?.label}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'transition-transform duration-200',
                    categoryDropdownOpen ? 'rotate-180' : ''
                  )}
                />
              </button>
              {categoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg bg-slate-700 shadow-lg">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onCategoryChange(option.value);
                        setCategoryDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-600',
                        category === option.value
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'text-gray-100'
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <label className="mb-2 block text-[12px] text-gray-400">
              年份范围: {yearRange[0]} - {yearRange[1]}
            </label>
            <div className="relative py-4">
              <input
                type="range"
                min={2014}
                max={2024}
                value={yearRange[0]}
                onChange={handleMinYearChange}
                className="absolute left-0 right-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
              />
              <input
                type="range"
                min={2014}
                max={2024}
                value={yearRange[1]}
                onChange={handleMaxYearChange}
                className="absolute left-0 right-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>2014</span>
              <span>2024</span>
            </div>
          </section>

          <section>
            <label className="mb-2 block text-[12px] text-gray-400">视角预设</label>
            <div className="grid grid-cols-4 gap-2">
              {cameraPresets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.value}
                    onClick={() => onCameraPresetChange(preset.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] transition-all duration-200 hover:bg-slate-600 active:scale-95',
                      category === preset.value
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-slate-700 text-gray-100'
                    )}
                  >
                    <Icon size={16} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <label className="mb-2 block text-[12px] text-gray-400">动画控制</label>
            <div className="flex items-center gap-3">
              <button
                onClick={onPlayToggle}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 hover:bg-slate-600 active:scale-95',
                  isPlaying ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-100'
                )}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button
                onClick={onAutoRotateToggle}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 hover:bg-slate-600 active:scale-95',
                  autoRotate ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-100'
                )}
              >
                <RotateCcw size={18} />
                自动旋转
              </button>