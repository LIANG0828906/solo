import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import type { StructureAnalysis } from '@/types';

interface StructureChartProps {
  structure: StructureAnalysis;
}

const COLORS = {
  intro: '#42A5F5',
  body: '#66BB6A',
  conclusion: '#FF7043',
};

const LABELS = {
  intro: '引言',
  body: '正文',
  conclusion: '结论',
};

export function StructureChart({ structure }: StructureChartProps) {
  const data = useMemo(
    () => [
      {
        name: LABELS.intro,
        key: 'intro',
        value: structure.introPercent,
        has: structure.hasIntro,
      },
      {
        name: LABELS.body,
        key: 'body',
        value: structure.bodyPercent,
        has: structure.hasBody,
      },
      {
        name: LABELS.conclusion,
        key: 'conclusion',
        value: structure.conclusionPercent,
        has: structure.hasConclusion,
      },
    ],
    [structure]
  );

  const missingParts = useMemo(() => {
    const missing: string[] = [];
    if (!structure.hasIntro) missing.push('引言');
    if (!structure.hasBody) missing.push('正文');
    if (!structure.hasConclusion) missing.push('结论');
    return missing;
  }, [structure]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; has: boolean } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-medium text-gray-800">{item.name}</p>
          <p className="text-gray-600">占比：{item.value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#E3F2FD] rounded-xl p-4 animate-fade-in">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
        文章结构分析
      </h3>

      <div
        className={`rounded-lg p-3 mb-3 transition-all duration-300 ${
          missingParts.length > 0
            ? 'border-2 border-red-400 bg-red-50'
            : 'border border-green-200 bg-green-50'
        }`}
      >
        {missingParts.length > 0 ? (
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-red-700">
                结构不完整
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                缺少：{missingParts.join('、')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
              ✓
            </span>
            <p className="text-sm text-green-700 font-medium">
              结构完整，三部分齐全
            </p>
          </div>
        )}
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={40}
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              barSize={20}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.key as keyof typeof COLORS]}
                  fillOpacity={entry.has ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {structure.suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              {structure.suggestions.map((suggestion, index) => (
                <p key={index} className="text-xs text-gray-600 leading-relaxed">
                  {suggestion}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StructureChart;
