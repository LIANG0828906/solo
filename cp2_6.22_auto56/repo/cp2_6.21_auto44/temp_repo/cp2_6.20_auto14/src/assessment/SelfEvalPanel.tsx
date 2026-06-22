import React, { useCallback, useRef, useState } from 'react';
import { Settings, Gauge } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';
import { ABILITY_LABELS } from '@/types';
import type { Abilities } from '@/types';

const SelfEvalPanel: React.FC = () => {
  const { abilities, updateAbility, adjustPath, isAdjusting } = useLearningStore();
  const [draggingKey, setDraggingKey] = useState<keyof Abilities | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = useCallback(
    (key: keyof Abilities, value: number) => {
      updateAbility(key, value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        adjustPath();
      }, 300);
    },
    [updateAbility, adjustPath]
  );

  const handleMouseDown = (key: keyof Abilities) => {
    setDraggingKey(key);
  };

  const handleMouseUp = () => {
    setDraggingKey(null);
  };

  const abilityKeys = Object.keys(abilities) as (keyof Abilities)[];

  return (
    <div
      className="glass-card rounded-2xl p-6 shadow-lg"
      style={{
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1a365d' }}
        >
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: '#1a365d' }}>
            自我评估面板
          </h3>
          <p className="text-sm text-gray-500">
            拖动滑块调整能力值，系统将实时重排学习路径
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {abilityKeys.map((key, index) => {
          const value = abilities[key];
          const label = ABILITY_LABELS[key];
          const isDragging = draggingKey === key;

          return (
            <div
              key={key}
              className="group"
              style={{
                animation: `fadeIn 0.4s ease forwards`,
                animationDelay: `${index * 0.08}s`,
                opacity: 0,
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700">{label}</span>
                </div>
                <span
                  className={`
                    text-lg font-bold transition-transform duration-200
                    ${isDragging ? 'scale-125' : ''}
                  `}
                  style={{ color: '#ed8936' }}
                >
                  {value}
                </span>
              </div>

              <div className="relative">
                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${(value / 10) * 100}%`,
                      background:
                        'linear-gradient(90deg, #1a365d 0%, #ed8936 100%)',
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={value}
                  onChange={(e) =>
                    handleSliderChange(key, parseInt(e.target.value, 10))
                  }
                  onMouseDown={() => handleMouseDown(key)}
                  onTouchStart={() => handleMouseDown(key)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div
                  className={`
                    absolute top-1/2 -translate-y-1/2 w-6 h-6
                    bg-white rounded-full shadow-lg border-2 border-orange-400
                    pointer-events-none transition-all duration-150
                    ${isDragging ? 'scale-125 shadow-xl' : 'group-hover:scale-110'}
                  `}
                  style={{
                    left: `calc(${(value / 10) * 100}% - 12px)`,
                  }}
                >
                  <div
                    className="absolute inset-1 rounded-full"
                    style={{ backgroundColor: '#ed8936' }}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          );
        })}
      </div>

      {isAdjusting && (
        <div className="mt-4 pt-4 border-t border-white/50">
          <div className="flex items-center justify-center gap-2 text-sm text-orange-500">
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>正在自适应调整学习路径...</span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/50">
        <p className="text-xs text-gray-400 text-center">
          💡 提示：调整能力值后，系统会在300ms内重新计算最优学习路径
        </p>
      </div>
    </div>
  );
};

export default SelfEvalPanel;
