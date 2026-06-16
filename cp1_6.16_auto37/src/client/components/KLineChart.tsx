import React, { useRef, useEffect, useState } from 'react';
import type { KLineData } from '../../data/types';

interface KLineChartProps {
  data: KLineData[];
  stockCode?: string;
}

const KLineChart: React.FC<KLineChartProps> = ({ data, stockCode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  const CANDLE_WIDTH = 8;
  const CANDLE_GAP = 2;
  const TOTAL_BAR_WIDTH = CANDLE_WIDTH + CANDLE_GAP;
  const VOLUME_HEIGHT_RATIO = 0.25;

  useEffect(() => {
    drawChart();
  }, [data, hoveredIndex]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartHeight = height - padding.top - padding.bottom;
    const klineHeight = chartHeight * (1 - VOLUME_HEIGHT_RATIO) - 10;
    const volumeTop = padding.top + klineHeight + 20;
    const volumeHeight = chartHeight * VOLUME_HEIGHT_RATIO - 10;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      ctx.fillStyle = '#a0a0c0';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stockCode ? `正在加载 ${stockCode} 的K线数据...` : '请输入股票代码查看K线', width / 2, height / 2);
      return;
    }

    const allPrices = data.flatMap((d) => [d.high, d.low]);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;
    const maxVolume = Math.max(...data.map((d) => d.volume));

    const totalDataWidth = data.length * TOTAL_BAR_WIDTH;
    const chartInnerWidth = width - padding.left - padding.right;
    const startX = padding.left + Math.max(0, (chartInnerWidth - totalDataWidth) / 2);

    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 0.5;
    const priceStep = priceRange / 4;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (klineHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const priceLabel = (maxPrice - priceStep * i).toFixed(2);
      ctx.fillStyle = '#a0a0c0';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceLabel, width - padding.right + 5, y);
    }

    data.forEach((item, i) => {
      const x = startX + i * TOTAL_BAR_WIDTH + CANDLE_GAP / 2;
      const isUp = item.close >= item.open;
      const color = isUp ? '#ef4444' : '#22c55e';
      const fillColor = isUp ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)';

      const priceToY = (price: number) => {
        return padding.top + klineHeight - ((price - minPrice) / priceRange) * klineHeight;
      };

      const highY = priceToY(item.high);
      const lowY = priceToY(item.low);
      const openY = priceToY(item.open);
      const closeY = priceToY(item.close);

      ctx.beginPath();
      ctx.moveTo(x + CANDLE_WIDTH / 2, highY);
      ctx.lineTo(x + CANDLE_WIDTH / 2, lowY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, bodyTop, CANDLE_WIDTH, bodyHeight);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, bodyTop, CANDLE_WIDTH, bodyHeight);

      const volHeight = (item.volume / maxVolume) * volumeHeight;
      ctx.fillStyle = color;
      ctx.fillRect(x, volumeTop + volumeHeight - volHeight, CANDLE_WIDTH, volHeight);
    });

    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length) {
      const x = startX + hoveredIndex * TOTAL_BAR_WIDTH + CANDLE_GAP / 2 + CANDLE_WIDTH / 2;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#888899';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { left: 10, right: 60 };
    const chartInnerWidth = rect.width - padding.left - padding.right;
    const totalDataWidth = data.length * TOTAL_BAR_WIDTH;
    const startX = padding.left + Math.max(0, (chartInnerWidth - totalDataWidth) / 2);

    const relativeX = x - startX;
    const index = Math.floor(relativeX / TOTAL_BAR_WIDTH);

    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredIndex(null);
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 100000000) return (vol / 100000000).toFixed(2) + '亿';
    if (vol >= 10000) return (vol / 10000).toFixed(2) + '万';
    return vol.toString();
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '400px', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 15, (canvasRef.current?.getBoundingClientRect().width || 600) - 200),
            top: Math.max(tooltip.y - 100, 10),
            background: 'rgba(30, 30, 46, 0.95)',
            color: '#e0e0ff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            pointerEvents: 'none',
            border: '1px solid #3a3a5e',
            zIndex: 10,
            minWidth: '180px',
          }}
        >
          <div style={{ marginBottom: '8px', color: '#a0a0c0' }}>{data[hoveredIndex].date}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
            <span style={{ color: '#a0a0c0' }}>开盘:</span>
            <span>{data[hoveredIndex].open.toFixed(2)}</span>
            <span style={{ color: '#a0a0c0' }}>收盘:</span>
            <span style={{ color: data[hoveredIndex].close >= data[hoveredIndex].open ? '#ef4444' : '#22c55e' }}>
              {data[hoveredIndex].close.toFixed(2)}
            </span>
            <span style={{ color: '#a0a0c0' }}>最高:</span>
            <span style={{ color: '#ef4444' }}>{data[hoveredIndex].high.toFixed(2)}</span>
            <span style={{ color: '#a0a0c0' }}>最低:</span>
            <span style={{ color: '#22c55e' }}>{data[hoveredIndex].low.toFixed(2)}</span>
            <span style={{ color: '#a0a0c0' }}>成交量:</span>
            <span>{formatVolume(data[hoveredIndex].volume)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KLineChart;
