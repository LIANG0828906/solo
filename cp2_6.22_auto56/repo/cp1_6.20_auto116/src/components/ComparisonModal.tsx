import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Palette, HarmonyType, HARMONY_NAMES, HARMONY_DESCRIPTIONS } from '../types/color';
import { hslToHex, hslToString } from '../utils/colorUtils';

interface ComparisonModalProps {
  palettes: Record<HarmonyType, Palette>;
  visible: boolean;
  onClose: () => void;
}

const IllustrationSunrise: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="80" fill={colors[4]} />
    <circle cx="60" cy="50" r="20" fill={colors[0]} />
    <circle cx="60" cy="50" r="15" fill={colors[1]} />
    <circle cx="60" cy="50" r="10" fill={colors[2]} />
    <path d="M0,65 Q30,55 60,65 T120,65 L120,80 L0,80 Z" fill={colors[3]} />
  </svg>
);

const IllustrationMountains: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="80" fill={colors[4]} />
    <path d="M0,80 L20,40 L40,60 L60,25 L80,55 L100,35 L120,80 Z" fill={colors[0]} />
    <path d="M0,80 L15,50 L35,65 L55,35 L75,60 L95,45 L120,80 Z" fill={colors[1]} opacity="0.8" />
    <path d="M0,80 L30,60 L50,70 L70,50 L90,65 L110,55 L120,80 Z" fill={colors[2]} opacity="0.6" />
    <circle cx="90" cy="20" r="8" fill={colors[3]} />
  </svg>
);

const IllustrationForest: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="80" fill={colors[4]} />
    <rect x="0" y="60" width="120" height="20" fill={colors[3]} />
    <polygon points="20,60 30,30 40,60" fill={colors[0]} />
    <polygon points="35,60 48,25 61,60" fill={colors[1]} />
    <polygon points="55,60 70,35 85,60" fill={colors[2]} />
    <polygon points="80,60 95,28 110,60" fill={colors[0]} />
    <rect x="27" y="55" width="6" height="10" fill={colors[2]} />
    <rect x="46" y="55" width="6" height="10" fill={colors[2]} />
    <rect x="67" y="55" width="6" height="10" fill={colors[2]} />
    <rect x="92" y="55" width="6" height="10" fill={colors[2]} />
  </svg>
);

const IllustrationOcean: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="40" fill={colors[4]} />
    <circle cx="95" cy="18" r="10" fill={colors[0]} />
    <path d="M0,40 Q30,35 60,40 T120,40 L120,50 Q90,45 60,50 T0,50 Z" fill={colors[1]} />
    <path d="M0,50 Q30,45 60,50 T120,50 L120,62 Q90,57 60,62 T0,62 Z" fill={colors[2]} />
    <path d="M0,62 Q30,57 60,62 T120,62 L120,80 L0,80 Z" fill={colors[3]} />
    <circle cx="25" cy="55" r="4" fill={colors[0]} opacity="0.6" />
    <circle cx="75" cy="68" r="3" fill={colors[0]} opacity="0.5" />
  </svg>
);

const IllustrationCity: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="80" fill={colors[4]} />
    <rect x="5" y="45" width="15" height="35" fill={colors[0]} />
    <rect x="22" y="30" width="18" height="50" fill={colors[1]} />
    <rect x="42" y="20" width="16" height="60" fill={colors[2]} />
    <rect x="60" y="38" width="20" height="42" fill={colors[3]} />
    <rect x="82" y="25" width="14" height="55" fill={colors[1]} />
    <rect x="98" y="40" width="17" height="40" fill={colors[0]} />
    <rect x="8" y="52" width="3" height="4" fill={colors[4]} />
    <rect x="14" y="52" width="3" height="4" fill={colors[4]} />
    <rect x="26" y="38" width="4" height="5" fill={colors[4]} />
    <rect x="32" y="38" width="4" height="5" fill={colors[4]} />
    <rect x="26" y="48" width="4" height="5" fill={colors[4]} />
    <rect x="32" y="48" width="4" height="5" fill={colors[4]} />
    <rect x="46" y="28" width="3" height="4" fill={colors[4]} />
    <rect x="51" y="28" width="3" height="4" fill={colors[4]} />
    <rect x="46" y="38" width="3" height="4" fill={colors[4]} />
    <rect x="51" y="38" width="3" height="4" fill={colors[4]} />
    <rect x="65" y="45" width="4" height="5" fill={colors[4]} />
    <rect x="71" y="45" width="4" height="5" fill={colors[4]} />
    <rect x="65" y="55" width="4" height="5" fill={colors[4]} />
    <rect x="71" y="55" width="4" height="5" fill={colors[4]} />
    <rect x="86" y="33" width="3" height="4" fill={colors[4]} />
    <rect x="91" y="33" width="3" height="4" fill={colors[4]} />
    <rect x="86" y="43" width="3" height="4" fill={colors[4]} />
    <rect x="91" y="43" width="3" height="4" fill={colors[4]} />
    <circle cx="102" cy="15" r="6" fill={colors[2]} />
  </svg>
);

