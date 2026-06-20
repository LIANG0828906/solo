import { useRef, useEffect, useState, useCallback } from 'react';
import type { BidRecord } from '../types';

interface BidHistoryProps {
  bids: BidRecord[];
  highestBid: number;
  startPrice: number;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分钟前`;
  return `${hours}小时前`;
}

export default function BidHistory({ bids, highestBid, startPrice }: BidHistoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const animationRef = useRef<number | null>(null);
  const displayedPricesRef = useRef<number[]>([]);
  const targetPricesRef = useRef<number[]>([]);

  const getPrices = useCallback((): number[] => {
    if (bids.length === 0) return [startPrice];
    return [startPrice, ...bids.map((b) => b.amount)];
  }, [bids, startPrice]);

  useEffect(() => {
    targetPricesRef.current = getPrices();
  }, [getPrices]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const padding = { top: 30, right: 20, bottom: 30, left: 50 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      const targetPrices = targetPricesRef.current;
      let displayedPrices = displayedPricesRef.current;

      if (displayedPrices.length !== targetPrices.length) {
        displayedPrices = new Array(targetPrices.length).fill(startPrice);
        displayedPricesRef.current = displayedPrices;
      }

      let allReached = true;
      for (let i = 0; i < targetPrices.length; i++) {
        const diff = targetPrices[i] - displayedPrices[i];
        if (Math.abs(diff) > 0.5) {
          displayedPrices[i] += diff * 0.15;
          allReached = false;
        } else {
          displayedPrices[i] = targetPrices[i];
        }
      }

      displayedPricesRef.current = [...displayedPrices];

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      const maxPrice = Math.max(...displayedPrices, startPrice) * 1.1;
      const minPrice = Math.min(...displayedPrices, startPrice) * 0.9;
      const priceRange = maxPrice - minPrice || 1;

      ctx.fillStyle = 'rgba(196, 168, 130, 0.6)';
      ctx.font = '11px var(--font-body)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const price = maxPrice - (priceRange / 4) * i;
        ctx.fillText(`¥${Math.round(price)}`, padding.left - 8, y);
      }

      if (displayedPrices.length > 0) {
        const xStep = displayedPrices.length > 1 ? chartWidth / (displayedPrices.length - 1) : 0;

        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        displayedPrices.forEach((price, index) => {
          const x = padding.left + xStep * index;
          const y = padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = padding.left + xStep * (index - 1);
            const prevY = padding.top + chartHeight - ((displayedPrices[index - 1] - minPrice) / priceRange) * chartHeight;
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        });
        ctx.lineTo(padding.left + xStep * (displayedPrices.length - 1), height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        displayedPrices.forEach((price, index) => {
          const x = padding.left + xStep * index;
          const y = padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = padding.left + xStep * (index - 1);
            const prevY = padding.top + chartHeight - ((displayedPrices[index - 1] - minPrice) / priceRange) * chartHeight;
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        });
        ctx.stroke();

        if (displayedPrices.length > 0) {
          const lastIndex = displayedPrices.length - 1;
          const lastX = padding.left + xStep * lastIndex;
          const lastY = padding.top + chartHeight - ((displayedPrices[lastIndex] - minPrice) / priceRange) * chartHeight;

          const glowGradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 15);
          glowGradient.addColorStop(0, 'rgba(212, 175, 55, 0.8)');
          glowGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(lastX, lastY, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = '#FFD700';
          ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      if (!allReached) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }

      forceUpdate((n) => n + 1);
    };

    if (bids.length > 0 || animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bids.length, startPrice]);

  useEffect(() => {
    if (bids.length === 0) return;
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [bids.length]);

  const sortedBids = [...bids].reverse();

  return (
    <div className="glass-card" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
          当前最高出价
        </div>
        <div
          className="gold-text"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
          }}
        >
          ¥{highestBid.toLocaleString()}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
            opacity: 0.3,
            zIndex: -1,
          }}
        />
      </div>

      <div
        ref={containerRef}
        style={{
          height: '200px',
          marginBottom: '16px',
          background: 'rgba(26, 10, 10, 0.4)',
          borderRadius: '8px',
          border: '1px solid var(--color-border-gold)',
          overflow: 'hidden',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '3px',
            height: '18px',
            background: 'var(--color-gold)',
            borderRadius: '2px',
          }}
        />
        <h3
          className="gold-text"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
          }}
        >
          📜 出价历史
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            color: 'var(--color-text-secondary)',
            fontSize: '12px',
          }}
        >
          共 {bids.length} 次出价
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          minHeight: 0,
        }}
      >
        {sortedBids.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              padding: '40px 20px',
              fontSize: '14px',
            }}
          >
            暂无出价，成为第一个出价的人吧！
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '19px',
                top: '24px',
                bottom: '24px',
                width: '2px',
                background: 'linear-gradient(to bottom, var(--color-gold), rgba(212, 175, 55, 0.2))',
              }}
            />

            {sortedBids.map((bid, index) => (
              <div
                key={bid.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 0',
                  animation: 'fadeInUp 0.3s ease-out',
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: bid.avatar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1A0A0A',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                    border: '2px solid var(--color-gold)',
                    boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  {bid.nickname.charAt(0).toUpperCase()}
                </div>

                <div
                  style={{
                    flex: 1,
                    background: 'rgba(74, 14, 14, 0.4)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-gold)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{bid.nickname}</span>
                    <span
                      className="gold-text"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      ¥{bid.amount.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontSize: '11px',
                      marginTop: '4px',
                    }}
                  >
                    {formatTimeAgo(bid.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
