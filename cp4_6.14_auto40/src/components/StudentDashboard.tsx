import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApp } from '../App';
import { StudentProgress, Booking } from '../types';

const COLORS = {
  primary: '#F59E0B',
  secondary: '#FCD34D',
  background: '#FEF3C7',
  bg: '#FFFBEB',
  text: '#1F2937',
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  delay: number;
  visible: boolean;
}> = ({ label, value, icon, delay, visible }) => (
  <div
    style={{
      flex: '1 1 0',
      minWidth: 0,
      background: '#fff',
      borderRadius: 12,
      padding: '20px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.primary,
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{value}</div>
    </div>
  </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= Math.round(rating) ? COLORS.primary : '#E5E7EB',
          fontSize: 14,
        }}
      >
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
};

export default function StudentDashboard() {
  const { currentUser, bookings } = useApp();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [visible, setVisible] = useState(false);
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/students/${currentUser.id}/progress`)
      .then((r) => r.json())
      .then((data: StudentProgress) => {
        setProgress(data);
        requestAnimationFrame(() => setVisible(true));
      })
      .catch(() => {
        requestAnimationFrame(() => setVisible(true));
      });
  }, [currentUser.id]);

  useEffect(() => {
    if (!progress || !chartCanvasRef.current) return;
    const t0 = performance.now();
    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth || 480;
    const displayHeight = 260;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const data = progress.ratingHistory;
    const padding = { top: 20, right: 20, bottom: 35, left: 40 };
    const chartWidth = displayWidth - padding.left - padding.right;
    const chartHeight = displayHeight - padding.top - padding.bottom;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (data.length > 0) {
      const minY = 0;
      const maxY = 5;
      const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * (maxY - i)) / (maxY - minY);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(displayWidth - padding.right, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px Poppins, sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * (maxY - i)) / (maxY - minY) + 4;
        ctx.fillText(String(i), padding.left - 8, y);
      }

      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      data.forEach((d, i) => {
        const x = padding.left + i * xStep;
        const date = d.date.slice(5);
        if (i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1) {
          ctx.fillText(date, x, displayHeight - padding.bottom + 20);
        }
      });

      const points = data.map((d, i) => ({
        x: padding.left + i * xStep,
        y: padding.top + (chartHeight * (maxY - d.rating)) / (maxY - minY),
      }));

      const gradient = ctx.createLinearGradient(0, padding.top, 0, displayHeight - padding.bottom);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
      ctx.beginPath();
      ctx.moveTo(points[0].x, displayHeight - padding.bottom);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, displayHeight - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cpX = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cpX, prev.y, cpX, p.y, p.x, p.y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
      });
    } else {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无评价数据', displayWidth / 2, displayHeight / 2);
    }

    const renderTime = performance.now() - t0;
    console.log('Line chart rendered in', renderTime.toFixed(2), 'ms');
    setChartImageUrl(canvas.toDataURL('image/png'));
  }, [progress]);

  const completedBookings = Array.isArray(bookings)
    ? bookings.filter((b: Booking) => b.status === 'completed' && b.review)
    : [];
  const recentReviews = completedBookings
    .filter((b) => b.review)
    .sort((a, b) => new Date(b.review!.createdAt).getTime() - new Date(a.review!.createdAt).getTime())
    .slice(0, 5);

  const completionRate = progress?.completionRate ?? 0;
  const pieData = [
    { name: '已完成', value: completionRate },
    { name: '未完成', value: 100 - completionRate },
  ];

  return (
    <div style={{ padding: 24, background: COLORS.bg, minHeight: '100%', color: COLORS.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: COLORS.text }}>
        学习进度
      </h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard
          label="总课时数"
          value={progress?.totalBookings ?? '—'}
          icon={<span>📚</span>}
          delay={0}
          visible={visible}
        />
        <StatCard
          label="完成率"
          value={progress ? `${progress.completionRate}%` : '—'}
          icon={<span>✅</span>}
          delay={100}
          visible={visible}
        />
        <StatCard
          label="任务完成率"
          value={progress ? `${progress.taskCompletionRate}%` : '—'}
          icon={<span>📝</span>}
          delay={200}
          visible={visible}
        />
        <StatCard
          label="平均评价分"
          value={progress ? progress.averageRating.toFixed(1) : '—'}
          icon={<span>⭐</span>}
          delay={300}
          visible={visible}
        />
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: '3 1 400px',
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.text }}>
            评价趋势 (折线图)
          </h3>
          <canvas
            ref={chartCanvasRef}
            style={{
              position: 'absolute',
              left: -9999,
              top: -9999,
              width: '500px',
              height: '260px',
            }}
          />
          {chartImageUrl ? (
            <img
              src={chartImageUrl}
              alt="评价趋势图"
              style={{
                width: '100%',
                height: 260,
                display: 'block',
                animation: 'fadeIn 0.3s ease',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: 260, background: '#fafafa', borderRadius: 8 }} />
          )}
        </div>

        <div
          style={{
            flex: '2 1 280px',
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.text, alignSelf: 'flex-start' }}>
            完成率 (环形图)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill={COLORS.primary} />
                <Cell fill={COLORS.background} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: -8 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary }}>
              {completionRate}%
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>课程完成率</div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.text }}>
          评价记录
        </h3>
        {recentReviews.length === 0 ? (
          <div style={{ color: '#9CA3AF', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            暂无评价记录
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentReviews.map((booking) => {
              const review = booking.review!;
              return (
                <div
                  key={review.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <StarRating rating={review.rating} />
                      <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.description}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
                    {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
