import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { NutritionData } from '@/types';

interface NutritionRadarProps {
  data: NutritionData;
}

const labelMap: Record<string, string> = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
  fiber: '纤维',
};

export default function NutritionRadar({ data }: NutritionRadarProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: labelMap[key] || key,
    value: key === 'calories' ? Math.min(value / 10, 100) : Math.min(value, 100),
    raw: value,
  }));

  return (
    <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
      <h3 className="font-serif text-lg text-warm-brown mb-4">营养分析</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#F0E0D0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8D6E63', fontSize: 12 }} />
          <Radar
            name="营养"
            dataKey="value"
            stroke="#FF8A3D"
            fill="#FFB380"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((d) => (
          <div key={d.subject} className="text-xs text-warm-brown-light">
            <span className="font-medium text-warm-brown">{d.subject}</span> {d.raw}{d.subject === '热量' ? 'kcal' : 'g'}
          </div>
        ))}
      </div>
    </div>
  );
}
