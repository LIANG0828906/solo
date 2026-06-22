import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { DailyPlay } from './DataQuery';

function getBarColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.33) return '#60a5fa';
  if (ratio < 0.66) return '#6366f1';
  return '#7c3aed';
}

interface BarModalProps {
  data: DailyPlay | null;
  onClose: () => void;
}

function BarModal({ data, onClose }: BarModalProps) {
  if (!data) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,212,255,0.2)',
          border: '1px solid #2a2a4e'
        }}
      >
        <h3 style={{ color: '#00d4ff', margin: 0, marginBottom: 16, fontSize: 18 }}>
          {data.date} Top 3 作品
        </h3>
        <div style={{ color: '#fff', marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
          当日总播放量: <span style={{ color: '#00ffc3', fontWeight: 600 }}>{data.plays.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.topTracks.map((track, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#252545',
                borderRadius: '8px'
              }}
            >
              <span style={{ color: '#fff', fontSize: 14 }}>
                <span style={{ color: '#00ffc3', marginRight: 8, fontWeight: 600 }}>#{idx + 1}</span>
                {track.name}
              </span>
              <span style={{ color: '#00d4ff', fontSize: 14, fontWeight: 500 }}>
                {track.plays.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg, #00d4ff, #00ffc3)',
            border: 'none',
            borderRadius: '8px',
            color: '#0f0f23',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 8,
        background: 'linear-gradient(90deg, #2a2a4e 25%, #3a3a6e 50%, #2a2a4e 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s ease-in-out infinite',
        minHeight: 280
      }}
    />
  );
}

export function injectGlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes barRise {
        0% { transform: scaleY(0); opacity: 0; }
        60% { transform: scaleY(1.05); opacity: 1; }
        100% { transform: scaleY(1); opacity: 1; }
      }
      @keyframes radarPulse {
        0%, 100% { box-shadow: 0 0 8px #00d4ff; }
        50% { box-shadow: 0 0 16px #00ffc3, 0 0 32px rgba(0,255,195,0.4); }
      }
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes glowPulse {
        0%, 100% { filter: drop-shadow(0 0 4px #00ffc3); }
        50% { filter: drop-shadow(0 0 12px #00ffc3) drop-shadow(0 0 20px rgba(0,255,195,0.5)); }
      }
      @keyframes elasticBounce {
        0% { transform: translateX(0); }
        30% { transform: translateX(-8px); }
        60% { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }
      .recharts-bar-rectangle {
        transition: transform 0.2s ease !important;
        transform-origin: bottom;
      }
      .recharts-bar-rectangle:hover {
        transform: scaleY(1.1) scaleX(1.05) !important;
        filter: brightness(1.2) drop-shadow(0 0 8px currentColor);
      }
    `}</style>
  );
}

interface BarChartCardProps {
  data: DailyPlay[];
  animKey: number;
}

export function BarChartCard({ data, animKey }: BarChartCardProps) {
  const [modalData, setModalData] = useState<DailyPlay | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxPlays = useMemo(() => Math.max(...data.map(d => d.plays), 1), [data]);

  const chartData = data.map(d => ({
    ...d,
    shortDate: d.date.slice(5)
  }));

  return (
    <div
      key={animKey}
      style={{ width: '100%', height: '100%', animation: 'fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <XAxis
            dataKey="shortDate"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
            tickLine={{ stroke: '#2a2a4e' }}
          />
          <YAxis
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a4e' }}
            tickLine={{ stroke: '#2a2a4e' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,212,255,0.06)' }}
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4e',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
              boxShadow: '0 4px 16px rgba(0,212,255,0.15)'
            }}
            formatter={(value: number) => [
              <span style={{ color: '#00ffc3', fontWeight: 600 }}>{value.toLocaleString()}</span>,
              <span style={{ color: '#8888aa' }}>播放量</span>
            ]}
          />
          <Bar
            dataKey="plays"
            onClick={(entry) => setModalData(entry as DailyPlay)}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            cursor="pointer"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={getBarColor(entry.plays, maxPlays)}
                style={{
                  transformOrigin: 'bottom',
                  animation: `barRise 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 30}ms both`,
                  transition: 'filter 0.2s ease',
                  filter: hoveredIndex === index
                    ? `drop-shadow(0 0 10px ${getBarColor(entry.plays, maxPlays)}) brightness(1.2)`
                    : 'none'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <BarModal data={modalData} onClose={() => setModalData(null)} />
    </div>
  );
}
