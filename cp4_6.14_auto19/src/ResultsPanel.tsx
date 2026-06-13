import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { Poll, PollOption } from './types';

interface ResultsPanelProps {
  poll: Poll;
}

const cardStyles: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '20px',
  padding: '28px',
  border: '1px solid var(--border-color)',
  animation: 'fadeInUp 0.5s ease-out',
  animationDelay: '0.1s',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const shareCardStyles: React.CSSProperties = {
  marginTop: '24px',
  padding: '20px',
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(249, 115, 22, 0.08))',
  border: '1px solid var(--border-color)',
  borderRadius: '16px',
};

const shareImageWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const shareHintStyles: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const canvasContainerStyles: React.CSSProperties = {
  width: '100%',
  position: 'relative',
};

const performanceBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  padding: '4px 10px',
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#10b981',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '999px',
  fontFamily: 'monospace',
  zIndex: 2,
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  const w = size;
  const h = size * 0.8;

  const gradient = ctx.createLinearGradient(0, -h * 0.7, 0, h * 0.4);
  gradient.addColorStop(0, '#fde68a');
  gradient.addColorStop(0.4, '#fbbf24');
  gradient.addColorStop(1, '#d97706');

  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const baseY = h * 0.35;
  ctx.moveTo(-w / 2, baseY);
  ctx.lineTo(-w / 2, -h * 0.15);
  ctx.lineTo(-w * 0.25, -h * 0.6);
  ctx.lineTo(0, -h * 0.1);
  ctx.lineTo(w * 0.25, -h * 0.6);
  ctx.lineTo(w / 2, -h * 0.15);
  ctx.lineTo(w / 2, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(-w * 0.25, -h * 0.65, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -h * 0.15, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.25, -h * 0.65, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.12, -h * 0.05, w * 0.06, h * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.fillRect(-w / 2, baseY - 1, w, size * 0.1);

  ctx.restore();
}

const BAR_H = 32;
const BAR_GAP = 16;
const PAD_LEFT = 24;
const PAD_RIGHT = 120;
const CROWN_TOP = 38;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 16;

const ResultsPanel: React.FC<ResultsPanelProps> = ({ poll }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const offCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cachedSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const rafIdRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [showShare, setShowShare] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const prevPollIdRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  const totalVotes = useMemo(
    () => poll.options.reduce((s, o) => s + o.votes, 0),
    [poll.options]
  );

  const maxVotes = useMemo(
    () => Math.max(...poll.options.map((o) => o.votes), 1),
    [poll.options]
  );

  const winnerIds = useMemo(() => {
    const mx = Math.max(...poll.options.map((o) => o.votes), 0);
    if (mx === 0) return [] as string[];
    return poll.options.filter((o) => o.votes === mx).map((o) => o.id);
  }, [poll.options]);

  const canvasHeight = useMemo(
    () => MARGIN_TOP + MARGIN_BOTTOM + CROWN_TOP + poll.options.length * (BAR_H + BAR_GAP) - BAR_GAP,
    [poll.options.length]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.min(entry.contentRect.width - 16, 800);
        setCanvasWidth(Math.max(260, w));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getOrCreateOffscreen = useCallback((w: number, h: number, dpr: number): CanvasRenderingContext2D | null => {
    if (
      offscreenRef.current &&
      cachedSizeRef.current.w === w * dpr &&
      cachedSizeRef.current.h === h * dpr &&
      offCtxRef.current
    ) {
      return offCtxRef.current;
    }
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const oc = offscreenRef.current;
    oc.width = w * dpr;
    oc.height = h * dpr;
    cachedSizeRef.current = { w: w * dpr, h: h * dpr };
    const ctx = oc.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offCtxRef.current = ctx;
    return ctx;
  }, []);

  const drawBars = useCallback(
    (ctx: CanvasRenderingContext2D, options: PollOption[], widths: number[], w: number, h: number, drawCrownFlag: boolean = true) => {
      const startY = MARGIN_TOP + CROWN_TOP;
      const barAreaW = w - PAD_LEFT - PAD_RIGHT;

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const y = startY + i * (BAR_H + BAR_GAP);
        const barW = Math.max(2, widths[i] * barAreaW);
        const isWinner = winnerIds.includes(opt.id) && opt.votes > 0;

        if (drawCrownFlag && isWinner) {
          drawCrown(ctx, PAD_LEFT + 30, y - 6, 26);
        }

        const grad = ctx.createLinearGradient(PAD_LEFT, 0, PAD_LEFT + barW, 0);
        if (isWinner) {
          grad.addColorStop(0, '#fbbf24');
          grad.addColorStop(1, '#f97316');
        } else {
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#1d4ed8');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        const r = BAR_H / 2;
        const bw = Math.max(r * 2, barW);
        const x = PAD_LEFT;
        if (bw <= r * 2) {
          ctx.arc(x + r, y + BAR_H / 2, r, 0, Math.PI * 2);
        } else {
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + bw - r, y);
          ctx.arc(x + bw - r, y + BAR_H / 2, r, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(x + r, y + BAR_H);
          ctx.arc(x + r, y + BAR_H / 2, r, Math.PI / 2, -Math.PI / 2);
        }
        ctx.closePath();
        ctx.fill();

        const textX = PAD_LEFT + 12;
        const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : '0.0';
        const label = opt.text.length > 18 ? opt.text.slice(0, 16) + '…' : opt.text;

        ctx.font = '600 14px Outfit, -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        if (barW > 80) {
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.textAlign = 'left';
          ctx.fillText(label, textX, y + BAR_H / 2);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'left';
          ctx.fillText(label, PAD_LEFT + bw + 8, y + BAR_H / 2);
        }

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 13px Space Grotesk, Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${opt.votes}票 · ${pct}%`, w - 12, y + BAR_H / 2);
      }
    },
    [winnerIds, totalVotes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvasWidth;
    const h = canvasHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const offCtx = getOrCreateOffscreen(w, h, dpr);
    if (!offCtx) return;

    const isNewPoll = prevPollIdRef.current !== poll.id;
    if (isNewPoll) {
      prevPollIdRef.current = poll.id;
      animStartRef.current = 0;
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }

    const t0 = performance.now();

    if (isNewPoll) {
      const animate = (ts: number) => {
        if (!animStartRef.current) animStartRef.current = ts;
        const elapsed = ts - animStartRef.current;

        const widths: number[] = [];
        let allDone = true;

        for (let i = 0; i < poll.options.length; i++) {
          const delay = i * 100;
          const duration = 500;
          let t = Math.max(0, Math.min(1, (elapsed - delay) / duration));
          widths.push(easeOutCubic(t) * (poll.options[i].votes / maxVotes));
          if (t < 1) allDone = false;
        }

        offCtx.clearRect(0, 0, w, h);
        drawBars(offCtx, poll.options, widths, w, h);

        const mainCtx = canvas.getContext('2d');
        if (mainCtx) {
          mainCtx.clearRect(0, 0, canvas.width, canvas.height);
          mainCtx.drawImage(offscreenRef.current!, 0, 0);
        }

        if (!allDone) {
          rafIdRef.current = requestAnimationFrame(animate);
        } else {
          rafIdRef.current = 0;
          setRenderTime(performance.now() - t0);
        }
      };
      rafIdRef.current = requestAnimationFrame(animate);
    } else {
      const widths = poll.options.map((o) => o.votes / maxVotes);
      offCtx.clearRect(0, 0, w, h);
      drawBars(offCtx, poll.options, widths, w, h);

      const mainCtx = canvas.getContext('2d');
      if (mainCtx) {
        mainCtx.clearRect(0, 0, canvas.width, canvas.height);
        mainCtx.drawImage(offscreenRef.current!, 0, 0);
      }
      setRenderTime(performance.now() - t0);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [poll, canvasWidth, canvasHeight, maxVotes, drawBars, getOrCreateOffscreen]);

  useEffect(() => {
    if (!showShare) return;
    const sc = shareCanvasRef.current;
    if (!sc) return;

    const dpr = window.devicePixelRatio || 1;
    const sw = 800;
    const sh = Math.max(600, 200 + poll.options.length * 40 + 80);
    sc.width = sw * dpr;
    sc.height = sh * dpr;
    sc.style.width = '100%';
    sc.style.height = 'auto';

    const ctx = sc.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = ctx.createLinearGradient(0, 0, sw, sh);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, sw, sh);

    ctx.fillStyle = 'rgba(59,130,246,0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(249,115,22,0.08)';
    ctx.beginPath();
    ctx.arc(sw, sh, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Space Grotesk, Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(poll.title, 40, 40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText(
      `共 ${totalVotes} 票 · ${poll.options.length} 个选项 · ${poll.isEnded ? '已结束' : '进行中'}`,
      40,
      82
    );

    const chartTop = 120;
    const chartBottom = sh - 80;
    const chartLeft = 40;
    const chartRight = sw - 40;
    const chartH = chartBottom - chartTop;

    const sorted = [...poll.options].sort((a, b) => b.votes - a.votes);
    const optCount = sorted.length;
    const eachH = chartH / Math.max(optCount, 1);
    const barH = Math.min(36, eachH * 0.6);
    const barAreaW = chartRight - chartLeft - 160;

    for (let i = 0; i < sorted.length; i++) {
      const opt = sorted[i];
      const y = chartTop + i * eachH + (eachH - barH) / 2;
      const ratio = maxVotes > 0 ? opt.votes / maxVotes : 0;
      const barW = Math.max(4, ratio * barAreaW);
      const isWinner = winnerIds.includes(opt.id) && opt.votes > 0;

      if (isWinner) {
        drawCrown(ctx, chartLeft + 30, y - 4, 24);
      }

      const barGrad = ctx.createLinearGradient(chartLeft, 0, chartLeft + barW, 0);
      if (isWinner) {
        barGrad.addColorStop(0, '#fbbf24');
        barGrad.addColorStop(1, '#f97316');
      } else {
        barGrad.addColorStop(0, '#3b82f6');
        barGrad.addColorStop(1, '#1d4ed8');
      }

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      const r = barH / 2;
      const bw = Math.max(r * 2, barW);
      if (bw <= r * 2) {
        ctx.arc(chartLeft + r, y + barH / 2, r, 0, Math.PI * 2);
      } else {
        ctx.moveTo(chartLeft + r, y);
        ctx.lineTo(chartLeft + bw - r, y);
        ctx.arc(chartLeft + bw - r, y + barH / 2, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(chartLeft + r, y + barH);
        ctx.arc(chartLeft + r, y + barH / 2, r, Math.PI / 2, -Math.PI / 2);
      }
      ctx.closePath();
      ctx.fill();

      const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : '0.0';
      const label = opt.text.length > 22 ? opt.text.slice(0, 20) + '…' : opt.text;

      if (barW > 100) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
      } else {
        ctx.fillStyle = '#94a3b8';
      }
      ctx.font = '600 14px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, chartLeft + 14, y + barH / 2);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 14px Space Grotesk, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${opt.votes}票 · ${pct}%`, chartRight, y + barH / 2);
    }

    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('团队投票决策工具 · 输入投票码参与', sw / 2, sh - 28);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 14px Space Grotesk, sans-serif';
    ctx.fillText(`投票码: ${poll.id}`, sw / 2, sh - 10);
  }, [showShare, poll, totalVotes, maxVotes, winnerIds]);

  return (
    <div style={cardStyles} ref={containerRef} className="results-panel-card">
      <h3 style={sectionTitleStyles}>
        <span>📊</span>
        <span>实时投票结果</span>
      </h3>

      <div style={canvasContainerStyles} className="results-canvas-container">
        {renderTime > 0 && (
          <div style={performanceBadgeStyles}>
            渲染 {renderTime.toFixed(1)}ms
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>

      {poll.isEnded && (
        <div style={shareCardStyles}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🖼️</span>
            <span>结果分享图</span>
          </h4>

          {!showShare ? (
            <button
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '10px',
                transition: 'all 200ms ease',
              }}
              onClick={() => setShowShare(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🎨 生成分享图片
            </button>
          ) : (
            <div style={shareImageWrapperStyles}>
              <canvas
                ref={shareCanvasRef}
                style={{
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  cursor: 'context-menu',
                  maxWidth: '100%',
                  height: 'auto',
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const c = shareCanvasRef.current;
                  if (c) {
                    const link = document.createElement('a');
                    link.download = `投票结果_${poll.id}.png`;
                    link.href = c.toDataURL('image/png');
                    link.click();
                  }
                }}
                onMouseEnter={() => setShowHint(true)}
                onMouseLeave={() => setShowHint(false)}
                title="右键可保存为PNG图片"
              />
              <p style={shareHintStyles}>
                {showHint ? '🖱️ 右键点击图片 → "图片另存为" 保存PNG' : '💡 鼠标悬停查看保存提示'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ResultsPanel);
