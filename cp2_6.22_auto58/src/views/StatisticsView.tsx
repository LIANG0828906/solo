import { useState, useEffect, useMemo } from 'react';
import { timerService } from '../services/timerService';
import { DailyStats, Statistics, FocusRecord } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '../styles/StatisticsView.css';

type Period = 'day' | 'week' | 'month';
type ChartType = 'area' | 'bar';

function StatisticsView() {
  const [period, setPeriod] = useState<Period>('week');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [weeklyOffset, setWeeklyOffset] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRecords, setDayRecords] = useState<FocusRecord[]>([]);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const currentDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weeklyOffset * 7);
    return date.toISOString().split('T')[0];
  }, [weeklyOffset]);

  const weekLabel = useMemo(() => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay() || 7;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [period, currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, dailyRes] = await Promise.all([
        timerService.getStatistics(period, currentDate),
        timerService.getDailyStats(period, currentDate),
      ]);
      setStatistics(statsRes);
      setDailyStats(dailyRes);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatShortTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === 'day') {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
    if (period === 'week') {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    }
    return `${date.getDate()}日`;
  };

  const chartData = useMemo(() => {
    return dailyStats.map(stat => ({
      ...stat,
      date: formatDateLabel(stat.date),
      fullDate: stat.date,
      focusHours: Math.round((stat.totalFocusTime / 3600) * 10) / 10,
    }));
  }, [dailyStats, period]);

  const handleBarClick = (data: any) => {
    if (data && data.fullDate) {
      setSelectedDate(data.fullDate);
      loadDayDetail(data.fullDate);
      setShowDayDetail(true);
    }
  };

  const loadDayDetail = async (dateStr: string) => {
    try {
      const allRecords = await timerService.getRecords();
      const dayRecords = allRecords.filter(r => r.endTime.startsWith(dateStr));
      setDayRecords(dayRecords);
    } catch (error) {
      console.error('Failed to load day records:', error);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrevWeek = () => setWeeklyOffset(prev => prev - 1);
  const handleNextWeek = () => setWeeklyOffset(prev => prev + 1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="tooltip-item">
              <span className="tooltip-color" style={{ backgroundColor: item.color }} />
              {item.name === 'focusHours' ? '专注时长' : '完成任务'}: 
              <strong>
                {item.name === 'focusHours' 
                  ? formatSeconds(item.value * 3600) 
                  : `${item.value}个`}
              </strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="statistics-view">
        <div className="loading-container">加载中...</div>
      </div>
    );
  }

  return (
    <div className="statistics-view">
      <div className="stats-header">
        <div>
          <h1 className="page-title">统计报告</h1>
          <p className="page-subtitle">查看你的专注数据和任务完成情况</p>
        </div>
      </div>

      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-icon focus-icon">⏱</div>
          <div className="summary-content">
            <span className="summary-label">总专注时长</span>
            <span className="summary-value">{formatSeconds(statistics?.totalFocusTime || 0)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon tasks-icon">✅</div>
          <div className="summary-content">
            <span className="summary-label">完成任务</span>
            <span className="summary-value">{statistics?.completedTasks || 0}个</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon avg-icon">📊</div>
          <div className="summary-content">
            <span className="summary-label">平均专注时长</span>
            <span className="summary-value">{formatSeconds(statistics?.avgFocusDuration || 0)}</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="section-header">
          <div className="period-nav">
            <button 
              className="nav-btn"
              onClick={handlePrevWeek}
            >
              ←
            </button>
            <span className="current-period">{weekLabel}</span>
            <button 
              className="nav-btn"
              onClick={handleNextWeek}
            >
              →
            </button>
          </div>
          <div className="chart-controls">
            <div className="period-tabs">
              {(['day', 'week', 'month'] as Period[]).map(p => (
                <button
                  key={p}
                  className={`period-tab ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'day' ? '日' : p === 'week' ? '周' : '月'}
                </button>
              ))}
            </div>
            <div className="chart-type-tabs">
              <button
                className={`chart-tab ${chartType === 'area' ? 'active' : ''}`}
                onClick={() => setChartType('area')}
              >
                区线图
              </button>
              <button
                className={`chart-tab ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                柱状图
              </button>
            </div>
          </div>
        </div>

        <div className={`chart-container ${chartType} fade-in`} key={chartType}>
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9f6b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ff9f6b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6bcb77" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6bcb77" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="focusHours"
                  name="focusHours"
                  stroke="#ff9f6b"
                  strokeWidth={2}
                  fill="url(#focusGradient)"
                  activeDot={{ r: 6, fill: '#ff9f6b', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="completedTasks"
                  name="completedTasks"
                  stroke="#6bcb77"
                  strokeWidth={2}
                  fill="url(#tasksGradient)"
                  activeDot={{ r: 6, fill: '#6bcb77', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="focusHours"
                  name="focusHours"
                  fill="#ff9f6b"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
                <Bar 
                  dataKey="completedTasks"
                  name="completedTasks"
                  fill="#6bcb77"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="records-section">
        <div className="section-title">最近专注记录</div>
        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>任务</th>
                <th>专注时长</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {statistics?.records && statistics.records.length > 0 ? (
                statistics.records.map(record => (
                  <tr key={record.id} className="record-row">
                    <td className="record-date">{formatDateTime(record.endTime)}</td>
                    <td className="record-task">{record.taskTitle}</td>
                    <td className="record-duration">{formatShortTime(record.duration)}</td>
                    <td className="record-status">
                      <span className={`status-badge ${record.status}`}>
                        {record.status === 'completed' ? '已完成' : '已中断'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty-records">暂无专注记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDayDetail && (
        <div className="modal-overlay" onClick={() => setShowDayDetail(false)}>
          <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDate} 详细记录</h2>
              <button className="close-btn" onClick={() => setShowDayDetail(false)}>✕</button>
            </div>
            <div className="day-records-list">
              {dayRecords.length > 0 ? (
                dayRecords.map(record => (
                  <div key={record.id} className="day-record-item">
                    <div className="record-info">
                      <span className="record-task-name">{record.taskTitle}</span>
                      <span className="record-time">{formatDateTime(record.endTime)}</span>
                    </div>
                    <div className="record-stats">
                      <span className={`status-badge ${record.status}`}>
                        {record.status === 'completed' ? '已完成' : '已中断'}
                      </span>
                      <span className="record-duration">{formatShortTime(record.duration)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-day-records">当天暂无专注记录</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsView;
