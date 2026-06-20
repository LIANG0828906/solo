import { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Layers, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Lens, LensType } from '../../types/optical';

const lensTypeLabels: Record<LensType, string> = {
  biconvex: '双凸透镜',
  'plano-convex': '平凸透镜',
  'positive-meniscus': '正弯月镜',
  biconcave: '双凹透镜',
  'plano-concave': '平凹透镜',
  'negative-meniscus': '负弯月镜',
  convex: '凸透镜',
  concave: '凹透镜',
  doublet: '双胶合',
};

const lensTypeColors: Record<LensType, string> = {
  biconvex: '#66D9EF',
  'plano-convex': '#50C878',
  'positive-meniscus': '#F4A460',
  biconcave: '#F92672',
  'plano-concave': '#FF6347',
  'negative-meniscus': '#DDA0DD',
  convex: '#66D9EF',
  concave: '#F92672',
  doublet: '#AE81FF',
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#888]">{label}</span>
        <span className="text-xs font-mono text-[#A6E22E]">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #A6E22E 0%, #A6E22E ${((value - min) / (max - min)) * 100}%, #3A3A45 ${((value - min) / (max - min)) * 100}%, #3A3A45 100%)`,
        }}
      />
    </div>
  );
}

function LensCard({ lens, isSelected }: { lens: Lens; isSelected: boolean }) {
  const { updateLensSurface, removeLens, setSelectedLensId } = useAppStore();
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`mb-3 rounded-lg border transition-all duration-300 cursor-pointer ${
        isSelected ? 'border-[#66D9EF]' : 'border-[#3A3A45]'
      }`}
      style={{
        backgroundColor: isSelected ? 'rgba(102, 217, 239, 0.08)' : '#252530',
      }}
      onClick={() => setSelectedLensId(lens.id)}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: lensTypeColors[lens.type] }}
          />
          <span className="text-sm font-medium text-[#E0E0E0]">
            {lensTypeLabels[lens.type]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeLens(lens.id);
            }}
            className="p-1 rounded text-[#888] hover:text-[#F92672] hover:bg-[#F92672]/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? (
            <ChevronLeft size={14} className="text-[#666]" />
          ) : (
            <ChevronRight size={14} className="text-[#666]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[#3A3A45]/50 pt-2">
          {lens.surfaces.slice(0, -1).map((surface, idx) => (
            <div key={idx} className="mb-2">
              <div className="text-xs text-[#666] mb-1.5">面 {idx + 1}</div>
              <Slider
                label="曲率半径"
                value={surface.radius}
                min={-100}
                max={100}
                step={1}
                unit="mm"
                onChange={(v) =>
                  updateLensSurface(lens.id, idx, 'radius', v)
                }
              />
              <Slider
                label="厚度"
                value={surface.thickness}
                min={1}
                max={20}
                step={0.1}
                unit="mm"
                onChange={(v) =>
                  updateLensSurface(lens.id, idx, 'thickness', v)
                }
              />
              <Slider
                label="折射率"
                value={surface.refractiveIndex}
                min={1.4}
                max={2.0}
                step={0.01}
                onChange={(v) =>
                  updateLensSurface(lens.id, idx, 'refractiveIndex', v)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParameterPanel() {
  const {
    lenses,
    lightSource,
    addLens,
    updateLightSourcePosition,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectedLensId,
    setIsTracing,
  } = useAppStore();

  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const rect = dragRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 80;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -80;
      updateLightSourcePosition('x', Math.round(x * 10) / 10);
      updateLightSourcePosition('y', Math.round(y * 10) / 10);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateLightSourcePosition]);

  const handleTrace = () => {
    setIsTracing(true);
  };

  if (sidebarCollapsed) {
    return (
      <div
        className="h-full flex flex-col items-center py-4 gap-4"
        style={{
          width: 56,
          backgroundColor: '#2A2A35',
          color: '#E0E0E0',
          transition: 'all 0.3s ease',
          borderRight: '1px solid #1F1F28',
        }}
      >
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 rounded-lg hover:bg-[#3A3A45] transition-colors"
          title="展开面板"
        >
          <ChevronRight size={18} />
        </button>
        <div className="w-10 h-10 rounded-lg bg-[#66D9EF]/10 flex items-center justify-center text-[#66D9EF]">
          <Layers size={18} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        width: 380,
        backgroundColor: '#2A2A35',
        color: '#E0E0E0',
        transition: 'all 0.3s ease',
        borderRight: '1px solid #1F1F28',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A45]">
        <h2 className="text-sm font-semibold tracking-wide">参数面板</h2>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="p-1.5 rounded hover:bg-[#3A3A45] transition-colors text-[#888]"
          title="折叠面板"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <div className="text-xs font-medium text-[#888] mb-2 px-1">添加透镜</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addLens('convex')}
              className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-[#3A3A45] hover:border-[#66D9EF] hover:bg-[#66D9EF]/5 transition-all duration-300 group"
            >
              <Plus size={16} className="text-[#66D9EF]" />
              <span className="text-[11px] group-hover:text-[#66D9EF] transition-colors">
                凸透镜
              </span>
            </button>
            <button
              onClick={() => addLens('concave')}
              className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-[#3A3A45] hover:border-[#F92672] hover:bg-[#F92672]/5 transition-all duration-300 group"
            >
              <Minus size={16} className="text-[#F92672]" />
              <span className="text-[11px] group-hover:text-[#F92672] transition-colors">
                凹透镜
              </span>
            </button>
            <button
              onClick={() => addLens('doublet')}
              className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-[#3A3A45] hover:border-[#AE81FF] hover:bg-[#AE81FF]/5 transition-all duration-300 group"
            >
              <Layers size={16} className="text-[#AE81FF]" />
              <span className="text-[11px] group-hover:text-[#AE81FF] transition-colors">
                双胶合
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-[#888] mb-2 px-1">透镜列表</div>
          {lenses.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#555] rounded-lg border border-dashed border-[#3A3A45]">
              暂无透镜，点击上方添加
            </div>
          ) : (
            lenses.map((lens) => (
              <LensCard
                key={lens.id}
                lens={lens}
                isSelected={selectedLensId === lens.id}
              />
            ))
          )}
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-[#888] mb-2 px-1">光源位置</div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#252530' }}>
            <div
              ref={dragRef}
              onMouseDown={handleDragStart}
              className="relative w-full h-32 rounded-lg border border-[#3A3A45] mb-3 overflow-hidden cursor-crosshair select-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(58,58,69,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(58,58,69,0.5) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                backgroundColor: '#1F1F28',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-full bg-[#3A3A45]" />
                <div className="absolute w-full h-px bg-[#3A3A45]" />
              </div>
              <div
                className="absolute w-4 h-4 rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75"
                style={{
                  left: `${50 + (lightSource.position.x / 80) * 50}%`,
                  top: `${50 - (lightSource.position.y / 80) * 50}%`,
                  backgroundColor: '#E6DB74',
                  boxShadow: '0 0 12px rgba(230, 219, 116, 0.6)',
                }}
              />
              <div className="absolute bottom-1.5 left-2 text-[10px] text-[#555] font-mono">
                XY 投影 (拖拽移动)
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10px] text-[#666] mb-1">X</div>
                <input
                  type="number"
                  value={lightSource.position.x}
                  onChange={(e) =>
                    updateLightSourcePosition('x', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-[#3A3A45] bg-[#1F1F28] text-[#A6E22E] focus:outline-none focus:border-[#A6E22E]/50"
                  step={0.5}
                />
              </div>
              <div>
                <div className="text-[10px] text-[#666] mb-1">Y</div>
                <input
                  type="number"
                  value={lightSource.position.y}
                  onChange={(e) =>
                    updateLightSourcePosition('y', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-[#3A3A45] bg-[#1F1F28] text-[#A6E22E] focus:outline-none focus:border-[#A6E22E]/50"
                  step={0.5}
                />
              </div>
              <div>
                <div className="text-[10px] text-[#666] mb-1">Z</div>
                <input
                  type="number"
                  value={lightSource.position.z}
                  onChange={(e) =>
                    updateLightSourcePosition('z', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-[#3A3A45] bg-[#1F1F28] text-[#A6E22E] focus:outline-none focus:border-[#A6E22E]/50"
                  step={10}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#3A3A45]">
        <button
          onClick={handleTrace}
          className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: '#66D9EF',
            color: '#1F1F28',
            boxShadow: '0 4px 20px rgba(102, 217, 239, 0.3)',
          }}
        >
          开始光线追迹
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #A6E22E;
          cursor: pointer;
          border: 2px solid #2A2A35;
          box-shadow: 0 0 6px rgba(166, 226, 46, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #A6E22E;
          cursor: pointer;
          border: 2px solid #2A2A35;
          box-shadow: 0 0 6px rgba(166, 226, 46, 0.5);
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
