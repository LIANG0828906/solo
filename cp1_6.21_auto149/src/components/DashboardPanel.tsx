import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuction } from '../context/AuctionContext';

function formatPrice(n: number): string {
  if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + '万';
  return '¥' + n.toLocaleString('zh-CN');
}

function formatPriceFull(n: number): string {
  return '¥' + n.toLocaleString('zh-CN');
}

interface ChartPoint {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export default function DashboardPanel() {
  const { bids, highestBid, selectedProductId } = useAuction();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 320 });
  const [fadeKey, setFadeKey] = useState(0);
  const animFrameRef = useRef<number>(0);
  const prevBidsLenRef = useRef(0);
  const pointsRef = useRef<ChartPoint[]>([]);
  const animProgressRef = useRef(1);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [selectedProductId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setCanvasSize({ width: Math.floor(width), height: 320 });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drawChart = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas || bids.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvasSize.width;
      const h = canvasSize.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);

      const pad = { top: 30, right: 30, bottom: 40, left: 70 };
      const cw = w - pad.left - pad.right;
      const ch = h - pad.top - pad.bottom;

      ctx.clearRect(0, 0, w, h);

      const amounts = bids.map((b) => b.amount);
      const minAmt = Math.min(...amounts);
      const maxAmt = Math.max(...amounts);
      const range = maxAmt - minAmt || 1;
      const yPad = range * 0.1;
      const yMin = minAmt - yPad;
      const yMax = maxAmt + yPad;

      const gridLines = 5;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'right';

      for (let i = 0; i <= gridLines; i++) {
        const y = pad.top + (ch / gridLines) * i;
        const val = yMax - ((yMax - yMin) / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + cw, y);
        ctx.stroke();
        ctx.fillText(formatPrice(Math.round(val)), pad.left - 8, y + 4);
      }

      ctx.textAlign = 'center';
      const step = Math.max(1, Math.floor(bids.length / 6));
      for (let i = 0; i < bids.length; i += step) {
        const x = pad.left + (cw / Math.max(bids.length - 1, 1)) * i;
        const d = new Date(bids[i].timestamp);
        const label =
          String(d.getMinutes()).padStart(2, '0') +
          ':' +
          String(d.getSeconds()).padStart(2, '0');
        ctx.fillText(label, x, h - pad.bottom + 20);
      }

      const toX = (i: number) =>
        pad.left + (cw / Math.max(bids.length - 1, 1)) * i;
      const toY = (amt: number) =>
        pad.top + ch - ((amt - yMin) / (yMax - yMin)) * ch;

      if (highestBid > 0) {
        const hy = toY(highestBid);
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, hy);
        ctx.lineTo(pad.left + cw, hy);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(formatPriceFull(highestBid), pad.left + cw + 4, hy + 4);
      }

      const points: { x: number; y: number }[] = bids.map((b, i) => ({
        x: toX(i),
        y: toY(b.amount),
      }));

      const animPts = points.map((p, i) => {
        if (progress >= 1) return p;
        const prev = pointsRef.current[i];
        if (prev) {
          return {
            x: prev.x + (p.x - prev.x) * progress,
            y: prev.y + (p.y - prev.y) * progress,
          };
        }
        return {
          x: pad.left + (p.x - pad.left) * progress,
          y: pad.top + ch + (p.y - pad.top - ch) * progress,
        };
      });

      if (progress >= 1) {
        pointsRef.current = points;
      }

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      animPts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
      grad.addColorStop(0, 'rgba(59,130,246,0.25)');
      grad.addColorStop(1, 'rgba(59,130,246,0.02)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      animPts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.lineTo(animPts[animPts.length - 1].x, pad.top + ch);
      ctx.lineTo(animPts[0].x, pad.top + ch);
      ctx.closePath();
      ctx.fill();

      animPts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#3B82F6';
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    },
    [bids, highestBid, canvasSize]
  );

  useEffect(() => {
    const newLen = bids.length;
    if (newLen > prevBidsLenRef.current && prevBidsLenRef.current > 0) {
      animProgressRef.current = 0;
      const start = performance.now();
      const duration = 150;
      const animate = (now: number) => {
        const elapsed = now - start;
        const p = Math.min(elapsed / duration, 1);
        animProgressRef.current = p;
        drawChart(p);
        if (p < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      drawChart(1);
    }
    prevBidsLenRef.current = newLen;
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [bids, drawChart]);

  const totalBids = bids.length;
  const maxBid = totalBids > 0 ? Math.max(...bids.map((b) => b.amount)) : 0;
  const avgBid =
    totalBids > 0
      ? Math.round(bids.reduce((s, b) => s + b.amount, 0) / totalBids)
      : 0;

  const stats = [
    { label: '总出价次数', value: String(totalBids) },
    { label: '最高出价', value: formatPriceFull(maxBid) },
    { label: '平均出价', value: formatPriceFull(avgBid) },
  ];

  return (
    <div
      key={fadeKey}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minWidth: 0,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        ref={containerRef}
        style={{
          background: '#1E293B',
          borderRadius: '8px',
          border: '0.5px solid #334155',
          padding: '16px',
          flex: 1,
          minHeight: '320px',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            color: '#F8FAFC',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          出价趋势
        </div>
        {bids.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '280px',
              color: '#64748B',
              fontSize: '14px',
            }}
          >
            暂无出价数据
          </div>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 160px)',
          gap: '12px',
          justifyContent: 'start',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              width: '160px',
              height: '80px',
              background: '#1E293B',
              borderRadius: '8px',
              border: '0.5px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#F8FAFC',
                lineHeight: 1.3,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '14px', color: '#94A3B8' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
