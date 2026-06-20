import type { TrendDataPoint, EmotionStats } from '@/types';

export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: TrendDataPoint[],
  animationProgress: number = 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) return;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const points: { x: number; y: number }[] = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.count / maxCount) * chartHeight * animationProgress,
  }));

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  if (points.length >= 2) {
    const gradient = ctx.createLinearGradient(
      points[0].x,
      padding.top,
      points[points.length - 1].x,
      padding.top + chartHeight
    );
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();

    const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    areaGradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    areaGradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');
    ctx.fillStyle = areaGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  points.forEach((p) => {
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
    glow.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
    glow.addColorStop(1, 'rgba(102, 126, 234, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    ctx.fillText(d.time, x, height - padding.bottom + 25);
  });

  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight;
    const value = Math.round(maxCount - (i / 4) * maxCount);
    ctx.fillText(String(value), padding.left - 10, y + 4);
  }
}

export function drawPieChart(
  canvas: HTMLCanvasElement,
  stats: EmotionStats,
  animationProgress: number = 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 30;
  const innerRadius = radius * 0.55;

  ctx.clearRect(0, 0, width, height);

  const emotions = [
    { key: 'happy' as const, color: '#10B981', emoji: '😊', label: '开心' },
    { key: 'neutral' as const, color: '#F59E0B', emoji: '😐', label: '一般' },
    { key: 'sad' as const, color: '#EF4444', emoji: '😢', label: '难过' },
    { key: 'angry' as const, color: '#8B5CF6', emoji: '😡', label: '生气' },
    { key: 'excited' as const, color: '#3B82F6', emoji: '🎉', label: '兴奋' },
  ];

  const total = emotions.reduce((sum, e) => sum + stats[e.key], 0);

  if (total === 0) {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', centerX, centerY);
    return;
  }

  let startAngle = -Math.PI / 2;
  const totalRotation = animationProgress * Math.PI * 2;

  emotions.forEach((emotion) => {
    const count = stats[emotion.key];
    if (count === 0) return;

    const sliceAngle = (count / total) * Math.PI * 2 * animationProgress;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = emotion.color;
    ctx.fill();

    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), centerX, centerY - 8);
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
  ctx.fillText('总反馈', centerX, centerY + 18);
}
