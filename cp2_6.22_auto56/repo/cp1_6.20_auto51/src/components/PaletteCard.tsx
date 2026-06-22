import React, { useState } from 'react';
import { Heart, Share2, ChevronDown, ChevronUp, Copy, Trash2, Tag } from 'lucide-react';
import type { HarmonyRule } from '@/types';
import { HARMONY_RULES } from '@/types';
import { getContrastColor } from '@/utils/colorUtils';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PaletteCardProps {
  colors: string[];
  rule?: HarmonyRule;
  isSaved?: boolean;
  savedData?: {
    id: string;
    name: string;
    tags: string[];
    createdAt: string;
  };
  paletteIndex?: number;
  onSave?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  showAdjustments?: boolean;
  compact?: boolean;
}

export const PaletteCard: React.FC<PaletteCardProps> = ({
  colors,
  rule,
  isSaved = false,
  savedData,
  paletteIndex,
  onSave,
  onDelete,
  onShare,
  showAdjustments = true,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showAdjustSliders, setShowAdjustSliders] = useState<number | null>(null);
  const { adjustPaletteColor } = useStore();
  const colorBlindMode = useStore(state => state.colorBlindMode);

  const handleCopy = async (color: string, index: number) => {
    await navigator.clipboard.writeText(color);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleBrightnessChange = (colorIndex: number, value: number) => {
    if (paletteIndex !== undefined) {
      adjustPaletteColor(paletteIndex, colorIndex, 'brightness', value);
    }
  };

  const handleSaturationChange = (colorIndex: number, value: number) => {
    if (paletteIndex !== undefined) {
      adjustPaletteColor(paletteIndex, colorIndex, 'saturation', value);
    }
  };

  const ruleInfo = rule ? HARMONY_RULES.find(r => r.value === rule) : null;

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md
        ${isExpanded ? 'ring-2 ring-blue-400' : ''}
        animate-fadeInUp`}
    >
      <div className={`flex ${compact ? 'h-16' : 'h-24'}`}>
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex-1 relative group cursor-pointer transition-all duration-200 hover:flex-[1.2]"
            style={{ backgroundColor: color }}
            onClick={() => handleCopy(color, index)}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: getContrastColor(color) }}
            >
              {copiedIndex === index ? (
                <span className="text-xs font-medium bg-black/20 px-2 py-1 rounded">已复制</span>
              ) : (
                <Copy size={16} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            {savedData ? (
              <h3 className="font-semibold text-gray-800">{savedData.name}</h3>
            ) : (
              <h3 className="font-semibold text-gray-800">{ruleInfo?.label || '配色方案'}</h3>
            )}
            {savedData && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(savedData.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onSave && (
              <button
                onClick={onSave}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved 
                    ? 'text-pink-500 bg-pink-50' 
                    : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50'
                }`}
              >
                <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Share2 size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {ruleInfo && !savedData && (
          <p className="text-xs text-gray-500 mb-3">{ruleInfo.description}</p>
        )}

        {savedData?.tags && savedData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {savedData.tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {isExpanded && (
          <div className="space-y-3 mt-3 pt-3 border-t animate-expandDown">
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-full h-12 rounded-lg mb-1"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-mono text-gray-600">{color}</span>
                </div>
              ))}
            </div>

            {showAdjustments && paletteIndex !== undefined && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 mb-2">微调颜色</p>
                {colors.map((color, colorIndex) => (
                  <div 
                    key={colorIndex}
                    className="p-2 bg-gray-50 rounded-lg"
                    onMouseEnter={() => setShowAdjustSliders(colorIndex)}
                    onMouseLeave={() => setShowAdjustSliders(null)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono text-gray-600 flex-1">{color}</span>
                    </div>
                    {showAdjustSliders === colorIndex && (
                      <div className="space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">亮度</span>
                          <input
                            type="range"
                            min="-30"
                            max="30"
                            defaultValue="0"
                            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            onChange={(e) => handleBrightnessChange(colorIndex, parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">饱和度</span>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            defaultValue="100"
                            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            onChange={(e) => handleSaturationChange(colorIndex, parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
