import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api, type WeeklyReport as WeeklyReportType } from '../api';

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function formatCNDate(d: string): string {
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}年${MONTH_NAMES[dt.getMonth()]}${dt.getDate()}日`;
  } catch {
    return d;
  }
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return WEEK_LABELS[d.getDay()];
}

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReportType | null>(null);

  useEffect(() => {
    api.getWeeklyReport(0).then(setReport).catch(() => {});
  }, []);

  const chartData = (report?.dailyBreakdown || []).map((d) => ({
    label: dayLabel(d.date),
    阅读分钟: d.minutes,
    笔记数: d.noteCount,
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <button className="report-back" onClick={() => navigate('/')}>
          ← 返回书架
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#4A2C17', letterSpacing: '1px' }}>
          个人阅读周报
        </h1>
        <button className="report-print-btn" onClick={handlePrint}>
          🖨 打印 / 导出 PDF
        </button>
      </div>

      <div className="report-document">
        <div className="report-doc-title">📚 每周阅读报告</div>
        <div className="report-date-range">
          {report
            ? `${formatCNDate(report.dateRange.start)} — ${formatCNDate(report.dateRange.end)}`
            : '加载中...'}
        </div>

        <div className="report-summary">
          <div className="summary-tile">
            <div className="num">{report?.totalHours ?? 0}</div>
            <div className="tag">本周总阅读时长 (小时)</div>
          </div>
          <div className="summary-tile">
            <div className="num">{report?.booksRead.length ?? 0}</div>
            <div className="tag">在读 / 翻阅书籍数</div>
          </div>
          <div className="summary-tile">
            <div className="num">{report?.totalNotes ?? 0}</div>
            <div className="tag">新增笔记数</div>
          </div>
        </div>

        <div className="section-title">📈 每日阅读分布</div>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 20, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3D5C3A" />
                    <stop offset="100%" stopColor="#2E4A2A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 94, 60, 0.1)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#6B4423' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#8B5E3C' }} tickLine={false} unit="m" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#8B5E3C' }} tickLine={false} unit="条" />
                <Tooltip
                  contentStyle={{
                    background: '#FAF6EB',
                    border: '1px solid #C9A86C',
                    borderRadius: 6,
                    fontFamily: "'Noto Serif SC', serif",
                    color: '#4A2C17',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 14 }} />
                <Bar yAxisId="left" dataKey="阅读分钟" fill="url(#barGreen)" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="笔记数" fill="#C9A86C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#8B5E3C', fontStyle: 'italic' }}>
            暂无本周数据
          </div>
        )}

        <div className="section-title">📅 每日详情</div>
        <table className="daily-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>星期</th>
              <th>阅读时长 (分钟)</th>
              <th>笔记数</th>
            </tr>
          </thead>
          <tbody>
            {(report?.dailyBreakdown || []).map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{dayLabel(d.date)}</td>
                <td>
                  <strong style={{ color: '#2E4A2A' }}>{d.minutes}</strong>
                </td>
                <td>{d.noteCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(46, 74, 42, 0.08)', fontWeight: 700 }}>
              <td colSpan={2}>本周合计</td>
              <td style={{ color: '#2E4A2A' }}>
                {(report?.dailyBreakdown || []).reduce((a, b) => a + b.minutes, 0)} 分钟 (
                {((report?.dailyBreakdown || []).reduce((a, b) => a + b.minutes, 0) / 60).toFixed(1)} 小时)
              </td>
              <td style={{ color: '#2E4A2A' }}>{(report?.dailyBreakdown || []).reduce((a, b) => a + b.noteCount, 0)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="section-title">📖 本周翻阅的书籍</div>
        {report?.booksRead?.length ? (
          <div className="books-list">
            {report.booksRead.map((t, i) => (
              <span key={i} className="book-chip">
                📕 {t}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ padding: '14px 4px', color: '#8B5E3C', fontStyle: 'italic' }}>
            本周还没有开始阅读，明天继续加油吧！
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            fontSize: 12,
            color: '#8B5E3C',
            fontStyle: 'italic',
            borderTop: '1px solid rgba(201, 168, 108, 0.5)',
            paddingTop: 14,
          }}
        >
          阅读点亮生活 · 坚持即是胜利 🌿
        </div>
      </div>
    </div>
  );
}