const IllustrationStarryNight: React.FC<{ colors: string[] }> = ({ colors }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <rect x="0" y="0" width="120" height="80" fill={colors[4]} />
    <circle cx="15" cy="12" r="2" fill={colors[0]} />
    <circle cx="40" cy="8" r="1.5" fill={colors[1]} />
    <circle cx="65" cy="15" r="2" fill={colors[0]} />
    <circle cx="90" cy="10" r="1.5" fill={colors[2]} />
    <circle cx="105" cy="20" r="2" fill={colors[1]} />
    <circle cx="25" cy="25" r="1" fill={colors[3]} />
    <circle cx="55" cy="30" r="1.5" fill={colors[0]} />
    <circle cx="75" cy="22" r="1" fill={colors[3]} />
    <circle cx="100" cy="32" r="1.5" fill={colors[2]} />
    <circle cx="35" cy="35" r="1" fill={colors[1]} />
    <circle cx="85" cy="38" r="1" fill={colors[0]} />
    <circle cx="95" cy="55" r="12" fill={colors[0]} />
    <circle cx="92" cy="52" r="10" fill={colors[4]} />
    <path d="M0,70 Q30,60 60,70 T120,70 L120,80 L0,80 Z" fill={colors[2]} />
  </svg>
);

const ILLUSTRATIONS: Record<string, React.FC<{ colors: string[] }>> = {
  sunrise: IllustrationSunrise,
  mountains: IllustrationMountains,
  forest: IllustrationForest,
  ocean: IllustrationOcean,
  city: IllustrationCity,
  starryNight: IllustrationStarryNight,
};

const ILLUSTRATION_ORDER = ['sunrise', 'mountains', 'forest', 'ocean', 'city', 'starryNight'];

const ComparisonModal: React.FC<ComparisonModalProps> = ({ palettes, visible, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const paletteEntries = Object.entries(palettes) as [HarmonyType, Palette][];
  const allItems = paletteEntries.map(([type, palette], index) => ({
    type,
    palette,
    illustrationKey: ILLUSTRATION_ORDER[index],
  }));

  const getColorsAsStrings = (colors: Palette['colors']) =>
    colors.slice(0, 5).map(hslToString);

  const getColorsAsHex = (colors: Palette['colors']) =>
    colors.slice(0, 5).map(hslToHex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        animation: 'fadeIn 0.3s ease forwards',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: '#16213e',
          borderColor: '#0f3460',
          animation: 'scaleIn 0.3s ease forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#0f3460' }}>
          <h2 className="text-2xl font-bold text-white">配色方案对比</h2>
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allItems.map(({ type, palette, illustrationKey }) => {
              const Illustration = ILLUSTRATIONS[illustrationKey];
              const colorStrings = getColorsAsStrings(palette.colors);
              const colorHexes = getColorsAsHex(palette.colors);

              return (
                <div
                  key={type}
                  className="rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: '#0f3460',
                    borderColor: '#0f3460',
                  }}
                >
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {HARMONY_NAMES[type]}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {HARMONY_DESCRIPTIONS[type]}
                  </p>

                  <div className="rounded-lg overflow-hidden mb-4 aspect-[3/2] bg-black/20">
                    <Illustration colors={colorStrings} />
                  </div>

                  <div className="flex gap-[2px] rounded-lg overflow-hidden">
                    {colorHexes.map((hex, index) => (
                      <div
                        key={index}
                        className="flex-1 aspect-square relative group"
                        style={{ backgroundColor: hex }}
                        title={hex.toUpperCase()}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <span className="text-white text-[10px] font-mono">
                            {hex.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(ComparisonModal);
