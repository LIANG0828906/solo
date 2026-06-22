import React, { useEffect, useState, useRef, useCallback } from 'react';
import { computeFunnel, FunnelResult } from './funnelPipeline';
import { HeatmapRenderer } from './heatmapRenderer';

interface Activity {
  id: string;
  name: string;
  steps: { name: string; order: number }[];
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: number;
  activityId: string;
  stepName: string;
  userId: string;
  userType: string;
}

const MAX_LOG_ENTRIES = 500;

function interpolateColor(t: number): string {
  const r = Math.round(16 + (239 - 16) * t);
  const g = Math.round(185 + (68 - 185) * t);
  const b = Math.round(129 + (68 - 129) * t);
  return `rgb(${r},${g},${b})`;
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const animRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased * 100) / 100);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
        setDisplay(end);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  if (Number.isInteger(value)) return <>{Math.round(display)}</>;
  return <>{display.toFixed(1)}</>;
}

function KpiCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div style={{
      width: 240, background: '#1E293B', borderRadius: 12, padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'box-shadow 0.4s ease-out',
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 28, color: '#F8FAFC', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        <AnimatedNumber value={value} duration={800} />
        {suffix && <span style={{ fontSize: 14, color: '#94A3B8', marginLeft: 4 }}>{suffix}</span>}
      </span>
    </div>
  );
}

