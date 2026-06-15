import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useDefectStore } from '@/utils/defectStore';
import { CATEGORY_COLORS, DEFECT_CATEGORIES } from '@/utils/types';
import type { DailyReport } from '@/utils/types';
import { Download, Link, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const barHoverPlugin = {
  id: 'barHoverEffect',
  beforeDatasetDraw: (chart: any, args: any) => {
    const { meta } = args;
    if (meta.type !== 'bar') return;

    const hoveredIndex = chart.$hoveredBarIndex ?? null;

    meta.data.forEach((element: any, index: number) => {
      if (hoveredIndex === index) {
        element.y -= 5;
        element.height += 5;
      }
    });
  },
  afterDatasetDraw: (chart: any, args: any) => {
    const { ctx, meta } = args;
    if (meta.type !== 'bar') return;

    const hoveredIndex = chart.$hoveredBarIndex ?? null;

    meta.data.forEach((element: any, index: number) => {
      if (hoveredIndex === index) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        const { x, y, width, height } = element;
        const radius = element.options.borderRadius || 0;

        ctx.fillStyle = CATEGORY_COLORS[DEFECT_CATEGORIES[index]];
        ctx.beginPath();
        const r = radius;
        const left = x - width / 2;
        const right = x + width / 2;
        const top = y;
        const bottom = y + height;

        ctx.moveTo(left + r, top);
        ctx.lineTo(right - r, top);
        ctx.quadraticCurveTo(right, top, right, top + r);
        ctx.lineTo(right, bottom - r);
        ctx.quadraticCurveTo(right, bottom, right - r, bottom);
        ctx.lineTo(left + r, bottom);
        ctx.quadraticCurveTo(left, bottom, left, bottom - r);
        ctx.lineTo(left, top + r);
        ctx.quadraticCurveTo(left, top, left + r, top);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
  },
};

ChartJS.register(barHoverPlugin);

export default function TrendPage() {
  const { trendData, reports, loading, fetchTrend, fetchReports } = useDefectStore();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTrend();
    fetchReports();
  }, [fetchTrend, fetchReports]);

  const lineChartData = {
    labels: trendData.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: '不良率 (%)',
        data: trendData.map((d) => d.defectRate),
        borderColor: '#3b82f6',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, '#3b82f633');
          gradient.addColorStop(1, '#3b82f600');
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: '#1e293b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0].dataIndex;
            return trendData[idx]?.date || '';
          },
          label: (item: any) => {
            const idx = item.dataIndex;
            const d = trendData[idx];
            return [
              `不良率: ${d.defectRate}%`,
              `检测数: ${d.totalInspected}`,
              `缺陷数: ${d.defectCount}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          font: { size: 12 },
          color: '#64748b',
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const categoryData = (() => {
    const counts: Record<string, number> = {};
    DEFECT_CATEGORIES.forEach((c) => (counts[c] = 0));
    reports.forEach((r) => {
      r.categoryBreakdown.forEach((b) => {
        counts[b.category] = (counts[b.category] || 0) + b.count;
      });
    });
    return DEFECT_CATEGORIES.map((cat) => ({
      category: cat,
      count: counts[cat],
    }));
  })();

  const barChartData = {
    labels: categoryData.map((d) => d.category),
    datasets: [
      {
        label: '缺陷数量',
        data: categoryData.map((d) => d.count),
        backgroundColor: DEFECT_CATEGORIES.map((c) => CATEGORY_COLORS[c]),
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 6,
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
      },
      barHoverEffect: {},
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
        },
        ticks: {
          font: { size: 12 },
          color: '#64748b',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 12, weight: 500 as const },
          color: '#334155',
        },
      },
    },
    onHover: (event: any, elements: any[], chart: any) => {
      if (elements.length > 0) {
        chart.$hoveredBarIndex = elements[0].index;
        setHoveredBarIndex(elements[0].index);
      } else {
        chart.$hoveredBarIndex = null;
        setHoveredBarIndex(null);
      }
    },
  };

  const getBorderColor = (rate: number) => {
    if (rate < 2) return '#22c55e';
    if (rate <= 5) return '#eab308';
    return '#ef4444';
  };

  const getStatusIcon = (rate: number) => {
    if (rate < 2) return <TrendingDown size={16} className="text-green-500" />;
    if (rate <= 5) return <AlertCircle size={16} className="text-yellow-500" />;
    return <TrendingUp size={16} className="text-red-500" />;
  };

  const handleDownload = (report: DailyReport) => {
    const content = `不良率日报 - ${report.date}
=====================
检测总数: ${report.totalInspected}
缺陷数量: ${report.defectCount}
不良率: ${report.defectRate}%

各类缺陷占比:
${report.categoryBreakdown.map((b) => `  ${b.category}: ${b.count}个 (${b.percentage}%)`).join('\n')}

生成时间: ${new Date(report.createdAt).toLocaleString()}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `不良率报告_${report.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = (report: DailyReport) => {
    const text = `【不良率日报】${report.date}\n检测总数: ${report.totalInspected}\n缺陷数: ${report.defectCount}\n不良率: ${report.defectRate}%`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('报告链接已复制到剪贴板');
    } else {
      alert(text);
    }
  };

  const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="flex gap-6 h-full">
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <SkeletonLine />
            <SkeletonLine />
          </div>
        </div>
        <div className="w-[320px] space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm h-[160px]">
              <SkeletonLine />
              <SkeletonLine />
              <SkeletonLine />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">近30天不良率趋势</h2>
          <div style={{ height: '280px' }}>
            {trendData.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">缺陷类别分布</h2>
          <div style={{ height: '240px' }}>
            {categoryData.some((d) => d.count > 0) ? (
              <Bar key={hoveredBarIndex} data={barChartData} options={barChartOptions as any} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      <div className="w-[320px] flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">每日报告</h2>
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {sortedReports.length > 0 ? (
            sortedReports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                style={{
                  backgroundColor: '#f8fafc',
                  borderLeft: `4px solid ${getBorderColor(report.defectRate)}`,
                  height: '160px',
                }}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{report.date}</span>
                    {getStatusIcon(report.defectRate)}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold" style={{ color: getBorderColor(report.defectRate) }}>
                      {report.defectRate}%
                    </span>
                    <span className="text-xs text-gray-500">不良率</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 flex-1">
                    <div className="flex justify-between">
                      <span>检测总数</span>
                      <span className="font-medium text-gray-700">{report.totalInspected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>缺陷数量</span>
                      <span className="font-medium text-gray-700">{report.defectCount}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleDownload(report)}
                      className="flex-1 flex items-center justify-center gap-1 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                      style={{ height: '28px' }}
                    >
                      <Download size={12} />
                      下载
                    </button>
                    <button
                      onClick={() => handleShare(report)}
                      className="flex-1 flex items-center justify-center gap-1 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                      style={{ height: '28px' }}
                    >
                      <Link size={12} />
                      分享
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="暂无报告数据" />
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonLine() {
  return (
    <div className="h-5 rounded animate-pulse mb-3 last:mb-0" style={{ width: '60%', backgroundColor: '#e2e8f0' }}></div>
  );
}

function EmptyState({ text = '暂无数据' }: { text?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="mb-2" style={{ color: '#e2e8f0' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: '#94a3b8', fontSize: '14px' }}>{text}</p>
    </div>
  );
}
