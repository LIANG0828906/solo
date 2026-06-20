import React, { memo, useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RiskScores } from '../types';
import { RISK_DIMENSION_LABELS, RISK_DIMENSION_KEYS, getScoreColor } from '../types';

interface RadarChartProps {
  riskScores: RiskScores;
}

const RADAR_THRESHOLD = 70;

interface RadarDatum {
  dimension: string;
  score: number;
  abnormalScore: number;
  fullMark: number;
}

const RadarChartComponent: React.FC<RadarChartProps> = memo(function RadarChartComponent({ riskScores }) {
  const chartData = useMemo<RadarDatum[]>(() => {
    return RISK_DIMENSION_KEYS.map((key) => {
      const score = riskScores[key];
      return {
        dimension: RISK_DIMENSION_LABELS[key],
        score,
        abnormalScore: score < RADAR_THRESHOLD ? score : 0,
        fullMark: 100,
      };
    });
  }, [riskScores]);

  const avgScore = useMemo(() => {
    const values = RISK_DIMENSION_KEYS.map((k) => riskScores[k]);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [riskScores]);

  const lineColor = getScoreColor(avgScore);

  return (
    <div className="fade-data" style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData} outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#4a5568', fontSize: 13, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#a0aec0', fontSize: 11 }}
            axisLine={false}
            tickCount={5}
          />
          <Radar
            name="健康评分"
            dataKey="score"
            stroke={lineColor}
            fill={lineColor}
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={500}
          />
          <Radar
            name="风险区域"
            dataKey="abnormalScore"
            stroke="transparent"
            fill="#e53e3e"
            fillOpacity={0.35}
            strokeWidth={0}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const d = payload[0].payload as RadarDatum;
                const color = getScoreColor(d.score);
                return (
                  <div
                    style={{
                      background: 'white',
                      padding: '10px 14px',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.dimension}</div>
                    <div style={{ color, fontWeight: 500 }}>
                      评分: {d.score} / 100
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default RadarChartComponent;
