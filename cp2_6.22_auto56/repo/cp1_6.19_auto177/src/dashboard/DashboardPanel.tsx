import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { store } from '../store';
import { AppState, ConsistencyMetrics } from '../types';

interface Props {
  assignmentId: string;
}

export const DashboardPanel: React.FC<Props> = ({ assignmentId }) => {
  const [state, setState] = useState<AppState>(store.getState());
  const [selectedRater, setSelectedRater] = useState<string>('S001');

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return unsub;
  }, []);

  const metrics: ConsistencyMetrics | undefined = state.consistencyMetrics[assignmentId];
  const biasData = state.raterBiasData[assignmentId] || [];
  const trendData = state.raterBiasTrends[selectedRater] || [];
  const current = state.students.find((s) => s.id === selectedRater);

  const barData = useMemo(() => {
    return biasData.map((b) => ({
      name: b.raterName,
      id: b.raterId,
      bias: Number(b.biasValue.toFixed(3)),
      mean: Number(b.meanScore.toFixed(2)),
    }));
  }, [biasData]);

  const alertVisible = metrics?.isAlert ?? false;

  const lineColor = '#7E57C2';

  return (
    <div className="dashboard-panel">
      <AnimatePresence>
        {alertVisible && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="alert-bar"
          >
            <span className="alert-bar-icon">⚠</span>
            <span className="alert-bar-text">
              警告：当前作业评分者间一致性较低（Kendall W = {metrics?.kendallW.toFixed(3)}），低于阈值 0.6，请人工复核。
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">Kendall 协调系数 W</div>
          <div className={`metric-value ${(metrics?.kendallW ?? 0) < 0.6 ? 'danger' : ''}`}>
            {metrics ? metrics.kendallW.toFixed(3) : '计算中...'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cohen's Kappa 系数</div>
          <div className="metric-value">{metrics ? metrics.cohenKappa.toFixed(3) : '计算中...'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">有效评分记录数</div>
          <div className="metric-value">{state.scoreRecords.filter((r) => r.assignmentId === assignmentId).length}</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3 className="chart-title">评阅者偏差系数趋势（按作业时间）</h3>
          <div className="rater-select">
            <label>学生：</label>
            <select
              value={selectedRater}
              onChange={(e) => setSelectedRater(e.target.value)}
              className="select-control"
            >
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.id}）
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 16, right: 32, bottom: 16, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#555' }} label={{ value: '作业提交日期', position: 'insideBottom', offset: -6, fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12, fill: '#555' }} label={{ value: '偏差值(σ)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="chart-tooltip">
                        <div className="tooltip-title">{d.assignmentTitle}</div>
                        <div>日期：{label}</div>
                        <div>偏差值：<b>{Number(payload[0].value).toFixed(3)} σ</b></div>
                        <div>学生：{current?.name}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="biasValue"
                name={`${current?.name} 偏差系数`}
                stroke={lineColor}
                strokeWidth={2.5}
                dot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 9, fill: lineColor, stroke: '#fff', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3 className="chart-title">各评阅者偏差值分布（当前作业）</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 16, right: 32, bottom: 16, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#555' }} />
              <YAxis tick={{ fontSize: 12, fill: '#555' }} label={{ value: '偏差值(σ)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="chart-tooltip">
                        <div className="tooltip-title">{d.name}（{d.id}）</div>
                        <div>偏差值：<b>{d.bias} σ</b></div>
                        <div>平均给分：{d.mean}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="bias" name="偏差系数(σ)" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.bias > 0 ? '#EF5350' : entry.bias < 0 ? '#42A5F5' : '#66BB6A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
