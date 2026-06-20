import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store/appStore';

const COLORS = ['#4FC3F7', '#8899BB', '#7C4DFF', '#FFD700', '#FF6B9D'];

export const ChartPanel = () => {
  const { blockStats, shadowPolygons, buildings } = useAppStore();

  const barData = useMemo(() => {
    return blockStats.map((stat) => ({
      name: stat.blockName,
      平均日照时长: stat.avgSunlightHours,
      fullMark: 12,
    }));
  }, [blockStats]);

  const pieData = useMemo(() => {
    return blockStats.map((stat) => ({
      name: stat.blockName,
      value: Math.round(stat.shadowCoverage * 100),
    }));
  }, [blockStats]);

  const totalShadowArea = useMemo(() => {
    const total = blockStats.reduce((sum, s) => sum + s.shadowCoverage * s.totalArea, 0);
    const totalArea = blockStats.reduce((sum, s) => sum + s.totalArea, 0);
    return totalArea > 0 ? Math.round((total / totalArea) * 100) : 0;
  }, [blockStats]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#1A2236',
            border: '1px solid #2A3A5C',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <p style={{ color: '#E0E6F0', margin: 0, marginBottom: '4px' }}>{label}</p>
          <p style={{ color: '#4FC3F7', margin: 0 }}>
            {payload[0].value.toFixed(1)} 小时
          </p>
        </div>
      );
    }
    return null;
  };

  const pieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#1A2236',
            border: '1px solid #2A3A5C',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <p style={{ color: '#E0E6F0', margin: 0 }}>
            {payload[0].name}: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      className="chart-panel"
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
    >
      <div className="chart-container">
        <div className="chart-title">平均日照时长 (小时)</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" />
            <XAxis
              dataKey="name"
              stroke="#8899BB"
              tick={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <YAxis
              stroke="#8899BB"
              domain={[0, 12]}
              tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="平均日照时长"
              fill="#4FC3F7"
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container" style={{ maxWidth: '400px' }}>
        <div className="chart-title">
          阴影覆盖率
          <span style={{ float: 'right', color: '#4FC3F7' }}>总计: {totalShadowArea}%</span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={70}
              innerRadius={35}
              fill="#8884d8"
              dataKey="value"
              animationDuration={600}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={pieTooltip} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#8899BB', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container" style={{ maxWidth: '200px' }}>
        <div className="chart-title">实时统计</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '8px 0',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>
              建筑数量
            </div>
            <div
              className="mono"
              style={{ fontSize: '20px', fontWeight: 700, color: '#4FC3F7' }}
            >
              {buildings.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>
              阴影投影数
            </div>
            <div
              className="mono"
              style={{ fontSize: '20px', fontWeight: 700, color: '#FFD700' }}
            >
              {shadowPolygons.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>
              分析街区
            </div>
            <div
              className="mono"
              style={{ fontSize: '20px', fontWeight: 700, color: '#7C4DFF' }}
            >
              {blockStats.length}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
