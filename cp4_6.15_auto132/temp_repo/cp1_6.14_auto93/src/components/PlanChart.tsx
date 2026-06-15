import { useMemo, useState, useEffect } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import type { DailyNutrition } from '../../shared/types';

interface PlanChartProps {
  weeklyData: DailyNutrition[];
}

const NUTRIENT_COLORS = {
  protein: '#FF6B9D',
  carbs: '#FFB74D',
  fat: '#64B5F6',
};

export default function PlanChart({ weeklyData }: PlanChartProps) {
  const days = weeklyData.slice(-7);
  const todayData = days[days.length - 1];

  const todayProtein = todayData?.protein ?? 0;
  const todayCarbs = todayData?.carbs ?? 0;
  const todayFat = todayData?.fat ?? 0;

  const barChartValues = useCountUpAnimations(days.map((d) => d.calories));
  const { value: dispProtein } = useCountUp(Math.round(todayProtein), { duration: 1500, delay: 50 });
  const { value: dispCarbs } = useCountUp(Math.round(todayCarbs), { duration: 1500, delay: 125 });
  const { value: dispFat } = useCountUp(Math.round(todayFat), { duration: 1500, delay: 200 });

  const barChartData = useMemo(() => {
    return days.map((d, i) => ({
      ...d,
      displayedCalories: barChartValues[i],
    }));
  }, [days, barChartValues]);

  const totalNutrients = todayProtein + todayCarbs + todayFat;
  const nutrientPercentages = {
    protein: totalNutrients > 0 ? (todayProtein / totalNutrients) * 100 : 0,
    carbs: totalNutrients > 0 ? (todayCarbs / totalNutrients) * 100 : 0,
    fat: totalNutrients > 0 ? (todayFat / totalNutrients) * 100 : 0,
  };

  const [pieAnimProgress, setPieAnimProgress] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const delay = 100;
    const start = performance.now() + delay;

    const animate = (now: number) => {
      if (now < start) {
        requestAnimationFrame(animate);
        return;
      }
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setPieAnimProgress(easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [todayProtein, todayCarbs, todayFat]);

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-8">
      <div className="flex-1">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">本周热量趋势</h3>
        <BarChart data={barChartData} />
      </div>

      <div className="flex-1">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">今日营养素占比</h3>
        <PieChart
          protein={nutrientPercentages.protein}
          carbs={nutrientPercentages.carbs}
          fat={nutrientPercentages.fat}
          animProgress={pieAnimProgress}
          dispProtein={dispProtein}
          dispCarbs={dispCarbs}
          dispFat={dispFat}
        />
      </div>
    </div>
  );
}

function useCountUpAnimations(targets: number[]): number[] {
  const delays = [50, 100, 150, 200, 250, 300, 350];
  const results = targets.map((target, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { value } = useCountUp(Math.round(target), {
      duration: 1200,
      delay: delays[i] ?? 0,
    });
    return value;
  });
  return results;
}

interface BarChartData extends DailyNutrition {
  displayedCalories: number;
}

