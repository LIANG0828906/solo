import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import Chart from 'chart.js/auto';

function interpolateColor(count: number, maxCount: number): string {
  if (maxCount === 0) return '#F0F4F8';
  const ratio = Math.min(count / maxCount, 1);
  const r1 = 187, g1 = 222, b1 = 251;
  const r2 = 21, g2 = 101, b2 = 192;
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r},${g},${b})`;
}

export default function AnalyticsBoard() {
  const {
    analysisData,
    selectedCourseId,
    dateRange,
    setDateRange,
    fetchAnalysis,
  } = useStore();

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAnalysis(selectedCourseId);
    }
  }, [selectedCourseId, dateRange]);

  const buildLineChart = useCallback(() => {
    if (!lineChartRef.current || !analysisData) return;

    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }

    const ctx = lineChartRef.current.getContext('2d');
    if (!ctx) return;

    lineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: analysisData.dailyAverages.map((d) => d.date.slice(5)),
        datasets: [
          {
            label: '每日平均分',
            data: analysisData.dailyAverages.map((d) => d.avgScore),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76,175,80,0.1)',
            pointRadius: 4,
            pointBackgroundColor: '#4CAF50',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: { stepSize: 1 },
            grid: {
              color: '#E0E0E0',
              borderDash: [5, 5],
            },
          },
          x: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }, [analysisData]);

  const buildPieChart = useCallback(() => {
    if (!pieChartRef.current || !analysisData) return;

    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

    const ctx = pieChartRef.current.getContext('2d');
    if (!ctx) return;

    const { positive, neutral, negative } = analysisData.sentimentBreakdown;

    pieChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['正面', '中性', '负面'],
        datasets: [
          {
            data: [positive, neutral, negative],
            backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = positive + neutral + negative;
                const value = context.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${value}条 (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }, [analysisData]);

  useEffect(() => {
    buildLineChart();
    buildPieChart();

    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
        pieChartInstance.current = null;
      }
    };
  }, [buildLineChart, buildPieChart]);

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange({ ...dateRange, [field]: value });
  };

  const handleHeatmapClick = (date: string) => {
    setDateRange({ start: date, end: date });
  };

  const maxCount = analysisData
    ? Math.max(...analysisData.dailyFeedbackCounts.map((d) => d.count), 1)
    : 1;

  return (
    <div>
      <div className="date-filter">
        <label>起始日期:</label>
        <input
          type="date"
          className="date-input"
          value={dateRange.start}
          onChange={(e) => handleDateChange('start', e.target.value)}
        />
        <label>结束日期:</label>
        <input
          type="date"
          className="date-input"
          value={dateRange.end}
          onChange={(e) => handleDateChange('end', e.target.value)}
        />
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h4>📊 每日平均分趋势</h4>
          <div className="chart-container">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        <div>
          <div className="chart-card">
            <h4>🎯 情绪占比分析</h4>
            <div className="chart-container">
              <canvas ref={pieChartRef} />
            </div>
          </div>

          <div className="chart-card" style={{ marginTop: 20 }}>
            <div className="heatmap-section">
              <h4>🗓️ 反馈量热力图</h4>
              <div className="heatmap-grid">
                {analysisData?.dailyFeedbackCounts.map((d) => (
                  <div
                    key={d.date}
                    className="heatmap-cell"
                    style={{ backgroundColor: interpolateColor(d.count, maxCount) }}
                    onClick={() => handleHeatmapClick(d.date)}
                  >
                    <span>{d.date.slice(8)}</span>
                    <span className="tooltip">
                      {d.date}: {d.count}条反馈
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
