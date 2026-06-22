import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BuildingTemplate, Building } from '../../types';
import {
  Building2,
  Plus,
  Trash2,
  Sun,
  Moon,
  Ruler,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Menu,
} from 'lucide-react';

interface ControlPanelProps {
  templates: BuildingTemplate[];
  selectedBuilding: Building | null;
  timeOfDay: number;
  onAddBuilding: (templateId: string) => void;
  onDeleteBuilding: () => void;
  onTimeChange: (time: number) => void;
  onHeightChange: (height: number) => void;
  onExport: () => Promise<void>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  templates,
  selectedBuilding,
  timeOfDay,
  onAddBuilding,
  onDeleteBuilding,
  onTimeChange,
  onHeightChange,
  onExport,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [height, setHeight] = useState<number>(40);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      setHeight(selectedBuilding.height);
    }
  }, [selectedBuilding]);

  const handleAddBuilding = useCallback(() => {
    onAddBuilding(selectedTemplateId);
  }, [selectedTemplateId, onAddBuilding]);

  const handleDeleteBuilding = useCallback(() => {
    if (selectedBuilding) {
      onDeleteBuilding();
    }
  }, [selectedBuilding, onDeleteBuilding]);

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTimeChange(parseFloat(e.target.value));
    },
    [onTimeChange]
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHeight = parseFloat(e.target.value);
      setHeight(newHeight);
      if (selectedBuilding) {
        onHeightChange(newHeight);
      }
    },
    [selectedBuilding, onHeightChange]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [onExport]);

  const formatTime = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getTimeIcon = () => {
    if (timeOfDay >= 6 && timeOfDay < 18) {
      return <Sun className="w-5 h-5 text-yellow-400" />;
    }
    return <Moon className="w-5 h-5 text-blue-300" />;
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const controlPanelContent = (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Building2 className="w-8 h-8 text-[#00BFFF]" />
        <h1 className="text-xl font-bold text-white">城市编辑器</h1>
      </div>

      <div className="space-y-2" ref={dropdownRef}>
        <label className="text-sm font-medium text-gray-300">建筑模板</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: selectedTemplate?.color }}
              />
              <span>{selectedTemplate?.name || '请选择模板'}</span>
            </div>
            {isDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-[#1a1a2e]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                    selectedTemplateId === template.id
                      ? 'bg-white/10'
                      : ''
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: template.color }}
                  />
                  <span className="text-white">{template.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAddBuilding}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00BFFF] hover:bg-[#00a3d9] text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          添加建筑
        </button>
        <button
          type="button"
          onClick={handleDeleteBuilding}
          disabled={!selectedBuilding}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all duration-200 ${
            selectedBuilding
              ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 active:scale-95'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-5 h-5" />
          删除
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            {getTimeIcon()}
            时间
          </label>
          <span className="text-white font-mono">{formatTime(timeOfDay)}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="24"
            step="0.1"
            value={timeOfDay}
            onChange={handleTimeChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FFD700 0%, #FF8C00 25%, #1E90FF 50%, #4169E1 75%, #000080 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#00BFFF]" />
            建筑高度
          </label>
          <span className="text-white font-mono">
            {selectedBuilding ? `${height}m` : '--'}
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          step="1"
          value={selectedBuilding ? height : 10}
          onChange={handleHeightChange}
          disabled={!selectedBuilding}
          className={`w-full h-2 rounded-lg appearance-none ${
            selectedBuilding
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            background: selectedBuilding
              ? `linear-gradient(to right, #00BFFF 0%, #00BFFF ${((height - 10) / 190) * 100}%, #333 ${((height - 10) / 190) * 100}%, #333 100%)`
              : '#333',
          }}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10m</span>
          <span>100m</span>
          <span>200m</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00BFFF] to-[#0080ff] hover:from-[#00a3d9] hover:to-[#0066cc] text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isExporting ? '导出中...' : '导出 JSON'}
        </button>
      </div>

      {isMobile && (
        <div className="pt-4 border-t border-white/10 text-xs text-gray-500 text-center">
          点击建筑可选中，拖拽旋转视角
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/10">
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Menu className="w-6 h-6 text-[#00BFFF]" />
              <span className="font-medium">控制面板</span>
            </div>
            {isMobileOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
        {isMobileOpen && (
          <div className="bg-[#0a0a1a]/90 backdrop-blur-md border-b border-white/10 max-h-[80vh] overflow-y-auto">
            {controlPanelContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[300px] z-40 bg-[#0a0a1a]/70 backdrop-blur-[8px] border-r border-white/10 overflow-y-auto">
      {controlPanelContent}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        input[type='range']:disabled::-webkit-slider-thumb {
          background: #666;
          cursor: not-allowed;
        }
        input[type='range']:disabled::-moz-range-thumb {
          background: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
