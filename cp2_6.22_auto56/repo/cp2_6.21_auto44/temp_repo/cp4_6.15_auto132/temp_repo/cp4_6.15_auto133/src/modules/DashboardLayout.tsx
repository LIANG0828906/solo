import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { dataQuery } from './DataQuery';
import type {
  DailyPlay,
  AudienceAge,
  HeatmapCell,
  TrackNode,
  TrackFlow
} from './DataQuery';
import {
  DailyBarChart,
  AudienceRadarChart,
  FlowChart,
  HeatmapChart,
  SkeletonCard,
  injectChartStyles
} from './ChartRenderer';

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
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [elasticStart, setElasticStart] = useState<number | null>(null);
  const [elasticEnd, setElasticEnd] = useState<number | null>(null);

  const totalDays = useMemo(() => {
    return Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [minDate, maxDate]);

  const startIdx = useMemo(() => {
    return Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, minDate]);

  const endIdx = useMemo(() => {
    return Math.ceil((endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [endDate, minDate]);

  const handleMouseDown = useCallback((which: 'start' | 'end') => {
    setDragging(which);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    let newIdx = Math.round(ratio * totalDays);

    if (dragging === 'start') {
      if (newIdx > endIdx) {
        setElasticStart((newIdx - endIdx) * 0.5);
        newIdx = endIdx;
      } else {
        setElasticStart(0);
      }
      const newStart = addDays(minDate, newIdx);
      onChange(newStart, endDate);
    } else {
      if (newIdx < startIdx) {
        setElasticEnd((startIdx - newIdx) * 0.5);
        newIdx = startIdx;
      } else {
        setElasticEnd(0);
      }
      const newEnd = addDays(minDate, newIdx);
      onChange(startDate, newEnd);
    }
  }, [dragging, minDate, totalDays, startIdx, endIdx, startDate, endDate, onChange]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(null);
      setElasticStart(null);
      setElasticEnd(null);
      onCommit();
    }
  }, [dragging, onCommit]);

  useEffect(() => {
    if (dragging) {
      const move = (e: MouseEvent) => handleMouseMove(e);
      const up = () => handleMouseUp();
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const startPct = (startIdx / totalDays) * 100 + (elasticStart || 0) * 0.3;
  const endPct = (endIdx / totalDays) * 100 - (elasticEnd || 0) * 0.3;

  const stripedBg = useMemo(() => {
    const stripes: string[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const pct = (i / totalDays) * 100;
      const color = i % 2 === 0 ? '#2a2a5e' : '#1a1a4e';
      stripes.push(`${color} ${pct}%, ${color} ${((i + 1) / totalDays) * 100}%`);
    }
    return `linear-gradient(90deg, ${stripes.join(', ')})`;
  }, [totalDays]);

  return (
    <div style={{ width: '100%', padding: '20px 8px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: '#8888aa' }}>{formatDate(startDate)}</span>
        <span style={{ color: '#00d4ff', fontWeight: 600 }}>
          日期范围: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
        </span>
        <span style={{ color: '#8888aa' }}>{formatDate(endDate)}</span>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 12,
          borderRadius: 6,
          background: stripedBg,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${startPct}%`,
            width: `${endPct - startPct}%`,
            top: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(0,212,255,0.5), rgba(0,255,195,0.5))',
            borderRadius: 4,
            transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
        <div
          onMouseDown={() => handleMouseDown('start')}
          style={{
            position: 'absolute',
            left: `calc(${startPct}% - 10px)`,
            top: -5,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00ffc3, #00d4ff)',
            boxShadow: `0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.4)`,
            cursor: dragging === 'start' ? 'grabbing' : 'grab',
            zIndex: 2,
            transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
        <div
          onMouseDown={() => handleMouseDown('end')}
          style={{
            position: 'absolute',
            left: `calc(${endPct}% - 10px)`,
            top: -5,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00ffc3, #00d4ff)',
            boxShadow: `0 0 12px #00ffc3, 0 0 24px rgba(0,255,195,0.4)`,
            cursor: dragging === 'end' ? 'grabbing' : 'grab',
            zIndex: 2,
            transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
            padding: '8px 12px',
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
            padding: '8px 12px',
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

  const cardTitles = [
    { title: '每日播放量', desc: '柱状图展示播放趋势' },
    { title: '受众画像', desc: '年龄分布雷达图' },
    { title: '作品跳转流向', desc: '听众在作品间流动' },
    { title: '地域播放热力', desc: '全球播放分布' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f23',
        padding: 0,
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#fff'
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00d4ff, #00ffc3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,212,255,0.3)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f0f23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
                SoundWave <span style={{ color: '#00d4ff' }}>Analytics</span>
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#8888aa' }}>
                音乐人作品数据分析仪表盘
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: loading ? '#f59e0b' : '#00ffc3',
                  boxShadow: loading ? '0 0 8px #f59e0b' : '0 0 8px #00ffc3',
                  animation: 'pulse 2s ease infinite'
                }}
              />
              <span style={{ fontSize: 12, color: '#8888aa' }}>
                {loading ? '数据加载中...' : '数据已同步'}
              </span>
            </div>
          </div>
        </header>

        <div
          style={{
            background: '#1a1a2e',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            marginBottom: 24,
            border: '1px solid #2a2a4e'
          }}
        >
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>日期范围筛选</span>
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
            gap: 20
          }}
        >
          <div
            style={{
              gridColumn: isMobile ? '1fr' : 'span 2',
              background: '#1a1a2e',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 340
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00d4ff', boxShadow: '0 0 6px #00d4ff'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>每日播放量</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666688' }}>柱状图展示播放趋势</p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, minHeight: 280 }}>
              {loading ? <SkeletonCard /> : <DailyBarChart data={dailyPlays} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: '1fr',
              background: '#1a1a2e',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 340
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00ffc3', boxShadow: '0 0 6px #00ffc3'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>受众画像</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666688' }}>年龄分布雷达图</p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, minHeight: 280 }}>
              {loading ? <SkeletonCard /> : <AudienceRadarChart data={audienceAge} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: isMobile ? '1fr' : 'span 2',
              background: '#1a1a2e',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 340
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00d4ff', boxShadow: '0 0 6px #00d4ff'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>地域播放热力</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666688' }}>全球播放分布</p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, minHeight: 280 }}>
              {loading ? <SkeletonCard /> : <HeatmapChart cells={heatmapCells} animKey={animationKey} />}
            </div>
          </div>

          <div
            style={{
              gridColumn: '1fr',
              background: '#1a1a2e',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid #2a2a4e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 340
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00ffc3', boxShadow: '0 0 6px #00ffc3'
                }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>作品跳转流向</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666688' }}>听众在作品间流动</p>
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, minHeight: 280 }}>
              {loading ? <SkeletonCard /> : <FlowChart nodes={flowNodes} links={flowLinks} animKey={animationKey} />}
            </div>
          </div>
        </div>

        <footer style={{ marginTop: 32, textAlign: 'center', color: '#444466', fontSize: 12 }}>
          <p>SoundWave Analytics © 2026 — 独立音乐人专属数据分析平台</p>
        </footer>
      </div>

      {injectChartStyles()}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        select option {
          background: #1a1a2e;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
