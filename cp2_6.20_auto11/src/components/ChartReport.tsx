import { useRef, useEffect } from 'react';
import type { Question } from '@/utils/api';
import { useQuizStore } from '@/hooks/useQuizStore';
import { QUESTION_TYPE_LABELS } from '@/utils/api';
import { ArrowLeft } from 'lucide-react';

interface AnswerState {
  selected: string | string[];
  answered: boolean;
  correct: boolean;
}

interface ChartReportProps {
  answers: AnswerState[];
  questions: Question[];
  duration: number;
  onBack: () => void;
}

export default function ChartReport({ answers, questions, duration, onBack }: ChartReportProps) {
  const pieRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const practiceHistory = useQuizStore((s) => s.practiceHistory);

  const totalCorrect = answers.filter((a) => a.correct).length;
  const accuracy = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  useEffect(() => {
    drawPieChart();
  }, [answers, questions]);

  useEffect(() => {
    drawBarChart();
  }, [practiceHistory]);

  const byType: Record<string, { total: number; correct: number }> = {};
  questions.forEach((q, i) => {
    const t = q.type;
    if (!byType[t]) byType[t] = { total: 0, correct: 0 };
    byType[t].total++;
    if (answers[i].correct) byType[t].correct++;
  });

  const drawPieChart = () => {
    const canvas = pieRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 40;

    const types = Object.keys(byType);
    const colors = ['#4A90D9', '#357ABD', '#6BB5FF', '#2E6BA6'];
    const total = types.reduce((sum, t) => sum + byType[t].total, 0);

    let startAngle = -Math.PI / 2;
    types.forEach((type, i) => {
      const sliceAngle = (byType[type].total / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      const correctPct = Math.round((byType[type].correct / byType[type].total) * 100);
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = cx + Math.cos(midAngle) * radius * 0.6;
      const labelY = cy + Math.sin(midAngle) * radius * 0.6;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${QUESTION_TYPE_LABELS[type]}`, labelX, labelY - 8);
      ctx.font = '12px sans-serif';
      ctx.fillText(`${correctPct}%`, labelX, labelY + 10);

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#F8F9FA';
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${accuracy}%`, cx, cy - 6);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('正确率', cx, cy + 14);
  };

  const drawBarChart = () => {
    const canvas = barRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };

    const dailyData = getDailyData();
    if (dailyData.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无历史练习数据', w / 2, h / 2);
      return;
    }

    const maxVal = Math.max(...dailyData.map((d) => d.count), 1);
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = Math.min(40, chartW / dailyData.length - 10);

    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('每日练习数量', w / 2, 16);

    dailyData.forEach((d, i) => {
      const x = padding.left + (i + 0.5) * (chartW / dailyData.length) - barWidth / 2;
      const barH = (d.count / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, '#4A90D9');
      gradient.addColorStop(1, '#357ABD');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(d.count), x + barWidth / 2, y + 14);

      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, h - padding.bottom + 18);
    });
  };

  const getDailyData = () => {
    const map = new Map<string, number>();
    practiceHistory.forEach((r) => {
      const date = new Date(r.duration ? Date.now() - 0 : Date.now()).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      map.set(date, (map.get(date) || 0) + r.total);
    });
    return Array.from(map.entries())
      .slice(-7)
      .map(([label, count]) => ({ label, count }));
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}分${sec}秒`;
  };

  return (
    <div className="chart-report">
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          返回题库
        </button>
        <h2 className="report-title">练习成绩报告</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{questions.length}</div>
          <div className="stat-label">总题数</div>
        </div>
        <div className="stat-card stat-correct">
          <div className="stat-value">{totalCorrect}</div>
          <div className="stat-label">正确数</div>
        </div>
        <div className="stat-card stat-accuracy">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">正确率</div>
        </div>
        <div className="stat-card stat-time">
          <div className="stat-value">{formatDuration(duration)}</div>
          <div className="stat-label">用时</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">各题型正确率</h3>
          <canvas ref={pieRef} className="chart-canvas" />
        </div>
        <div className="chart-card">
          <h3 className="chart-title">每日练习数量</h3>
          <canvas ref={barRef} className="chart-canvas" />
        </div>
      </div>
    </div>
  );
}
