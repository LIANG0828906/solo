import React, { useMemo, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import type { CommitData, HighlightState } from '../types';
import '../styles/ChartPanel.css';

interface ChartPanelProps {
  commits: CommitData[];
  highlight: HighlightState;
  setHighlight: React.Dispatch<React.SetStateAction<HighlightState>>;
}

const EXT_CATEGORIES = ['.ts', '.tsx', '.js', '.css', '.json', '.md', '其他'];

export default function ChartPanel({ commits, highlight, setHighlight }: ChartPanelProps) {
  const renderStartRef = useRef<number>(0);

  const { frequencyData, authorData, heatmapData, dateList } = useMemo(() => {
    renderStartRef.current = performance.now();

    const now = new Date();
    const last30Days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }

    const freqMap = new Map<string, number>();
    last30Days.forEach((d) => freqMap.set(d, 0));

    const authorMap = new Map<string, { additions: number; deletions: number; dateMap: Map<string, { additions: number; deletions: number }> }>();

    const fileExtMap = new Map<string, Map<string, number>>();
    last30Days.forEach((d) => {
      fileExtMap.set(d, new Map(EXT_CATEGORIES.map((ext) => [ext, 0])));
    });

    const filteredCommits = commits.filter((c) => {
      const commitDate = c.date.split('T')[0];
      return last30Days.includes(commitDate);
    });

    for (const commit of filteredCommits) {
      const dateKey = commit.date.split('T')[0];

      freqMap.set(dateKey, (freqMap.get(dateKey) || 0) + 1);

      if (!authorMap.has(commit.author)) {
        const dm = new Map<string, { additions: number; deletions: number }>();
        last30Days.forEach((d) => dm.set(d, { additions: 0, deletions: 0 }));
        authorMap.set(commit.author, { additions: 0, deletions: 0, dateMap: dm });
      }
      const authorStats = authorMap.get(commit.author)!;
      authorStats.additions += commit.additions;
      authorStats.deletions += commit.deletions;
      const dateStats = authorStats.dateMap.get(dateKey)!;
      dateStats.additions += commit.additions;
      dateStats.deletions += commit.deletions;

      for (const file of commit.files) {
        const extMatch = file.filename.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0].toLowerCase() : '其他';
        const category = EXT_CATEGORIES.includes(ext) ? ext : '其他';
        const dayMap = fileExtMap.get(dateKey)!;
        dayMap.set(category, (dayMap.get(category) || 0) + 1);
      }
    }

    const frequencyData = last30Days.map((date) => ({
      date,
      count: freqMap.get(date) || 0,
      displayDate: date.slice(5),
    }));

    const authorData = Array.from(authorMap.entries()).map(([author, stats]) => ({
      author,
      additions: stats.additions,
      deletions: stats.deletions,
      dateMap: stats.dateMap,
    }));

    const heatmapData: Array<{ date: string; displayDate: string } & Record<string, number>> = [];
    for (const date of last30Days) {
      const dayMap = fileExtMap.get(date)!;
      const row: any = { date, displayDate: date.slice(5) };
      for (const ext of EXT_CATEGORIES) {
        row[ext] = dayMap.get(ext) || 0;
      }
      heatmapData.push(row);
    }

    const renderTime = performance.now() - renderStartRef.current;
    if (renderTime > 100) {
      console.warn(`ChartPanel 渲染时间: ${renderTime.toFixed(2)}ms，超过100ms`);
    }

    return { frequencyData, authorData, heatmapData, dateList: last30Days };
  }, [commits]);

  const handleLineClick = useCallback(
    (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const clickedDate = data.activePayload[0].payload.date;
        setHighlight((prev) => ({
          ...prev,
          date: prev.date === clickedDate ? null : clickedDate,
        }));
      }
    },
    [setHighlight]
  );

  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'rgba(255, 255, 255, 0.05)';
    const maxVal = 10;
    const ratio = Math.min(value / maxVal, 1);
    const r = Math.round(209 - (209 - 254) * ratio);
    const g = Math.round(250 - (250 - 202) * ratio);
    const b = Math.round(229 - (229 - 202) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const isDateHighlighted = (date: string) => highlight.date === date;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-panel">
      <div className="chart-grid">
        <div className="chart-card">
          <h3 className="chart-title">提交频率趋势</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={frequencyData} onClick={handleLineClick} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#3a7bd5" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00d2ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#9ca3af"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  interval={3}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="none" fill="url(#areaGradient)" />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: '#16213e',
                    stroke: 'url(#lineGradient)',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#00d2ff',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">人均代码量</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={authorData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="author"
                  stroke="#9ca3af"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                />
                <Bar
                  dataKey="additions"
                  name="新增"
                  stackId="a"
                  animationDuration={300}
                  onMouseEnter={(data, index, e) => {
                    const rect = e.currentTarget;
                    rect.style.transform = 'scaleY(1.1)';
                    rect.style.transformOrigin = 'bottom';
                    rect.style.transition = 'transform 0.3s ease';
                  }}
                  onMouseLeave={(data, index, e) => {
                    const rect = e.currentTarget;
                    rect.style.transform = 'scaleY(1)';
                  }}
                >
                  {authorData.map((entry, index) => {
                    const isHighlighted = highlight.date
                      ? (entry.dateMap.get(highlight.date)?.additions || 0) > 0
                      : true;
                    return (
                      <Cell
                        key={`add-${index}`}
                        fill="#10b981"
                        stroke={isHighlighted ? '#fff' : 'transparent'}
                        strokeWidth={isHighlighted ? 2 : 0}
                        opacity={highlight.date && !isHighlighted ? 0.4 : 1}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    );
                  })}
                </Bar>
                <Bar
                  dataKey="deletions"
                  name="删除"
                  stackId="a"
                  animationDuration={300}
                  onMouseEnter={(data, index, e) => {
                    const rect = e.currentTarget;
                    rect.style.transform = 'scaleY(1.1)';
                    rect.style.transformOrigin = 'bottom';
                    rect.style.transition = 'transform 0.3s ease';
                  }}
                  onMouseLeave={(data, index, e) => {
                    const rect = e.currentTarget;
                    rect.style.transform = 'scaleY(1)';
                  }}
                >
                  {authorData.map((entry, index) => {
                    const isHighlighted = highlight.date
                      ? (entry.dateMap.get(highlight.date)?.deletions || 0) > 0
                      : true;
                    return (
                      <Cell
                        key={`del-${index}`}
                        fill="#ef4444"
                        stroke={isHighlighted ? '#fff' : 'transparent'}
                        strokeWidth={isHighlighted ? 2 : 0}
                        opacity={highlight.date && !isHighlighted ? 0.4 : 1}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3 className="chart-title">文件修改热力图</h3>
          <div className="chart-container">
            <div className="heatmap-wrapper">
              <div className="heatmap-header">
                <div className="heatmap-corner" />
                {EXT_CATEGORIES.map((ext) => (
                  <div key={ext} className="heatmap-col-header">
                    {ext}
                  </div>
                ))}
              </div>
              <div className="heatmap-body">
                {heatmapData.map((row, rowIndex) => {
                  const highlighted = isDateHighlighted(row.date);
                  return (
                    <div
                      key={row.date}
                      className={`heatmap-row ${highlighted ? 'highlighted' : ''}`}
                      style={{
                        transition: 'all 0.3s ease',
                        opacity: highlight.date && !highlighted ? 0.5 : 1,
                      }}
                    >
                      <div className="heatmap-row-header">{row.displayDate}</div>
                      {EXT_CATEGORIES.map((ext) => {
                        const value = row[ext] || 0;
                        return (
                          <div
                            key={`${row.date}-${ext}`}
                            className="heatmap-cell"
                            style={{
                              backgroundColor: getHeatmapColor(value),
                              border: highlighted && value > 0 ? '2px solid #00d2ff' : '1px solid rgba(255,255,255,0.05)',
                              transition: 'all 0.3s ease',
                            }}
                            title={`${row.date} ${ext}: ${value}次修改`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="heatmap-legend">
                <span className="legend-label">少</span>
                <div className="legend-gradient" />
                <span className="legend-label">多</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
