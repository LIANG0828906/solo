import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WeatherCardData, WeatherCondition, CITIES } from './weatherData';

interface WeatherCardProps {
  data: WeatherCardData;
  isCollected: boolean;
  onToggleCollect: (data: WeatherCardData) => void;
  onCityChange: (city: string) => void;
  onShowToast: (msg: string) => void;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function generateParticles(condition: WeatherCondition, count: number): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: condition === 'snowy' ? (6 + Math.random() * 6) : (condition === 'rainy' ? 30 : (20 + Math.random() * 30)),
      delay: Math.random() * (condition === 'sunny' ? 8 : 6),
      duration: condition === 'sunny' ? (15 + Math.random() * 20) : (condition === 'rainy' ? (0.8 + Math.random() * 0.6) : (4 + Math.random() * 4)),
      opacity: condition === 'rainy' ? 0.2 : 0.6 + Math.random() * 0.3
    });
  }
  return arr;
}

const CONDITION_STYLES: Record<WeatherCondition, { bg: string; accent: string }> = {
  sunny: { bg: 'radial-gradient(circle at 50% 40%, #FFD54F 0%, #FFA726 60%, #FB8C00 100%)', accent: '#FFD54F' },
  rainy: { bg: 'linear-gradient(180deg, #37474F 0%, #607D8B 100%)', accent: '#90A4AE' },
  snowy: { bg: 'linear-gradient(180deg, #ECEFF1 0%, #B0BEC5 100%)', accent: '#E3F2FD' },
  windy: { bg: 'linear-gradient(180deg, #455A64 0%, #78909C 100%)', accent: '#B0BEC5' },
  cloudy: { bg: 'linear-gradient(180deg, #546E7A 0%, #90A4AE 100%)', accent: '#CFD8DC' }
};

