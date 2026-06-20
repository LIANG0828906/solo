import React, { useState, useEffect } from 'react';
import ObjectiveCard from './ObjectiveCard';
import type { Objective, Cycle, FilterType } from '../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我负责的' },
  { key: 'not_started', label: '未开始' },
  { key: 'in_progress', label: '进行中' },
  { key: 'at_risk', label: '有风险' },
];

interface OkrBoardProps {
  currentMember: string;
}

const OkrBoard: React.FC<OkrBoardProps> = ({ currentMember }) => {
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKey, setFilterKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cyclesRes, histRes, membersRes] = await Promise.all([
          fetch('/api/cycles'),
          fetch('/api/historical'),
          fetch('/api/members'),
        ]);
        const cycles = await cyclesRes.json();
        const hist = await histRes.json();
        const mems = await membersRes.json();

        if (cycles.length > 0) {
          const cycleRes = await fetch(`/api/cycles/${cycles[0].id}`);
          const fullCycle = await cycleRes.json();
          setCycle(fullCycle);
        }
        setHistoricalData(hist);
        setMembers(mems);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFilteredObjectives = (): Objective[] => {
    if (!cycle) return [];
    return cycle.objectives.filter((obj) => {
      switch (filter) {
        case 'all': return true;
        case 'mine': return obj.owner === currentMember;
        case 'not_started': return obj.status === 'not_started';
        case 'in_progress': return obj.status === 'in_progress';
        case 'at_risk': return obj.status === 'at_risk';
        default: return true;
      }
    });
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setFilterKey(k => k + 1);
  };

  const getMemberCompletionRates = () => {
    if (!cycle) return [];
    return members.map(m => {
      const memberObjectives = cycle.objectives.filter(o => o.owner === m.name);
      if (memberObjectives.length === 0) return { name: m.name, value: 0 };
      const avg = memberObjectives.reduce((sum, obj) => {
        const krProgress = obj.keyResults.reduce((s, kr) => {
          const p = Math.max(0, Math.min(100,
            ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100
          ));
          return s + (isNaN(p) ? 0 : p);
        }, 0) / Math.max(1, obj.keyResults.length);
        return sum + krProgress;
      }, 0) / memberObjectives.length;
      return { name: m.name, value: Math.round(avg) };
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          padding: '10px 14px',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(108, 99, 255, 0.15)',
          border: '1px solid #E8E6FF',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2D2B55', marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ fontSize: 12, color: '#6C63FF' }}>
            完成率: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: '#6C63FF',
        fontSize: 16,
      }}>
        加载中...
      </div>
    );
  }

  const filteredObjectives = getFilteredObjectives();
  const barData = getMemberCompletionRates();
  const lineData = historicalData.map(d => ({ name: d.cycle, value: d.completionRate }));

  return (
    <div style={{ padding: '24px 32px 40px', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#2D2B55',
            marginBottom: 4,
          }}>
            团队 OKR 看板
          </h1>
          <p style={{ fontSize: 14, color: '#8B88B5' }}>
            {cycle?.name || '当前周期'} · 共 {cycle?.objectives.length || 0} 个目标
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        background: '#fff',
        padding: 6,
        borderRadius: 12,
        boxShadow: '0 2px 10px rgba(108, 99, 255, 0.06)',
        width: 'fit-content',
      }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            style={{
              position: 'relative',
              padding: '10px 20px',
              border: 'none',
              background: filter === f.key ? 'rgba(108, 99, 255, 0.08)' : 'transparent',
              color: filter === f.key ? '#6C63FF' : '#6B6891',
              fontSize: 14,
              fontWeight: filter === f.key ? 600 : 500,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {f.label}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                left: '20%',
                right: '20%',
                height: 3,
                borderRadius: 2,
                background: '#6C63FF',
                transform: filter === f.key ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'transform 0.3s ease-in-out',
              }}
            />
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: 20,
        overflowX: 'auto',
        paddingBottom: 16,
        scrollBehavior: 'smooth',
      }}>
        <div
          key={filterKey}
          style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {filteredObjectives.length === 0 ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              color: '#8B88B5',
              fontSize: 14,
              width: '100%',
            }}>
              暂无符合条件的目标
            </div>
          ) : (
            filteredObjectives.map((obj, idx) => (
              <div
                key={obj.id}
                style={{
                  opacity: 0,
                  animation: `fadeInUp 0.5s ease-out ${idx * 0.06}s forwards`,
                }}
              >
                <ObjectiveCard
                  objective={obj}
                  cycleId={cycle!.id}
                  index={idx}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{
        marginTop: 40,
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 2px 12px rgba(108, 99, 255, 0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D2B55' }}>
            数据概览
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                background: chartType === 'line' ? '#6C63FF' : '#F0EEFF',
                color: chartType === 'line' ? '#fff' : '#6C63FF',
                transition: 'all 0.3s ease-in-out',
                fontWeight: 500,
              }}
            >
              周期趋势
            </button>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                background: chartType === 'bar' ? '#6C63FF' : '#F0EEFF',
                color: chartType === 'bar' ? '#fff' : '#6C63FF',
                transition: 'all 0.3s ease-in-out',
                fontWeight: 500,
              }}
            >
              成员对比
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEFF" />
                <XAxis dataKey="name" stroke="#8B88B5" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B88B5" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6C63FF"
                  strokeWidth={3}
                  dot={{ fill: '#6C63FF', strokeWidth: 2, r: 5, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#F50057' }}
                />
              </LineChart>
            ) : (
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEFF" />
                <XAxis dataKey="name" stroke="#8B88B5" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B88B5" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#6C63FF"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OkrBoard;
