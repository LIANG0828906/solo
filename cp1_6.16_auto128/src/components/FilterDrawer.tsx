import { X } from 'lucide-react';
import { useScentStore } from '../store';
import {
  CATEGORY_LABELS,
  EMOTION_LABELS,
  EMOTION_COLORS,
} from '../types';
import type { ScentCategory, EmotionTag } from '../types';

const ALL_CATEGORIES: ScentCategory[] = ['floral', 'woody', 'food', 'environment'];
const ALL_EMOTIONS: EmotionTag[] = ['joyful', 'nostalgic', 'fresh', 'oppressive'];

const FilterDrawer = () => {
  const isFilterOpen = useScentStore((s) => s.isFilterOpen);
  const toggleFilterPanel = useScentStore((s) => s.toggleFilterPanel);
  const filters = useScentStore((s) => s.filters);
  const toggleCategoryFilter = useScentStore((s) => s.toggleCategoryFilter);
  const toggleEmotionFilter = useScentStore((s) => s.toggleEmotionFilter);
  const clearFilters = useScentStore((s) => s.clearFilters);

  if (!isFilterOpen) return null;

  const hasActiveFilters = filters.categories.length > 0 || filters.emotions.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, pointerEvents: 'none' }}>
      <div
        onClick={toggleFilterPanel}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15, 52, 96, 0.4)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'auto',
        }}
      />

      <div
        className="slide-in-left"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 250,
          height: '100%',
          background: '#0F3460',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'auto',
          padding: 24,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxShadow: '10px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              color: '#E0D9CF', fontSize: 16,
              fontWeight: 600, letterSpacing: 0.5,
            }}>
              筛选记忆
            </div>
            {hasActiveFilters && (
              <div style={{ color: '#E94560', fontSize: 11, marginTop: 2 }}>
                {filters.categories.length + filters.emotions.length} 个筛选条件
              </div>
            )}
          </div>
          <button
            onClick={toggleFilterPanel}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'rgba(224, 217, 207, 0.7)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <div style={{
            color: 'rgba(224, 217, 207, 0.5)',
            fontSize: 11, letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            气味类别
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ALL_CATEGORIES.map((cat) => {
              const active = filters.categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategoryFilter(cat)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: active
                      ? 'rgba(233, 69, 96, 0.2)'
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? '1px solid rgba(233, 69, 96, 0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#E0D9CF' : 'rgba(224, 217, 207, 0.7)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{
            color: 'rgba(224, 217, 207, 0.5)',
            fontSize: 11, letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            情感标签
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ALL_EMOTIONS.map((emo) => {
              const active = filters.emotions.includes(emo);
              const color = EMOTION_COLORS[emo];
              return (
                <button
                  key={emo}
                  onClick={() => toggleEmotionFilter(emo)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: active
                      ? `${color}22`
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? `1px solid ${color}80`
                      : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#E0D9CF' : 'rgba(224, 217, 207, 0.7)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color,
                    boxShadow: active ? `0 0 8px ${color}` : 'none',
                  }} />
                  {EMOTION_LABELS[emo]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              background: hasActiveFilters
                ? 'transparent'
                : 'rgba(255,255,255,0.03)',
              border: hasActiveFilters
                ? '1px solid rgba(233, 69, 96, 0.4)'
                : '1px solid rgba(255,255,255,0.06)',
              color: hasActiveFilters
                ? '#E94560'
                : 'rgba(224, 217, 207, 0.3)',
              cursor: hasActiveFilters ? 'pointer' : 'not-allowed',
              fontSize: 13,
              transition: 'all 0.3s ease',
              fontFamily: 'inherit',
            }}
          >
            清除所有筛选
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
