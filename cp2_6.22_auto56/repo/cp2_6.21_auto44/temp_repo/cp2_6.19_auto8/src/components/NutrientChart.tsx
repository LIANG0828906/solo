/**
 * ============================================================
 *  NutrientChart.tsx - 营养圆环图表组件
 * ============================================================
 * 
 * 【职责】：
 *  1. 使用 recharts 渲染圆环图(PieChart)，展示三大营养素供能比例
 *  2. 圆环中心显示总热量数值
 *  3. 计算达标状态并以图标+动画展示
 *  4. 渐变色与主题色统一（主色#4CAF50，辅助色#FFB74D）
 * 
 * 【调用关系】：
 *  ┌──────────────────────────────────────────────────┐
 *  │   App.tsx (父组件)                               │
 *  │     │                                            │
 *  │     ▼ 传入 props                                  │
 *  │  ┌──────────────────────────────────────────┐    │
 *  │  │   dailyTotal: {calories, protein,        │    │
 *  │  │               fat, carbs}                │    │
 *  │  │   goals: {dailyCalories, minProtein,     │    │
 *  │  │          maxFat, maxCarbs}               │    │
 *  │  │   goalStatus: {calories, protein,        │    │
 *  │  │             fat, carbs} (布尔值)         │    │
 *  │  └──────────────────┬───────────────────────┘    │
 *  │                     │                             │
 *  │                     ▼  useMemo                    │
 *  │            chartData (供能比例%)                  │
 *  │  蛋白质(4kcal/g) 脂肪(9kcal/g) 碳水(4kcal/g)     │
 *  │                     │                             │
 *  │                     ▼ 渲染                        │
 *  │  ┌───────────────────────────────────────────┐   │
 *  │  │  recharts PieChart + Pie                   │   │
 *  │  │  ├─ 800ms 转动动画                         │   │
 *  │  │  ├─ CSS旋转动画包裹层 (rotate-chart)       │   │
 *  │  │  ├─ 渐变填充 (Protein/Fat/Carbs渐变)       │   │
 *  │  │  └─ 中心文本: 总热量千卡                    │   │
 *  │  │                                           │   │
 *  │  │  达标状态区 goal-status                    │   │
 *  │  │  ├─ achieved  → floatUp 上浮 + ✓          │   │
 *  │  │  └─ not-achieved → shake 抖动 + ✗         │   │
 *  │  └───────────────────────────────────────────┘   │
 *  └──────────────────────────────────────────────────┘
 * 
 * 【数据流向】：
 *  App props (dailyTotal, goals, goalStatus)
 *    → useMemo 计算各营养素供能比例 (转成kcal再算百分比)
 *    → recharts 渲染 + 中心文本
 *    → 遍历 goalItems 渲染 4 项达标状态卡片
 * ============================================================
 */