function BarChart({ data }: { data: BarChartData[] }) {
  const width = 480;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.calories, d.targetCalories)),
    100
  );
  const yMax = Math.ceil(maxValue / 200) * 200 + 200;
  const yTicks = 5;
  const barWidth = (chartWidth / data.length) * 0.55;
  const barGap = (chartWidth / data.length) * 0.45;

  const yScale = (value: number) => chartHeight - (value / yMax) * chartHeight;
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  const getWeekdayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `周${weekdays[date.getDay()]}`;
  };

  const avgTarget = data.length > 0
    ? data.reduce((sum, d) => sum + d.targetCalories, 0) / data.length
    : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[320px]">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AED581" />
            <stop offset="100%" stopColor="#7CB342" />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const yVal = (yMax / yTicks) * i;
          const y = padding.top + yScale(yVal);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9CA3AF"
              >
                {yVal}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = padding.left + (barWidth + barGap) * i + barGap / 2;
          const targetY = padding.top + yScale(d.targetCalories);
          const barHeight = chartHeight - yScale(d.displayedCalories);
          const barY = padding.top + yScale(d.displayedCalories);
          const isOver = d.calories > d.targetCalories;

          return (
            <g key={i}>
              <rect
                x={x}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={isOver ? 'url(#barGradient)' : 'url(#barGradient)'}
                opacity={d.displayedCalories === 0 ? 0 : 1}
                style={{ transition: 'all 0.3s ease-out' }}
              />
              {d.targetCalories > 0 && (
                <>
                  <line
                    x1={x - 4}
                    y1={targetY}
                    x2={x + barWidth + 4}
                    y2={targetY}
                    stroke="#FF5252"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                </>
              )}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                fontSize="12"
                fill="#6B7280"
                fontWeight="500"
              >
                {getDateLabel(d.date)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 34}
                textAnchor="middle"
                fontSize="10"
                fill="#9CA3AF"
              >
                {getWeekdayLabel(d.date)}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${padding.left}, ${padding.top - 10})`}>
          <rect width="14" height="10" rx="3" fill="url(#barGradient)" />
          <text x="20" y="9" fontSize="11" fill="#6B7280">
            实际热量
          </text>
          <line x1="90" y1="5" x2="110" y2="5" stroke="#FF5252" strokeWidth="2" strokeDasharray="6 4" />
          <text x="116" y="9" fontSize="11" fill="#6B7280">
            目标 (平均 {Math.round(avgTarget)})
          </text>
        </g>
      </svg>
    </div>
  );
}

interface PieChartProps {
  protein: number;
  carbs: number;
  fat: number;
  animProgress: number;
  dispProtein: number;
  dispCarbs: number;
  dispFat: number;
}

function PieChart({
  protein,
  carbs,
  fat,
  animProgress,
  dispProtein,
  dispCarbs,
  dispFat,
}: PieChartProps) {
  const size = 220;
  const center = size / 2;
  const outerRadius = 90;
  const innerRadius = 60;
  const strokeWidth = 24;
  const radius = (outerRadius + innerRadius) / 2;
  const circumference = 2 * Math.PI * radius;

  const proteinLen = (protein / 100) * circumference * animProgress;
  const carbsLen = (carbs / 100) * circumference * animProgress;
  const fatLen = (fat / 100) * circumference * animProgress;

  const proteinGap = circumference * 0.005;
  const carbsGap = circumference * 0.005;
  const fatGap = circumference * 0.005;

  const proteinDasharray = `${proteinLen} ${circumference}`;
  const carbsDasharray = `${carbsLen} ${circumference}`;
  const fatDasharray = `${fatLen} ${circumference}`;

  const proteinOffset = 0;
  const carbsOffset = -((proteinLen + proteinGap));
  const fatOffset = -((proteinLen + proteinGap + carbsLen + carbsGap));

  const { value: dispProteinPct } = useCountUp(Math.round(protein), { duration: 1500, delay: 100 });
  const { value: dispCarbsPct } = useCountUp(Math.round(carbs), { duration: 1500, delay: 150 });
  const { value: dispFatPct } = useCountUp(Math.round(fat), { duration: 1500, delay: 200 });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={NUTRIENT_COLORS.protein}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={proteinDasharray}
            strokeDashoffset={proteinOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />

          {carbsLen > 0.5 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={NUTRIENT_COLORS.carbs}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={carbsDasharray}
              strokeDashoffset={carbsOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}

          {fatLen > 0.5 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={NUTRIENT_COLORS.fat}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={fatDasharray}
              strokeDashoffset={fatOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">总营养</span>
          <span className="text-2xl font-bold text-gray-800">
            {dispProtein + dispCarbs + dispFat}g
          </span>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-lg bg-gray-50 p-2">
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NUTRIENT_COLORS.protein }}
            />
            <span className="text-xs font-medium text-gray-600">蛋白质</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: NUTRIENT_COLORS.protein }}>
            {dispProteinPct}%
          </span>
          <span className="text-xs text-gray-500">{dispProtein}g</span>
        </div>

        <div className="flex flex-col items-center rounded-lg bg-gray-50 p-2">
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NUTRIENT_COLORS.carbs }}
            />
            <span className="text-xs font-medium text-gray-600">碳水</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: NUTRIENT_COLORS.carbs }}>
            {dispCarbsPct}%
          </span>
          <span className="text-xs text-gray-500">{dispCarbs}g</span>
        </div>

        <div className="flex flex-col items-center rounded-lg bg-gray-50 p-2">
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NUTRIENT_COLORS.fat }}
            />
            <span className="text-xs font-medium text-gray-600">脂肪</span>
          </div>
          <span className="mt-1 text-lg font-bold" style={{ color: NUTRIENT_COLORS.fat }}>
            {dispFatPct}%
          </span>
          <span className="text-xs text-gray-500">{dispFat}g</span>
        </div>
      </div>
    </div>
  );
}
