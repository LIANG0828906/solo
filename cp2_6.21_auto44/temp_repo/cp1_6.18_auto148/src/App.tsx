import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Check, BookmarkPlus, Palette } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ColorStop, GradientScheme } from '@/types';
import { generateGradient } from '@/engine/gradientEngine';
import { useUserStore } from '@/stores/userStore';
import { presetGradients } from '@/data/presets';
import GradientCanvas from '@/components/GradientCanvas';
import ColorPickerPanel from '@/components/ColorPickerPanel';
import CommunityGallery from '@/components/CommunityGallery';
import AnglePicker from '@/components/AnglePicker';

const initialColorStops: ColorStop[] = [
  { id: uuidv4(), color: '#FF6B6B', position: 0 },
  { id: uuidv4(), color: '#4ECDC4', position: 100 },
];

const App: React.FC = () => {
  const [colorStops, setColorStops] = useState<ColorStop[]>(initialColorStops);
  const [angle, setAngle] = useState<number>(135);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { addFavorite } = useUserStore();

  const gradient = useMemo(() => {
    const start = performance.now();
    const result = generateGradient(colorStops, angle);
    const end = performance.now();
    if (end - start > 100) {
      console.warn(`Gradient generation took ${end - start}ms, exceeding 100ms limit`);
    }
    return result;
  }, [colorStops, angle]);

  const selectedStop = useMemo(() => {
    return colorStops.find(stop => stop.id === selectedStopId) || null;
  }, [colorStops, selectedStopId]);

  const cssCode = useMemo(() => {
    return `background-image: ${gradient.cssString};`;
  }, [gradient]);

  const handleColorStopsChange = useCallback((stops: ColorStop[]) => {
    setColorStops(stops);
  }, []);

  const handleAddStop = useCallback((stop: ColorStop) => {
    if (colorStops.length >= 6) return;
    setColorStops(prev => [...prev, stop]);
    setSelectedStopId(stop.id);
  }, [colorStops.length]);

  const handleStopSelect = useCallback((id: string | null) => {
    setSelectedStopId(id);
  }, []);

  const handleColorChange = useCallback((id: string, color: string) => {
    setColorStops(prev =>
      prev.map(stop => (stop.id === id ? { ...stop, color } : stop))
    );
  }, []);

  const handlePositionChange = useCallback((id: string, position: number) => {
    setColorStops(prev =>
      prev.map(stop => (stop.id === id ? { ...stop, position } : stop))
    );
  }, []);

  const handleDeleteStop = useCallback((id: string) => {
    if (colorStops.length <= 2) return;
    setColorStops(prev => prev.filter(stop => stop.id !== id));
    if (selectedStopId === id) {
      setSelectedStopId(null);
    }
  }, [colorStops.length, selectedStopId]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [cssCode]);

  const handleExportFavorite = useCallback(() => {
    const scheme: GradientScheme = {
      id: uuidv4(),
      name: `渐变方案 ${new Date().toLocaleTimeString()}`,
      colorStops: [...colorStops],
      angle,
      createdAt: Date.now(),
    };
    addFavorite(scheme);
  }, [colorStops, angle, addFavorite]);

  const handleApplyScheme = useCallback((stops: ColorStop[], newAngle: number) => {
    const newStops = stops.map(stop => ({ ...stop, id: uuidv4() }));
    setColorStops(newStops);
    setAngle(newAngle);
    setSelectedStopId(null);
  }, []);

  return (
    <div className="min-h-screen text-gray-200" style={{ backgroundColor: '#1A1A2E' }}>
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{
              background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)'
            }}>
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                渐变回响
              </h1>
              <p className="text-xs text-gray-500">Gradient Echo Studio</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            色标: {colorStops.length}/6 | 角度: {angle}°
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:w-[70%] flex flex-col gap-6">
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">渐变角度</h2>
                <div className="text-sm text-gray-500">
                  拖动圆形选择器或点击预设角度
                </div>
              </div>
              <AnglePicker angle={angle} onChange={setAngle} />
            </div>

            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/5 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">渐变画布</h2>
                <div className="text-sm text-gray-500">
                  点击画布添加色标，拖拽色标调整位置
                </div>
              </div>
              <GradientCanvas
                colorStops={colorStops}
                angle={angle}
                selectedStopId={selectedStopId}
                onColorStopsChange={handleColorStopsChange}
                onStopSelect={handleStopSelect}
                onAddStop={handleAddStop}
                maxStops={6}
              />
            </div>

            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">CSS 代码</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-400" />
                        <span className="text-green-400">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>复制代码</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExportFavorite}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 hover:from-pink-500/30 hover:to-cyan-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border border-white/10"
                  >
                    <BookmarkPlus size={16} />
                    <span>导出收藏</span>
                  </button>
                </div>
              </div>
              <div
                className="p-4 rounded-xl font-mono text-sm overflow-x-auto custom-scrollbar"
                style={{ backgroundColor: '#2D2D2D' }}
              >
                <code className="text-cyan-300">{cssCode}</code>
              </div>
            </div>
          </div>

          <div className="lg:w-[30%] lg:min-w-[300px] flex flex-col gap-6">
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/5 min-h-[500px]">
              <ColorPickerPanel
                selectedStop={selectedStop}
                onColorChange={handleColorChange}
                onPositionChange={handlePositionChange}
                onDelete={handleDeleteStop}
                canDelete={colorStops.length > 2}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
          <CommunityGallery
            presets={presetGradients}
            onApply={handleApplyScheme}
          />
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-4 mt-12">
        <div className="max-w-[1800px] mx-auto text-center text-sm text-gray-500">
          <p>渐变回响 © 2026 | 用心创造每一抹色彩</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
