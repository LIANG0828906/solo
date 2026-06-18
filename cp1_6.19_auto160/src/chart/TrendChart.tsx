import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribe, SimulationState } from '../store';
import { policyTags } from '../engine/policyData';

const COLORS = {
  satisfaction: '#4CAF50',
  carbon: '#FF9800',
  economy: '#2196F3',
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(22, 33, 62, 0.95)',
          border: '1px solid #2A3F5F',
          borderRadius: '8px',
          padding: '12px',
          color: '#fff',
          fontSize: '12px',
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#FFC107' }}>
          第 {label} 月
        </p>
        {payload.map((entry: any, index: number) => {
          const prevData = payload[index]?.payload?.prevValue;
          const change = prevData !== undefined ? entry.value - prevData : 0;
          const changePercent = prevData ? ((change / prevData) * 100).toFixed(1) : '0';
          const isPositive = change >= 0;
          const color = entry.color;
          const nameMap: Record<string, string> = {
            satisfaction: '居民满意度',
            carbon: '碳排放强度',
            economy: '经济活跃度',
          };
          const unitMap: Record<string, string> = {
            satisfaction: '分',
            carbon: 'kg/人/月',
            economy: '分',
          };
          return (
            <div key={index} style={{ marginBottom: '4px' }}>
              <span style={{ color, marginRight: '8px' }}>●</span>
              <span>{nameMap[entry.dataKey] || entry.dataKey}: </span>
              <span style={{ fontWeight: 'bold' }}>
                {entry.value} {unitMap[entry.dataKey] || ''}
              </span>
              {prevData !== undefined && (
                <span style={{ color: isPositive ? '#4CAF50' : '#F44336', marginLeft: '6px' }}>
                  {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(changePercent))}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const TrendChart: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const chartData = useMemo(() => {
    if (!state || state.simulationData.length === 0) return [];
    return state.simulationData.map((item, index) => ({
      ...item,
      prevValue: index > 0 ? state.simulationData[index - 1] : undefined,
    }));
  }, [state?.simulationData]);

  const contributionData = useMemo(() => {
    if (!state || state.policyContributions.length === 0) return [];
    return state.policyContributions;
  }, [state?.policyContributions]);

  const policyColors = useMemo(() => {
    const colors: Record<string, string> = {};
    policyTags.forEach((policy) => {
      colors[policy.id] = policy.color;
    });
    return colors;
  }, []);

  const selectedPolicyIds = state?.selectedPolicies || [];

  if (!state) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          height: '400px',
          background: '#16213E',
          borderRadius: '12px',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence>
          {state.isSimulating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(22, 33, 62, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #2A3F5F',
                  borderTopColor: '#FFC107',
                  borderRadius: '50%',
                  marginBottom: '16px',
                }}
              />
              <span style={{ color: '#FFC107', fontSize: '16px', fontWeight: 'bold' }}>
                推演中...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3F5F" />
              <XAxis
                dataKey="month"
                stroke="#8B9CBF"
                label={{ value: '月份', position: 'insideBottom', offset: -5, fill: '#8B9CBF' }}
                tickFormatter={(value) => `${value}月`}
              />
              <YAxis stroke="#8B9CBF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#fff' }}
                formatter={(value) => {
                  const nameMap: Record<string, string> = {
                    satisfaction: '居民满意度',
                    carbon: '碳排放强度',
                    economy: '经济活跃度',
                  };
                  return nameMap[value] || value;
                }}
              />
              <Line
                type="monotone"
                dataKey="satisfaction"
                stroke={COLORS.satisfaction}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="carbon"
                stroke={COLORS.carbon}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="economy"
                stroke={COLORS.economy}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B9CBF',
              fontSize: '16px',
            }}
          >
            请选择至少2个政策标签，然后点击「开始模拟」查看推演结果
          </div>
        )}
      </motion.div>

      {contributionData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            height: '200px',
            background: '#16213E',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '14px' }}>
            各政策碳排放贡献度（堆叠图）
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={contributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3F5F" />
              <XAxis
                dataKey="month"
                stroke="#8B9CBF"
                tickFormatter={(value) => `${value}月`}
              />
              <YAxis stroke="#8B9CBF" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22, 33, 62, 0.95)',
                  border: '1px solid #2A3F5F',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string) => {
                  const policy = policyTags.find((p) => p.id === name);
                  return [`${value.toFixed(1)} kg/人/月`, policy?.name || name];
                }}
              />
              <Legend
                wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                formatter={(value) => {
                  const policy = policyTags.find((p) => p.id === value);
                  return policy?.name || value;
                }}
              />
              {selectedPolicyIds.map((policyId) => (
                <Bar
                  key={policyId}
                  dataKey={policyId}
                  stackId="a"
                  animationDuration={500}
                >
                  {contributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={policyColors[policyId] || '#888'} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};
