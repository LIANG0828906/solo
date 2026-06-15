import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { dataQuery } from './DataQuery';
import type {
  DailyPlay,
  AudienceAge,
  HeatmapCell,
  TrackNode,
  TrackFlow
} from './DataQuery';
import { BarChartCard, SkeletonCard, injectGlobalStyles } from './BarChartCard';
import { RadarChartCard } from './RadarChartCard';
import { HeatmapCanvas } from './HeatmapCanvas';
import { FlowChart } from './FlowChart';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

interface DateRangeSliderProps {
  minDate: Date;
  maxDate: Date;
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
  onCommit: () => void;
}

function DateRangeSlider({
  minDate,
  maxDate,
  startDate,
  endDate,
  onChange,
  onCommit
}: DateRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startHandleRef = useRef<HTMLDivElement>(null);
  const endHandleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [elasticStartPx, setElasticStartPx] = useState(0);
  const [elasticEndPx, setElasticEndPx] = useState(0);
  const [visStartIdx, setVisStartIdx] = useState(0);
  const [visEndIdx, setVisEndIdx] = useState(0);

  const totalDays = useMemo(() => {
    return Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [minDate, maxDate]);

  const startIdx = useMemo(() => {
    return Math.round((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, minDate]);

  const endIdx = useMemo(() => {
    return Math.round((endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [endDate, minDate]);

  useEffect(() => {
    setVisStartIdx(startIdx);
    setVisEndIdx(endIdx);
  }, [startIdx, endIdx]);

  const commitAnimRef = useRef<{
    type: 'start' | 'end';
    phase: number;
    startTime: number;
    initialOver: number;
  } | null>(null);

  const runElasticAnimation = useCallback((type: 'start' | 'end', initialOver: number) => {
    if (initialOver === 0) return;
    commitAnimRef.current = {
      type,
      phase: 0,
      startTime: performance.now(),
      initialOver
    };

    function animate(now: number) {
      const anim = commitAnimRef.current;
      if (!anim) return;
      const t = Math.min((now - anim.startTime) / 600, 1);

      const k1 = 126;
      const m1 = 1;
      const w = Math.sqrt(k1 / m1);
      const z = 0.52;
      const decay = Math.exp(-z * w * t * 3);
      const wave = Math.cos(w * t * 3);
      const amplitude = anim.initialOver * decay * wave;

      if (anim.type === 'start') {
        setElasticStartPx(amplitude);
      } else {
        setElasticEndPx(amplitude);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        if (anim.type === 'start') setElasticStartPx(0);
        else setElasticEndPx(0);
        commitAnimRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const convertToIdx = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = rect.width > 0 ? x / rect.width : 0;
    return Math.round(ratio * totalDays);
  }, [totalDays]);

  const handleMouseDown = useCallback((which: 'start' | 'end') => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    commitAnimRef.current = null;
    setElasticStartPx(0);
    setElasticEndPx(0);
    setDragging(which);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    let lastOverStart = 0;
    let lastOverEnd = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const newIdx = convertToIdx(e.clientX);

      if (dragging === 'start') {
        let clamped = newIdx;
        let overshoot = 0;
        if (newIdx > endIdx) {
          clamped = endIdx;
          overshoot = newIdx - endIdx;
        }
        if (newIdx < 0) {
          clamped = 0;
          overshoot = newIdx;
        }
        const rect = trackRef.current.getBoundingClientRect();
        const pxPerDay = rect.width / (totalDays || 1);
        const elasticPx = Math.sign(overshoot) * Math.min(Math.abs(overshoot) * pxPerDay * 0.4, 28);
        lastOverStart = elasticPx;
        setElasticStartPx(elasticPx);
        setVisStartIdx(clamped);
        if (clamped !== startIdx) {
          const newStart = addDays(minDate, clamped);
          if (newStart <= endDate) {
            onChange(newStart, endDate);
          }
        }
      } else {
        let clamped = newIdx;
        let overshoot = 0;
        if (newIdx < startIdx) {
          clamped = startIdx;
          overshoot = startIdx - newIdx;
        }
        if (newIdx > totalDays) {
          clamped = totalDays;
          overshoot = newIdx - totalDays;
        }
        const rect = trackRef.current.getBoundingClientRect();
        const pxPerDay = rect.width / (totalDays || 1);
        const elasticPx = Math.sign(overshoot) * Math.min(Math.abs(overshoot) * pxPerDay * 0.4, 28);
        lastOverEnd = elasticPx;
        setElasticEndPx(elasticPx);
        setVisEndIdx(clamped);
        if (clamped !== endIdx) {
          const newEnd = addDays(minDate, clamped);
          if (newEnd >= startDate) {
            onChange(startDate, newEnd);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      const overS = lastOverStart;
      const overE = lastOverEnd;
      if (overS !== 0) {
        runElasticAnimation('start', overS);
      } else if (overE !== 0) {
        runElasticAnimation('end', overE);
      } else {
        onCommit();
      }
      setTimeout(() => onCommit(), 650);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, startIdx, endIdx, startDate, endDate, minDate, onChange, onCommit, convertToIdx, totalDays, runElasticAnimation]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startPct = useMemo(() => {
    const basePct = (visStartIdx / totalDays) * 100;
    if (!trackRef.current) return basePct;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetPct = rect.width > 0 ? (elasticStartPx / rect.width) * 100 : 0;
    return basePct + offsetPct;
  }, [visStartIdx, totalDays, elasticStartPx]);

  const endPct = useMemo(() => {
    const basePct = (visEndIdx / totalDays) * 100;
    if (!trackRef.current) return basePct;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetPct = rect.width > 0 ? (elasticEndPx / rect.width) * 100 : 0;
    return basePct + offsetPct;
  }, [visEndIdx, totalDays, elasticEndPx]);

  const stripedBg = useMemo(() => {
    const stripes: string[] = [];
    for (let i = 0; i <= Math.max(totalDays, 1); i++) {
      const pct = (i / Math.max(totalDays, 1)) * 100;
      const color = i % 2 === 0 ? 'rgba(42,42,94,0.7)' : 'rgba(26,26,78,0.7)';
      stripes.push(`${color} ${pct}%, ${color} ${((i + 1) / Math.max(totalDays, 1)) * 100}%`);
    }
    return `linear-gradient(90deg, ${stripes.join(', ')})`;
  }, [totalDays]);

  const handleSpring = dragging ? 'none' : 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <div style={{ width: '100%', padding: '20px 8px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#00d4ff',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatDate(startDate)}
          </span>
        </div>
        <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
          <span style={{ color: '#8888aa', fontWeight: 400, fontSize: 12, marginRight: 4 }}>范围</span>
          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(0,255,195,0.1)',
            border: '1px solid rgba(0,255,195,0.3)',
            color: '#00ffc3',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatDate(endDate)}
          </span>
        </div>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 18,
          borderRadius: 9,
          background: stripedBg,
          cursor: 'pointer',
          userSelect: 'none',
          padding: '0 2px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `calc(${startPct}% + 2px)`,
            width: `calc(${Math.max(endPct - startPct, 0.5)}% - 4px)`,
            top: 2,
            bottom: 2,
            background: 'linear-gradient(90deg, rgba(0,212,255,0.55), rgba(0,255,195,0.55))',
            borderRadius: 7,
            transition: handleSpring,
            boxShadow: dragging ? 'inset 0 0 12px rgba(0,255,195,0.35)' : 'inset 0 0 8px rgba(0,212,255,0.25)'
          }}
        />

        <div
          ref={startHandleRef}
          onMouseDown={() => handleMouseDown('start')}
          style={{
            position: 'absolute',
            left: `calc(${startPct}% - 11px)`,
            top: -2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: dragging === 'start'
              ? 'radial-gradient(circle at 35% 35%, #ffffff, #00ffc3 60%, #00d4ff)'
              : 'radial-gradient(circle at 35% 35%, #ffffff, #00ffc3 55%, #0088cc)',
            boxShadow: dragging === 'start'
              ? '0 0 18px #00ffc3, 0 0 36px rgba(0,255,195,0.55), 0 2px 6px rgba(0,0,0,0.4)'
              : '0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.35), 0 2px 4px rgba(0,0,0,0.3)',
            cursor: dragging === 'start' ? 'grabbing' : 'grab',
            zIndex: dragging === 'start' ? 15 : 12,
            transform: dragging === 'start' ? 'scale(1.18)' : (elasticStartPx !== 0 ? `scale(${1 + Math.abs(elasticStartPx) * 0.006})` : 'scale(1)'),
            transition: dragging === 'start' || elasticStartPx !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />

        <div
          ref={endHandleRef}
          onMouseDown={() => handleMouseDown('end')}
          style={{
            position: 'absolute',
            left: `calc(${endPct}% - 11px)`,
            top: -2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: dragging === 'end'
              ? 'radial-gradient(circle at 65% 35%, #ffffff, #00ffc3 60%, #006688)'
              : 'radial-gradient(circle at 65% 35%, #ffffff, #00d4ff 55%, #006688)',
            boxShadow: dragging === 'end'
              ? '0 0 18px #00d4ff, 0 0 36px rgba(0,212,255,0.55), 0 2px 6px rgba(0,0,0,0.4)'
              : '0 0 12px #00ffc3, 0 0 24px rgba(0,255,195,0.35), 0 2px 4px rgba(0,0,0,0.3)',
            cursor: dragging === 'end' ? 'grabbing' : 'grab',
            zIndex: dragging === 'end' ? 15 : 11,
            transform: dragging === 'end' ? 'scale(1.18)' : (elasticEndPx !== 0 ? `scale(${1 + Math.abs(elasticEndPx) * 0.006})` : 'scale(1)'),
            transition: dragging === 'end' || elasticEndPx !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </div>
    </div>
  );
}

interface MobileDatePickerProps {
  minDate: Date;
  maxDate: Date;
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

function MobileDatePicker({ minDate, maxDate, startDate, endDate, onChange }: MobileDatePickerProps) {
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let d = new Date(minDate); d <= maxDate; d = addDays(d, 1)) {
      result.push(new Date(d));
    }
    return result;
  }, [minDate, maxDate]);

  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 8px' }}>
      <div style={{ flex: 1 }}>
        <label style={{ color: '#8888aa', fontSize: 12, display: 'block', marginBottom: 6 }}>开始日期</label>
        <select
          value={formatDate(startDate)}
          onChange={(e) => {
            const newStart = new Date(e.target.value);
            if (newStart <= endDate) onChange(newStart, endDate);
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#1a1a2e',
            border: '1px solid #2a2a4e',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none'
          }}
        >
          {dates.map((d) => (
            <option key={formatDate(d)} value={formatDate(d)}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ color: '#8888aa', fontSize: 12, display: 'block', marginBottom: 6 }}>结束日期</label>
        <select
          value={formatDate(endDate)}
          onChange={(e) => {
            const newEnd = new Date(e.target.value);
            if (newEnd >= startDate) onChange(startDate, newEnd);
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#1a1a2e',
            border: '1px solid #2a2a4e',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none'
          }}
        >
          {dates.map((d) => (
            <option key={formatDate(d)} value={formatDate(d)}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const minDate = useMemo(() => addDays(today, -29), [today]);
  const defaultStart = useMemo(() => addDays(today, -6), [today]);

  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(today);
  const [animationKey, setAnimationKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const [dailyPlays, setDailyPlays] = useState<DailyPlay[]>([]);
  const [audienceAge, setAudienceAge] = useState<AudienceAge>({
    '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, unknown: 0
  });
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const [flowNodes, setFlowNodes] = useState<TrackNode[]>([]);
  const [flowLinks, setFlowLinks] = useState<TrackFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchAllData = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const [stats, heatmap, flow] = await Promise.all([
        dataQuery.getStats(formatDate(start), formatDate(end)),
        dataQuery.getHeatmap(formatDate(start), formatDate(end)),
        dataQuery.getFlow()
      ]);
      setDailyPlays(stats.dailyPlays);
      setAudienceAge(stats.audienceAge);
      setHeatmapCells(heatmap.cells);
      setFlowNodes(flow.nodes);
      setFlowLinks(flow.flows);
    } catch (err) {
      console.error('数据获取失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(startDate, endDate);
  }, []);

  const handleDateChange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleDateCommit = useCallback(() => {
    setAnimationKey(k => k + 1);
    fetchAllData(startDate, endDate);
  }, [startDate, endDate, fetchAllData]);

  const handleMobileDateChange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setAnimationKey(k => k + 1);
    fetchAllData(start, end);
  }, [fetchAllData]);

  const totalPlays = useMemo(() => dailyPlays.reduce((s, d) => s + d.plays, 0), [dailyPlays]);
  const peakDay = useMemo(() => dailyPlays.length > 0 ? dailyPlays.reduce((a, b) => a.plays > b.plays ? a : b) : null, [dailyPlays]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f23',
        padding: 0,
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#fff',
        overflowX: 'hidden'
      }}
    >
      {injectGlobalStyles()}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px 32px' }}>
        <header style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 4,
            flexWrap: 'wrap'
          }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffc3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(0,212,255,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                flexShrink: 0
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f0f23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15 }}>
                SoundWave <span style={{
                  background: 'linear-gradient(135deg, #00d4ff, #00ffc3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>Analytics</span>
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#8888aa', lineHeight: 1.5 }}>
                音乐人作品数据分析仪表盘 · 多维度洞察您的听众数据
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 10,
                background: loading ? 'rgba(245,158,11,0.08)' : 'rgba(0,255,195,0.08)',
                border: `1px solid ${loading ? 'rgba(245,158,11,0.3)' : 'rgba(0,255,195,0.3)'}`,
                minHeight: 36
              }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: loading ? '#f59e0b' : '#00ffc3',
                    boxShadow: loading ? '0 0 10px #f59e0b' : '0 0 10px #00ffc3',
                    animation: 'pulse 2s ease infinite',
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: 12.5, color: loading ? '#fbbf24' : '#5eead4', fontWeight: 600 }}>
                  {loading ? '数据同步中…' : '数据已就绪'}
                </span>
              </div>
              {!loading && totalPlays > 0 && (
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  fontSize: 12.5,
                  color: '#67e8f9',
                  fontWeight: 600,
                  minHeight: 36,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  总播放 <span style={{ color: '#fff', marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>{totalPlays.toLocaleString()}</span>
                </div>
              )}
              {peakDay && (
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  fontSize: 12.5,
                  color: '#c4b5fd',
                  fontWeight: 600,
                  minHeight: 36,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  峰值 <span style={{ color: '#fff', marginLeft: 6 }}>{peakDay.date.slice(5)}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)',
            borderRadius: 14,
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            marginBottom: 22,
            border: '1px solid #2a2a4e',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'rgba(0,212,255,0.12)',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>时间范围筛选</span>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#666688' }}>
                拖动滑块选择分析时间段 · 可选最近 30 天数据
              </p>
            </div>
          </div>
          {isMobile ? (
            <MobileDatePicker
              minDate={minDate}
              maxDate={today}
              startDate={startDate}
              endDate={endDate}
              onChange={handleMobileDateChange}
            />
          ) : (
            <DateRangeSlider
              minDate={minDate}
              maxDate={today}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              onCommit={handleDateCommit}
            />
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 22
          }}
        >
          <div
            style={{
              gridColumn: isMobile ? '1fr' : 'span 2',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 360
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#00d4ff',
                    boxShadow: '0 0 10px #00d4ff'
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#fff' }}>每日播放量趋势</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#666688' }}>
                    柱状图展示每日播放数据 · 点击柱子查看 Top 作品
                  </p>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, minHeight: 300 }}>
              {loading ? <SkeletonCard /> : <BarChartCard data={dailyPlays} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: '1fr',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 360
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#00ffc3',
                  boxShadow: '0 0 10px #00ffc3'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#fff' }}>受众年龄画像</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#666688' }}>
                  五维度雷达图展示听众分布
                </p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, minHeight: 300 }}>
              {loading ? <SkeletonCard /> : <RadarChartCard data={audienceAge} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: isMobile ? '1fr' : 'span 2',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 360
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#00d4ff',
                  boxShadow: '0 0 10px #00d4ff'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#fff' }}>全球地域播放热力图</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#666688' }}>
                  20×15 网格展示各区域播放热度 · 悬停查看详情
                </p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, minHeight: 300 }}>
              {loading ? <SkeletonCard /> : <HeatmapCanvas cells={heatmapCells} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: '1fr',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 360
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#00ffc3',
                  boxShadow: '0 0 10px #00ffc3'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#fff' }}>作品跳转流向</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#666688' }}>
                  力导向图 · 拖拽节点查看流动关系
                </p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, minHeight: 300 }}>
              {loading ? <SkeletonCard /> : <FlowChart nodes={flowNodes} links={flowLinks} animKey={animationKey} />}
            </div>
          </div>
        </div>

        <footer style={{
          marginTop: 36,
          padding: '22px 0 4px',
          borderTop: '1px solid #202040',
          textAlign: 'center',
          color: '#555577',
          fontSize: 12
        }}>
          <p style={{ margin: 0 }}>
            SoundWave Analytics © 2026 · 为独立音乐人打造的数据分析平台
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#444466' }}>
            模拟数据源 · 共生成约 2,000 条播放记录
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        select option {
          background: #1a1a2e;
          color: #fff;
          padding: 4px;
        }
        select:focus {
          border-color: #00d4ff !important;
          box-shadow: 0 0 0 2px rgba(0,212,255,0.15);
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;
