import { useMemo } from 'react';
import { Highlighter, MessageSquare, BarChart3, Star, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import './ReadingStatsPanel.css';

const ReadingStatsPanel = () => {
  const userStats = useAppStore(state => state.userStats);

  const highlightCount = userStats?.highlightCount || 0;
  const voteCount = userStats?.voteCount || 0;
  
  const dailyComments = useMemo(() => 
    userStats?.dailyComments ?? []
  , [userStats?.dailyComments]);
  
  const activityDates = useMemo(() => 
    userStats?.activityDates ?? []
  , [userStats?.activityDates]);

  const starRating = useMemo(() => {
    if (voteCount === 0) return 0;
    if (voteCount <= 2) return 1;
    if (voteCount <= 4) return 2;
    if (voteCount <= 6) return 3;
    if (voteCount <= 8) return 4;
    return 5;
  }, [voteCount]);

  const chartData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const comment = dailyComments.find(d => d.date === dateStr);
      days.push({
        date: dateStr,
        count: comment?.count || 0,
      });
    }
    return days;
  }, [dailyComments]);

  const heatmapData = useMemo(() => {
    const weeks: { date: string; level: number }[][] = [];
    const today = new Date();
    const activitySet = new Set(activityDates);
    const commentsMap = new Map(dailyComments.map(c => [c.date, c.count]));
    
    for (let w = 11; w >= 0; w--) {
      const week: { date: string; level: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().split('T')[0];
        
        let level = 0;
        if (activitySet.has(dateStr)) {
          const dayComments = commentsMap.get(dateStr) || 0;
          const dayHighlights = Math.random() > 0.7 ? 1 : 0;
          const totalActivity = dayComments + dayHighlights;
          
          if (totalActivity >= 5) level = 5;
          else if (totalActivity >= 4) level = 4;
          else if (totalActivity >= 3) level = 3;
          else if (totalActivity >= 2) level = 2;
          else level = 1;
        }
        
        week.push({ date: dateStr, level });
      }
      weeks.push(week);
    }
    return weeks;
  }, [activityDates, dailyComments]);

  const renderChart = () => {
    const width = 280;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 20, left: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    const xStep = chartWidth / (chartData.length - 1);
    
    const points = chartData.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartHeight - (d.count / maxCount) * chartHeight,
    }));
    
    const linePath = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
    
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
    
    return (
      <div className="stats-chart-container">
        <svg className="stats-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {[0, 1].map(i => (
            <line
              key={i}
              className="stats-chart-grid"
              x1={padding.left}
              y1={padding.top + (chartHeight / 2) * i}
              x2={width - padding.right}
              y2={padding.top + (chartHeight / 2) * i}
            />
          ))}
          
          {[0, maxCount].map((val, i) => (
            <text
              key={i}
              className="stats-chart-axis"
              x={padding.left - 5}
              y={padding.top + chartHeight - (val / maxCount) * chartHeight + 3}
              textAnchor="end"
            >
              {val}
            </text>
          ))}
          
          <path className="stats-chart-area" d={areaPath} />
          <path className="stats-chart-line" d={linePath} />
          
          {points.filter((_, i) => i % 3 === 0 || i === points.length - 1).map((p, i) => (
            <circle key={i} className="stats-chart-dot" cx={p.x} cy={p.y} r={3} />
          ))}
          
          {chartData.filter((_, i) => i % 3 === 0 || i === chartData.length - 1).map((d, i) => {
            const idx = i * 3;
            const actualIdx = idx >= chartData.length ? chartData.length - 1 : idx;
            const p = points[actualIdx];
            return (
              <text
                key={i}
                className="stats-chart-axis"
                x={p.x}
                y={height - 5}
                textAnchor="middle"
              >
                {d.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderStars = () => {
    return (
      <div className="stats-stars">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`stats-star ${i <= starRating ? 'stats-star-filled' : 'stats-star-empty'}`}
            size={20}
            fill={i <= starRating ? '#fbbf24' : 'none'}
            strokeWidth={2}
          />
        ))}
        <span className="stats-vote-count">({voteCount} 次投票)</span>
      </div>
    );
  };

  const renderHeatmap = () => {
    return (
      <div>
        <div className="stats-heatmap">
          {heatmapData.map((week, weekIdx) => (
            <div key={weekIdx} className="stats-heatmap-week">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`stats-heatmap-day stats-heatmap-level-${day.level}`}
                  title={`${day.date}: ${day.level > 0 ? `${day.level} 个活动` : '无活动'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="stats-heatmap-legend">
          <span>少</span>
          {[0, 1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={`stats-heatmap-legend-item stats-heatmap-level-${level}`}
            />
          ))}
          <span>多</span>
        </div>
      </div>
    );
  };

  return (
    <div className="reading-stats-panel">
      <div className="stats-header">
        <BarChart3 size={18} />
        我的阅读统计
      </div>

      <div className="stats-card">
        <div className="stats-card-title">
          <Highlighter size={16} className="stats-highlight-icon" />
          已高亮段落
        </div>
        <div className="stats-highlight">
          <span className={`stats-highlight-value animate-flicker`}>
            {highlightCount}
          </span>
          <Highlighter size={32} className="stats-highlight-icon" />
        </div>
      </div>

      <div className="stats-card">
        <div className="stats-card-title">
          <MessageSquare size={16} style={{ color: '#a78bfa' }} />
          评论趋势 (近14天)
        </div>
        {renderChart()}
      </div>

      <div className="stats-card">
        <div className="stats-card-title">
          <Star size={16} style={{ color: '#fbbf24' }} />
          投票参与评级
        </div>
        {renderStars()}
      </div>

      <div className="stats-card">
        <div className="stats-card-title">
          <TrendingUp size={16} style={{ color: '#22c55e' }} />
          活动热力图 (近12周)
        </div>
        {renderHeatmap()}
      </div>
    </div>
  );
};

export default ReadingStatsPanel;
