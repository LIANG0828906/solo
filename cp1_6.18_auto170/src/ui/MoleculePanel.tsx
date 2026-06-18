import React from 'react';
import { RotateCcw } from 'lucide-react';

interface MoleculeOption {
  id: string;
  name: string;
  formula: string;
}

interface MoleculePanelProps {
  currentMolecule: string;
  molecules: MoleculeOption[];
  atomCount: number;
  bondCount: number;
  showLabels: boolean;
  onMoleculeChange: (id: string) => void;
  onToggleLabels: (show: boolean) => void;
  onResetView: () => void;
}

export const MoleculePanel: React.FC<MoleculePanelProps> = ({
  currentMolecule,
  molecules,
  atomCount,
  bondCount,
  showLabels,
  onMoleculeChange,
  onToggleLabels,
  onResetView,
}) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 w-[280px] rounded-[16px] border border-white/10 backdrop-blur-md z-50"
         style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
      <div className="p-5">
        <h2 className="text-white text-[14px] font-semibold mb-4 tracking-wide">
          分子控制面板
        </h2>
        
        <div className="mb-5">
          <label className="block text-[#B0B0C0] text-[12px] mb-2">选择分子</label>
          <select
            value={currentMolecule}
            onChange={(e) => onMoleculeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] text-white text-[13px] border border-[#3A3A4A] focus:outline-none focus:border-[#5A5A6A] transition-colors cursor-pointer"
            style={{ background: '#2A2A3A' }}
          >
            {molecules.map((mol) => (
              <option key={mol.id} value={mol.id} className="hover:bg-[#4A4A5A]">
                {mol.name} ({mol.formula})
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-5 p-3 rounded-[8px]" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
          <div className="text-[#B0B0C0] text-[12px] mb-3">分子信息</div>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#B0B0C0]">原子数量</span>
              <span className="text-white font-medium">{atomCount}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#B0B0C0]">化学键数量</span>
              <span className="text-white font-medium">{bondCount}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[#B0B0C0] text-[13px]">显示原子标签</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => onToggleLabels(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  showLabels ? 'bg-[#4A7FFF]' : 'bg-[#3A3A4A]'
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  showLabels ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
        
        <button
          onClick={onResetView}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-white text-[13px] font-medium transition-all duration-150 hover:bg-[#3A3A4A] active:scale-[0.92]"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <RotateCcw size={16} />
          重置视角
        </button>
      </div>
    </div>
  );
};
