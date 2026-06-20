import { useRef, useState, useEffect } from 'react';
import { Upload, Layers, Palette, Eye, RotateCcw, Download, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useGeoStore, ColorMode, Annotation } from '@/store/useGeoStore';
import { presets } from '@/utils/geoUtils';
import { ViewPreset } from '@/scene/Scene3D';

interface ControlPanelProps {
  onViewChange: (view: ViewPreset) => void;
  onExport: () => void;
  onReset: () => void;
}

const colorModes: { id: ColorMode; name: string; colors: string[] }[] = [
  { id: 'rainbow', name: '彩虹', colors: ['#ff0000', '#ffaa00', '#00ff00', '#00aaff', '#aa00ff'] },
  { id: 'heat', name: '热力图', colors: ['#000033', '#0066ff', '#00ffcc', '#ffff00', '#ff0000'] },
  { id: 'grayscale', name: '灰度', colors: ['#000000', '#444444', '#888888', '#bbbbbb', '#ffffff'] },
];

const viewPresets: { id: ViewPreset; name: string; icon: string }[] = [
  { id: 'top', name: '俯视', icon: '⬇' },
  { id: 'side', name: '侧视', icon: '➡' },
  { id: 'section', name: '剖视', icon: '◢' },
  { id: 'global', name: '全局', icon: '🌐' },
];

export function ControlPanel({ onViewChange, onExport, onReset }: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    sliceX, sliceY, sliceZ,
    setSliceX, setSliceY, setSliceZ,
    colorMode, setColorMode,
    presetName, setGeoData, setPresetName,
    annotations, clearAnnotations,
    gridSize,
    isPanelOpen, setPanelOpen
  } = useGeoStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.densities && data.size) {
          setGeoData(data.densities, data.size, 'custom');
          setPresetName('custom');
        }
      } catch (err) {
        console.error('Failed to parse geo data:', err);
      }
    };
    reader.readAsText(file);
  };

  const handlePresetChange = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const size = 16;
      const data = preset.generator(size);
      setGeoData(data, { x: size, y: size, z: size }, presetId);
      setPresetName(presetId);
    }
  };

  const panelContent = (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[#e0e6f0] mb-4 flex items-center gap-2">
          <Layers size={18} className="text-[#4a6cf7]" />
          地质体数据
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-[#6b7280] mb-1.5 block">预设地质体</label>
            <select
              value={presetName}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-[#1e2029] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-[#e0e6f0] text-sm
                focus:outline-none focus:border-[#4a6cf7] transition-colors cursor-pointer"
            >
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-[#6b7280] mb-1.5 block">上传数据</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-[#1e2029] border border-[#2a2d3a] 
                rounded-lg px-4 py-2.5 text-[#e0e6f0] text-sm hover:border-[#4a6cf7] 
                hover:bg-[#252834] transition-all duration-200"
            >
              <Upload size={16} />
              上传JSON数据
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2a2d3a] pt-5">
        <h2 className="text-lg font-semibold text-[#e0e6f0] mb-4 flex items-center gap-2">
          <Eye size={18} className="text-[#4a6cf7]" />
          切片控制
        </h2>
        
        <div className="space-y-4">
          <SliderControl
            label="X轴切片"
            value={sliceX}
            onChange={setSliceX}
            color="#4ade80"
            gridSize={gridSize.x}
          />
          <SliderControl
            label="Y轴切片"
            value={sliceY}
            onChange={setSliceY}
            color="#4ade80"
            gridSize={gridSize.y}
          />
          <SliderControl
            label="Z轴切片"
            value={sliceZ}
            onChange={setSliceZ}
            color="#4ade80"
            gridSize={gridSize.z}
          />
        </div>
      </div>

      <div className="border-t border-[#2a2d3a] pt-5">
        <h2 className="text-lg font-semibold text-[#e0e6f0] mb-4 flex items-center gap-2">
          <Palette size={18} className="text-[#4a6cf7]" />
          色彩映射
        </h2>
        
        <div className="grid grid-cols-3 gap-2">
          {colorModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200
                ${colorMode === mode.id 
                  ? 'border-[#4a6cf7] bg-[#4a6cf7]/10' 
                  : 'border-[#2a2d3a] bg-[#1e2029] hover:border-[#3a3d4a]'
                }`}
            >
              <div className="flex h-4 w-full rounded overflow-hidden">
                {mode.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className={`text-xs ${colorMode === mode.id ? 'text-[#4a6cf7]' : 'text-[#9ca3af]'}`}>
                {mode.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#2a2d3a] pt-5">
        <h2 className="text-lg font-semibold text-[#e0e6f0] mb-4">预设视角</h2>
        
        <div className="grid grid-cols-4 gap-2">
          {viewPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onViewChange(preset.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[#2a2d3a] bg-[#1e2029]
                hover:border-[#4a6cf7] hover:bg-[#252834] transition-all duration-200"
            >
              <span className="text-lg">{preset.icon}</span>
              <span className="text-xs text-[#9ca3af]">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#2a2d3a] pt-5">
        <h2 className="text-lg font-semibold text-[#e0e6f0] mb-4">标注信息</h2>
        <div className="bg-[#1e2029] rounded-lg p-3 text-sm">
          <div className="flex justify-between text-[#9ca3af] mb-2">
            <span>标注数量</span>
            <span className="text-[#e0e6f0]">{annotations.length}</span>
          </div>
          <button
            onClick={clearAnnotations}
            className="w-full flex items-center justify-center gap-1.5 text-[#f87171] 
              hover:text-[#fca5a5] transition-colors text-xs mt-2"
          >
            <X size={14} />
            清空所有标注
          </button>
        </div>
      </div>

      <div className="border-t border-[#2a2d3a] pt-5 mt-auto">
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7f1d1d] hover:bg-[#991b1b]
              text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200"
          >
            <RotateCcw size={16} />
            重置
          </button>
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 bg-[#4a6cf7] hover:bg-[#5b7df8]
              text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200"
          >
            <Download size={16} />
            截图导出
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className={`bg-[#13151c] border-t border-[#2a2d3a] transition-all duration-300 ease-out
            ${isExpanded ? 'h-[70vh]' : 'h-[60px]'}`}
        >
          <div
            className="h-[60px] flex items-center justify-between px-5 cursor-pointer border-b border-[#2a2d3a]"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="text-[#e0e6f0] font-medium">控制面板</span>
            {isExpanded ? <ChevronDown size={20} className="text-[#6b7280]" /> : <ChevronUp size={20} className="text-[#6b7280]" />}
          </div>
          {isExpanded && (
            <div className="h-[calc(70vh-60px)] overflow-y-auto">
              {panelContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#13151c] border-l border-[#2a2d3a] flex flex-col h-full flex-shrink-0
      rounded-tl-[12px] rounded-bl-[12px]">
      {panelContent}
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  gridSize: number;
}

function SliderControl({ label, value, onChange, gridSize }: SliderControlProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = value;
  const actualIndex = Math.floor((value / 100) * (gridSize - 1));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-[#9ca3af]">{label}</span>
        <span className="text-[#e0e6f0] font-mono">
          {value.toFixed(0)}% <span className="text-[#6b7280] text-xs">({actualIndex})</span>
        </span>
      </div>
      <div 
        className="relative h-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-[#2a2d3a] rounded-full" />
        <div 
          className="absolute left-0 top-0 h-full bg-[#4a6cf7] rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[#4a6cf7] 
            shadow-lg transition-all duration-150 pointer-events-none
            ${isHovered ? 'w-5 h-5 shadow-[#4a6cf7]/50' : 'w-4 h-4'}`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ControlPanel;
