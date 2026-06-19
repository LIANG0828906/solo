import { useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import './RadarChart.css';

export const RadarChart: React.FC = () => {
  const { terrainMetrics } = useStore();

  const data = useMemo(() => {
    return [
      { subject: '地形复杂度', A: Math.round(terrainMetrics.complexity), fullMark: 100 },
      { subject: '平均深度', A: Math.round(terrainMetrics.avgDepth), fullMark: 50 },
      { subject: '起伏度', A: Math.round(terrainMetrics.relief), fullMark: 30 },
      { subject: '探测覆盖率', A: Math.round(terrainMetrics.coverage), fullMark: 100 },
    ];
  }, [terrainMetrics]);

  return (
    <motion.div
      className="radar-chart-panel"
      initial={{ x: 240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="radar-title">地形分析</h2>
      <p className="radar-subtitle">实时探测指标</p>

      <div className="radar-chart-container">
        <ResponsiveContainer width="100%" height={220}>
          <RechartsRadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={data}
          >
            <PolarGrid stroke="#D0D8E0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#5A6B7D', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 'dataMax']}
              tick={{ fill: '#8B9BAB', fontSize: 9 }}
              axisLine={false}
              tickCount={4}
            />
            <Radar
              name="指标"
              dataKey="A"
              stroke="#2E75B6"
              strokeWidth={2}
              fill="#4A90D9"
              fillOpacity={0.3}
              dot={{
                r: 3,
                fill: '#4A90D9',
                stroke: '#2E75B6',
                strokeWidth: 1,
              }}
              activeDot={{
                r: 6,
                fill: '#4A90D9',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>

      <div className="metrics-list">
        <div className="metric-item">
          <span className="metric-label">地形复杂度</span>
          <motion.span
            className="metric-value"
            key={terrainMetrics.complexity}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {terrainMetrics.complexity.toFixed(1)}
          </motion.span>
        </div>
        <div className="metric-item">
          <span className="metric-label">平均深度</span>
          <motion.span
            className="metric-value"
            key={terrainMetrics.avgDepth}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {terrainMetrics.avgDepth.toFixed(1)} m
          </motion.span>
        </div>
        <div className="metric-item">
          <span className="metric-label">起伏度</span>
          <motion.span
            className="metric-value"
            key={terrainMetrics.relief}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {terrainMetrics.relief.toFixed(1)} m
          </motion.span>
        </div>
        <div className="metric-item">
          <span className="metric-label">探测覆盖率</span>
          <motion.span
            className="metric-value"
            key={terrainMetrics.coverage}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {terrainMetrics.coverage.toFixed(1)}%
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};
