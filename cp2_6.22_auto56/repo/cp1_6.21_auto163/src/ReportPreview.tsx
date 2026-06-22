import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import type { WeeklyReport, ReportConfig as ReportConfigType } from './types';

interface ReportPreviewProps {
  config: ReportConfigType;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ config }) => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.studentId || !config.startDate || !config.endDate) return;

    setLoading(true);
    const timer = setTimeout(() => {
      axios
        .get<WeeklyReport>('/api/report', {
          params: {
            studentId: config.studentId,
            startDate: config.startDate,
            endDate: config.endDate,
          },
        })
        .then((res) => setReport(res.data))
        .catch((err) => console.error('获取周报失败:', err))
        .finally(() => setLoading(false));
    }, 50);

    return () => clearTimeout(timer);
  }, [config.studentId, config.startDate, config.endDate]);

  const handleExportPNG = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        width: 1200,
        height: 800,
        scale: 1,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `学习周报_${report?.studentName || ''}_${config.startDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('导出PNG失败:', err);
    }
  };

  const formatDateRange = (start: string, end: string): string => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`;
  };

  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
  };

  return (
    <section className="preview-section">
      <div className="preview-header">
        <h2 style={{ margin: 0, fontSize: '18px', color: '#1F2937' }}>周报预览</h2>
        <button
          onClick={handleExportPNG}
          className="export-btn"
          disabled={!report}
        >
          导出PNG
        </button>
      </div>

      <div className="preview-wrapper" ref={previewRef}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : report ? (
          <div className="report-content">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="avatar" />
              <div style={{ fontSize: '16px', color: '#6B7280', marginTop: '12px' }}>
                {report.studentName}
              </div>
              <h1 style={reportTitleStyle}>学习周报</h1>
              <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                {formatDateRange(report.startDate, report.endDate)}
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">本周学习时长</div>
                <div className="stat-number">{formatMinutes(report.totalMinutes)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">完成章节</div>
                <div className="stat-number">{report.completedChapters.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">成绩趋势</div>
                <div className="stat-number" style={{ fontSize: '20px' }}>
                  {report.scoreTrend}
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ marginTop: '16px' }}>
              <div className="stat-label">已完成章节</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {report.completedChapters.map((ch) => (
                  <span key={ch.id} className="chapter-tag">
                    {ch.name}
                  </span>
                ))}
              </div>
            </div>

            {config.includeChart && (
              <div className="stat-card" style={{ marginTop: '16px' }}>
                <div className="stat-label">测验成绩趋势</div>
                <ScoreChart scores={report.quizScores} />
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: '#6B7280' }}>
                  {report.scoreTrend}
                </div>
              </div>
            )}

            {report.reviewItems.length > 0 && (
              <div className="stat-card" style={{ marginTop: '16px' }}>
                <div className="stat-label">待复习知识点</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {report.reviewItems.map((item, idx) => (
                    <div key={idx} className="review-card">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', color: '#1F2937', fontWeight: 500 }}>
                          {item.chapterName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                          平均分数: {item.averageScore}分
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {config.includeRecommendations && (
              <div className="stat-card" style={{ marginTop: '16px' }}>
                <div className="stat-label">推荐学习内容</div>
                <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px', color: '#4B5563' }}>
                  {report.recommendedContent.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '6px', fontSize: '14px' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="loading">请选择学员和日期范围</div>
        )}
      </div>
    </section>
  );
};

const reportTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#1F2937',
  fontWeight: 700,
  margin: '8px 0 4px 0',
};

interface ScoreChartProps {
  scores: { score: number; date: string }[];
}

const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const value = 100 - (100 / 5) * i;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value), padding.left - 8, y);
    }

    if (scores.length === 0) {
      console.log(`图表渲染耗时: ${performance.now() - startTime}ms`);
      return;
    }

    const xStep = scores.length > 1 ? chartWidth / (scores.length - 1) : 0;

    const points = scores.map((s, i) => ({
      x: padding.left + xStep * i,
      y: padding.top + chartHeight - (s.score / 100) * chartHeight,
    }));

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.fillStyle = '#3B82F6';
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    scores.forEach((s, i) => {
      const x = padding.left + xStep * i;
      const monthDay = s.date.slice(5);
      ctx.fillText(monthDay, x, height - padding.bottom + 8);
    });

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`图表渲染超过50ms: ${elapsed}ms`);
    }
  }, [scores]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={220}
      style={{ width: '100%', height: 'auto', maxWidth: '560px', marginTop: '8px' }}
    />
  );
};

export default ReportPreview;
