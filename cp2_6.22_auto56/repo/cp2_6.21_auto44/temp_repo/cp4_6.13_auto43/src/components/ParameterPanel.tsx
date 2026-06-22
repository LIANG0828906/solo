import { useCallback, useRef, useEffect, useState } from 'react';
import { RotateCcw, Eye, Settings, Palette, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { FractalType, COLOR_MAPS } from '../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step, onChange, unit = '' }: SliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onChange(newValue);
      }, 100);
    },
    [onChange]
  );

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-[#e0e0e0]">{label}</label>
        <span className="text-sm font-mono text-[#8b9dc3] bg-[#16213e] px-2 py-0.5 rounded">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0f3460 0%, #16213e ${percentage}%, #0a0f1a ${percentage}%, #0a0f1a 100%)`
          }}
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 border border-[#16213e] rounded-lg overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-[#16213e]/50 hover:bg-[#16213e] transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-[#e0e0e0]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-[#8b9dc3]" /> : <ChevronDown size={18} className="text-[#8b9dc3]" />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 bg-[#1a1a2e]/50">{children}</div>
      </div>
    </div>
  );
}

export default function ParameterPanel({ isMobile = false }: { isMobile?: boolean }) {
  const currentParams = useStore((state) => state.currentParams);
  const fractalType = useStore((state) => state.fractalType);
  const colorMap = useStore((state) => state.colorMap);
  const isRendering = useStore((state) => state.isRendering);
  const updateParams = useStore((state) => state.updateParams);
  const setFractalType = useStore((state) => state.setFractalType);
  const setColorMap = useStore((state) => state.setColorMap);
  const resetParams = useStore((state) => state.resetParams);
  const resetView = useStore((state) => state.resetView);

  const handleJuliaConstantChange = useCallback(
    (index: number, value: number) => {
      const newJuliaConstant = [...currentParams.juliaConstant] as [number, number, number];
      newJuliaConstant[index] = value;
      updateParams({ juliaConstant: newJuliaConstant });
    },
    [currentParams.juliaConstant, updateParams]
  );

  return (
    <div
      className={`${isMobile ? 'w-full' : 'w-[320px]'} bg-[#16213e] text-[#e0e0e0] overflow-y-auto transition-all duration-200`}
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#e0e0e0]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Fractal Lab
            </h1>
            <p className="text-xs text-[#8b9dc3]">3D 分形图形编辑器</p>
          </div>
          {isRendering && (
            <div className="flex items-center gap-1 text-xs text-[#64ffda]">
              <div className="w-2 h-2 bg-[#64ffda] rounded-full animate-pulse" />
              <span>渲染中</span>
            </div>
          )}
        </div>

        <Section title="分形类型" icon={<Settings size={16} className="text-[#64ffda]" />}>
          <select
            value={fractalType}
            onChange={(e) => setFractalType(e.target.value as FractalType)}
            className="w-full p-2 bg-[#1a1a2e] border border-[#0f3460] rounded-md text-[#e0e0e0] focus:outline-none focus:border-[#64ffda] transition-colors duration-200 mb-2"
          >
            <option value={FractalType.MANDELBULB}>Mandelbulb</option>
            <option value={FractalType.JULIA_SET}>Julia 集</option>
            <option value={FractalType.QUATERNION}>Quaternion 分形</option>
          </select>
        </Section>

        <Section title="迭代参数" icon={<Eye size={16} className="text-[#ff6b6b]" />}>
          <Slider
            label="迭代次数"
            value={currentParams.iterations}
            min={8}
            max={128}
            step={1}
            onChange={(v) => updateParams({ iterations: Math.round(v) })}
          />
          <Slider
            label="逃逸半径"
            value={currentParams.escapeRadius}
            min={2}
            max={10}
            step={0.1}
            onChange={(v) => updateParams({ escapeRadius: v })}
          />
          <Slider
            label="幂指数 (P值)"
            value={currentParams.power}
            min={2}
            max={8}
            step={0.1}
            onChange={(v) => updateParams({ power: v })}
          />
        </Section>

        {fractalType === FractalType.JULIA_SET && (
          <Section title="Julia 常数" icon={<Settings size={16} className="text-[#ffd93d]" />}>
            <Slider
              label="X 分量"
              value={currentParams.juliaConstant[0]}
              min={-1}
              max={1}
              step={0.01}
              onChange={(v) => handleJuliaConstantChange(0, v)}
            />
            <Slider
              label="Y 分量"
              value={currentParams.juliaConstant[1]}
              min={-1}
              max={1}
              step={0.01}
              onChange={(v) => handleJuliaConstantChange(1, v)}
            />
            <Slider
              label="Z 分量"
              value={currentParams.juliaConstant[2]}
              min={-1}
              max={1}
              step={0.01}
              onChange={(v) => handleJuliaConstantChange(2, v)}
            />
          </Section>
        )}

        <Section title="视觉效果" icon={<Palette size={16} className="text-[#6bcb77]" />}>
          <Slider
            label="环境光遮蔽强度"
            value={currentParams.ambientOcclusion}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updateParams({ ambientOcclusion: v })}
          />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#e0e0e0]">内部着色</span>
            <button
              onClick={() => updateParams({ internalColoring: !currentParams.internalColoring })}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 ${currentParams.internalColoring ? 'bg-[#0f3460]' : 'bg-[#0a0f1a]'}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${currentParams.internalColoring ? 'left-7' : 'left-1'}`}
              />
            </button>
          </div>
        </Section>

        <Section title="颜色映射" icon={<Palette size={16} className="text-[#a66cff]" />}>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {COLOR_MAPS.map((cm) => (
              <button
                key={cm.name}
                onClick={() => setColorMap(cm)}
                className={`h-10 rounded-md border-2 transition-all duration-200 hover:scale-105 ${colorMap.name === cm.name ? 'border-[#64ffda] shadow-[0_0_10px_rgba(100,255,218,0.5)]' : 'border-transparent'}`}
                style={{
                  background: `linear-gradient(to right, rgb(${cm.colors[0].rgb.map((v) => v * 255).join(',')}), rgb(${cm.colors[1].rgb.map((v) => v * 255).join(',')}), rgb(${cm.colors[2].rgb.map((v) => v * 255).join(',')}), rgb(${cm.colors[3].rgb.map((v) => v * 255).join(',')}))`
                }}
                title={cm.name}
              />
            ))}
          </div>
          <div className="text-xs text-[#8b9dc3] text-center">{colorMap.name} 调色板</div>
        </Section>

        <div className="flex gap-2 mt-6">
          <button
            onClick={resetParams}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#0f3460] hover:bg-[#1a4a7a] text-white rounded-md transition-all duration-200 hover:shadow-[0_0_15px_rgba(15,52,96,0.8)]"
          >
            <RotateCcw size={16} />
            <span className="text-sm">重置参数</span>
          </button>
          <button
            onClick={resetView}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#16213e] hover:bg-[#1a3a5c] text-white rounded-md border border-[#0f3460] transition-all duration-200 hover:shadow-[0_0_15px_rgba(15,52,96,0.6)]"
          >
            <Eye size={16} />
            <span className="text-sm">重置视角</span>
          </button>
        </div>

        <div className="mt-6 p-3 bg-[#1a1a2e]/80 rounded-md text-xs text-[#8b9dc3]">
          <p className="mb-1">🖱️ 拖拽旋转视角</p>
          <p className="mb-1">🔍 滚轮缩放 (0.5x-10x)</p>
          <p>⌨️ WASD 键平移视野</p>
        </div>
      </div>
    </div>
  );
}
