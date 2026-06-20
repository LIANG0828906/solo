import { useEffect, useState } from 'react';
import { Card, Checkbox } from 'antd';
import { City, CurrentAirData, PollutantKey, POLLUTANT_CONFIG, getAqiLevel, getPollutantColor } from '@/api/airApi';
import { useAirStore } from '@/stores/airStore';

interface CityCardProps {
  city: City;
  data?: CurrentAirData;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = display;
    const diff = value - startValue;

    let frameId: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + diff * easeOut));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{display}</span>;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min((value / max) * 100, 100));
    }, 50);
    return () => clearTimeout(timer);
  }, [value, max]);

  return (
    <div style={{
      width: '100%',
      height: 6,
      background: 'rgba(255,255,255,0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 8,
    }}>
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 1s cubic-bezier(0.33, 1, 0.68, 1)',
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
    </div>
  );
}

export default function CityCard({ city, data }: CityCardProps) {
  const { selectedCities, toggleCitySelection } = useAirStore();
  const isSelected = selectedCities.includes(city.id);
  const aqiInfo = data ? getAqiLevel(data.aqi) : { level: '-', color: '#888' };

  const pollutants: PollutantKey[] = ['pm25', 'pm10', 'ozone', 'no2'];

  return (
    <Card
      id={`city-${city.id}`}
      styles={{
        body: { padding: 24 },
      }}
      style={{
        background: isSelected
          ? 'rgba(0,180,216,0.1)'
          : 'rgba(255,255,255,0.05)',
        border: isSelected
          ? '1px solid rgba(0,180,216,0.5)'
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
      onClick={() => toggleCitySelection(city.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{city.icon}</span>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0 }}>{city.name}</h2>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            {data ? `更新于 ${new Date(data.timestamp).toLocaleTimeString('zh-CN')}` : '加载中...'}
          </div>
        </div>
        <Checkbox
          checked={isSelected}
          onChange={() => toggleCitySelection(city.id)}
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#fff' }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{
          fontSize: 56,
          fontWeight: 700,
          color: aqiInfo.color,
          textShadow: `0 0 20px ${aqiInfo.color}60`,
          lineHeight: 1,
        }}>
          {data ? <AnimatedNumber value={data.aqi} /> : '-'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: aqiInfo.color, fontSize: 18, fontWeight: 600 }}>{aqiInfo.level}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>AQI</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {pollutants.map((key) => {
          const config = POLLUTANT_CONFIG[key];
          const value = data ? data[key] : 0;
          const color = getPollutantColor(key, value);
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{config.name}</span>
                <span style={{ color, fontSize: 16, fontWeight: 600 }}>
                  {data ? <AnimatedNumber value={value} /> : '-'}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>{config.unit}</span>
                </span>
              </div>
              <ProgressBar value={value} max={config.max} color={color} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
