import { useState, useMemo } from 'react';
import {
  CityClimateData,
  getMonthName,
  getYearlyDimensionData,
} from '../services/climateDataService';

interface CityInfoCardProps {
  cities: CityClimateData[];
  compareMode: boolean;
  onClose: (cityId: string) => void;
}

type DimensionType = 'temperature' | 'precipitation' | 'humidity';

const MONTHS_SHORT = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const DIMENSION_CONFIG = {
  temperature: { label: '气温', unit: '°C', min: -10, max: 45 },
  precipitation: { label: '降水', unit: 'mm', min: 0, max: 250 },
  humidity: { label: '湿度', unit: '%', min: 20, max: 100 },
};

interface RadarChartProps {
  data: number[];
  labels: string[];
  minVal: number;
  maxVal: number;
  unit: string;
  title: string;
}

function RadarChart({ data, labels, minVal, maxVal, unit, title }: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;

  const normalize = (val: number) => (val - minVal) / (maxVal - minVal);

  const points = useMemo(() => {
    return data.map((val, i) => {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const r = radius * normalize(val);
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
  }, [data, cx, cy, radius, minVal, maxVal]);

  const polygonPoints = points.map(p => p.join(',')).join(' ');

  const axisPoints = labels.map((_, i) => {
    const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
    return {
      x1: cx,
      y1: cy,
      x2: cx + radius * Math.cos(angle),
      y2: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        color: '#FFD700',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        marginBottom: 4,
        fontWeight: 600,
      }}>
        {title}
      </div>
      <svg width={size} height={size} style={{ position: 'relative' }}>
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={labels.map((_, i) => {
              const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
              const r = radius * scale;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        ))}
        {axisPoints.map((p, i) => (
          <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        <polygon
          points={polygonPoints}
          fill="rgba(255, 215, 0, 0.3)"
          stroke="#FFD700"
          strokeWidth="2"
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hoveredIndex === i ? 5 : 3}
            fill="#FFD700"
            style={{ cursor: 'pointer', transition: 'r 0.2s' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
        {hoveredIndex !== null && (
          <g>
            <rect
              x={points[hoveredIndex][0] - 28}
              y={points[hoveredIndex][1] - 28}
              width={56}
              height={22}
              rx={4}
              fill="rgba(0,0,0,0.85)"
            />
            <text
              x={points[hoveredIndex][0]}
              y={points[hoveredIndex][1] - 13}
              fill="#fff"
              fontSize={10}
              textAnchor="middle"
              fontFamily="Arial"
            >
              {labels[hoveredIndex]}: {data[hoveredIndex]}{unit}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

interface CompareBarChartProps {
  city1: CityClimateData;
  city2: CityClimateData;
  dimension: DimensionType;
}

function CompareBarChart({ city1, city2, dimension }: CompareBarChartProps) {
  const data1 = getYearlyDimensionData(city1, dimension);
  const data2 = getYearlyDimensionData(city2, dimension);
  const config = DIMENSION_CONFIG[dimension];
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const width = 680;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = 40;
  const groupGap = (chartWidth - 12 * barWidth * 2) / 11;

  const normalize = (val: number) => {
    return ((val - config.min) / (config.max - config.min)) * chartHeight;
  };

  return (
    <div style={{
      width: '100%',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    }}>
      <div style={{
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <span style={{ fontWeight: 600 }}>{config.label}对比 ({config.unit})</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, background: city1.color, borderRadius: 2 }} />
          <span>{city1.nameCN}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, background: city2.color, borderRadius: 2 }} />
          <span>{city2.nameCN}</span>
        </div>
      </div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + chartHeight * (1 - t);
          const val = config.min + (config.max - config.min) * t;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#94A3B8"
                fontSize={10}
                textAnchor="end"
                fontFamily="Arial"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}
        {MONTHS_SHORT.map((label, i) => {
          const groupX = padding.left + i * (barWidth * 2 + groupGap);
          const h1 = normalize(data1[i]);
          const h2 = normalize(data2[i]);
          return (
            <g key={i}>
              <rect
                x={groupX}
                y={padding.top + chartHeight - h1}
                width={barWidth}
                height={h1}
                fill={city1.color}
                opacity={hoveredMonth === i ? 1 : 0.85}
                rx={3}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={() => setHoveredMonth(i)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
              <rect
                x={groupX + barWidth}
                y={padding.top + chartHeight - h2}
                width={barWidth}
                height={h2}
                fill={city2.color}
                opacity={hoveredMonth === i ? 1 : 0.85}
                rx={3}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={() => setHoveredMonth(i)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
              <text
                x={groupX + barWidth}
                y={height - 10}
                fill="#94A3B8"
                fontSize={10}
                textAnchor="middle"
                fontFamily="Arial"
              >
                {label}
              </text>
              {hoveredMonth === i && (
                <g>
                  <rect
                    x={groupX - 10}
                    y={padding.top - 28}
                    width={barWidth * 2 + 20}
                    height={24}
                    rx={4}
                    fill="rgba(0,0,0,0.85)"
                  />
                  <text
                    x={groupX + barWidth}
                    y={padding.top - 12}
                    fill="#fff"
                    fontSize={11}
                    textAnchor="middle"
                    fontFamily="Arial"
                  >
                    {city1.nameCN}: {data1[i]}{config.unit} | {city2.nameCN}: {data2[i]}{config.unit}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface SingleCityCardProps {
  city: CityClimateData;
  onClose: () => void;
  animationKey: number;
}

function SingleCityCard({ city, onClose, animationKey }: SingleCityCardProps) {
  const temperatureData = getYearlyDimensionData(city, 'temperature');
  const precipitationData = getYearlyDimensionData(city, 'precipitation');
  const humidityData = getYearlyDimensionData(city, 'humidity');

  const avgTemp = (temperatureData.reduce((a, b) => a + b, 0) / 12).toFixed(1);
  const totalPrecip = precipitationData.reduce((a, b) => a + b, 0).toFixed(0);
  const avgHumidity = (humidityData.reduce((a, b) => a + b, 0) / 12).toFixed(0);

  return (
    <div
      key={animationKey}
      style={{
        width: 320,
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'cardPop 0.3s ease-out',
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#94A3B8';
        }}
      >
        ×
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: city.color,
          boxShadow: `0 0 12px ${city.color}`,
        }} />
        <div>
          <h2 style={{
            color: '#FFFFFF',
            fontSize: 18,
            margin: 0,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
          }}>
            {city.nameCN}
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: 12,
            margin: 0,
            fontFamily: 'Arial, sans-serif',
          }}>
            {city.name}
          </p>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 16,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          padding: 8,
          textAlign: 'center',
        }}>
          <div style={{ color: '#FFD700', fontSize: 16, fontFamily: 'Arial', fontWeight: 700 }}>
            {avgTemp}°C
          </div>
          <div style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'Arial' }}>年均气温</div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          padding: 8,
          textAlign: 'center',
        }}>
          <div style={{ color: '#60A5FA', fontSize: 16, fontFamily: 'Arial', fontWeight: 700 }}>
            {totalPrecip}mm
          </div>
          <div style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'Arial' }}>年降水</div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          padding: 8,
          textAlign: 'center',
        }}>
          <div style={{ color: '#34D399', fontSize: 16, fontFamily: 'Arial', fontWeight: 700 }}>
            {avgHumidity}%
          </div>
          <div style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'Arial' }}>年均湿度</div>
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        <RadarChart
          data={temperatureData}
          labels={MONTHS_SHORT}
          minVal={-10}
          maxVal={45}
          unit="°C"
          title="气温"
        />
        <RadarChart
          data={precipitationData}
          labels={MONTHS_SHORT}
          minVal={0}
          maxVal={250}
          unit="mm"
          title="降水"
        />
        <RadarChart
          data={humidityData}
          labels={MONTHS_SHORT}
          minVal={20}
          maxVal={100}
          unit="%"
          title="湿度"
        />
      </div>
    </div>
  );
}

export default function CityInfoCard({ cities, compareMode, onClose }: CityInfoCardProps) {
  const [compareDimension, setCompareDimension] = useState<DimensionType>('temperature');
  const [animationKey] = useState(() => Date.now());

  if (cities.length === 0) return null;

  if (compareMode && cities.length === 2) {
    const city1 = cities[0];
    const city2 = cities[1];

    return (
      <div style={{
        position: 'fixed',
        top: 92,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'cardPop 0.3s ease-out',
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8,
          padding: '8px 16px',
          marginBottom: 12,
          display: 'flex',
          gap: 8,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {(['temperature', 'precipitation', 'humidity'] as DimensionType[]).map(dim => (
            <button
              key={dim}
              onClick={() => setCompareDimension(dim)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: compareDimension === dim ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontFamily: 'Arial',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {DIMENSION_CONFIG[dim].label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <CompareBarChart
            city1={city1}
            city2={city2}
            dimension={compareDimension}
          />
        </div>
        <div style={{
          display: 'flex',
          gap: 40,
          transition: 'all 0.3s ease-in-out',
        }}>
          <SingleCityCard
            key={`${city1.id}-${animationKey}`}
            city={city1}
            onClose={() => onClose(city1.id)}
            animationKey={animationKey}
          />
          <SingleCityCard
            key={`${city2.id}-${animationKey}`}
            city={city2}
            onClose={() => onClose(city2.id)}
            animationKey={animationKey}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 92,
      right: 24,
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out',
    }}>
      {cities.map(city => (
        <SingleCityCard
          key={`${city.id}-${animationKey}`}
          city={city}
          onClose={() => onClose(city.id)}
          animationKey={animationKey}
        />
      ))}
    </div>
  );
}
