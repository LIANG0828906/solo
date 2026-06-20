import { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { ScoreBreakdown } from '@/types';
import { SCORE_COLORS, SCORE_DIMENSIONS, getScoreLevel } from '@/types';

interface ScoreRadarProps {
  scores: ScoreBreakdown;
}

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const [animatedData, setAnimatedData] = useState(
    SCORE_DIMENSIONS.map((d) => ({ subject: d.label, value: 0, fullMark: 5 }))
  );
  const [showScore, setShowScore] = useState(false);
  const scoreLevel = getScoreLevel(scores.total);

  const radarData = SCORE_DIMENSIONS.map((dim) => ({
    subject: dim.label,
    value: scores[dim.key as keyof ScoreBreakdown] as number,
    fullMark: 5,
  }));

  useEffect(() => {
    setShowScore(false);

    const duration = 800;
    const startTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const animated = radarData.map((item) => ({
        ...item,
        value: item.value * easeOut,
      }));

      setAnimatedData(animated);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowScore(true), 200);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scores]);

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-fade-in">
      <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-[#FF7043] rounded-full" />
        综合评分
      </h3>

      <div className="relative">
        <div className="h-56" style={{ willChange: 'transform' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={animatedData}>
              <PolarGrid stroke="#e0e0e0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tickCount={6}
                tick={{ fill: '#999', fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name="评分"
                dataKey="value"
                stroke="#FF7043"
                fill="#FF7043"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500 ${
            showScore ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div
            className="text-4xl font-bold"
            style={{ color: SCORE_COLORS[scoreLevel] }}
          >
            {scores.total}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">总分</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {SCORE_DIMENSIONS.map((dim) => (
          <div key={dim.key} className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {scores[dim.key as keyof ScoreBreakdown] as number}
            </div>
            <div className="text-xs text-gray-500">{dim.label}</div>
          </div>
        ))}
      </div>

      <div
        className="mt-3 py-2 rounded-lg text-center text-sm font-medium"
        style={{
          backgroundColor: `${SCORE_COLORS[scoreLevel]}15`,
          color: SCORE_COLORS[scoreLevel],
        }}
      >
        {scoreLevel === 'excellent' && '优秀！继续保持'}
        {scoreLevel === 'medium' && '中等，还有提升空间'}
        {scoreLevel === 'poor' && '需要加强练习'}
      </div>
    </div>
  );
}

export default ScoreRadar;
