import React, { useState } from 'react';
import { Lock, Unlock, Grid } from 'lucide-react';
import { Palette, HARMONY_NAMES, HARMONY_DESCRIPTIONS } from '../types/color';
import { hslToHex } from '../utils/colorUtils';

interface HarmonyPaletteProps {
  palette: Palette;
  selected: boolean;
  locked: boolean[];
  onLockToggle: (index: number) => void;
  onSelect: () => void;
  onCompare: () => void;
}

const HarmonyPalette: React.FC<HarmonyPaletteProps> = ({
  palette,
  selected,
  locked,
  onLockToggle,
  onSelect,
  onCompare,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all duration-300 ease hover:bg-[#0f3460] active:scale-[0.98]"
      style={{ backgroundColor: '#16213e' }}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-base">
            {HARMONY_NAMES[palette.type]}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {HARMONY_DESCRIPTIONS[palette.type]}
          </p>
        </div>
        <button
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onCompare();
          }}
          title="对比"
        >
          <Grid size={18} />
        </button>
      </div>

      <div className="flex gap-[2px] rounded-lg overflow-hidden">
        {palette.colors.slice(0, 5).map((color, index) => {
          const hex = hslToHex(color);
          const isLocked = locked[index];
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="flex-1 relative aspect-square group"
              style={{
                backgroundColor: hex,
                border: selected ? '2px solid #ffd700' : '2px solid transparent',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {hex.toUpperCase()}
                </div>
              )}

              <button
                className="absolute top-1 right-1 p-1 rounded bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onLockToggle(index);
                }}
              >
                {isLocked ? (
                  <Lock size={12} className="text-white" />
                ) : (
                  <Unlock size={12} className="text-white" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HarmonyPalette);
