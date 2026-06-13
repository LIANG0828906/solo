import React, { useState, memo } from 'react';

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  cook_time: number;
  calories: number;
  steps: string;
  ingredients: string[];
  matchScore?: number;
  is_vegetarian?: number;
  is_low_fat?: number;
  is_high_protein?: number;
  is_gluten_free?: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
  showMatch?: boolean;
  onAddToPlan?: (recipe: Recipe) => void;
  isInPlan?: boolean;
  onClick?: () => void;
  replaceAnim?: boolean;
}

const cuisineGradients: Record<string, string> = {
  '中餐': 'linear-gradient(135deg, #ffe4e1 0%, #f8a8a0 50%, #e27d60 100%)',
  '西餐': 'linear-gradient(135deg, #fff8e1 0%, #ffe0a0 50%, #f5c16c 100%)',
  '日料': 'linear-gradient(135deg, #e3f2fd 0%, #a8d5f0 50%, #6fa8dc 100%)',
  '韩餐': 'linear-gradient(135deg, #f3e5f5 0%, #d9a8d9 50%, #b57edc 100%)',
  '泰餐': 'linear-gradient(135deg, #e8f5e9 0%, #a8d8ab 50%, #68b977 100%)',
  '法式': 'linear-gradient(135deg, #fff1f2 0%, #f5b8c0 50%, #e08a9a 100%)'
};

const cuisineBadge: Record<string, { bg: string; color: string }> = {
  '中餐': { bg: 'rgba(226,125,96,0.9)', color: '#fff' },
  '西餐': { bg: 'rgba(245,193,108,0.9)', color: '#5a3a00' },
  '日料': { bg: 'rgba(111,168,220,0.9)', color: '#fff' },
  '韩餐': { bg: 'rgba(181,126,220,0.9)', color: '#fff' },
  '泰餐': { bg: 'rgba(104,185,119,0.9)', color: '#fff' },
  '法式': { bg: 'rgba(224,138,154,0.9)', color: '#fff' }
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index = 0, showMatch = true, onAddToPlan, isInPlan, onClick, replaceAnim }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const gradient = cuisineGradients[recipe.cuisine] || cuisineGradients['西餐'];
  const badge = cuisineBadge[recipe.cuisine] || cuisineBadge['西餐'];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        opacity: mounted ? 1 : 0,
        transition: `transform 0.4s cubic-bezier(.2,.8,.2,1), opacity 0.4s ease, box-shadow 0.3s ease${replaceAnim ? ', opacity 0.4s ease, transform 0.4s ease' : ''}`,
        boxShadow: hovered
          ? '0 20px 40px -12px rgba(0,0,0,0.18), 0 8px 16px -8px rgba(0,0,0,0.1)'
          : '0 4px 16px -4px rgba(0,0,0,0.1)',
        animation: replaceAnim ? 'zoomInFade 0.4s ease' : undefined
      }}
    >
      <style>{`
        @keyframes zoomInFade {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          0% { max-height: 0; opacity: 0; }
          100% { max-height: 500px; opacity: 1; }
        }
      `}</style>

      <div
        style={{
          background: gradient,
          padding: '24px 20px 20px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 999,
            background: badge.bg,
            color: badge.color,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5
          }}>
            {recipe.cuisine}
          </span>
          {showMatch && typeof recipe.matchScore === 'number' && (
            <div style={{
              textAlign: 'right',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: '#3a2a1a'
            }}>
              🍽️ {recipe.matchScore}%
            </div>
          )}
        </div>

        <div style={{
          fontSize: 56,
          textAlign: 'center',
          padding: '10px 0',
          filter: hovered ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          transition: 'filter 0.3s',
          transform: hovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
          transitionProperty: 'filter, transform'
        }}>
          {recipe.emoji}
        </div>

        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#2a1a0a',
          textAlign: 'center',
          margin: '6px 0 10px',
          textShadow: '0 1px 2px rgba(255,255,255,0.5)'
        }}>
          {recipe.name}
        </h3>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          fontSize: 13,
          color: '#4a3a2a'
        }}>
          <span>⏱️ {recipe.cook_time}分钟</span>
          <span>🔥 {recipe.calories}千卡</span>
        </div>
      </div>

      <div style={{
        background: '#fffdfb',
        padding: expanded ? '16px 20px 20px' : '12px 16px',
        transition: 'padding 0.3s'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: expanded ? 12 : 8
        }}>
          {recipe.ingredients.slice(0, expanded ? undefined : 5).map(ing => (
            <span key={ing} style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: '#f5efe8',
              color: '#6a5a4a',
              fontSize: 12,
              borderRadius: 6
            }}>
              {ing}
            </span>
          ))}
          {!expanded && recipe.ingredients.length > 5 && (
            <span style={{ fontSize: 12, color: '#8a7a6a' }}>+{recipe.ingredients.length - 5}</span>
          )}
        </div>

        <div style={{
          overflow: 'hidden',
          maxHeight: expanded ? 500 : 0,
          opacity: expanded ? 1 : 0,
          transition: 'max-height 0.4s cubic-bezier(.2,.8,.2,1), opacity 0.3s ease'
        }}>
          <div style={{
            borderTop: '1px dashed #e8e0d6',
            paddingTop: 12,
            fontSize: 13,
            color: '#4a3a2a',
            lineHeight: 1.7,
            whiteSpace: 'pre-line'
          }}>
            <strong style={{ color: '#2a1a0a' }}>📖 烹饪步骤：</strong>
            <div style={{ marginTop: 6 }}>{recipe.steps}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #d6cfc7',
              background: '#fffdfb',
              color: '#5a4a3a',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.background = '#faf6f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#fffdfb'; }}
          >
            {expanded ? '收起 ▲' : '展开步骤 ▼'}
          </button>
          {onAddToPlan && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToPlan(recipe); }}
              disabled={isInPlan}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: isInPlan ? '#c8e6d5' : 'linear-gradient(135deg, #68b977, #3d8a50)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: isInPlan ? 'default' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: isInPlan ? 0.8 : 1,
                boxShadow: isInPlan ? 'none' : '0 2px 8px rgba(104,185,119,0.3)'
              }}
              onMouseEnter={(e) => { if (!isInPlan) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isInPlan ? '✓ 已加入' : '+ 加入餐单'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(RecipeCard);
