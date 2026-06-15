import { useState } from 'react';
import { X, CheckCircle, Sparkles, Leaf } from 'lucide-react';
import type { Suggestion, ActivityType } from '@/types';
import { ACTIVITY_TYPE_COLORS } from '@/constants/emissionFactors';
import { formatNumber } from '@/utils/calculations';

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onDismiss: (id: string) => void;
  onAdopt: (id: string) => void;
}

const typeIcon: Record<ActivityType, string> = {
  transport: '🚗',
  diet: '🍽️',
  electricity: '⚡',
};

const SuggestionCard = ({
  suggestion,
  index,
  onDismiss,
  onAdopt,
}: SuggestionCardProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const color = ACTIVITY_TYPE_COLORS[suggestion.activityType];

  const handleAdopt = () => {
    setIsExiting(true);
    setTimeout(() => onAdopt(suggestion.id), 200);
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(suggestion.id), 200);
  };

  return (
    <div
      className={`relative flex-shrink-0 w-full sm:w-[360px] md:w-[380px] bg-white rounded-[12px] shadow-card overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-[2px] ${
        isExiting ? 'opacity-0 translate-x-8' : ''
      }`}
      style={{
        animation: isExiting
          ? undefined
          : `slideInLeft 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s both`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              {typeIcon[suggestion.activityType]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color }}
                />
                <h4 className="font-bold text-gray-800 truncate">
                  {suggestion.title}
                </h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {suggestion.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="关闭建议"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
          style={{ background: `${color}10` }}
        >
          <Leaf className="w-4 h-4" style={{ color }} />
          <span className="text-xs" style={{ color }}>
            预计每周可减少{' '}
            <span className="font-bold">
              {formatNumber(suggestion.potentialSaving)}
            </span>{' '}
            kg CO₂
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
          >
            稍后再说
          </button>
          <button
            onClick={handleAdopt}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.95] hover:brightness-110 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: color }}
          >
            <CheckCircle className="w-4 h-4" />
            已采纳
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-48px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SuggestionCard;
