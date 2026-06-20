import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SpectralType } from '../types/star';
import { SPECTRAL_COLORS } from '../types/star';
import { useStarStore } from '../store/useStarStore';
import { cn } from '../lib/utils';

const FILTER_OPTIONS: { value: SpectralType; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'O', label: 'O' },
  { value: 'B', label: 'B' },
  { value: 'A', label: 'A' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'K', label: 'K' },
  { value: 'M', label: 'M' },
];

export const SpectrumFilter: React.FC = () => {
  const { filterType, setFilterType } = useStarStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = FILTER_OPTIONS.find(opt => opt.value === filterType) || FILTER_OPTIONS[0];

  const getColor = (type: SpectralType): string => {
    if (type === 'ALL') return '#888';
    return SPECTRAL_COLORS[type];
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded text-white',
          'transition-colors duration-200',
          'hover:bg-[#3D566E]'
        )}
        style={{ backgroundColor: '#34495E' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: getColor(filterType) }}
        />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full rounded overflow-hidden z-50"
          style={{ backgroundColor: '#34495E' }}
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-4 py-2 text-white text-left',
                'transition-colors duration-200',
                'hover:bg-[#3D566E]',
                filterType === option.value && 'bg-[#3D566E]'
              )}
              onClick={() => {
                setFilterType(option.value);
                setIsOpen(false);
              }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColor(option.value) }}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