import { memo, useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { DailyTotal, NutritionGoals, GoalStatus } from '../types';

interface NutrientChartProps {
  dailyTotal: DailyTotal;
  goals: NutritionGoals;
  goalStatus: GoalStatus;
}

const COLORS = {
  protein: ['#4CAF50', '#81C784'],
  fat: ['#FFB74D', '#FFE082'],
  carbs: ['#64B5F6', '#90CAF9'],
};

function NutrientChart({ dailyTotal, goals, goalStatus }: NutrientChartProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const chartData = useMemo(() => {
    const proteinCalories = dailyTotal.totalProtein * 4;
    const fatCalories = dailyTotal.totalFat * 9;
    const carbsCalories = dailyTotal.totalCarbs * 4;
    const total = proteinCalories + fatCalories + carbsCalories;

    if (total === 0) {
      return [
        { name: '蛋白质', value: 1, color: COLORS.protein, calories: 0, grams: 0 },
        { name: '脂肪', value: 1, color: COLORS.fat, calories: 0, grams: 0 },
        { name: '碳水', value: 1, color: COLORS.carbs, calories: 0, grams: 0 },
      ];
    }

    return [
      { 
        name: '蛋白质', 
        value: Math.round(proteinCalories / total * 100), 
        color: COLORS.protein,
        calories: Math.round(proteinCalories),
        grams: dailyTotal.totalProtein,
      },
      { 
        name: '脂肪', 
        value: Math.round(fatCalories / total * 100), 
        color: COLORS.fat,
        calories: Math.round(fatCalories),
        grams: dailyTotal.totalFat,
      },
      { 
        name: '碳水化合物', 
        value: Math.round(carbsCalories / total * 100), 
        color: COLORS.carbs,
        calories: Math.round(carbsCalories),
        grams: dailyTotal.totalCarbs,
      },
    ];
  }, [dailyTotal]);

  useEffect(() => {
    if (dailyTotal.totalCalories > 0) {
      setIsRotating(true);
      setAnimationKey(prev => prev + 1);
      const timer = setTimeout(() => setIsRotating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [dailyTotal.totalCalories, dailyTotal.totalProtein, dailyTotal.totalFat, dailyTotal.totalCarbs]);

  const renderCustomizedLabel = () => null;

  const goalItems = useMemo(() => [
    { 
      key: 'calories', 
      label: '热量', 
      value: `${Math.round(dailyTotal.totalCalories)} / ${goals.dailyCalories}`, 
      unit: 'kcal',
      achieved: goalStatus.calories,
      icon: '🔥',
    },
    { 
      key: 'protein', 
      label: '蛋白质', 
      value: `${dailyTotal.totalProtein.toFixed(1)} / ${goals.minProtein}`, 
      unit: 'g',
      achieved: goalStatus.protein,
      icon: '💪',
    },
    { 
      key: 'fat', 
      label: '脂肪', 
      value: `${dailyTotal.totalFat.toFixed(1)} / ${goals.maxFat}`, 
      unit: 'g',
      achieved: goalStatus.fat,
      icon: '🥑',
    },
    { 
      key: 'carbs', 
      label: '碳水', 
      value: `${dailyTotal.totalCarbs.toFixed(1)} / ${goals.maxCarbs}`, 
      unit: 'g',
      achieved: goalStatus.carbs,
      icon: '🍞',
    },
  ], [dailyTotal, goals, goalStatus]);

  const hasData = dailyTotal.totalCalories > 0;

  return (
    <div className="chart-section">
      <div className="chart-container">
        <div 
          style={{ 
            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: isRotating ? 'rotate(360deg)' : 'rotate(0deg)',
          }}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart key={animationKey}>
              <defs>
                <linearGradient id="gradientProtein" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={COLORS.protein[0]} />
                  <stop offset="100%" stopColor={COLORS.protein[1]} />
                </linearGradient>
                <linearGradient id="gradientFat" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={COLORS.fat[0]} />
                  <stop offset="100%" stopColor={COLORS.fat[1]} />
                </linearGradient>
                <linearGradient id="gradientCarbs" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={COLORS.carbs[0]} />
                  <stop offset="100%" stopColor={COLORS.carbs[1]} />
                </linearGradient>
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomizedLabel}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient${entry.name === '蛋白质' ? 'Protein' : entry.name === '脂肪' ? 'Fat' : 'Carbs'})`}
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-center-text">
          <div className="chart-center-value">{Math.round(dailyTotal.totalCalories)}</div>
          <div className="chart-center-label">千卡 / {goals.dailyCalories}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color protein"></span>
          <span>蛋白质 {chartData[0].value}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color fat"></span>
          <span>脂肪 {chartData[1].value}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color carbs"></span>
          <span>碳水 {chartData[2].value}%</span>
        </div>
      </div>

      {hasData && (
        <div className="goal-status">
          {goalItems.map(item => (
            <div 
              key={item.key}
              className={`goal-item ${item.achieved ? 'achieved' : 'not-achieved'}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              <span className="value">{item.value} {item.unit}</span>
              <span className={`status-icon ${item.achieved ? 'success' : 'error'}`}>
                {item.achieved ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <div className="empty-state">
          <div className="empty-state-icon">🥗</div>
          <div className="empty-state-text">开始记录您的第一餐吧！</div>
        </div>
      )}
    </div>
  );
}

export default memo(NutrientChart);
