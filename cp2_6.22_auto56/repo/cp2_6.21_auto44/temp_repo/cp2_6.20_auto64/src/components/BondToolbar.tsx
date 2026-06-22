
import React from 'react';
import { BOND_CONFIG, type BondType } from '../utils/constants';
import { useMoleculeStore } from '../store/moleculeStore';
import { Minus, Minus as MinusIcon } from 'lucide-react';

export const BondToolbar: React.FC = () => {
  const selectedBondType = useMoleculeStore((s) => s.selectedBondType);
  const setSelectedBondType = useMoleculeStore((s) => s.setSelectedBondType);
  const bondCreationFirstAtom = useMoleculeStore((s) => s.bondCreationFirstAtom);

  const bondTypes: BondType[] = ['single', 'double', 'triple'];

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-[#1a1f2e]/80 backdrop-blur-md border border-white/10">
      {bondTypes.map((type) => {
        const config = BOND_CONFIG[type];
        const isSelected = selectedBondType === type;
        return (
          <button
            key={type}
            onClick={() => setSelectedBondType(type)}
            className={`
              relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-all duration-150 ease-out
              hover:brightness-110 active:scale-95
              ${isSelected ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}
            `}
            style={{ minWidth: 72 }}
          >
            <div className="flex items-center gap-[2px]">
              {Array.from({ length: config.count }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 16,
                    height: 2,
                    backgroundColor: isSelected ? config.color : '#666',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              ))}
            </div>
            <span className="text-xs">{config.name}</span>
            {isSelected && (
              <div
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{
                  backgroundColor: config.color,
                  boxShadow: `0 0 8px ${config.color}`,
                  animation: 'bondUnderline 0.3s ease-out',
                }}
              />
            )}
          </button>
        );
      })}
      {bondCreationFirstAtom && (
        <div className="ml-2 pl-3 border-l border-white/10 text-xs text-cyan-400 animate-pulse">
          请选择第二个原子
        </div>
      )}
    </div>
  );
};
