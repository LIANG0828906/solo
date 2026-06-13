import React, { useState, useCallback } from 'react';
import {
  Palette,
  Grid3x3,
  Triangle,
  Hexagon,
  Square,
  Sliders,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Pipette,
} from 'lucide-react';
import type { GridType } from '../generator';

interface ControlPanelProps {
  palette: string[];
  gridType: GridType;
  density: number;
  isGenerating: boolean;
  isExporting: boolean;
  panelExpanded: boolean;
  onPaletteChange: (palette: string[]) => void;
  onGridTypeChange: (type: GridType) => void;
  onDensityChange: (density: number) => void;
  onGenerate: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onTogglePanel: () => void;
}

const DEFAULT_PALETTES = [
  ['#9d4edd', '#7b2cbf', '#5a189a', '#3c096c', '#240046', '#10002b'],
  ['#ffd700', '#ffb700', '#ff9500', '#ff6d00', '#ff4800', '#ff0054'],
  ['#00f5d4', '#00bbf9', '#9b5de5', '#f15bb5', '#fee440', '#00f5d4'],
  ['#06ffa5', '#00d9ff', '#7c3aed', '#db2777', '#f59e0b', '#84cc16'],
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  palette,
  gridType,
  density,
  isGenerating,
  isExporting,
  panelExpanded,
  onPaletteChange,
  onGridTypeChange,
  onDensityChange,
  onGenerate,
  onExportSVG,
  onExportPNG,
  onTogglePanel,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newPalette = [...palette];
      const [removed] = newPalette.splice(draggedIndex, 1);
      newPalette.splice(dropIndex, 0, removed);
      onPaletteChange(newPalette);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, palette, onPaletteChange]
  );

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      const newPalette = [...palette];
      newPalette[index] = color;
      onPaletteChange(newPalette);
    },
    [palette, onPaletteChange]
  );

  const handleAddColor = useCallback(() => {
    if (palette.length >= 6) return;
    const newPalette = [...palette, '#ffffff'];
    onPaletteChange(newPalette);
  }, [palette, onPaletteChange]);

  const handleRemoveColor = useCallback(
    (index: number) => {
      if (palette.length <= 2) return;
      const newPalette = palette.filter((_, i) => i !== index);
      onPaletteChange(newPalette);
      if (showColorPicker === index) setShowColorPicker(null);
    },
    [palette, showColorPicker, onPaletteChange]
  );

  const applyPreset = useCallback(
    (presetIndex: number) => {
      setActivePreset(presetIndex);
      onPaletteChange([...DEFAULT_PALETTES[presetIndex]]);
    },
    [onPaletteChange]
  );

  const gridTypes: { type: GridType; icon: React.ReactNode; label: string }[] = [
    { type: 'square', icon: <Square size={18} />, label: '正方形' },
    { type: 'hexagon', icon: <Hexagon size={18} />, label: '六边形' },
    { type: 'triangle', icon: <Triangle size={18} />, label: '三角形' },
  ];

  return (
    <div
      className={`control-panel h-full flex flex-col transition-all duration-300 ease-in-out ${
        panelExpanded ? 'w-72' : 'w-14'
      }`}
      onMouseEnter={() => !panelExpanded && onTogglePanel()}
    >
      <div className="panel-content h-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-r border-purple-900/30 flex flex-col relative overflow-hidden">
        <button
          onClick={onTogglePanel}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 w-6 h-12 bg-[#2a1a4e] border border-purple-500/30 rounded-r-lg flex items-center justify-center text-purple-300 hover:text-yellow-400 hover:border-yellow-500/50 transition-all"
        >
          {panelExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {panelExpanded ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-purple-600 bg-clip-text text-transparent">
                NeonMosaic
              </h1>
              <p className="text-xs text-purple-300/60 mt-1">生成式像素画创作工具</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-200">
                <Palette size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">调色板</span>
                <span className="text-xs text-purple-400 ml-auto">
                  {palette.length}/6
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PALETTES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(idx)}
                    className={`h-8 rounded-lg overflow-hidden border-2 transition-all ${
                      activePreset === idx
                        ? 'border-yellow-400 scale-105'
                        : 'border-purple-700/30 hover:border-purple-500/50'
                    }`}
                    title={`预设 ${idx + 1}`}
                  >
                    <div className="flex h-full">
                      {preset.slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="flex-1"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {palette.map((color, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`relative group w-10 h-10 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                      dragOverIndex === index && draggedIndex !== index
                        ? 'ring-2 ring-yellow-400 scale-110'
                        : ''
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 4px 12px ${color}40`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical
                        size={14}
                        className="text-white/80 drop-shadow-lg"
                      />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColorPicker(
                          showColorPicker === index ? null : index
                        );
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-purple-900 rounded-full border border-purple-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="取色"
                    >
                      <Pipette size={10} className="text-white" />
                    </button>

                    {palette.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveColor(index);
                        }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-900 rounded-full border border-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除"
                      >
                        <Trash2 size={10} className="text-white" />
                      </button>
                    )}

                    {showColorPicker === index && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-[#2a1a4e] border border-purple-500/30 rounded-lg p-2 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) =>
                            handleColorChange(index, e.target.value)
                          }
                          className="w-20 h-8 bg-transparent cursor-pointer rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {palette.length < 6 && (
                  <button
                    onClick={handleAddColor}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-purple-600/50 flex items-center justify-center text-purple-400 hover:border-yellow-500/70 hover:text-yellow-400 transition-all"
                    title="添加颜色"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              <p className="text-xs text-purple-400/60 text-center">
                拖拽排序 · 点击吸管取色
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-200">
                <Grid3x3 size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">网格类型</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {gridTypes.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => onGridTypeChange(type)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all ${
                      gridType === type
                        ? 'bg-gradient-to-b from-purple-600/40 to-purple-800/40 border-yellow-500/60 text-yellow-300 shadow-lg shadow-purple-500/20'
                        : 'bg-purple-900/20 border-purple-700/30 text-purple-300 hover:border-purple-500/50 hover:text-purple-200'
                    }`}
                  >
                    {icon}
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-200">
                <Sliders size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">密度</span>
                <span className="text-xs text-purple-400 ml-auto">
                  {density} × {Math.floor(density * 0.6)}
                </span>
              </div>

              <div className="px-2">
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={density}
                  onChange={(e) => onDensityChange(Number(e.target.value))}
                  className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-br
                    [&::-webkit-slider-thumb]:from-yellow-400
                    [&::-webkit-slider-thumb]:to-yellow-600
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-yellow-500/40
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110"
                />
              </div>

              <div className="flex justify-between text-xs text-purple-500">
                <span>10 × 6</span>
                <span>50 × 30</span>
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 via-purple-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? '生成中...' : '生成图案'}
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-200">
                <Download size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">导出</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onExportSVG}
                  disabled={isExporting}
                  className="py-2.5 px-4 rounded-lg bg-purple-900/40 border border-purple-600/30 text-purple-200 text-sm font-medium hover:bg-purple-800/40 hover:border-purple-500/50 hover:text-white transition-all disabled:opacity-50"
                >
                  SVG 矢量
                </button>
                <button
                  onClick={onExportPNG}
                  disabled={isExporting}
                  className="py-2.5 px-4 rounded-lg bg-purple-900/40 border border-purple-600/30 text-purple-200 text-sm font-medium hover:bg-purple-800/40 hover:border-purple-500/50 hover:text-white transition-all disabled:opacity-50"
                >
                  PNG 高清
                </button>
              </div>

              <p className="text-xs text-purple-500/70 text-center">
                PNG 导出为 1920×1080 · 四倍抗锯齿
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center py-4 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300 hover:text-yellow-400 transition-colors"
                title="调色板"
              >
                <Palette size={18} />
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300 hover:text-yellow-400 transition-colors"
                title="网格"
              >
                <Grid3x3 size={18} />
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300 hover:text-yellow-400 transition-colors"
                title="导出"
              >
                <Download size={18} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
