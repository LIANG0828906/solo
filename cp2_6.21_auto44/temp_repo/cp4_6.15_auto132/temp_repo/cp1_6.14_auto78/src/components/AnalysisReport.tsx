import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeeklyAnalytics, MonthlyAnalytics } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalysisReportProps {
  type: 'weekly' | 'monthly';
  data: WeeklyAnalytics | MonthlyAnalytics;
}

type TabType = 'overview' | 'trend' | 'tags';

interface TagData {
  tag: string;
  count: number;
}

interface TrendDataPoint {
  label: string;
  minutes: number;
  pages: number;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ type, data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tabIndex, setTabIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: '概览' },
    { key: 'trend', label: '趋势' },
    { key: 'tags', label: '标签' },
  ];

  useEffect(() => {
    setTabIndex(tabs.findIndex((t) => t.key === activeTab));
  }, [activeTab]);

  const getDayName = (dateStr: string): string => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const overviewStats = useMemo(() => {
    if (type === 'weekly') {
      const weeklyData = data as WeeklyAnalytics;
      const totalDays = weeklyData.dailyBreakdown?.filter((d) => d.minutes > 0).length || 0;
      const totalMinutes = weeklyData.totalMinutes || 0;
      const avgPagesPerDay = totalDays > 0 ? Math.round(weeklyData.totalPages / totalDays) : 0;
      const booksCompleted = weeklyData.booksRead?.length || 0;

      return [
        { label: '总阅读天数', value: totalDays, icon: '📅', unit: '天' },
        { label: '总阅读时长', value: Math.floor(totalMinutes / 60), icon: '⏱️', unit: '小时' },
        { label: '平均每天页数', value: avgPagesPerDay, icon: '📖', unit: '页' },
        { label: '完成书籍数', value: booksCompleted, icon: '✅', unit: '本' },
      ];
    } else {
      const monthlyData = data as MonthlyAnalytics;
      const totalDays = monthlyData.weeklyBreakdown?.reduce((sum, w) => {
        return sum + (w.dailyBreakdown?.filter((d) => d.minutes > 0).length || 0);
      }, 0) || 0;
      const totalMinutes = monthlyData.totalMinutes || 0;
      const avgPagesPerDay = monthlyData.averageDailyPages || 0;
      const booksCompleted = monthlyData.booksCompleted || 0;

      return [
        { label: '总阅读天数', value: totalDays, icon: '📅', unit: '天' },
        { label: '总阅读时长', value: Math.floor(totalMinutes / 60), icon: '⏱️', unit: '小时' },
        { label: '平均每天页数', value: avgPagesPerDay, icon: '📖', unit: '页' },
        { label: '完成书籍数', value: booksCompleted, icon: '✅', unit: '本' },
      ];
    }
  }, [type, data]);

  const trendData = useMemo((): TrendDataPoint[] => {
    if (type === 'weekly') {
      const weeklyData = data as WeeklyAnalytics;
      return (
        weeklyData.dailyBreakdown?.map((d) => ({
          label: getDayName(d.date),
          minutes: d.minutes,
          pages: d.pages,
        })) || []
      );
    } else {
      const monthlyData = data as MonthlyAnalytics;
      return (
        monthlyData.weeklyBreakdown?.map((w, i) => ({
          label: `第${i + 1}周`,
          minutes: w.totalMinutes,
          pages: w.totalPages,
        })) || []
      );
    }
  }, [type, data]);

  const tagData = useMemo((): TagData[] => {
    const rawData = data as unknown as { tagStats?: Record<string, number> };
    const tagStats = rawData.tagStats || {};
    return Object.entries(tagStats)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const chartData = useMemo(() => {
    const labels = trendData.map((d) => d.label);
    const minutesData = trendData.map((d) => d.minutes);
    const pagesData = trendData.map((d) => d.pages);

    return {
      labels,
      datasets: [
        {
          label: '阅读时长（分钟）',
          data: minutesData,
          borderColor: '#8B5A2B',
          backgroundColor: (context: { chart: { ctx: { createLinearGradient: (arg0: number, arg1: number, arg2: number, arg3: number) => { (): any; new (): any; addColorStop: { (arg0: number, arg1: string): void; new (): any } } }; chartArea: { top: number; bottom: number } } }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, context.chartArea.top, 0, context.chartArea.bottom);
            gradient.addColorStop(0, 'rgba(139, 90, 43, 0.4)');
            gradient.addColorStop(1, 'rgba(196, 154, 108, 0.05)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8B5A2B',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#C49A6C',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
          pagesData,
        },
      ],
    };
  }, [trendData]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#3D2914',
          font: {
            family: 'var(--font-sans)',
            size: 13,
          },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(61, 41, 20, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#C49A6C',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: 'var(--font-sans)',
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: 'var(--font-sans)',
          size: 13,
        },
        callbacks: {
          title: (items) => {
            return items[0].label;
          },
          label: (context) => {
            const index = context.dataIndex;
            const minutes = context.raw as number;
            const pages = (context.dataset as unknown as { pagesData: number[] }).pagesData[index];
            return [
              `阅读时长: ${minutes} 分钟`,
              `阅读页数: ${pages} 页`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(139, 90, 43, 0.1)',
        },
        ticks: {
          color: '#6B5344',
          font: {
            family: 'var(--font-sans)',
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(139, 90, 43, 0.1)',
        },
        ticks: {
          color: '#6B5344',
          font: {
            family: 'var(--font-sans)',
            size: 12,
          },
        },
        title: {
          display: true,
          text: '分钟',
          color: '#6B5344',
          font: {
            family: 'var(--font-sans)',
            size: 12,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const tagColors = ['#8B5A2B', '#C49A6C', '#5A8A5A', '#C9962C', '#B85450', '#6B5344', '#A67C52'];

  const getTagStyle = (index: number, maxCount: number, count: number): React.CSSProperties => {
    const minSize = 14;
    const maxSize = 32;
    const size = maxCount > 0 ? minSize + ((count / maxCount) * (maxSize - minSize)) : minSize;
    const color = tagColors[index % tagColors.length];
    return {
      fontSize: `${size}px`,
      color,
      fontWeight: count >= maxCount * 0.7 ? 700 : count >= maxCount * 0.4 ? 600 : 500,
    };
  };

  const maxTagCount = tagData.length > 0 ? Math.max(...tagData.map((t) => t.count)) : 0;

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          position: 'relative',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            style={{
              flex: 1,
              padding: '16px 20px',
              fontSize: '15px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {tab.label}
          </button>
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${tabIndex * (100 / 3)}%`,
            width: `${100 / 3}%`,
            height: '3px',
            background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
            borderRadius: '3px 3px 0 0',
            transition: 'left var(--transition-slow) ease',
          }}
        />
      </div>

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${tabIndex * 100}%)`,
            transition: 'transform var(--transition-slow) ease',
          }}
        >
          <div style={{ minWidth: '100%', padding: '24px' }}>
            <div
              style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {overviewStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="card"
                  style={{
                    textAlign: 'center',
                    animation: `slideInUp 0.5s ease forwards`,
                    animationDelay: `${index * 0.1}s`,
                    opacity: 0,
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: 'var(--color-accent)',
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                    <span style={{ fontSize: '16px', fontWeight: 500, marginLeft: '4px' }}>
                      {stat.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ minWidth: '100%', padding: '24px' }}>
            <div
              className="card-static"
              style={{
                height: '360px',
                animation: 'fadeIn 1s ease forwards',
              }}
            >
              {trendData.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-light)',
                    fontSize: '14px',
                  }}
                >
                  暂无趋势数据
                </div>
              )}
            </div>
          </div>

          <div style={{ minWidth: '100%', padding: '24px' }}>
            <div className="card-static">
              {tagData.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px 20px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px',
                    minHeight: '200px',
                  }}
                >
                  {tagData.map((item, index) => (
                    <div
                      key={item.tag}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        animation: `slideInUp 0.5s ease forwards`,
                        animationDelay: `${index * 0.08}s`,
                        opacity: 0,
                        cursor: 'default',
                        transition: 'transform var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={getTagStyle(index, maxTagCount, item.count)}>
                        {item.tag}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                          backgroundColor: 'rgba(139, 90, 43, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-light)',
                    fontSize: '14px',
                  }}
                >
                  暂无标签数据
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;