function FunnelChart({ data }: { data: FunnelResult | null }) {
  if (!data || data.steps.length === 0) {
    return <div style={{ color: '#94A3B8', padding: 40, textAlign: 'center' }}>暂无漏斗数据</div>;
  }

  const maxCount = Math.max(...data.steps.map((s) => s.userCount), 1);
  const barMaxWidth = 320;
  const barHeight = 44;

  return (
    <svg width="100%" height={data.steps.length * 90 + 40} style={{ overflow: 'visible' }}>
      {data.steps.map((step, i) => {
        const width = Math.max((step.userCount / maxCount) * barMaxWidth, 20);
        const y = i * 90 + 20;
        const colorT = i / Math.max(data.steps.length - 1, 1);
        const fillColor = interpolateColor(colorT);
        const leftPad = (barMaxWidth - width) / 2 + 20;

        return (
          <g key={step.stepName}>
            <rect
              x={leftPad} y={y} width={width} height={barHeight}
              rx={8} fill={fillColor}
              style={{ transition: 'width 0.5s ease, fill 0.5s ease' }}
            />
            <text x={leftPad + width / 2} y={y + barHeight / 2}
              textAnchor="middle" dominantBaseline="central"
              fill="#F8FAFC" fontSize={14} fontWeight={600}>
              {step.stepName} ({step.userCount})
            </text>
            <text x={leftPad + width + 16} y={y + barHeight / 2}
              dominantBaseline="central" fill="#94A3B8" fontSize={12}>
              {i === 0 ? '100%' : `${step.conversionRate.toFixed(1)}%`}
            </text>
            <text x={leftPad + width + 16} y={y + barHeight / 2 + 16}
              dominantBaseline="central" fill="#64748B" fontSize={11}>
              停留 {step.avgDwellTime}s
            </text>
            {i < data.steps.length - 1 && (
              <g>
                <line x1={barMaxWidth / 2 + 20} y1={y + barHeight}
                  x2={barMaxWidth / 2 + 20} y2={y + barHeight + 36}
                  stroke="#475569" strokeWidth={1.5} strokeDasharray="4,3" />
                <polygon
                  points={`${barMaxWidth / 2 + 14},${y + barHeight + 32} ${barMaxWidth / 2 + 20},${y + barHeight + 40} ${barMaxWidth / 2 + 26},${y + barHeight + 32}`}
                  fill="#475569"
                />
                <text x={barMaxWidth / 2 + 36} y={y + barHeight + 24}
                  fill="#F59E0B" fontSize={12} fontWeight={600}>
                  转化 {data.steps[i + 1].conversionRate.toFixed(1)}%
                </text>
                <text x={barMaxWidth / 2 + 36} y={y + barHeight + 40}
                  fill="#EF4444" fontSize={11}>
                  流失 {data.steps[i + 1].lossRate.toFixed(1)}%
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function EventLog({ entries }: { entries: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [entries]);

  return (
    <div ref={containerRef} style={{
      height: 200, overflowY: 'auto', padding: '8px 16px',
      fontSize: 12, fontFamily: 'monospace',
      scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
    }}>
      {entries.map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour12: false });
        const typeLabel: Record<string, string> = { new: '新用户', returning: '回流', 'high-value': '高价值' };
        return (
          <div key={entry.id} style={{
            padding: '4px 0', borderBottom: '1px solid #1E293B',
            color: '#94A3B8', animation: 'fadeIn 0.3s ease-out',
          }}>
            <span style={{ color: '#64748B', marginRight: 12 }}>{time}</span>
            <span style={{ color: '#3B82F6', marginRight: 8 }}>{entry.stepName}</span>
            <span style={{ color: '#64748B', marginRight: 8 }}>{typeLabel[entry.userType] || entry.userType}</span>
            <span style={{ color: '#475569' }}>{entry.userId.slice(0, 8)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [funnelResult, setFunnelResult] = useState<FunnelResult | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivitySteps, setNewActivitySteps] = useState('浏览,点击,加购,支付');
  const heatmapRef = useRef<HTMLDivElement>(null);
  const heatmapRendererRef = useRef<HeatmapRenderer | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities');
      const data: Activity[] = await res.json();
      setActivities(data);
      setTotalActivities(data.length);
      if (data.length > 0 && !selectedActivityId) {
        setSelectedActivityId(data[0].id);
      }
    } catch { /* ignore */ }
  }, [selectedActivityId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setTotalEvents(data.totalEvents);
    } catch { /* ignore */ }
  }, []);

  const fetchFunnelData = useCallback(async () => {
    if (!selectedActivityId) return;
    try {
      const res = await fetch(`/api/funnel?activityId=${selectedActivityId}`);
      const data = await res.json();
      const result = computeFunnel(data);
      setFunnelResult(result);
    } catch { /* ignore */ }
  }, [selectedActivityId]);

  const fetchRecentEvents = useCallback(async () => {
    if (!selectedActivityId) return;
    try {
      const res = await fetch(`/api/events?activityId=${selectedActivityId}&limit=20`);
      const data = await res.json();
      const newEntries: LogEntry[] = data.map((e: LogEntry) => ({
        id: e.id,
        timestamp: e.timestamp,
        activityId: e.activityId,
        stepName: e.stepName,
        userId: e.userId,
        userType: e.userType,
      }));
      setLogEntries(prev => {
        const merged = [...newEntries, ...prev];
        return merged.slice(0, MAX_LOG_ENTRIES);
      });
    } catch { /* ignore */ }
  }, [selectedActivityId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchFunnelData(), fetchRecentEvents()]);
  }, [fetchStats, fetchFunnelData, fetchRecentEvents]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (selectedActivityId) {
      fetchFunnelData();
      fetchRecentEvents();
      fetchStats();
    }
  }, [selectedActivityId, fetchFunnelData, fetchRecentEvents, fetchStats]);

  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(refreshAll, 5000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [autoRefresh, refreshAll]);

  useEffect(() => {
    if (heatmapRef.current && funnelResult) {
      const steps = funnelResult.steps.map((s) => s.stepName);
      const data = funnelResult.userTypeBreakdown;

      if (!heatmapRendererRef.current) {
        heatmapRendererRef.current = new HeatmapRenderer({
          container: heatmapRef.current,
          data,
          steps,
          maxDwellTime: 300,
        });
      } else {
        heatmapRendererRef.current.updateData(data, steps);
      }
    }
  }, [funnelResult]);

  useEffect(() => {
    return () => {
      heatmapRendererRef.current?.destroy();
    };
  }, []);

  const handleCreateActivity = async () => {
    const steps = newActivitySteps.split(',').map((s) => s.trim()).filter(Boolean);
    if (!newActivityName || steps.length < 3 || steps.length > 6) return;
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newActivityName, steps }),
      });
      setShowNewActivity(false);
      setNewActivityName('');
      setNewActivitySteps('浏览,点击,加购,支付');
      await fetchActivities();
    } catch { /* ignore */ }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: '#0F172A',
      color: '#F8FAFC', padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        select, input[type="date"], input[type="text"] {
          background: #334155; color: #F8FAFC; border: 1px solid #475569;
          border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none;
        }
        select:focus, input:focus { border-color: #3B82F6; }
        button { cursor: pointer; border: none; border-radius: 8px; padding: 8px 16px;
          font-size: 13px; font-weight: 500; transition: all 0.2s; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          📊 活动转化漏斗看板
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            style={{ width: 220 }}
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 140 }} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 140 }} />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? '#10B981' : '#475569', color: '#F8FAFC',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: autoRefresh ? 'spin 1s linear infinite' : 'none',
              fontSize: 16,
            }}>↻</span>
            {autoRefresh ? '自动刷新' : '已暂停'}
          </button>
          <button
            onClick={() => setShowNewActivity(!showNewActivity)}
            style={{ background: '#3B82F6', color: '#F8FAFC' }}
          >
            + 新建活动
          </button>
        </div>
      </div>

      {/* New Activity Form */}
      {showNewActivity && (
        <div style={{
          background: '#1E293B', borderRadius: 12, padding: 20,
          display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#94A3B8' }}>活动名称</label>
            <input type="text" value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              placeholder="输入活动名称" style={{ width: 200 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: '#94A3B8' }}>步骤（逗号分隔，3-6个）</label>
            <input type="text" value={newActivitySteps}
              onChange={(e) => setNewActivitySteps(e.target.value)}
              style={{ width: 280 }} />
          </div>
          <button onClick={handleCreateActivity}
            style={{ background: '#10B981', color: '#F8FAFC', padding: '8px 24px' }}>
            创建
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="总事件数" value={totalEvents} />
        <KpiCard label="总活动数" value={totalActivities} />
        <KpiCard label="整体转化率" value={funnelResult?.overallConversionRate || 0} suffix="%" />
        <KpiCard label="平均停留时长" value={funnelResult?.avgDwellTime || 0} suffix="s" />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row',
        height: isMobile ? 'auto' : 400,
      }}>
        {/* Funnel Chart */}
        <div style={{
          flex: isMobile ? '0 0 60%' : '0 0 60%', background: 'rgba(0,0,0,0.3)',
          borderRadius: 12, padding: 20, overflow: 'hidden',
          minHeight: isMobile ? 300 : 400,
          transition: 'box-shadow 0.4s ease-out',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#F8FAFC' }}>
            转化漏斗
          </div>
          <FunnelChart data={funnelResult} />
        </div>

        {/* Heatmap */}
        <div style={{
          flex: isMobile ? '0 0 40%' : '0 0 40%', background: 'rgba(0,0,0,0.3)',
          borderRadius: 12, padding: 20, position: 'relative',
          minHeight: isMobile ? 250 : 400,
          transition: 'box-shadow 0.4s ease-out',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#F8FAFC' }}>
            用户行为热力图
          </div>
          <div ref={heatmapRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
        </div>
      </div>

      {/* Event Log */}
      <div style={{
        background: '#1E293B', borderRadius: 12, overflow: 'hidden',
        minHeight: isMobile ? 48 : 200,
      }}>
        <div style={{
          padding: '12px 16px', fontSize: 13, fontWeight: 600,
          borderBottom: '1px solid #334155', color: '#94A3B8',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>📋 实时事件日志</span>
          <span style={{ fontSize: 11, color: '#64748B' }}>{logEntries.length} 条记录</span>
        </div>
        <EventLog entries={logEntries} />
      </div>
    </div>
  );
}
