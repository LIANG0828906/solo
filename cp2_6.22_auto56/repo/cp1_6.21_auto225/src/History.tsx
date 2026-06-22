import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { plansApi, recordsApi } from './api';
import type { TrainingPlan, TrainingRecord } from './types';

interface DayDetail {
  date: string;
  records: TrainingRecord[];
  plans: TrainingPlan[];
}

export default function History() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [allRecords, setAllRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlanId, setFilterPlanId] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [detailView, setDetailView] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [p, r] = await Promise.all([plansApi.list(), recordsApi.list()]);
      setPlans(p);
      setAllRecords(r);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (filterPlanId === 'all') return allRecords;
    return allRecords.filter((r) => r.planId === filterPlanId);
  }, [allRecords, filterPlanId]);

  /* ---------- 30天折线图数据 ---------- */
  const chartData = useMemo(() => {
    const days: { date: string; display: string; volume: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const display = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayRecs = filteredRecords.filter((r) => r.date === dateStr);
      const volume = dayRecs.reduce((sum, r) => {
        return (
          sum +
          r.exerciseRecords.reduce((es, er) => {
            return (
              es +
              er.sets.reduce((ss, s) => ss + (s.weight > 0 && s.reps > 0 ? s.weight * s.reps : 0), 0)
            );
          }, 0)
        );
      }, 0);
      days.push({ date: dateStr, display, volume });
    }
    return days;
  }, [filteredRecords]);

  const maxVolume = Math.max(...chartData.map((d) => d.volume), 1);

  /* ---------- 日历数据 ---------- */
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const days: { date: string; day: number; inMonth: boolean; isToday: boolean }[] = [];

    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLast - i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: prevMonthLast - i,
        inMonth: false,
        isToday: false,
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const ds = d.toISOString().split('T')[0];
      days.push({ date: ds, day: i, inMonth: true, isToday: ds === todayStr });
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1];
      const d = new Date(last.date);
      d.setDate(d.getDate() + 1);
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        inMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentMonth]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, TrainingRecord[]>();
    for (const r of filteredRecords) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return map;
  }, [filteredRecords]);

  const handleDayClick = (date: string) => {
    const recs = recordsByDate.get(date) || [];
    const recPlans = recs
      .map((r) => plans.find((p) => p.id === r.planId))
      .filter((p): p is TrainingPlan => !!p);
    setSelectedDay({ date, records: recs, plans: recPlans });
    setDetailView(false);
  };

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '80px', color: '#94A3B8' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* ---------- 折线图区域 ---------- */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: '16px',
          padding: '20px',
        }}
        className="fade-in"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>📈 容量趋势</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              过去30天训练容量（重量×次数）变化
            </p>
          </div>
          <select
            value={filterPlanId}
            onChange={(e) => setFilterPlanId(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#334155',
              border: '1px solid transparent',
              borderRadius: '8px',
              color: '#F1F5F9',
              fontSize: '13px',
              minWidth: '160px',
            }}
          >
            <option value="all">全部计划</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="display"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                domain={[0, 'auto']}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                formatter={(value: number) => [`${value.toLocaleString()} kg`, '总容量']}
                labelFormatter={(label, payload) => {
                  const orig = payload?.[0]?.payload?.date;
                  return orig ? `📅 ${orig}` : label;
                }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ fill: '#6366F1', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#8B5CF6', r: 6, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------- 日历区域 ---------- */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: '16px',
          padding: '20px',
        }}
        className="fade-in"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>📅 训练日历</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={goPrevMonth}
              style={{
                width: '32px',
                height: '32px',
                background: '#334155',
                color: '#CBD5E1',
                borderRadius: '8px',
                fontSize: '14px',
                padding: 0,
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#F1F5F9', minWidth: '120px', textAlign: 'center' }}>
              {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
            </span>
            <button
              onClick={goNextMonth}
              style={{
                width: '32px',
                height: '32px',
                background: '#334155',
                color: '#CBD5E1',
                borderRadius: '8px',
                fontSize: '14px',
                padding: 0,
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <div
              key={w}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#64748B',
                fontWeight: 500,
              }}
            >
              {w}
            </div>
          ))}
          {calendarDays.map((d) => {
            const hasRec = recordsByDate.has(d.date);
            return (
              <button
                key={d.date + d.inMonth}
                onClick={() => hasRec && handleDayClick(d.date)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: hasRec
                    ? selectedDay?.date === d.date
                      ? '#6366F1'
                      : d.isToday
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'transparent'
                    : 'transparent',
                  color: d.inMonth ? (hasRec && selectedDay?.date === d.date ? '#fff' : hasRec ? '#E2E8F0' : d.isToday ? '#6366F1' : '#CBD5E1') : '#475569',
                  fontSize: '13px',
                  fontWeight: d.isToday ? 600 : 400,
                  position: 'relative',
                  cursor: hasRec ? 'pointer' : 'default',
                  transition: 'background 0.2s ease',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  if (hasRec && !e.currentTarget.style.background.includes('6366F1')) {
                    e.currentTarget.style.background = '#334155';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasRec && selectedDay?.date !== d.date && !d.isToday) {
                    e.currentTarget.style.background = 'transparent';
                  } else if (d.isToday && selectedDay?.date !== d.date) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                  }
                }}
              >
                {d.day}
                {hasRec && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: selectedDay?.date === d.date ? '#fff' : '#10B981',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- 选中日期的摘要 / 详情 ---------- */}
      {selectedDay && !detailView && (
        <div style={{ background: '#1E293B', borderRadius: '16px', padding: '20px' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F1F5F9' }}>
                📅 {selectedDay.date}
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                {selectedDay.records.length} 次训练
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                width: '28px',
                height: '28px',
                background: '#334155',
                color: '#94A3B8',
                borderRadius: '6px',
                fontSize: '12px',
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedDay.records.map((rec, i) => {
              const plan = selectedDay.plans[i];
              const totalSets = rec.exerciseRecords.reduce((s, er) => s + er.sets.length, 0);
              const volume = rec.exerciseRecords.reduce(
                (s, er) =>
                  s + er.sets.reduce((ss, set) => ss + (set.weight > 0 && set.reps > 0 ? set.weight * set.reps : 0), 0),
                0
              );
              return (
                <button
                  key={rec.id}
                  onClick={() => setDetailView(true)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#0F172A',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    color: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>
                      {plan?.name || '未知计划'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                      {rec.exerciseRecords.length} 个动作
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>总组数</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1' }}>{totalSets}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>容量</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>
                        {volume.toLocaleString()} kg
                      </div>
                    </div>
                    <span style={{ color: '#64748B', fontSize: '18px' }}>›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- 详细记录视图 ---------- */}
      {selectedDay && detailView && (
        <div style={{ background: '#1E293B', borderRadius: '16px', padding: '20px' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setDetailView(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#334155',
                  color: '#CBD5E1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  padding: 0,
                }}
              >
                ‹
              </button>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F1F5F9' }}>详细记录</h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>📅 {selectedDay.date}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setDetailView(false);
                setSelectedDay(null);
              }}
              style={{
                width: '28px',
                height: '28px',
                background: '#334155',
                color: '#94A3B8',
                borderRadius: '6px',
                fontSize: '12px',
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedDay.records.map((rec, ri) => {
              const plan = selectedDay.plans[ri];
              return (
                <div key={rec.id} style={{ background: '#0F172A', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#F1F5F9', marginBottom: '12px' }}>
                    {plan?.name || '未知计划'}
                  </h4>
                  {rec.exerciseRecords.map((er) => (
                    <div key={er.exerciseId} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#CBD5E1', marginBottom: '8px' }}>
                        ▸ {er.exerciseName}
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr) 1.5fr',
                          gap: '6px',
                          padding: '6px 10px',
                          background: '#1E293B',
                          borderRadius: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>组</span>
                        <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>重量</span>
                        <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>次数</span>
                        <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>RPE</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>备注</span>
                      </div>
                      {er.sets.map((s) => (
                        <div
                          key={s.setNumber}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr) 1.5fr',
                            gap: '6px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            color: '#CBD5E1',
                            borderBottom: '1px solid #1E293B',
                          }}
                        >
                          <span style={{ textAlign: 'center', fontWeight: 600, color: '#F1F5F9' }}>
                            {s.setNumber}
                          </span>
                          <span style={{ textAlign: 'center' }}>{s.weight} kg</span>
                          <span style={{ textAlign: 'center' }}>{s.reps}</span>
                          <span style={{ textAlign: 'center', color: '#F59E0B' }}>{s.rpe}</span>
                          <span style={{ color: '#94A3B8' }}>{s.note || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
