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
              <p className="text-sm font-medium text-red-700">结构不完整</p>
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

export function analyzeStructureLocally(content: string): StructureAnalysis {
  const paragraphs = content.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0);
  const totalLength = content.length;

  if (!paragraphs.length) {
    return {
      hasIntro: false, hasBody: false, hasConclusion: false,
      introPercent: 0, bodyPercent: 0, conclusionPercent: 0,
      suggestions: ['请输入作文内容'],
    };
  }

  const INTRO_KEYWORDS = [
    '随着', '在当今', '如今', '近年来', '众所周知', '随着科技',
    '随着社会', '随着经济', '在信息时代', '自古以来', '所谓',
  ];
  const BODY_KEYWORDS = [
    '首先', '其次', '再次', '此外', '另外', '同时', '与此同时',
    '另一方面', '不仅如此', '更重要的是', '例如', '比如', '具体来说',
  ];
  const CONCLUSION_KEYWORDS = [
    '总之', '综上所述', '由此可见', '总而言之', '概括来说',
    '归根结底', '因此', '所以', '让我们', '我们应该',
  ];

  let introEndIndex = 1;
  let conclusionStartIndex = paragraphs.length - 1;

  for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
    const p = paragraphs[i];
    if (INTRO_KEYWORDS.some((kw) => p.includes(kw))) {
      introEndIndex = Math.max(introEndIndex, i + 1);
    }
  }

  for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 3); i--) {
    const p = paragraphs[i];
    if (CONCLUSION_KEYWORDS.some((kw) => p.includes(kw))) {
      conclusionStartIndex = Math.min(conclusionStartIndex, i);
    }
  }

  if (conclusionStartIndex <= introEndIndex && paragraphs.length >= 3) {
    conclusionStartIndex = paragraphs.length - 1;
  }

  const introParagraphs = paragraphs.slice(0, introEndIndex);
  const bodyParagraphs = paragraphs.slice(introEndIndex, conclusionStartIndex);
  const conclusionParagraphs = paragraphs.slice(conclusionStartIndex);

  const introLen = introParagraphs.join('').length;
  const bodyLen = bodyParagraphs.join('').length;
  const conclusionLen = conclusionParagraphs.join('').length;

  const hasIntro = introLen > 20 && introParagraphs.some(
    (p) => INTRO_KEYWORDS.some((kw) => p.includes(kw)) || p.length > 20
  );
  const hasBody = bodyLen > 50 && bodyParagraphs.some(
    (p) => BODY_KEYWORDS.some((kw) => p.includes(kw)) || p.length > 50
  );
  const hasConclusion = conclusionLen > 15 && conclusionParagraphs.some(
    (p) => CONCLUSION_KEYWORDS.some((kw) => p.includes(kw)) || p.length > 15
  );

  const introPercent = totalLength > 0 ? (introLen / totalLength) * 100 : 0;
  const bodyPercent = totalLength > 0 ? (bodyLen / totalLength) * 100 : 0;
  const conclusionPercent = totalLength > 0 ? (conclusionLen / totalLength) * 100 : 0;

  const suggestions = generateStructureSuggestions(
    hasIntro, hasBody, hasConclusion,
    introPercent, bodyPercent, conclusionPercent,
    paragraphs.length
  );

  return {
    hasIntro, hasBody, hasConclusion,
    introPercent: Math.round(introPercent * 10) / 10,
    bodyPercent: Math.round(bodyPercent * 10) / 10,
    conclusionPercent: Math.round(conclusionPercent * 10) / 10,
    suggestions,
  };
}

function generateStructureSuggestions(
  hasIntro: boolean, hasBody: boolean, hasConclusion: boolean,
  introPct: number, bodyPct: number, conclusionPct: number,
  paraCount: number
): string[] {
  const suggestions: string[] = [];

  if (!hasIntro) {
    suggestions.push('缺少引言部分，建议在开头使用"随着""近年来"等词引出主题和背景');
  } else if (introPct > 30) {
    suggestions.push('引言部分过长，建议精简背景介绍，快速切入主题');
  }

  if (!hasBody) {
    suggestions.push('缺少正文主体，建议使用"首先""其次""此外"等词展开论述');
  } else if (bodyPct < 40 && paraCount >= 3) {
    suggestions.push('正文内容偏少，建议增加论据和细节描写');
  }

  if (!hasConclusion) {
    suggestions.push('缺少结论段，建议使用"总之""综上所述"等词总结全文并升华主题');
  } else if (conclusionPct > 25) {
    suggestions.push('结论部分过长，建议简洁收尾');
  }

  if (paraCount < 3 && paraCount > 0) {
    suggestions.push(`全文仅有 ${paraCount} 个段落，建议分段论述使结构更清晰`);
  }

  if (!suggestions.length) {
    suggestions.push('文章结构完整，各部分比例协调，继续保持！');
  }

  return suggestions;
}

export default StructureChart;
