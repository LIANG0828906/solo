import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNutritionStore } from '@/store/useNutritionStore';

const COLORS = {
  protein: '#2196F3',
  fat: '#FF5722',
  carbs: '#FFC107',
  fiber: '#9C27B0',
};

const NUTRIENT_NAMES: Record<string, string> = {
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
  fiber: '膳食纤维',
};

export default function NutritionChart() {
  const { computeDailyTotals, goals } = useNutritionStore();
  const totals = computeDailyTotals();

  const data = [
    { name: 'protein', value: Math.round(totals.protein * 4) },
    { name: 'fat', value: Math.round(totals.fat * 9) },
    { name: 'carbs', value: Math.round(totals.carbs * 4) },
    { name: 'fiber', value: Math.round(totals.fiber * 2) },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-5 h-full flex flex-col">
      <h3 className="text-base font-bold text-gray-800 mb-3">营养构成</h3>
      <div className="relative flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              className="recharts-pie-path"
              animationDuration={600}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} kcal`,
                NUTRIENT_NAMES[name] || name,
              ]}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400">总热量</span>
          <span className="text-3xl font-bold text-gray-800 tabular-nums">
            {totals.calories.toFixed(0)}
          </span>
          <span className="text-xs text-gray-400">
            kcal{goals && ` / ${goals.calories}`}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.entries(NUTRIENT_NAMES).map(([key, label]) => {
          const val = totals[key as keyof typeof totals];
          const goalVal = goals?.[key as keyof typeof goals];
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: COLORS[key as keyof typeof COLORS],
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 block truncate">
                  {label}
                </span>
                <span className="text-xs font-semibold text-gray-700 tabular-nums">
                  {val.toFixed(0)}g
                  {goalVal && (
                    <span className="text-gray-400 font-normal">
                      {' '}
                      / {goalVal.toFixed(0)}g
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
