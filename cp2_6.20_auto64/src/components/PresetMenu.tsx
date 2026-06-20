
import React, { useState } from 'react';
import { PRESET_MOLECULES } from '../utils/moleculePresets';
import { useMoleculeStore } from '../store/moleculeStore';
import { ChevronDown, Beaker, Trash2 } from 'lucide-react';

export const PresetMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const loadPreset = useMoleculeStore((s) => s.loadPreset);
  const clearAll = useMoleculeStore((s) => s.clearAll);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-[#1a1f2e]/80 backdrop-blur-md border border-white/10
                   text-sm text-white hover:brightness-110 active:scale-95
                   transition-all duration-150"
      >
        <Beaker size={16} className="text-cyan-400" />
        <span>预置分子</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-20 min-w-[160px] py-2 rounded-xl
                          bg-[#1a1f2e]/95 backdrop-blur-md border border-white/10 shadow-2xl">
            {Object.entries(PRESET_MOLECULES).map(([key, mol]) => (
              <button
                key={key}
                onClick={() => {
                  loadPreset(mol);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-left
                           hover:bg-white/10 hover:brightness-110 active:scale-[0.98]
                           transition-all duration-150"
              >
                <div>
                  <div className="text-sm text-white">{mol.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{mol.formula}</div>
                </div>
                <div className="text-xs text-cyan-400">
                  {mol.atoms.length}原子
                </div>
              </button>
            ))}
            <div className="my-1 border-t border-white/10" />
            <button
              onClick={() => {
                clearAll();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-left
                         hover:bg-red-500/20 hover:brightness-110 active:scale-[0.98]
                         transition-all duration-150 text-red-400"
            >
              <Trash2 size={14} />
              <span className="text-sm">清空场景</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
