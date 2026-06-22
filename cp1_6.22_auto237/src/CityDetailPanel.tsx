import React, { useRef, useEffect, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { City, DataCategory, Stats, MonthData, ValueMapping } from './types';

interface CityDetailPanelProps {
  city: City | null;
  category: DataCategory;
  yearRange: [number, number];
  stats: Stats | null;
  yearlyData: MonthData[];
  onClose: () => void;
  valueMapping: ValueMapping;
}

const CATEGORY_COLORS: Record<DataCategory, string> = {
  temperature: '#EF4444',
  precipitation: '#06B6D4',
  windSpeed: '#8B5CF6',
};

const CATEGORY_LABELS: Record<DataCategory, string> = {
  temperature: '温度',
  precipitation: '降水',
  windSpeed: '风速',
};

const MONTH_ABBREVIATIONS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const CityDetailPanel: React.FC<CityDetailPanelProps> = ({
  city,
  category,
  yearRange,
  stats,
  yearlyData,
  onClose,
  valueMapping,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (city) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [city]);

  useEffect(() => {
    if (!city || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 280;
    const height = 160;
    const padding = { top: 20, right: 20, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, width, height);

    const values = yearlyData.map((d) => d[category]);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = maxVal - (range * i) / gridLines;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), padding.left - 5, y + 3);
    }

    ctx.setLineDash([]);

    const color = CATEGORY_COLORS[category];
    const points: { x: number; y: number }[] = [];

    yearlyData.forEach((data, index) => {
      const x = padding.left + (chartWidth * index) / (yearlyData.length - 1 || 1);
      const value = data[category];
      const y = padding.top + chartHeight - ((value - minVal) / range) * chartHeight;
      points.push({ x, y });
    });

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    MONTH_ABBREVIATIONS.forEach((month, index) => {
      const x = padding.left + (chartWidth * index) / 11;
      ctx.fillText(month, x, height - 8);
    });
  }, [city, category, yearlyData]);

  if (!city) return null;

  const formatValue = (value: number) => {
    if (category === 'temperature') {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1] || '';
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: '20px',
    top: '20px',
    width: '320px',
    backgroundColor: '#1F2937',
    borderRadius: '12px',
    border: '1px solid #374151',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 50,
    transform: isVisible ? 'translateX(0)' : 'translateX(320px)',
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    transitionTimingFunction: `cubic-bezier(0.33, 1, 0.68, 1)`,
  };

  return (
    <div style={panelStyle} className="md:fixed md:right-5 md:top-5 fixed bottom-0 left-0 w-full md:w-80 rounded-t-xl md:rounded-xl">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-white text-xl font-semibold leading-tight">{city.name}</h2>
            <p className="text-gray-400 text-xs mt-1">
              {city.lat.toFixed(4)}°N, {city.lng.toFixed(4)}°E
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
          />
          <span className="text-gray-300 text-sm font-medium">
            {CATEGORY_LABELS[category]} ({valueMapping.unit})
          </span>
          <span className="text-gray-500 text-xs ml-auto">
            {yearRange[0]} - {yearRange[1]}
          </span>
        </div>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={280}
            height={160}
            style={{ display: 'block' }}
          />
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">均值</div>
              <div className="text-white text-lg font-semibold">
                {formatValue(stats.mean)}
                <span className="text-gray-500 text-xs ml-0.5">{valueMapping.unit}</span>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">最高</div>
              <div className="text-white text-lg font-semibold">
                {formatValue(stats.max)}
                <span className="text-gray-500 text-xs ml-0.5">{valueMapping.unit}</span>
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{getMonthName(stats.maxMonth)}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">最低</div>
              <div className="text-white text-lg font-semibold">
                {formatValue(stats.min)}
                <span className="text-gray-500 text-xs ml-0.5">{valueMapping.unit}</span>
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{getMonthName(stats.minMonth)}</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-700">
          <TrendingUp size={14} className="text-gray-500" />
          <span className="text-gray-500 text-xs">
            数据来源于 {yearRange[0]}-{yearRange[1]} 年的统计平均值
          </span>
        </div>
      </div>
    </div>
  );
};

export default CityDetailPanel;
