import React, { useState, useMemo, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { useRecipeStore } from '../stores/recipeStore';
import { Recipe, MealPlanItem, DayMealPlan } from '../types';

const MealPlanner: React.FC = () => {
  const {
    recipes,
    addMealPlan,
    removeMealPlan,
    getMealPlanByDate,
    moveMealPlan,
  } = useRecipeStore();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [draggedMeal, setDraggedMeal] = useState<{
    meal: MealPlanItem;
    fromDate: string;
  } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const startDay = startOfMonth.day();
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    const startDate = startOfMonth.subtract(startDay, 'day');
    for (let i = 0; i < 42; i++) {
      const date = startDate.add(i, 'day');
      days.push({
        date: date.format('YYYY-MM-DD'),
        day: date.date(),
        isCurrentMonth: date.month() === currentMonth.month(),
      });
    }
    return days;
  }, [currentMonth]);

  const hasMealPlan = (date: string): boolean => {
    const plan = getMealPlanByDate(date);
    return plan !== undefined && plan.meals.length > 0;
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const closeModal = () => {
    setSelectedDate(null);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!selectedDate) return;
    addMealPlan(selectedDate, recipe.id, selectedMealType);
  };

  const handleRemoveMeal = (mealPlanId: string) => {
    if (!selectedDate) return;
    removeMealPlan(selectedDate, mealPlanId);
  };

  const handleDragStart = useCallback((meal: MealPlanItem, date: string) => {
    setDraggedMeal({ meal, fromDate: date });
    setSelectedDate(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toDate: string) => {
    e.preventDefault();
    if (draggedMeal && draggedMeal.fromDate !== toDate) {
      moveMealPlan(draggedMeal.fromDate, toDate, draggedMeal.meal.id);
    }
    setDraggedMeal(null);
    setDragOverDate(null);
  }, [draggedMeal, moveMealPlan]);

  const handleDragEnd = useCallback(() => {
    setDraggedMeal(null);
    setDragOverDate(null);
  }, []);

  const handleCalendarCellDragStart = useCallback((e: React.DragEvent, date: string) => {
    const plan = getMealPlanByDate(date);
    if (!plan || plan.meals.length === 0) return;
    const firstMeal = plan.meals[0];
    setDraggedMeal({ meal: firstMeal, fromDate: date });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      mealId: firstMeal.id,
      fromDate: date,
    }));
  }, [getMealPlanByDate]);

  const selectedDayPlan = selectedDate ? getMealPlanByDate(selectedDate) : undefined;

  const getDayNutritionSummary = (plan: DayMealPlan | undefined) => {
    if (!plan) return { calories: 0, protein: 0, fat: 0 };
    return plan.meals.reduce(
      (sum, meal) => ({
        calories: sum.calories + meal.recipe.nutrition.calories,
        protein: sum.protein + meal.recipe.nutrition.protein,
        fat: sum.fat + meal.recipe.nutrition.fat,
      }),
      { calories: 0, protein: 0, fat: 0 }
    );
  };

  const nutritionSummary = getDayNutritionSummary(selectedDayPlan);

  const mealTypeLabels = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const MiniRing: React.FC<{ value: number; max: number; color: string; label: string; unit: string }> = ({
    value,
    max,
    color,
    label,
    unit,
  }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', willChange: 'transform' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <svg width="64" height="64" style={{ willChange: 'transform' }}>
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'stroke-dashoffset' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>{Math.round(value)}</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          {label} ({unit})
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', animation: 'fadeIn 0.4s ease-out', willChange: 'transform, opacity' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
        📅 膳食计划
      </h1>

      <div className="card" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
            style={{
              backgroundColor: '#f5f0eb',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#666',
              transition: 'background-color 0.2s, transform 0.2s',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ebe6e1';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f0eb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ← 上月
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>
            {currentMonth.format('YYYY年MM月')}
          </h2>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
            style={{
              backgroundColor: '#f5f0eb',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#666',
              transition: 'background-color 0.2s, transform 0.2s',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ebe6e1';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f0eb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            下月 →
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {weekDays.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontWeight: 500,
                color: '#888',
                fontSize: '14px',
                padding: '8px',
              }}
            >
              周{day}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {calendarDays.map((day) => {
            const hasPlan = hasMealPlan(day.date);
            const isToday = day.date === dayjs().format('YYYY-MM-DD');
            const isDragOver = dragOverDate === day.date;
            const dayPlan = getMealPlanByDate(day.date);

            return (
              <div
                key={day.date}
                draggable={hasPlan && day.isCurrentMonth}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                onDragStart={(e) => day.isCurrentMonth && hasPlan && handleCalendarCellDragStart(e, day.date)}
                onDragOver={(e) => day.isCurrentMonth && handleDragOver(e, day.date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => day.isCurrentMonth && handleDrop(e, day.date)}
                onDragEnd={handleDragEnd}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  backgroundColor: isDragOver
                    ? '#e8f5e9'
                    : isToday
                    ? '#fff3e0'
                    : day.isCurrentMonth
                    ? '#faf5ef'
                    : '#fafafa',
                  cursor: day.isCurrentMonth ? (hasPlan ? 'grab' : 'pointer') : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  willChange: 'transform',
                  opacity: day.isCurrentMonth ? 1 : 0.4,
                  border: isToday ? '2px solid #ff9800' : isDragOver ? '2px solid #4caf50' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (day.isCurrentMonth) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#ff8f00' : '#333',
                  }}
                >
                  {day.day}
                </span>
                {hasPlan && (
                  <div
                    className="dot-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      display: 'flex',
                      gap: '3px',
                    }}
                  >
                    {dayPlan?.meals.slice(0, 3).map((meal, idx) => (
                      <div
                        key={idx}
                        title={meal.recipe.name}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#4caf50',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            fontSize: '13px',
            color: '#888',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50' }} />
            <span>有计划</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '2px solid #ff9800',
              }}
            />
            <span>今天</span>
          </div>
          <span style={{ marginLeft: 'auto' }}>💡 点击日期添加食谱，拖拽有计划的日期到其他日期可移动</span>
        </div>
      </div>

      {selectedDate && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="modal-content"
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '28px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 600, color: '#333' }}>
                  {dayjs(selectedDate).format('MM月DD日')} 膳食计划
                </h3>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
                  {dayjs(selectedDate).format('dddd')}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: '#f5f0eb',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  color: '#666',
                  transition: 'background-color 0.2s, transform 0.2s',
                  willChange: 'transform',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ebe6e1';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f0eb';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>

            {selectedDayPlan && selectedDayPlan.meals.length > 0 && (
              <div
                style={{
                  backgroundColor: '#faf5ef',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#666',
                    marginBottom: '12px',
                  }}
                >
                  当日营养汇总
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                  }}
                >
                  <MiniRing
                    value={nutritionSummary.calories}
                    max={2000}
                    color="#ff9800"
                    label="热量"
                    unit="kcal"
                  />
                  <MiniRing
                    value={nutritionSummary.protein}
                    max={120}
                    color="#4caf50"
                    label="蛋白质"
                    unit="g"
                  />
                  <MiniRing
                    value={nutritionSummary.fat}
                    max={80}
                    color="#f44336"
                    label="脂肪"
                    unit="g"
                  />
                </div>
              </div>
            )}

            {selectedDayPlan && selectedDayPlan.meals.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#666',
                    marginBottom: '12px',
                  }}
                >
                  已添加的食谱
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDayPlan.meals.map((meal) => (
                    <div
                      key={meal.id}
                      draggable
                      onDragStart={() => handleDragStart(meal, selectedDate)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        backgroundColor: '#fff8e1',
                        borderRadius: '12px',
                        cursor: 'grab',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        willChange: 'transform',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#ff9800',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {mealTypeLabels[meal.mealType]}
                      </div>
                      <span style={{ flex: 1, fontWeight: 500, color: '#333' }}>
                        {meal.recipe.name}
                      </span>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        {meal.recipe.nutrition.calories} kcal
                      </span>
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          fontSize: '18px',
                          width: '28px',
                          height: '28px',
                          transition: 'transform 0.2s',
                          willChange: 'transform',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#666',
                  marginBottom: '12px',
                }}
              >
                添加食谱
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: selectedMealType === type ? '#ff9800' : '#f5f0eb',
                      color: selectedMealType === type ? '#fff' : '#666',
                      transition: 'all 0.2s',
                      willChange: 'transform',
                    }}
                  >
                    {mealTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="card"
                  onClick={() => handleSelectRecipe(recipe)}
                  style={{
                    backgroundColor: '#fff8e1',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    willChange: 'transform',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                    {recipe.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    ⏱ {recipe.cookTime}分钟 · {recipe.nutrition.calories} kcal
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
