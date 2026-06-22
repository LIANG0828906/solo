import { useState, useEffect } from 'react';
import { StatsService, FormattedStats } from '../../services/StatsService';

interface TaskDetail {
  id: string;
  text: string;
  date: string;
  entryId: string;
}

export default function AnalyticsPanel() {
  const [stats, setStats] = useState<FormattedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<TaskDetail[]>([]);

  useEffect(() => {
    const range = StatsService.getLast7DaysRange();
    loadStats(range.start, range.end);
  }, []);

  const loadStats = async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await StatsService.getStats(start, end);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const moodToColor = (value: number | null): string => {
    if (value === null) return '#CCCCCC';
    const ratio = (value - 2) / 8;
    const r = Math.round(39 + (231 - 39) * (1 - ratio));
    const g = Math.round(174 + (76 - 174) * (1 - ratio));
    const b = Math.round(96 + (60 - 96) * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const renderMoodChart = () => {
    if (!stats) return null;
    const { labels, data } = stats.moodChart;

    const width = 700;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xStep = chartWidth / (labels.length - 1 || 1);
    const yMin = 0;
    const yMax = 10;

    const points = data.map((v, i) => {
      if (v === null) return null;
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((v - yMin) / (yMax - yMin)) * chartHeight;
      return { x, y, value: v };
    });

    const validPoints = points.filter((p): p is { x: number; y: number; value: number } => p !== null);

    const buildPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        {[2, 4, 6, 8, 10].map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E8D5B7"
                strokeDasharray="4 4"
                strokeWidth="0.5"
              />
              <text x={padding.left - 10} y={y + 4} fill="#8B7355" fontSize="10" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}

        {validPoints.length > 1 && (
          <>
            <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#27AE60" />
              <stop offset="50%" stopColor="#F1C40F" />
              <stop offset="100%" stopColor="#E74C3C" />
            </linearGradient>
          </defs>
          <path
            d={buildPath(validPoints)}
            fill="none"
            stroke="url(#moodGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          </>
        )}

        {validPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill={moodToColor(p.value)}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {labels.map((label, i) => {
          const x = padding.left + i * xStep;
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              fill="#8B7355"
              fontSize="11"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    );
  };

  const handleBarClick = (dateIndex: number) => {
    if (!stats) return;
    const taskList = stats.taskChart.taskLists[dateIndex];
    if (taskList && taskList.tasks.length > 0) {
      setSelectedTaskDate(taskList.date);
      setSelectedTasks(taskList.tasks);
    }
  };

  const renderTaskChart = () => {
    if (!stats) return null;
    const { labels, completed, total } = stats.taskChart;

    const width = 700;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...total, 5);
    const barWidth = (chartWidth / labels.length) * 0.6;
    const gap = (chartWidth / labels.length) * 0.4;

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%' }} preserveAspectRatio="none">
          {Array.from({ length: Math.ceil(maxValue) + 1}).map((_, i) => {
            const tick = i;
            const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#E8D5B7"
                  strokeDasharray="4 4"
                  strokeWidth="0.5"
                />
                <text x={padding.left - 10} y={y + 4} fill="#8B7355" fontSize="10" textAnchor="end">
                  {tick}
                </text>
              </g>
            );
          })}

          {labels.map((label, i) => {
            const x = padding.left + i * (barWidth + gap) + gap / 2;
            const barHeightCompleted = (completed[i] / maxValue) * chartHeight;
            const barHeightTotal = (total[i] / maxValue) * chartHeight;
            const yCompleted = padding.top + chartHeight - barHeightCompleted;
            const yTotal = padding.top + chartHeight - barHeightTotal;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={yTotal}
                  width={barWidth}
                  height={barHeightTotal}
                  fill="#F5E6D3"
                  rx="4"
                  style={{ cursor: total[i] > 0 ? 'pointer' : 'default' }}
                  onClick={() => handleBarClick(i)}
                />
                <rect
                  x={x}
                  y={yCompleted}
                  width={barWidth}
                  height={barHeightCompleted}
                  fill="#3498DB"
                  rx="4"
                  style={{ cursor: completed[i] > 0 ? 'pointer' : 'default' }}
                  onClick={() => handleBarClick(i)}
                />
                <text
                  x={x + barWidth / 2}
                  y={padding.top + chartHeight + 18}
                  fill="#8B7355"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={yCompleted - 5}
                  fill="#3498DB"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {completed[i] > 0 ? completed[i] : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="chart-card">
        <h3 className="chart-title">最近7天心情指数趋势
        </h3>
        <div className="chart-wrapper">
          {loading ? (
            <div className="loading-spinner">加载中...
            </div>
          ) : (
            renderMoodChart()
          )}
        </div>
        <div style={{ marginTop: '8px',
          fontSize: '12px',
          color: '#8B7355'
        }>
          心情指数：非常开心(10) → 糟糕(2)，颜色从绿到红渐变
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">最近7天任务完成情况
        </h3>
        <div className="chart-wrapper">
          {loading ? (
            <div className="loading-spinner">加载中...
            </div>
          ) : (
            renderTaskChart()
          )}
        </div>
        <div style={{ marginTop: '8px',
          fontSize: '12px',
          color: '#8B7355'
        }}>
          蓝色=已完成 / 米色=总数，点击柱状图可查看详情
        </div>
      </div>

      {selectedTaskDate && (
        <div className="chart-card">
          <h3 className="chart-title">
            {selectedTaskDate} 完成的任务
          </h3>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedTaskDate(null);
              setSelectedTasks([]);
            }}
            style={{ marginBottom: '12px'
            }}
          >
            关闭
          </button>
          {selectedTasks.length === 0 ? (
            <div className="no-data">当天没有已完成的任务</div>
          ) : (
            <ul className="task-detail-list">
              {selectedTasks.map((task) => (
                <li key={task.id} className="task-detail-item">
                  ✓ {task.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
