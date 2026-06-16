import React, { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAQIStore } from '../store/aqiStore';
import { getTrend, getAverageAQI } from '../utils/aqiUtils';

export const CityInfoPanel: React.FC = () => {
  const hoveredCityId = useAQIStore((s) => s.hoveredCityId);
  const cities = useAQIStore((s) => s.cities);
  const currentYear = useAQIStore((s) => s.currentYear);
  const setHoveredCity = useAQIStore((s) => s.setHoveredCity);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hoveredCity = cities.find((c) => c.id === hoveredCityId) || null;

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (hoveredCityId) {
      hideTimeoutRef.current = setTimeout(() => {
        setHoveredCity(null);
      }, 2000);
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [hoveredCityId, setHoveredCity]);

  const props = useSpring({
    opacity: hoveredCity ? 1 : 0,
    transform: hoveredCity ? 1 : 0.95,
    config: { tension: 300, friction: 20 },
  });

  if (!hoveredCity) return null;

  const currentAqiData = hoveredCity.yearlyData.find((d) => d.year === currentYear);
  const currentAqi = currentAqiData?.aqi ?? 0;
  const avgAqi = getAverageAQI(hoveredCity.yearlyData);
  const trend = getTrend(hoveredCity.yearlyData);

  const trendArrow =
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor =
    trend === 'up' ? '#FF1744' : trend === 'down' ? '#00E676' : '#FFC107';
  const trendLabel =
    trend === 'up' ? '上升' : trend === 'down' ? '下降' : '持平';

  return (
    <animated.div
      style={{
        position: 'fixed',
        top: '50%',
        left: 20,
        transform: props.transform.to((v: number) => `translateY(calc(-50% + ${(1 - v) * 10}px))`),
        opacity: props.opacity,
        background: 'rgba(26, 26, 46, 0.95)',
        padding: 12,
        borderRadius: 6,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        minWidth: 200,
        zIndex: 150,
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0,188,212,0.3)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#00BCD4' }}>
        {hoveredCity.city}
      </div>
      <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 4 }}>
        {currentYear} 年 AQI
      </div>
      <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        {currentAqi}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <div>
          <div style={{ color: '#8B949E' }}>十年平均</div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{avgAqi}</div>
        </div>
        <div>
          <div style={{ color: '#8B949E' }}>趋势</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: trendColor }}>
            {trendArrow} {trendLabel}
          </div>
        </div>
      </div>
    </animated.div>
  );
};
