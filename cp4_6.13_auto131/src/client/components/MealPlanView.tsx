import React, { useState, memo } from 'react';
import { Recipe } from './RecipeCard';

export interface DayPlan {
  day: string;
  dayIndex: number;
  meals: Array<{ meal: string; recipe: Recipe }>;
}

interface MealPlanViewProps {
  plan: DayPlan[] | null;
  generating: boolean;
  selectedRecipesCount: number;
  onGenerate: () => void;
  onReplace: (dayIndex: number, mealIndex: number) => void;
  onShare: () => void;
  replacingMeal: { day: number; meal: number } | null;
}

const MEAL_NAMES = ['早餐', '午餐', '晚餐'];

const MealPlanView: React.FC<MealPlanViewProps> = ({ plan, generating, selectedRecipesCount, onGenerate, onReplace, onShare, replacingMeal }) => {
  const [expandedMeal, setExpandedMeal] = useState<{ day: number; meal: number } | null>(null);

  const canGenerate = !generating;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          style={{
            ...actionBtn,
            background: 'linear-gradient(135deg, #b08968, #8b6b4f)',
            minWidth: 160
          }}
          onMouseEnter={(e) => { if (canGenerate) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(176,137,104,0.4)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(176,137,104,0.25)'; }}
        >
          {generating ? '⏳ 生成中...' : '🍽️ 生成一周餐单'}
        </button>
        <button
          onClick={onShare}
          disabled={!plan}
          style={{
            ...actionBtn,
            background: !plan ? '#d6cfc7' : 'linear-gradient(135deg, #6fa8dc, #4a86bf)',
            cursor: !plan ? 'not-allowed' : 'pointer',
            minWidth: 120
          }}
          onMouseEnter={(e) => { if (plan) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(111,168,220,0.4)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(111,168,220,0.25)'; }}
        >
          📤 分享餐单
        </button>
      </div>

      {!plan && !generating && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fffdfb',
          borderRadius: 16,
          border: '2px dashed #e8e0d6',
          color: '#8a7a6a'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, marginBottom: 8, color: '#5a4a3a' }}>
            {selectedRecipesCount > 0
              ? `已选 ${selectedRecipesCount} 道菜谱，点击上方按钮开始生成`
              : '先添加食材并搜索推荐，或直接点击按钮随机生成'}
          </div>
          <div style={{ fontSize: 13 }}>每餐推荐热量范围：500~800 千卡</div>
        </div>
      )}

      {generating && !plan && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fffdfb',
          borderRadius: 16
        }}>
          <LoadingSpinner />
          <div style={{ marginTop: 16, color: '#5a4a3a', fontSize: 15 }}>正在精心搭配您的一周美味...</div>
        </div>
      )}

      {plan && (
        <div style={{ overflowX: 'auto', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #b08968, #8b6b4f)', color: 'white' }}>
                <th style={thStyle}>日期</th>
                {MEAL_NAMES.map(m => (
                  <th key={m} style={thStyle}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.map((day, dIdx) => (
                <tr key={day.day} style={{ background: dIdx % 2 === 0 ? '#fffdfb' : '#f8f5f0' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: '#5a4a3a', fontSize: 15 }}>{day.day}</div>
                    <div style={{ fontSize: 12, color: '#8a7a6a', marginTop: 4 }}>
                      🔥 {day.meals.reduce((s, m) => s + m.recipe.calories, 0)} 千卡
                    </div>
                  </td>
                  {day.meals.map((mItem, mIdx) => {
                    const isExpanded = expandedMeal?.day === dIdx && expandedMeal?.meal === mIdx;
                    const isReplacing = replacingMeal?.day === dIdx && replacingMeal?.meal === mIdx;
                    return (
                      <td key={mItem.meal} style={tdStyle}>
                        <div
                          onClick={() => setExpandedMeal(isExpanded ? null : { day: dIdx, meal: mIdx })}
                          style={{
                            ...mealCardStyle,
                            animation: isReplacing ? 'zoomInFade 0.4s ease' : undefined,
                            borderColor: isExpanded ? '#b08968' : '#e8e0d6',
                            background: isExpanded ? '#faf6f2' : 'white'
                          }}
                        >
                          <style>{`
                            @keyframes zoomInFade {
                              0% { opacity: 0; transform: scale(0.7); }
                              100% { opacity: 1; transform: scale(1); }
                            }
                          `}</style>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              fontSize: 32,
                              width: 48,
                              height: 48,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f5efe8',
                              borderRadius: 12,
                              flexShrink: 0
                            }}>
                              {mItem.recipe.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#2a1a0a', fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mItem.recipe.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#8a7a6a', display: 'flex', gap: 8 }}>
                                <span>🔥{mItem.recipe.calories}</span>
                                <span>⏱️{mItem.recipe.cook_time}m</span>
                                <span style={{ color: '#b08968' }}>{mItem.recipe.cuisine}</span>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: '1px dashed #e8e0d6',
                              fontSize: 12,
                              color: '#4a3a2a',
                              lineHeight: 1.7,
                              whiteSpace: 'pre-line'
                            }}>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>🥗 食材：{mItem.recipe.ingredients.join('、')}</div>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>📖 步骤：</div>
                              <div>{mItem.recipe.steps}</div>
                            </div>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); onReplace(dIdx, mIdx); }}
                            style={{
                              ...replaceBtnStyle,
                              opacity: isReplacing ? 0.5 : 1,
                              cursor: isReplacing ? 'wait' : 'pointer'
                            }}
                            onMouseEnter={(e) => { if (!isReplacing) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#f5efe8'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
                            disabled={isReplacing}
                          >
                            {isReplacing ? '⏳' : '🔄 换一餐'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = '#b08968' }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `3px solid ${color}30`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block'
    }}
  >
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

const actionBtn: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 600,
  color: 'white',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
};

const thStyle: React.CSSProperties = {
  padding: '14px 18px',
  fontWeight: 600,
  fontSize: 14,
  textAlign: 'left',
  letterSpacing: 0.5,
  position: 'sticky',
  top: 0,
  zIndex: 2
};

const tdStyle: React.CSSProperties = {
  padding: '14px 10px',
  verticalAlign: 'top',
  borderBottom: '1px solid #ece6dc'
};

const mealCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 12,
  border: '1.5px solid #e8e0d6',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  position: 'relative',
  minWidth: 200
};

const replaceBtnStyle: React.CSSProperties = {
  marginTop: 10,
  width: '100%',
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#8b6b4f',
  background: 'transparent',
  border: '1.5px dashed #d6cfc7',
  borderRadius: 8,
  transition: 'all 0.2s ease'
};

export default memo(MealPlanView);
