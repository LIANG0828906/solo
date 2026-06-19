import React, { useRef, useEffect, useState } from 'react';
import type { Submission } from '../types';
import { drawLineChart, type ChartDataPoint } from '../utils/chart';

interface 班级统计面板Props {
  submissions: Submission[];
  className?: string;
}

export const 班级统计面板: React.FC<班级统计面板Props> = ({
  submissions,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayGraded, setDisplayGraded] = useState(0);
  const [displayAvg, setDisplayAvg] = useState(0);
  const prevGradedRef = useRef(0);
  const prevAvgRef = useRef(0);

  const total = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const gradedCount = gradedSubmissions.length;
  const averageScore =
    gradedCount > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedCount
      : 0;

  const chartData: ChartDataPoint[] = (() => {
    const sorted = [...gradedSubmissions].sort((a, b) => (a.gradedAt ?? 0) - (b.gradedAt ?? 0));
    const points: ChartDataPoint[] = [];
    let cumulativeSum = 0;
    let cumulativeCount = 0;

    sorted.forEach((s, i) => {
      if (s.gradedAt === null) return;
      cumulativeSum += s.score ?? 0;
      cumulativeCount++;
      const date = new Date(s.gradedAt);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      points.push({
        label: i % 2 === 0 ? label : '',
        value: Math.round((cumulativeSum / cumulativeCount) * 10) / 10,
      });
    });

    return points;
  })();

  useEffect(() => {
    const animateValue = (
      start: number,
      end: number,
      duration: number,
      callback: (value: number) => void
    ) => {
      const startTime = performance.now();
      const diff = end - start;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + diff * easeProgress;
        callback(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    animateValue(prevGradedRef.current, gradedCount, 600, (val) => {
      setDisplayGraded(Math.round(val));
    });

    animateValue(prevAvgRef.current, averageScore, 600, (val) => {
      setDisplayAvg(Math.round(val * 10) / 10);
    });

    prevGradedRef.current = gradedCount;
    prevAvgRef.current = averageScore;
  }, [gradedCount, averageScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    drawLineChart(ctx, chartData, {
      width: rect.width,
      height: rect.height,
      paddingTop: 15,
      paddingRight: 15,
      paddingBottom: 25,
      paddingLeft: 35,
      lineColor: '#4a90d9',
      fillColorStart: 'rgba(74, 144, 217, 0.3)',
      fillColorEnd: 'rgba(74, 144, 217, 0.0)',
      axisColor: '#666',
      gridColor: '#eee',
    });
  }, [chartData]);

  const progressPercent = total > 0 ? (gradedCount / total) * 100 : 0;

  return (
    <div className={`stats-panel ${className}`}>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">批改进度</div>
          <div className="stat-main">
            <span className="stat-number">{displayGraded}</span>
            <span className="stat-divider">/</span>
            <span className="stat-total">{total}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">平均分</div>
          <div className="stat-main">
            <span className="stat-number highlight">{displayAvg}</span>
            <span className="stat-unit">分</span>
          </div>
          <div className="stat-sub">
            {gradedCount > 0 ? '基于已批改作业' : '暂无数据'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">待批改</div>
          <div className="stat-main">
            <span className="stat-number warning">{total - gradedCount}</span>
            <span className="stat-unit">份</span>
          </div>
          <div className="stat-sub">需要尽快处理</div>
        </div>
      </div>

      <div className="chart-container" ref={containerRef}>
        <div className="chart-title">平均分趋势</div>
        <canvas ref={canvasRef} className="chart-canvas" />
      </div>

      <style>{`
        .stats-panel {
          background: #fff;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e5e5;
        }

        .stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-card {
          flex: 1;
          background: #f8f9fa;
          border-radius: 10px;
          padding: 12px 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 6px;
        }

        .stat-main {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          line-height: 1.2;
        }

        .stat-number.highlight {
          color: #4a90d9;
        }

        .stat-number.warning {
          color: #ff8c42;
        }

        .stat-divider {
          font-size: 20px;
          color: #ccc;
        }

        .stat-total {
          font-size: 16px;
          color: #999;
        }

        .stat-unit {
          font-size: 14px;
          color: #888;
        }

        .stat-sub {
          font-size: 11px;
          color: #aaa;
          margin-top: 4px;
        }

        .progress-bar {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4a90d9, #6ab0f0);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .chart-container {
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          padding: 12px 16px;
          height: 140px;
          position: relative;
        }

        .chart-title {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .chart-canvas {
          width: 100%;
          height: calc(100% - 20px);
          display: block;
        }

        @media (max-width: 768px) {
          .stats-row {
            flex-direction: column;
            gap: 10px;
          }

          .stat-card {
            padding: 10px 14px;
          }

          .stat-number {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};
