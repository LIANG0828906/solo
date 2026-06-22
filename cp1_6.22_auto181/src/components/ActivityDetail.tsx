import { useState, useEffect, useRef, useCallback } from 'react';
import { drawLineChart, drawHeatmap } from '../chartEngine';
import { getTypeName } from '../dataSimulator';
import type { ActivityDetail as ActivityDetailType, HourlyData, ClickPoint } from '../types';
import type { TooltipData } from '../chartEngine';

interface ActivityDetailProps {
  activity: ActivityDetailType | null;
  onRefresh: () => void;
}

const statusNames: Record<string, string> = {
  ongoing: '进行中',
  upcoming: '未开始',
  ended: '已结束'
};

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  return '¥' + num.toLocaleString();
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ActivityDetail({ activity, onRefresh }: ActivityDetailProps) {
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    onRefresh();
    const interval = setInterval(onRefresh, 5000);
    return () => clearInterval(interval);
  }, [isPaused, onRefresh]);

  const renderLineChart = useCallback((data: HourlyData[]) => {
    if (!lineChartRef.current || !chartContainerRef.current) return;

    const containerWidth = chartContainerRef.current.clientWidth;
    const width = Math.min(containerWidth - 48, 800);
    const height = 300;

    drawLineChart(
      lineChartRef.current,
      data,
      {
        width,
        height,
        colors: {
          impressions: '#60A5FA',
          clicks: '#34D399',
          conversions: '#F472B6'
        }
      },
      setTooltip
    );
  }, []);

  const renderHeatmap = useCallback((data: ClickPoint[]) => {
    if (!heatmapRef.current || !heatmapContainerRef.current) return;

    const containerWidth = heatmapContainerRef.current.clientWidth;
    const width = Math.min(containerWidth - 48, 600);
    const height = 350;

    drawHeatmap(
      heatmapRef.current,
      data,
      {
        width,
        height,
        gradient: ['#FDE68A', '#EF4444']
      }
    );
  }, []);

  useEffect(() => {
    if (activity) {
      renderLineChart(activity.hourlyData);
      renderHeatmap(activity.heatmapData);
    }
  }, [activity, renderLineChart, renderHeatmap]);

  useEffect(() => {
    const handleResize = () => {
      if (activity) {
        renderLineChart(activity.hourlyData);
        renderHeatmap(activity.heatmapData);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activity, renderLineChart, renderHeatmap]);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!activity) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <div className="empty-state-text">加载活动详情...</div>
      </div>
    );
  }

  const ctr = activity.impressions > 0 ? ((activity.clicks / activity.impressions) * 100).toFixed(2) : '0.00';
  const roi = activity.budgetUsed > 0 ? ((activity.revenue / activity.budgetUsed) * 100).toFixed(1) : '0.0';
  const cvr = activity.clicks > 0 ? ((activity.conversions / activity.clicks) * 100).toFixed(2) : '0.00';
  const budgetPercent = (activity.budgetUsed / activity.budgetLimit) * 100;
  const isWarning = budgetPercent > 80;

  return (
    <div>
      <div className="detail-panel" style={{ marginBottom: '24px' }}>
        <div className="detail-header">
          <div>
            <h2 className="detail-title">{activity.name}</h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
              <span className={`type-tag ${activity.type}`}>
                {getTypeName(activity.type)}
              </span>
              <span className={`status-badge ${activity.status}`}>
                {statusNames[activity.status]}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {formatDate(activity.startTime)} - {formatDate(activity.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-metrics">
          <div className="detail-metric">
            <div className="detail-metric-label">曝光量</div>
            <div className="detail-metric-value exposure">
              {formatNumber(activity.impressions)}
            </div>
          </div>
          <div className="detail-metric">
            <div className="detail-metric-label">点击量</div>
            <div className="detail-metric-value click">
              {formatNumber(activity.clicks)}
            </div>
          </div>
          <div className="detail-metric">
            <div className="detail-metric-label">转化率</div>
            <div className="detail-metric-value conversion">
              {cvr}%
            </div>
          </div>
          <div className="detail-metric">
            <div className="detail-metric-label">ROI</div>
            <div className="detail-metric-value roi">
              {roi}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="detail-metric">
            <div className="detail-metric-label">点击率</div>
            <div className="detail-metric-value" style={{ fontSize: '24px' }}>
              {ctr}%
            </div>
          </div>
          <div className="detail-metric">
            <div className="detail-metric-label">总收入</div>
            <div className="detail-metric-value" style={{ fontSize: '24px', color: '#10B981' }}>
              {formatCurrency(activity.revenue)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div className="progress-label">
            <span>预算使用</span>
            <span>
              {formatCurrency(activity.budgetUsed)} / {formatCurrency(activity.budgetLimit)}
              ({budgetPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <div
              className={`progress-fill ${isWarning ? 'warning' : ''}`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="detail-container">
        <div className="detail-panel">
          <div className="detail-header">
            <h3 className="detail-title" style={{ fontSize: '16px' }}>实时数据趋势</h3>
          </div>
          
          <div className="chart-container" ref={chartContainerRef}>
            <canvas ref={lineChartRef} className="chart-canvas" />
            {tooltip && (
              <div
                className="chart-tooltip"
                style={{
                  left: tooltip.x + 60,
                  top: tooltip.y
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{tooltip.hourLabel}</div>
                {tooltip.data.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.color,
                          marginRight: '6px'
                        }}
                      />
                      {item.label}
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot exposure" />
              <span>曝光量</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot click" />
              <span>点击量</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot conversion" />
              <span>转化量</span>
            </div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-header">
            <h3 className="detail-title" style={{ fontSize: '16px' }}>用户行为热力图</h3>
          </div>
          
          <div className="heatmap-container" ref={heatmapContainerRef}>
            <canvas ref={heatmapRef} className="chart-canvas" />
          </div>

          <div className="heatmap-controls">
            <div className="heatmap-legend">
              <span className="legend-label">低</span>
              <div className="legend-gradient" />
              <span className="legend-label">高</span>
              <span className="legend-label" style={{ marginLeft: '8px' }}>点击密度</span>
            </div>
            <button
              className={`btn-toggle ${isPaused ? 'paused' : 'running'}`}
              onClick={handleTogglePause}
            >
              {isPaused ? '▶ 恢复' : '⏸ 暂停'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
