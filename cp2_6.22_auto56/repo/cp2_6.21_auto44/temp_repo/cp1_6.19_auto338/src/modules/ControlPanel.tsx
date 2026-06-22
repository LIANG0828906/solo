import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Palette, Shapes, Type, RotateCcw, RotateCw, Sparkles, Undo2, Redo2 } from 'lucide-react';
import { useBoardStore } from '@/stores/useBoardStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { FONT_PRESETS } from '@/utils/fontPresets';
import { getRandomColor, generateColorScheme } from '@/utils/colorGenerator';
import { ElementType, ColorScheme } from '@/types';

interface ControlPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SHAPE_TYPES: { type: ElementType; label: string; icon: string }[] = [
  { type: 'rectangle', label: '矩形', icon: '▢' },
  { type: 'circle', label: '圆形', icon: '○' },
  { type: 'triangle', label: '三角形', icon: '△' },
  { type: 'hexagon', label: '六边形', icon: '⬡' },
  { type: 'star', label: '星形', icon: '★' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ isCollapsed, onToggle }) => {
  const {
    elements,
    selectedElementId,
    currentFontPreset,
    currentColorScheme,
    colorHistory,
    historyIndex,
    addElement,
    updateElement,
    setFontPreset,
    generateAndApplyColorScheme,
    applyColorScheme,
    undoColor,
    redoColor,
  } = useBoardStore();

  const [primaryColor, setPrimaryColor] = useState('#1976D2');
  const [generatedScheme, setGeneratedScheme] = useState<ColorScheme | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const handleGenerateColors = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const scheme = generateColorScheme(primaryColor);
      setGeneratedScheme(scheme);
      setIsGenerating(false);
    }, 20);
  }, [primaryColor]);

  const handleApplyColorScheme = useCallback((scheme: ColorScheme) => {
    applyColorScheme(scheme);
  }, [applyColorScheme]);

  const handleDragStart = useCallback((e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleShapeEdit = useCallback((key: string, value: string | number) => {
    if (!selectedElementId) return;
    updateElement(selectedElementId, { [key]: value });
  }, [selectedElementId, updateElement]);

  const allColors = generatedScheme 
    ? [generatedScheme.primary, ...generatedScheme.complementary, ...generatedScheme.auxiliary]
    : [];

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
      >
        <Menu size={24} className="text-gray-700" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-[320px] bg-white h-screen flex flex-col shadow-[1px_0_0_#E0E0E0] relative z-30"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#1976D2]" />
          <h1 className="text-lg font-bold text-gray-800">灵感板</h1>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-[#555555]" />
            <h2 className="text-[14px] font-semibold text-[#555555]">配色生成器</h2>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[#BDBDBD] hover:border-[#1976D2] transition-colors"
              />
            </div>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border border-[#BDBDBD] text-sm focus:border-[#1976D2] focus:shadow-[0_0_0_2px_rgba(25,118,210,0.2)] transition-all outline-none"
            />
            <button
              onClick={handleGenerateColors}
              disabled={isGenerating}
              className="px-4 h-9 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              style={{ 
                backgroundColor: '#1976D2',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565C0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
            >
              生成
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={undoColor}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg border border-[#BDBDBD] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="撤销配色"
            >
              <Undo2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={redoColor}
              disabled={historyIndex >= colorHistory.length - 1}
              className="p-2 rounded-lg border border-[#BDBDBD] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="重做配色"
            >
              <Redo2 size={16} className="text-gray-600" />
            </button>
            {currentColorScheme && (
              <span className="text-xs text-gray-500 ml-auto">
                历史 {historyIndex + 1}/{colorHistory.length}
              </span>
            )}
          </div>

          {allColors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-wrap gap-2">
                {allColors.map((color, index) => (
                  <motion.button
                    key={`${color}-${index}`}
                    onClick={() => {
                      if (generatedScheme) {
                        handleApplyColorScheme(generatedScheme);
                      }
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="w-[60px] h-[60px] rounded-lg shadow-md hover:shadow-lg transition-shadow relative group"
                    style={{ backgroundColor: color }}
                    title={`点击应用配色方案`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <span className="text-white text-xs font-medium">应用</span>
                    </div>
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                主色 + 4种互补色 + 3种辅助色
              </p>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-3">
            <Shapes size={16} className="text-[#555555]" />
            <h2 className="text-[14px] font-semibold text-[#555555]">图形元素库</h2>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {SHAPE_TYPES.map((shape) => (
              <div
                key={shape.type}
                draggable
                onDragStart={(e) => handleDragStart(e, shape.type)}
                className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#BDBDBD] hover:border-[#1976D2] hover:bg-[#1976D2]/5 cursor-grab active:cursor-grabbing transition-all group"
                title={`拖拽${shape.label}到画布`}
              >
                <span className="text-2xl text-gray-400 group-hover:text-[#1976D2] transition-colors">
                  {shape.icon}
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-[#1976D2] transition-colors mt-1">
                  {shape.label}
                </span>
              </div>
            ))}
          </div>

          {selectedElement && selectedElement.type !== 'text' && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="pt-3 border-t border-[#E0E0E0]">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">样式编辑</h3>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-16">填充色</label>
                  <input
                    type="color"
                    value={selectedElement.fill}
                    onChange={(e) => handleShapeEdit('fill', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-[#BDBDBD]"
                  />
                  <input
                    type="text"
                    value={selectedElement.fill}
                    onChange={(e) => handleShapeEdit('fill', e.target.value)}
                    className="flex-1 h-9 px-2 rounded-lg border border-[#BDBDBD] text-xs focus:border-[#1976D2] outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-16">边框色</label>
                  <input
                    type="color"
                    value={selectedElement.stroke === 'transparent' ? '#000000' : selectedElement.stroke}
                    onChange={(e) => handleShapeEdit('stroke', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-[#BDBDBD]"
                  />
                  <input
                    type="text"
                    value={selectedElement.stroke === 'transparent' ? '#000000' : selectedElement.stroke}
                    onChange={(e) => handleShapeEdit('stroke', e.target.value)}
                    className="flex-1 h-9 px-2 rounded-lg border border-[#BDBDBD] text-xs focus:border-[#1976D2] outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-16">边框粗</label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={selectedElement.strokeWidth}
                    onChange={(e) => handleShapeEdit('strokeWidth', Number(e.target.value))}
                    className="flex-1 h-9 accent-[#1976D2]"
                  />
                  <span className="text-xs text-gray-500 w-6 text-right">{selectedElement.strokeWidth}px</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-16">旋转</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={selectedElement.rotation}
                    onChange={(e) => handleShapeEdit('rotation', Number(e.target.value))}
                    className="flex-1 h-9 accent-[#1976D2]"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right">{selectedElement.rotation}°</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-16">透明度</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={selectedElement.opacity}
                    onChange={(e) => handleShapeEdit('opacity', Number(e.target.value))}
                    className="flex-1 h-9 accent-[#1976D2]"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right">{Math.round(selectedElement.opacity * 100)}%</span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {!selectedElement && (
            <p className="text-xs text-gray-400 text-center py-4">
              选中图形后可编辑样式
            </p>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Type size={16} className="text-[#555555]" />
            <h2 className="text-[14px] font-semibold text-[#555555]">字体预设</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {FONT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setFontPreset(preset)}
                className={`p-3 rounded-xl text-left transition-all ${
                  currentFontPreset.name === preset.name
                    ? 'bg-[#1976D2] text-white shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
                style={{ transition: 'background-color 0.2s' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{preset.displayName}</span>
                  <span 
                    className="text-xs opacity-70"
                    style={{ fontFamily: preset.titleFont }}
                  >
                    Aa
                  </span>
                </div>
                <div 
                  className="text-xs mt-1 opacity-70"
                  style={{ fontFamily: preset.bodyFont }}
                >
                  标题: {preset.titleFont.split(',')[0]} · 正文: {preset.bodyFont.split(',')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#E0E0E0] text-center">
        <p className="text-xs text-gray-400">
          元素数量: {elements.length}/30
        </p>
      </div>
    </motion.div>
  );
};
