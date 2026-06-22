import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CandleData, MarketData } from '../services/types';
import { marketSimulator } from '../data/marketSimulator';

interface PricePanelProps {
  candles: CandleData[];
  latestData: MarketData | null;
}

const PricePanel: React.FC<PricePanelProps> = ({ candles, latestData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(marketSimulator.isActive());

  const drawCandlestick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 20, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const visibleCandles = candles.slice(-60);
    if (visibleCandles.length === 0) return;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach((c) => {
      minPrice = Math.min(minPrice, c.low);
      maxPrice = Math.max(maxPrice, c.high);
    });

    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const candleWidth = chartWidth / visibleCandles.length;
    const bodyWidth = Math.max(candleWidth * 0.6, 2);

    ctx.strokeStyle = '#2A2A40';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const price = maxPrice - ((maxPrice - minPrice) / 4) * i;
      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding.left - 5, y + 4);
    }

    visibleCandles.forEach((candle, index) => {
      const x = padding.left + index * candleWidth + candleWidth / 2;
      const isUp = candle.close >= candle.open;

      const openY = padding.top + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
      const highY = padding.top + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;

      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      ctx.fillStyle = isUp ? '#00D4AA' : '#FF5C58';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });
  }, [candles]);

  useEffect(() => {
    drawCandlestick();
  }, [drawCandlestick]);

  const toggleSimulation = () => {
    if (isRunning) {
      marketSimulator.pause();
    } else {
      marketSimulator.resume();
    }
    setIsRunning(marketSimulator.isActive());
  };

  const latestPrice = latestData?.close ?? 0;
  const prevPrice = candles.length >= 2 ? candles[candles.length - 2]?.close : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const changePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <div className="card-hover" style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.symbol}>{marketSimulator.getSymbol()}</h2>
          <div style={styles.priceRow}>
            <span style={{ ...styles.price, color: isUp ? '#00D4AA' : '#FF5C58' }}>
              ¥{latestPrice.toFixed(2)}
            </span>
            <span style={{ ...styles.change, color: isUp ? '#00D4AA' : '#FF5C58' }}>
              {isUp ? '+' : ''}{priceChange.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <button style={{ ...styles.toggleBtn, backgroundColor: isRunning ? '#FF5C58' : '#00D4AA' }} onClick={toggleSimulation}>
          {isRunning ? '暂停' : '开始'}
        </button>
      </div>
      <div style={styles.volumeRow}>
        <span style={styles.volumeLabel}>成交量</span>
        <span style={styles.volumeValue}>{latestData?.volume?.toLocaleString() ?? 0}</span>
      </div>
      <canvas ref={canvasRef} width={600} height={200} style={styles.canvas} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#1E1E30',
    borderRadius: '12px',
    border: '1px solid #2A2A40',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symbol: {
    color: '#E0E0E0',
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
    marginBottom: '8px',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  price: {
    fontSize: '32px',
    fontWeight: 700,
    transition: 'color 0.2s ease',
  },
  change: {
    fontSize: '16px',
    fontWeight: 500,
    transition: 'color 0.2s ease',
  },
  toggleBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  volumeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderTop: '1px solid #2A2A40',
    borderBottom: '1px solid #2A2A40',
  },
  volumeLabel: {
    color: '#888',
    fontSize: '13px',
  },
  volumeValue: {
    color: '#E0E0E0',
    fontSize: '14px',
    fontWeight: 500,
  },
  canvas: {
    borderRadius: '8px',
    width: '100%',
    maxWidth: '600px',
    height: '200px',
  },
};

export default PricePanel;
