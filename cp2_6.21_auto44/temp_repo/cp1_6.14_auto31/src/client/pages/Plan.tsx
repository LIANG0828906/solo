import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, MealPlan, DayPlan, MealEntry } from '../App';

const MEAL_TYPE_LABELS: Record<MealEntry['type'], string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack1: '加餐1', snack2: '加餐2',
};
const MEAL_TYPE_COLORS: Record<MealEntry['type'], string> = {
  breakfast: '#FF9800', lunch: '#F44336', dinner: '#9C27B0', snack1: '#4CAF50', snack2: '#4CAF50',
};
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface DragData { date: string; type: MealEntry['type']; }

export default function Plan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/plan');
      setPlan(res.data.plan);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post('/api/plan/generate');
      setPlan(res.data.plan);
    } catch {} finally {
      setGenerating(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, date: string, type: MealEntry['type']) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ date, type }));
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, toDate: string, toType: MealEntry['type']) => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.date === toDate && data.type === toType) return;
      const res = await axios.put('/api/plan/swap', {
        fromDate: data.date, fromType: data.type, toDate, toType,
      });
      setPlan(res.data.plan);
    } catch {}
  };

  const getDayMeals = (day: DayPlan, type: MealEntry['type']): MealEntry[] => {
    return day.meals.filter(m => m.type === type);
  };

  const getDayTotalCalories = (day: DayPlan): number => {
    return day.meals.reduce((s, m) => s + m.calories, 0);
  };

  if (!user) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', padding: '120px 16px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
        <p style={{ fontSize: 18, color: '#8B7355', marginBottom: 24 }}>请先登录查看膳食计划</p>
        <Link to="/" style={{ color: '#F5A623', fontSize: 16 }}>返回首页</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 80, maxWidth: 1200, margin: '0 auto', padding: '76px 16px 40px' }}>
        <div style={{ width: 200, height: 40, background: '#F0E6D8', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12,
        }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: 200, background: '#F0E6D8', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 76, maxWidth: 1200, margin: '0 auto', padding: '76px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#3D2C1E' }}>🍽️ 本周膳食计划</h1>
        <button onClick={handleGenerate} disabled={generating}
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: generating ? '#F0E6D8' : '#F5A623',
            color: generating ? '#8B7355' : '#fff',
            fontSize: 15, fontWeight: 600, transition: 'background 0.3s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          {generating ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #8B7355', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              生成中...
            </>
          ) : (
            '✨ 生成计划'
          )}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['breakfast', 'lunch', 'dinner', 'snack1'] as const).map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: MEAL_TYPE_COLORS[type] }} />
            <span style={{ fontSize: 13, color: '#8B7355' }}>{MEAL_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {!plan || plan.days.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📋</p>
          <p style={{ fontSize: 18, color: '#8B7355', marginBottom: 24 }}>暂无膳食计划</p>
          <button onClick={handleGenerate} disabled={generating}
            style={{
              padding: '12px 32px', borderRadius: 8, background: '#F5A623', color: '#fff',
              fontSize: 16, fontWeight: 600, transition: 'background 0.3s',
            }}>
            生成我的膳食计划
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 24,
          }}>
            {plan.days.map((day, dayIdx) => {
              const isExpanded = expandedDay === day.date;
              const totalCal = getDayTotalCalories(day);
              const mealTypes = new Set(day.meals.map(m => m.type));

              return (
                <div key={day.date}
                  onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                  style={{
                    background: '#fff', borderRadius: 12, padding: 12,
                    boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer', transition: 'all 0.3s',
                    border: isExpanded ? '2px solid #F5A623' : '2px solid transparent',
                  }}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#3D2C1E' }}>{WEEKDAYS[dayIdx]}</span>
                    <p style={{ fontSize: 11, color: '#8B7355', marginTop: 2 }}>{day.date.slice(5)}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'] as const).map(type => (
                      mealTypes.has(type) ? (
                        <span key={type} style={{
                          width: 8, height: 8, borderRadius: '50%', background: MEAL_TYPE_COLORS[type],
                        }} />
                      ) : (
                        <span key={type} style={{
                          width: 8, height: 8, borderRadius: '50%', background: '#F0E6D8',
                        }} />
                      )
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {day.meals.slice(0, 3).map((meal, mi) => (
                      <div key={mi} style={{
                        fontSize: 11, color: '#3D2C1E',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        borderLeft: `3px solid ${MEAL_TYPE_COLORS[meal.type]}`,
                        paddingLeft: 6,
                      }}>
                        {meal.recipeName}
                      </div>
                    ))}
                    {day.meals.length > 3 && (
                      <span style={{ fontSize: 10, color: '#8B7355' }}>+{day.meals.length - 3} 更多</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: 600, color: '#F5A623' }}>
                    {totalCal} kcal
                  </div>
                </div>
              );
            })}
          </div>

          {expandedDay && (() => {
            const day = plan.days.find(d => d.date === expandedDay);
            if (!day) return null;
            const totalCal = getDayTotalCalories(day);
            const dayIdx = plan.days.indexOf(day);

            return (
              <div style={{
                background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#3D2C1E' }}>
                    {WEEKDAYS[dayIdx]} · {day.date.slice(5)}
                  </h3>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#F5A623' }}>
                    总计 {totalCal} kcal
                  </span>
                </div>

                {(['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'] as const).map(type => {
                  const meals = getDayMeals(day, type);
                  if (meals.length === 0) {
                    const slotKey = `${expandedDay}-${type}`;
                    return (
                      <div key={type}
                        onDragOver={e => handleDragOver(e, slotKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, expandedDay, type)}
                        style={{
                          padding: '12px 16px', marginBottom: 10, borderRadius: 10,
                          borderLeft: `4px solid ${MEAL_TYPE_COLORS[type]}`,
                          background: dragOverSlot === slotKey ? '#FFF3E0' : '#FFF8F0',
                          minHeight: 44, display: 'flex', alignItems: 'center',
                          transition: 'background 0.3s',
                        }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: MEAL_TYPE_COLORS[type], marginRight: 12, minWidth: 60 }}>
                          {MEAL_TYPE_LABELS[type]}
                        </span>
                        <span style={{ fontSize: 13, color: '#8B7355', fontStyle: 'italic' }}>拖拽菜谱到此处</span>
                      </div>
                    );
                  }

                  return meals.map(meal => {
                    const slotKey = `${expandedDay}-${type}-${meal.recipeId}`;
                    return (
                      <div key={slotKey}
                        draggable
                        onDragStart={e => handleDragStart(e, expandedDay, type)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, slotKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, expandedDay, type)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', marginBottom: 10, borderRadius: 10,
                          borderLeft: `4px solid ${MEAL_TYPE_COLORS[type]}`,
                          background: dragOverSlot === slotKey ? '#FFF3E0' : '#FFF8F0',
                          transition: 'all 0.3s', cursor: 'grab',
                        }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: MEAL_TYPE_COLORS[type], minWidth: 60 }}>
                          {MEAL_TYPE_LABELS[type]}
                        </span>
                        {meal.recipeImage ? (
                          <img src={meal.recipeImage} alt={meal.recipeName}
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                            background: `linear-gradient(135deg, ${MEAL_TYPE_COLORS[type]}, ${MEAL_TYPE_COLORS[type]}88)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                          }}>
                            🍽
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 14, fontWeight: 500, color: '#3D2C1E',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {meal.recipeName}
                          </p>
                          <p style={{ fontSize: 12, color: '#8B7355' }}>{meal.calories} kcal</p>
                        </div>
                      </div>
                    );
                  });
                })}

                <div style={{
                  marginTop: 16, paddingTop: 16, borderTop: '2px dashed #F0E6D8',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#3D2C1E' }}>每日总计</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#F5A623' }}>{totalCal} kcal</span>
                </div>
              </div>
            );
          })()}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