const WeatherCard: React.FC<WeatherCardProps> = React.memo(({ data, isCollected, onToggleCollect, onCityChange, onShowToast }) => {
  const [flipping, setFlipping] = useState(false);
  const [flipBack, setFlipBack] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const style = CONDITION_STYLES[data.condition];

  const sunnyParticles = useMemo(() => generateParticles('sunny', 6), [data.id]);
  const rainyParticles = useMemo(() => generateParticles('rainy', 35), [data.id]);
  const snowyParticles = useMemo(() => generateParticles('snowy', 25), [data.id]);
  const windyParticles = useMemo(() => generateParticles('windy', 12), [data.id]);

  const handleCityClick = () => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => setFlipBack(true), 250);
    setTimeout(() => {
      const idx = CITIES.indexOf(data.city);
      const next = CITIES[(idx + 1) % CITIES.length];
      onCityChange(next);
      setFlipping(false);
      setFlipBack(false);
    }, 500);
  };

  const handleCollect = () => {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
    onToggleCollect(data);
    onShowToast(isCollected ? '已取消收藏' : '已添加到收藏');
  };

  const isLightBg = data.condition === 'snowy';
  const textColor = isLightBg ? '#37474F' : '#FFFFFF';

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', perspective: 1200 }}>
      <div
        ref={cardRef}
        style={{
          width: '100%',
          height: 420,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease',
          transform: flipping ? (flipBack ? 'rotateY(180deg)' : 'rotateY(90deg)') : 'rotateY(0deg)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background: style.bg,
            borderRadius: 24,
            overflow: 'hidden'
          }}
        >
          {data.condition === 'sunny' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '30%',
                  width: 220,
                  height: 220,
                  marginLeft: -110,
                  marginTop: -110,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,213,79,0.3) 40%, transparent 70%)',
                  animation: 'sunRotate 8s linear infinite',
                  transformOrigin: 'center'
                }}
              />
              <style>{`
                @keyframes sunRotate {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes cloudFloat {
                  0% { transform: translateX(-10vw); }
                  100% { transform: translateX(110vw); }
                }
                @keyframes rainFall {
                  0% { transform: translate(0, -40px); opacity: 0; }
                  10% { opacity: 0.2; }
                  90% { opacity: 0.2; }
                  100% { transform: translate(-60px, 460px); opacity: 0; }
                }
                @keyframes snowFall {
                  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
                  10% { opacity: 0.7; }
                  90% { opacity: 0.7; }
                  100% { transform: translateY(440px) rotate(360deg); opacity: 0; }
                }
                @keyframes windFlow {
                  0% { transform: translateX(-20vw) scaleX(0.5); opacity: 0; }
                  20% { opacity: 0.5; }
                  80% { opacity: 0.5; }
                  100% { transform: translateX(120vw) scaleX(1.5); opacity: 0; }
                }
              `}</style>
              {sunnyParticles.map((p) => (
                <div
                  key={`cloud-${p.id}`}
                  style={{
                    position: 'absolute',
                    left: `${p.left}%`,
                    top: `${10 + p.top * 0.3}%`,
                    width: p.size,
                    height: p.size * 0.5,
                    background: 'rgba(255,255,255,0.55)',
                    borderRadius: p.size * 0.5,
                    filter: 'blur(6px)',
                    animation: `cloudFloat ${p.duration}s linear ${p.delay}s infinite`
                  }}
                />
              ))}
            </>
          )}

          {data.condition === 'rainy' && rainyParticles.map((p) => (
            <div
              key={`rain-${p.id}`}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: 1.5,
                height: 30,
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.2))',
                transform: 'rotate(-30deg)',
                transformOrigin: 'top center',
                animation: `rainFall ${p.duration}s linear ${p.delay}s infinite`
              }}
            />
          ))}

          {data.condition === 'snowy' && snowyParticles.map((p) => (
            <div
              key={`snow-${p.id}`}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                color: `rgba(255,255,255,${p.opacity})`,
                fontSize: p.size,
                lineHeight: 1,
                animation: `snowFall ${p.duration}s ease-in-out ${p.delay}s infinite`
              }}
            >
              ❄
            </div>
          ))}

          {data.condition === 'windy' && windyParticles.map((p) => (
            <div
              key={`wind-${p.id}`}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size * 2,
                height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                borderRadius: 2,
                animation: `windFlow ${p.duration}s ease-in-out ${p.delay}s infinite`
              }}
            />
          ))}

          {data.condition === 'cloudy' && sunnyParticles.slice(0, 4).map((p) => (
            <div
              key={`cloudy-${p.id}`}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${15 + p.top * 0.4}%`,
                width: p.size * 1.5,
                height: p.size * 0.7,
                background: 'rgba(255,255,255,0.45)',
                borderRadius: p.size * 0.5,
                filter: 'blur(8px)',
                animation: `cloudFloat ${p.duration + 5}s linear ${p.delay}s infinite`
              }}
            />
          ))}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColor,
              zIndex: 2
            }}
          >
            <button
              onClick={handleCityClick}
              style={{
                fontSize: 24,
                color: textColor,
                fontWeight: 500,
                padding: '6px 16px',
                borderRadius: 20,
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {data.city}
            </button>
            <div style={{ fontSize: 64, fontWeight: 700, marginTop: 8, lineHeight: 1 }}>
              {data.temperature}°
            </div>
            <div
              style={{
                fontSize: 18,
                marginTop: 12,
                paddingBottom: 4,
                borderBottom: `2px solid transparent`,
                borderImage: `linear-gradient(90deg, ${style.accent}, transparent) 1`,
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {data.conditionText}
            </div>
            <div style={{ fontSize: 13, marginTop: 16, opacity: 0.75 }}>{data.date}</div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            borderRadius: 24
          }}
        >
          正在加载...
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          onClick={handleCollect}
          className={heartAnim ? 'heart-bounce' : ''}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill={isCollected ? '#E53935' : 'none'}
            stroke={isCollected ? '#E53935' : '#9E9E9E'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
    </div>
  );
});

WeatherCard.displayName = 'WeatherCard';
export default WeatherCard;
