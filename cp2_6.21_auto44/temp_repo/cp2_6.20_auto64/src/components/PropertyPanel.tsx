
import React from 'react';
import { useMoleculeStore } from '../store/moleculeStore';
import { ELEMENT_CONFIG } from '../utils/constants';
import { X } from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const selectedBondId = useMoleculeStore((s) => s.selectedBondId);
  const getMolecularWeight = useMoleculeStore((s) => s.getMolecularWeight);
  const getAtomById = useMoleculeStore((s) => s.getAtomById);
  const selectAtom = useMoleculeStore((s) => s.selectAtom);
  const selectBond = useMoleculeStore((s) => s.selectBond);

  const selectedAtom = selectedAtomId ? getAtomById(selectedAtomId) : undefined;
  const selectedBond = bonds.find((b) => b.id === selectedBondId);

  const hasSelection = !!selectedAtom || !!selectedBond;
  const isExpanded = hasSelection || atoms.length > 0;

  const molecularWeight = getMolecularWeight();

  return (
    <div
      className="h-full transition-all duration-400 ease-out overflow-hidden"
      style={{
        width: isExpanded ? '100%' : '4px',
        opacity: isExpanded ? 1 : 0.6,
      }}
    >
      <div
        className="h-full bg-[#1a1f2e]/80 backdrop-blur-md border-l border-white/10
                   flex flex-col overflow-hidden"
        style={{
          minWidth: isExpanded ? 180 : 0,
        }}
      >
        {isExpanded && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <h3 className="text-xs text-cyan-400 uppercase tracking-widest">属性面板</h3>

            <div className="space-y-3 p-3 rounded-lg bg-black/20 border border-white/5">
              <h4 className="text-[10px] text-gray-400 uppercase tracking-wider">分子统计</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">原子数</span>
                <span className="text-white font-mono">{atoms.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">化学键</span>
                <span className="text-white font-mono">{bonds.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">分子量</span>
                <span className="text-cyan-400 font-mono">{molecularWeight.toFixed(2)} g/mol</span>
              </div>
            </div>

            {selectedAtom && (
              <div className="space-y-3 p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] text-cyan-400 uppercase tracking-wider">选中原子</h4>
                  <button
                    onClick={() => selectAtom(null)}
                    className="p-1 rounded hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <X size={12} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-full"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: selectedAtom.color,
                      boxShadow: `0 0 15px ${selectedAtom.color}`,
                    }}
                  />
                  <div>
                    <div className="text-white font-bold">
                      {ELEMENT_CONFIG[selectedAtom.element].name}
                      <span className="ml-1 text-gray-400 text-xs">({selectedAtom.element})</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      序号 #{atoms.findIndex((a) => a.id === selectedAtom.id) + 1}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-gray-500">原子序数</div>
                    <div className="text-white font-mono">
                      {ELEMENT_CONFIG[selectedAtom.element].atomicNumber}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-gray-500">原子量</div>
                    <div className="text-white font-mono">
                      {ELEMENT_CONFIG[selectedAtom.element].atomicWeight.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedBond && (
              <div className="space-y-3 p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] text-cyan-400 uppercase tracking-wider">选中化学键</h4>
                  <button
                    onClick={() => selectBond(null)}
                    className="p-1 rounded hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <X size={12} className="text-gray-400" />
                  </button>
                </div>
                <div className="text-sm text-white">
                  {(() => {
                    const a = getAtomById(selectedBond.atomA);
                    const b = getAtomById(selectedBond.atomB);
                    if (!a || !b) return null;
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: a.color }}
                        />
                        <span className="text-gray-400">—</span>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="ml-2">
                          {a.element} - {b.element}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">键类型：</span>
                  <span className="text-white">
                    {selectedBond.type === 'single' && '单键'}
                    {selectedBond.type === 'double' && '双键'}
                    {selectedBond.type === 'triple' && '三键'}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">键长：</span>
                  <span className="text-cyan-400 font-mono">
                    {(selectedBond.length * 0.529).toFixed(3)} Å
                  </span>
                </div>
              </div>
            )}

            {!selectedAtom && !selectedBond && atoms.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8">
                从左侧拖拽原子开始构建分子
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
