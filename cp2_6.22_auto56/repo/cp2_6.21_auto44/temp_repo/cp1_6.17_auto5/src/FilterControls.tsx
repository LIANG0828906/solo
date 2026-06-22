import React, { useState } from 'react';
import { useStore } from './store';
import { PRESET_FILTERS, COLOR_PALETTE, FONT_OPTIONS } from './types';
import { Type, AlignLeft, AlignCenter, AlignRight, Sun, Contrast, Palette, Droplets } from 'lucide-react';

const FilterControls: React.FC = () => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const layers = useStore((state) => state.layers);
  const updateLayer = useStore((state) => state.updateLayer);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const handlePresetClick = (preset: typeof PRESET_FILTERS[0]) => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, {
      filterConfig: {
        brightness: preset.config.brightness ?? 0,
        contrast: preset.config.contrast ?? 0,
        hue: preset.config.hue ?? 0,
        saturation: preset.config.saturation ?? 0,
        preset: preset.config.preset ?? null,
      },
    });
  };

  const handleFilterChange = (key: 'brightness' | 'contrast' | 'hue' | 'saturation', value: number) => {
    if (!selectedLayerId || !selectedLayer) return;
    updateLayer(selectedLayerId, {
      filterConfig: {
        ...selectedLayer.filterConfig,
        [key]: value,
        preset: null,
      },
    });
  };

  const handleTextChange = (key: string, value: string | number) => {
    if (!selectedLayerId || !selectedLayer || !selectedLayer.textStyle) return;
    updateLayer(selectedLayerId, {
      textStyle: {
        ...selectedLayer.textStyle,
        [key]: value,
      },
    });
  };

  const handleColorSelect = (color: string) => {
    if (!selectedLayerId || !selectedLayer || !selectedLayer.textStyle) return;
    const rgba = hexToRgba(color, selectedLayer.opacity);
    updateLayer(selectedLayerId, {
      textStyle: {
        ...selectedLayer.textStyle,
        color: rgba,
      },
    });
  };

  const handleOpacityChange = (value: number) => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, { opacity: value });
    if (selectedLayer?.textStyle) {
      const color = selectedLayer.textStyle.color;
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        handleTextChange('color', `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${value})`);
      }
    }
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
    }
    return hex;
  };

  if (!selectedLayer) {
    return (
      <div className="w-[280px] flex flex-col h-full" style={{ backgroundColor: '#F9F9F9', borderRight: '1px solid #E0E0E0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#1976D2' }}>滤镜调色</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p style={{ color: '#616161' }}>请选择一个图层以调整属性</p>
        </div>
      </div>
    );
  }

  const filterConfig = selectedLayer.filterConfig;

  return (
    <div className="w-[280px] flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#F9F9F9', borderRight: '1px solid #E0E0E0' }}>
      <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#1976D2' }}>滤镜调色</h2>
      </div>

      <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: '#616161' }}>预设滤镜</h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_FILTERS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              className="group relative transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{ width: '60px', height: '60px' }}
            >
              <div
                className="w-full h-full transition-shadow duration-300 group-hover:shadow-lg"
                style={{
                  background: preset.preview,
                  borderRadius: '8px',
                  border: filterConfig.preset === preset.config.preset ? '2px solid #1976D2' : '1px solid #E0E0E0',
                }}
              />
              <span className="text-xs mt-1 block truncate w-full text-center" style={{ color: '#616161' }}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b space-y-4" style={{ borderColor: '#E0E0E0' }}>
        <h3 className="text-sm font-medium" style={{ color: '#616161' }}>调整参数</h3>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1" style={{ color: '#616161' }}>
              <Sun size={14} /> 亮度
            </label>
            <span className="text-xs" style={{ color: '#1976D2' }}>{filterConfig.brightness}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filterConfig.brightness}
            onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
            style={{ accentColor: '#1976D2' }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1" style={{ color: '#616161' }}>
              <Contrast size={14} /> 对比度
            </label>
            <span className="text-xs" style={{ color: '#1976D2' }}>{filterConfig.contrast}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filterConfig.contrast}
            onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
            style={{ accentColor: '#1976D2' }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1" style={{ color: '#616161' }}>
              <Palette size={14} /> 色相
            </label>
            <span className="text-xs" style={{ color: '#1976D2' }}>{filterConfig.hue}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={filterConfig.hue}
            onChange={(e) => handleFilterChange('hue', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
            style={{ accentColor: '#1976D2' }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1" style={{ color: '#616161' }}>
              <Droplets size={14} /> 饱和度
            </label>
            <span className="text-xs" style={{ color: '#1976D2' }}>{filterConfig.saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filterConfig.saturation}
            onChange={(e) => handleFilterChange('saturation', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
            style={{ accentColor: '#1976D2' }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs" style={{ color: '#616161' }}>透明度</label>
            <span className="text-xs" style={{ color: '#1976D2' }}>{Math.round(selectedLayer.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedLayer.opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
            style={{ accentColor: '#1976D2' }}
          />
        </div>
      </div>

      {selectedLayer.type === 'text' && selectedLayer.textStyle && (
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: '#616161' }}>
            <Type size={14} /> 文字属性
          </h3>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#616161' }}>文案内容</label>
            <textarea
              value={selectedLayer.textStyle.content}
              onChange={(e) => handleTextChange('content', e.target.value)}
              className="w-full p-2 text-sm rounded transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2"
              style={{
                border: '1px solid #E0E0E0',
                resize: 'none',
              }}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#616161' }}>字体</label>
            <select
              value={selectedLayer.textStyle.fontFamily}
              onChange={(e) => handleTextChange('fontFamily', e.target.value)}
              className="w-full p-2 text-sm rounded transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2"
              style={{ border: '1px solid #E0E0E0' }}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#616161' }}>字号</label>
              <input
                type="number"
                min="12"
                max="120"
                value={selectedLayer.textStyle.fontSize}
                onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value) || 12)}
                className="w-full p-2 text-sm rounded transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E0E0E0' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#616161' }}>字重</label>
              <select
                value={selectedLayer.textStyle.fontWeight}
                onChange={(e) => handleTextChange('fontWeight', parseInt(e.target.value))}
                className="w-full p-2 text-sm rounded transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E0E0E0' }}
              >
                <option value={100}>细</option>
                <option value={400}>常规</option>
                <option value={700}>粗</option>
                <option value={900}>特粗</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#616161' }}>对齐方式</label>
            <div className="flex gap-2">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleTextChange('align', value)}
                  className="flex-1 p-2 rounded transition-all duration-300 hover:opacity-80 active:scale-95"
                  style={{
                    backgroundColor: selectedLayer.textStyle?.align === value ? '#1976D2' : '#FFFFFF',
                    color: selectedLayer.textStyle?.align === value ? '#FFFFFF' : '#616161',
                    border: '1px solid #E0E0E0',
                  }}
                >
                  <Icon size={16} className="mx-auto" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#616161' }}>颜色</label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded transition-all duration-300 hover:opacity-80 active:scale-95"
                style={{
                  backgroundColor: selectedLayer.textStyle.color,
                  border: '1px solid #E0E0E0',
                }}
              />
              {showColorPicker && (
                <div
                  className="absolute top-full left-0 mt-2 p-3 rounded-lg z-50"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                    width: '240px',
                  }}
                >
                  <div className="grid grid-cols-6 gap-1 mb-3">
                    {COLOR_PALETTE.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleColorSelect(color)}
                        className="w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{ backgroundColor: color, border: '1px solid #E0E0E0' }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs" style={{ color: '#616161' }}>透明度</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedLayer.opacity}
                      onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#1976D2' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: '#616161' }}>旋转角度</label>
              <span className="text-xs" style={{ color: '#1976D2' }}>{selectedLayer.textStyle.rotation}°</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              value={selectedLayer.textStyle.rotation}
              onChange={(e) => handleTextChange('rotation', parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 hover:opacity-80"
              style={{ accentColor: '#1976D2' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;
