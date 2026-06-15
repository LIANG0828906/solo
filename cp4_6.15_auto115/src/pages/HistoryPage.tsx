import React, { useState, useMemo } from 'react';
import { MoodRecord, MoodType, MOOD_META } from '../types';
import EmotionCard from '../components/EmotionCard';

interface Props {
  moods: MoodRecord[];
}

function getMoodColor(mood: MoodType, intensity: number): string {
  const alpha = 0.3 + intensity * 0.7;
  const colors: Record<MoodType, string> = {
    [MoodType.HAPPY]: `rgba(255, 183, 77, ${alpha})`,
    [MoodType.CALM]: `rgba(129, 199, 132, ${alpha})`,
    [MoodType.SAD]: `rgba(100, 181, 246, ${alpha})`,
    [MoodType.ANGRY]: `rgba(239, 83, 80, ${alpha})`,
    [MoodType.ANXIOUS]: `rgba(255, 167, 38, ${alpha})`,
    [MoodType.TIRED]: `rgba(144, 164, 174, ${alpha})`,
  };
  return colors[mood];
}

function getMoodScore(mood: MoodType): number {
  const scores: Record<MoodType, number> = {
    [MoodType.HAPPY]: 0.9,
    [MoodType.CALM]: 0.7,
    [MoodType.SAD]: 0.3,
    [MoodType.ANGRY]: 0.15,
    [MoodType.ANXIOUS]: 0.4,
    [MoodType.TIRED]: 0.35,
  };
  return scores[mood];
}

export default function HistoryPage({ moods }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const result: { date: string; record?: MoodRecord }[] = [];
    const today = new Date('2026-06-15');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = moods.find((m) => m.date === dateStr);
      result.push({ date: dateStr, record });
    }
    return result;
  }, [moods]);

  const selectedRecord = useMemo(() => {
    if (!selectedDate) return null;
    return moods.find((m) => m.date === selectedDate) || null;
  }, [selectedDate, moods]);

  const chartData = useMemo(() => {
    return moods
      .filter((m) => m.date >= days[0]?.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [moods, days]);

  const chartWidth = Math.max(chartData.length * 50, 600);
  const chartHeight = 200;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((m, i) => {
      const x = chartPadding.left + (i / Math.max(chartData.length - 1, 1)) * (chartWidth - chartPadding.left - chartPadding.right);
      const score = getMoodScore(m.mood) * m.intensity + (1 - m.intensity) * 0.5;
      const y = chartPadding.top + (1 - score) * (chartHeight - chartPadding.top - chartPadding.bottom);
      return { x, y, record: m, score };
    });
  }, [chartData, chartWidth]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`
    : '';

  return (
    <div className="history-page">
      <h2 className="page-title">心情轨迹</h2>

      <div className="heatmap-section">
        <h3 className="section-title">日历热力图</h3>
        <div className="heatmap-scroll">
          <div className="heatmap-grid">
            {days.map((day) => {
              const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(day.date).getDay()];
              const dayNum = day.date.slice(8);
              const color = day.record ? getMoodColor(day.record.mood, day.record.intensity) : 'rgba(200,200,200,0.2)';
              return (
                <div
                  key={day.date}
                  className={`heatmap-cell ${selectedDate === day.date ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="cell-day">{dayNum}</span>
                  <span className="cell-weekday">{weekday}</span>
                  {day.record && <span className="cell-emoji">{MOOD_META[day.record.mood].emoji}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3 className="section-title">情绪曲线</h3>
        <div className="chart-scroll">
          <svg width={chartWidth} height={chartHeight} className="emotion-chart">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 167, 38, 0.4)" />
                <stop offset="100%" stopColor="rgba(66, 165, 245, 0.05)" />
              </linearGradient>
              <filter id="frostedGlass">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>
            <line x1={chartPadding.left} y1={chartPadding.top} x2={chartPadding.left} y2={chartHeight - chartPadding.bottom} stroke="rgba(255,255,255,0.2)" />
            <line x1={chartPadding.left} y1={chartHeight - chartPadding.bottom} x2={chartWidth - chartPadding.right} y2={chartHeight - chartPadding.bottom} stroke="rgba(255,255,255,0.2)" />
            {['低', '中', '高'].map((label, i) => {
              const y = chartPadding.top + (1 - (i + 1) / 4) * (chartHeight - chartPadding.top - chartPadding.bottom);
              return (
                <text key={label} x={chartPadding.left - 8} y={y + 4} fill="rgba(255,255,255,0.5)" textAnchor="end" fontSize="11">{label}</text>
              );
            })}
            {areaPath && <path d={areaPath} fill="url(#areaGradient)" filter="url(#frostedGlass)" />}
            {linePath && <path d={linePath} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            {points.map((p, i) => {
              const color = MOOD_META[p.record.mood].color;
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="white" strokeWidth="2" className="chart-dot" />
                  <text x={p.x} y={chartHeight - chartPadding.bottom + 18} fill="rgba(255,255,255,0.5)" textAnchor="middle" fontSize="9">
                    {p.record.date.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedDate && (
        <div className="detail-overlay" onClick={() => setSelectedDate(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            {selectedRecord ? (
              <EmotionCard record={selectedRecord} />
            ) : (
              <div className="no-record-card">
                <span className="no-record-emoji">🍃</span>
                <p>这一天没有记录</p>
              </div>
            )}
            <button className="close-detail" onClick={() => setSelectedDate(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
