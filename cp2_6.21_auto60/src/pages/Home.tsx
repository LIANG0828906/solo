import { useState } from 'react';
import { useFoodStore } from '@/store/foodStore';
import FoodSearch from '@/components/FoodSearch';
import MacroChart from '@/components/MacroChart';
import RadarChart from '@/components/RadarChart';
import Timeline from '@/components/Timeline';
import DiagPanel from '@/components/DiagPanel';
import {
  calculateMacroRatio,
  generateRadarData,
} from '@/utils/nutritionCalc';
import type { FoodItem } from '@/types';

export default function Home() {
  const todaySummary = useFoodStore((state) => state.todaySummary);
  const todayRecords = useFoodStore((state) => state.todayRecords);
  const selectedFood = useFoodStore((state) => state.selectedFood);
  const grams = useFoodStore((state) => state.grams);
  const setGrams = useFoodStore((state) => state.setGrams);
  const addRecord = useFoodStore((state) => state.addRecord);
  const selectFood = useFoodStore((state) => state.selectFood);

  const [diagOpen, setDiagOpen] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const macroRatio = calculateMacroRatio(todaySummary);
  const radarData = generateRadarData(todaySummary);

  const handleAddRecord = () => {
    if (selectedFood) {
      addRecord(selectedFood.id, grams);
    }
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipple({ x, y, id });
    setTimeout(() => setRipple(null), 300);
    handleAddRecord();
  };

  const calcNutritionForGrams = (food: FoodItem, g: number) => {
    const factor = g / 100;
    return {
      calories: (food.calories * factor).toFixed(1),
      protein: (food.protein * factor).toFixed(1),
      fat: (food.fat * factor).toFixed(1),
      carbs: (food.carbs * factor).toFixed(1),
      fiber: (food.fiber * factor).toFixed(1),
      sodium: (food.sodium * factor).toFixed(0),
    };
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="animate-fade-up">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            今日饮食
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {dateStr}
          </p>
        </div>
        <button
          onClick={() => setDiagOpen(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
          }}
        >
          <span>🔍</span>
          <span>营养诊断</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
        className="charts-grid"
      >
        <div className="card" style={{ minHeight: '320px' }}>
          <MacroChart ratio={macroRatio} />
        </div>
        <div className="card" style={{ minHeight: '320px' }}>
          <RadarChart data={radarData} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          添加食物记录
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <FoodSearch onSelect={() => {}} />
        </div>

        {selectedFood ? (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFood.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedFood.nameEn}
                </p>
              </div>
              <button
                onClick={() => selectFood(null)}
                style={{
                  fontSize: '20px',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  食用量
                </span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                  {grams} 克
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${((grams - 10) / 490) * 100}%, #e0e0e0 ${((grams - 10) / 490) * 100}%, #e0e0e0 100%)`,
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                <span>10g</span>
                <span>500g</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
              className="nutrition-grid"
            >
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>热量</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {calcNutritionForGrams(selectedFood, grams).calories}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> kcal</span>
                </p>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>蛋白质</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#4ecdc4' }}>
                  {calcNutritionForGrams(selectedFood, grams).protein}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> g</span>
                </p>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>脂肪</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#ff6b6b' }}>
                  {calcNutritionForGrams(selectedFood, grams).fat}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> g</span>
                </p>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>碳水</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#d4a72c' }}>
                  {calcNutritionForGrams(selectedFood, grams).carbs}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> g</span>
                </p>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>纤维</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#8bc34a' }}>
                  {calcNutritionForGrams(selectedFood, grams).fiber}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> g</span>
                </p>
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>钠</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#9c27b0' }}>
                  {calcNutritionForGrams(selectedFood, grams).sodium}
                  <span style={{ fontSize: '12px', fontWeight: 400 }}> mg</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleRipple}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {ripple && (
                <span
                  key={ripple.id}
                  style={{
                    position: 'absolute',
                    left: ripple.x,
                    top: ripple.y,
                    width: '20px',
                    height: '20px',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'ripple 0.3s ease-out forwards',
                  }}
                />
              )}
              添加记录
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              border: '2px dashed rgba(78, 205, 196, 0.3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍴</div>
            <p>在上方搜索框中输入食物名称开始记录</p>
          </div>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
        }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            今日记录
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            共 {todayRecords.length} 条
          </span>
        </div>
        <Timeline records={todayRecords} />
      </div>

      <DiagPanel isOpen={diagOpen} onClose={() => setDiagOpen(false)} />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: white;
          border: 3px solid #4ecdc4;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: white;
          border: 3px solid #4ecdc4;
          border-radius: 50%;
          cursor: pointer;
        }
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(15);
            opacity: 0;
          }
        }
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          .nutrition-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
