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
  color: 'var(--success-start)',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '999px',
  fontFamily: 'monospace',
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  const gradient = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.4);
  gradient.addColorStop(0, '#fde68a');
  gradient.addColorStop(0.5, '#fbbf24');
  gradient.addColorStop(1, '#d97706');

  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = size * 0.06;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const w = size;
  const h = size * 0.75;
  const baseY = h * 0.5;

  ctx.moveTo(-w / 2, baseY);
  ctx.lineTo(-w / 2, -h * 0.2);
  ctx.lineTo(-w * 0.25, -h * 0.5);
  ctx.lineTo(0, -h * 0.15);
  ctx.lineTo(w * 0.25, -h * 0.5);
  ctx.lineTo(w / 2, -h * 0.2);
  ctx.lineTo(w / 2, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(-w * 0.25, -h * 0.55, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -h * 0.2, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.25, -h * 0.55, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.15, -h * 0.1, w * 0.08, h * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ poll }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number>(0);
  const animStartTimeRef = useRef<number>(0);
  const animProgressRef = useRef<number[]>([]);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [showShare, setShowShare] = useState(false);
  const prevPollIdRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const pendingPollRef = useRef<Poll | null>(null);

  const totalVotes = useMemo(
    () => poll.options.reduce((sum, o) => sum + o.votes, 0),
    [poll.options]
  );

  const maxVotes = useMemo(() => {
    return Math.max(...poll.options.map((o) => o.votes), 1);
  }, [poll.options]);

  const winnerIds = useMemo(() => {
    const max = Math.max(...poll.options.map((o) => o.votes), 0);
    if (max === 0) return [];
    return poll.options.filter((o) => o.votes === max).map((o) => o.id);
  }, [poll.options]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.offsetWidth - 40, 800);
        setCanvasWidth(Math.max(280, w));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const barHeight = 32;
  const barGap = 16;
  const labelLeftPad = 24;
  const labelRightPad = 120;
  const crownExtraTop = 36;
  const topMargin = 20;
  const bottomMargin = 16;

  const canvasHeight = useMemo(() => {
    return (
      topMargin +
      bottomMargin +
      poll.options.length * (barHeight + barGap) -
      barGap +
      crownExtraTop
    );
  }, [poll.options.length, barHeight, barGap, topMargin, bottomMargin, crownExtraTop]);

  const drawStatic = useCallback(
    (ctx: CanvasRenderingContext2D, options: PollOption[], widths: number[], width: number, height: number, withCrown: boolean = true) => {
      const startY = topMargin + crownExtraTop;
      const barAreaWidth = width - labelLeftPad - labelRightPad;

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const y = startY + i * (barHeight + barGap);
        const barW = Math.max(2, widths[i] * barAreaWidth);
        const isWinner = winnerIds.includes(opt.id);

        const barGradient = ctx.createLinearGradient(labelLeftPad, 0, labelLeftPad + barW, 0);
        if (isWinner && opt.votes > 0) {
          barGradient.addColorStop(0, '#fbbf24');
          barGradient.addColorStop(1, '#f97316');
        } else {
          barGradient.addColorStop(0, '#3b82f6');
          barGradient.addColorStop(1, '#1d4ed8');
        }

        ctx.fillStyle = barGradient;
        ctx.beginPath();
        const radius = barHeight / 2;
        const w = Math.max(radius * 2, barW);
        const x = labelLeftPad;

        if (w <= radius * 2) {
          ctx.arc(x + radius, y + barHeight / 2, radius, 0, Math.PI * 2);
        } else {
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + w - radius, y);
          ctx.arc(x + w - radius, y + barHeight / 2, radius, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(x + radius, y + barHeight);
          ctx.arc(x + radius, y + barHeight / 2, radius, Math.PI / 2, -Math.PI / 2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 14px Outfit, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textX = labelLeftPad + 12;
        if (barW > 80) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        } else {
          ctx.fillStyle = '#94a3b8';
        }

        const displayText = opt.text.length > 20 ? opt.text.slice(0, 18) + '...' : opt.text;
        ctx.fillText(displayText, textX, y + barHeight / 2);

        const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : '0.0';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 14px Space Grotesk, Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${opt.votes}票 · ${pct}%`,
          width - 16,
          y + barHeight / 2
        );

        if (withCrown && isWinner && opt.votes > 0) {
          const crownX = labelLeftPad + 30;
          const crownY = y - 8;
          drawCrown(ctx, crownX, crownY, 28);
        }
      }
    },
    [winnerIds, totalVotes, barHeight, barGap, topMargin, crownExtraTop]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvasWidth;
    const height = canvasHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    offscreen.width = width * dpr;
    offscreen.height = height * dpr;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.scale(dpr, dpr);

    const isNewPoll = prevPollIdRef.current !== poll.id;
    if (isNewPoll) {
      prevPollIdRef.current = poll.id;
      animProgressRef.current = poll.options.map(() => 0);
      animStartTimeRef.current = 0;
    }

    if (pendingPollRef.current === null) {
      pendingPollRef.current = poll;
    } else {
      pendingPollRef.current = poll;
      if (rafIdRef.current) {
        return;
      }
    }

    const startTime = performance.now();

    if (isNewPoll) {
      const animate = (ts: number) => {
        if (!animStartTimeRef.current) animStartTimeRef.current = ts;
        const elapsed = ts - animStartTimeRef.current;

        const widths: number[] = [];
        let allDone = true;

        for (let i = 0; i < poll.options.length; i++) {
          const delay = i * 100;
          const duration = 500;
          let t = (elapsed - delay) / duration;
          t = Math.max(0, Math.min(1, t));
          const progress = easeOutCubic(t);
          widths.push(progress * (poll.options[i].votes / Math.max(maxVotes, 1)));
          if (t < 1) allDone = false;
          animProgressRef.current[i] = progress;
        }

        offCtx.clearRect(0, 0, width, height);
        drawStatic(offCtx, poll.options, widths, width, height);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(offscreen, 0, 0);
        }

        if (!allDone) {
          rafIdRef.current = requestAnimationFrame(animate);
        } else {
          rafIdRef.current = 0;
          pendingPollRef.current = null;
          const endTime = performance.now();
          setRenderTime(endTime - startTime);
        }
      };

      rafIdRef.current = requestAnimationFrame(animate);
    } else {
      const widths = poll.options.map((o) => o.votes / Math.max(maxVotes, 1));

      offCtx.clearRect(0, 0, width, height);
      drawStatic(offCtx, poll.options, widths, width, height);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0);
      }

      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      pendingPollRef.current = null;
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [poll, canvasWidth, canvasHeight, maxVotes, drawStatic]);

  useEffect(() => {
    if (!showShare) return;
    const shareCanvas = shareCanvasRef.current;
    if (!shareCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 800;
    const h = 600;
    shareCanvas.width = w * dpr;
    shareCanvas.height = h * dpr;
    shareCanvas.style.width = '100%';
    shareCanvas.style.height = 'auto';

    const ctx = shareCanvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
    ctx.beginPath();
    ctx.arc(w, h, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Space Grotesk, Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(poll.title, 40, 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText(
      `共 ${totalVotes} 票 · ${poll.options.length} 个选项 · ${poll.isEnded ? '已结束' : '进行中'}`,
      40,
      100
    );

    const chartTop = 140;
    const chartBottom = h - 80;
    const chartLeft = 40;
    const chartRight = w - 40;
    const chartH = chartBottom - chartTop;

    const optCount = poll.options.length;
    const eachH = chartH / optCount;
    const barH = Math.min(36, eachH * 0.6);
    const barAreaW = chartRight - chartLeft - 160;

    const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);

    for (let i = 0; i < sortedOptions.length; i++) {
      const opt = sortedOptions[i];
      const y = chartTop + i * eachH + (eachH - barH) / 2;
      const ratio = maxVotes > 0 ? opt.votes / maxVotes : 0;
      const barW = Math.max(4, ratio * barAreaW);
      const isWinner = winnerIds.includes(opt.id) && opt.votes > 0;

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

      if (isWinner) {
        drawCrown(ctx, chartLeft + 28, y + 4, 26);
      }

      ctx.fillStyle = barW > 100 ? 'rgba(255,255,255,0.95)' : '#94a3b8';
      ctx.font = '600 15px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayText = opt.text.length > 25 ? opt.text.slice(0, 23) + '...' : opt.text;
      ctx.fillText(displayText, chartLeft + 14, y + barH / 2);

      const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : '0.0';
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 15px Space Grotesk, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${opt.votes}票 · ${pct}%`, chartRight, y + barH / 2);
    }

    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('团队投票决策工具 · 扫码或输入投票码参与', w / 2, h - 30);

    ctx.fillStyle = 'var(--accent-orange)';
    ctx.font = 'bold 14px Space Grotesk, sans-serif';
    ctx.fillText(`投票码: ${poll.id}`, w / 2, h - 12);

    shareCanvas.setAttribute('data-png', shareCanvas.toDataURL('image/png'));
  }, [showShare, poll, totalVotes, maxVotes, winnerIds]);

  const [showHint, setShowHint] = useState(false);

  return (
    <div style={cardStyles} ref={containerRef} className="results-panel-card">
      <h3 style={sectionTitleStyles}>
        <span>📊</span>
        <span>实时投票结果</span>
      </h3>

      <div style={canvasContainerStyles}>
        <div style={performanceBadgeStyles}>
          渲染 {renderTime.toFixed(1)}ms
        </div>
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
                background: 'var(--accent-blue)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '10px',
                transition: 'all 200ms ease',
              }}
              onClick={() => setShowShare(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
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
                  border: '1px solid var(--border-color)',
                  cursor: 'context-menu',
                  maxWidth: '100%',
                  height: 'auto',
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const canvas = shareCanvasRef.current;
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `投票结果_${poll.id}.png`;
                    link.href = canvas.toDataURL('image/png');
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
