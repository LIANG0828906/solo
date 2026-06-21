import React, { useState } from 'react';
import { Molecule, CPK_COLORS } from '@/types';

interface MoleculePanelProps {
  molecules: Molecule[];
  onSelectMolecule: (molecule: Molecule) => void;
  onDragStart: (molecule: Molecule, e: React.DragEvent) => void;
  selectedMoleculeId: string | null;
  isMobile: boolean;
}

const MoleculePanel: React.FC<MoleculePanelProps> = ({
  molecules,
  onSelectMolecule,
  onDragStart,
  selectedMoleculeId,
  isMobile,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getElementPreview = (molecule: Molecule) => {
    const uniqueElements = [...new Set(molecule.atoms.map(a => a.element))];
    return uniqueElements.slice(0, 4).map((el, idx) => (
      <div
        key={el}
        className="w-4 h-4 rounded-full border border-gray-600"
        style={{
          backgroundColor: CPK_COLORS[el] || '#888',
          transform: `translateX(${idx * 8}px)`,
          zIndex: uniqueElements.length - idx,
        }}
      />
    ));
  };

  const moleculeCards = molecules.map(molecule => (
    <div
      key={molecule.id}
      draggable
      onDragStart={(e) => onDragStart(molecule, e)}
      onClick={() => {
        onSelectMolecule(molecule);
        if (isMobile) setIsDrawerOpen(false);
      }}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-300
        hover:scale-105 hover:shadow-lg
        ${selectedMoleculeId === molecule.id
          ? 'bg-[#0f3460] border-2 border-blue-400 shadow-lg'
          : 'bg-[#16213e] border-2 border-transparent hover:border-[#0f3460]'
        }
      `}
      style={{
        animation: selectedMoleculeId === molecule.id
          ? 'pulseScale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-lg">{molecule.name}</h3>
        <div className="relative flex items-center h-4">
          {getElementPreview(molecule)}
        </div>
      </div>
      <p className="text-gray-300 text-sm font-mono">{molecule.formula}</p>
      <p className="text-gray-400 text-xs mt-1">分子量: {molecule.molecularWeight}</p>
      <p className="text-gray-500 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        拖拽至场景添加第二个分子
      </p>
    </div>
  ));

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0f3460] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#1a4a8a] transition-colors"
        >
          选择分子
        </button>
        <div
          className={`
            fixed inset-0 z-40 transition-transform duration-300
            ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-4 text-center">选择分子</h2>
            <div className="grid grid-cols-2 gap-3">
              {moleculeCards}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#16213e] p-4 overflow-y-auto border-r border-[#0f3460]">
      <h1 className="text-white text-2xl font-bold mb-2">分子实验室</h1>
      <p className="text-gray-400 text-sm mb-6">选择分子开始探索</p>

      <div className="space-y-3">
        {moleculeCards}
      </div>

      <div className="mt-6 p-3 bg-[#1a1a2e] rounded-lg">
        <h4 className="text-gray-300 text-sm font-semibold mb-2">操作说明</h4>
        <ul className="text-gray-500 text-xs space-y-1">
          <li>• 点击分子卡片添加到场景</li>
          <li>• 拖拽分子到场景添加第二个</li>
          <li>• 拖拽旋转，滚轮缩放</li>
          <li>• 点击原子查看元素符号</li>
        </ul>
      </div>

      <style>{`
        @keyframes pulseScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MoleculePanel;
