import { useState } from 'react';
import { useAppStore } from '../store';
import { CITIES } from '../cityConfig';
import type { CityConfig } from '../types';

const CitySelector: React.FC = () => {
  const { currentCityId, setCurrentCity, isMobile } = useAppStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cardWidth = isMobile ? 80 : 120;
  const cardHeight = isMobile ? 100 : 160;
  const nameFontSize = isMobile ? 12 : 14;
  const tempFontSize = isMobile ? 10 : 11;
  const descFontSize = isMobile ? 10 : 12;
  const iconSize = isMobile ? 16 : 22;
  const tempTagFontSize = isMobile ? 9 : 11;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        boxSizing: 'border-box',
        zIndex: 10,
        background:
          'linear-gradient(180deg, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.5) 70%, rgba(26,26,46,0) 100%)',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        div::-webkit-scrollbar { display: none; }
        @keyframes borderGlow {
          0% { box-shadow: 0 0 0 0 currentColor, 0 0 0 0 currentColor; opacity: 0; }
          50% { opacity: 1; }
          100% { box-shadow: 0 0 10px 3px currentColor, 0 0 20px 5px currentColor; opacity: 1; }
        }
        .city-card-selected {
          animation: borderGlow 0.3s ease-out forwards;
        }
        @keyframes slideUpIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .weather-desc-enter {
          animation: slideUpIn 0.3s ease-out forwards;
        }
        @keyframes slideDownOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        .weather-desc-leave {
          animation: slideDownOut 0.2s ease-in forwards;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: isMobile ? 10 : 16,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '8px 16px',
          scrollbarWidth: 'none',
          maxWidth: '100%',
          pointerEvents: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CITIES.map((city: CityConfig) => {
          const isSelected = city.id === currentCityId;
          const isHovered = hoveredId === city.id;
          const gradient = `linear-gradient(135deg, ${city.themeColors.gradient[0]} 0%, ${city.themeColors.gradient[1]} 100%)`;
          const liftOffset = isHovered && !isMobile ? -4 : 0;

          return (
            <div
              key={city.id}
              onClick={() => setCurrentCity(city.id)}
              onMouseEnter={() => setHoveredId(city.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={isSelected ? 'city-card-selected' : ''}
              style={{
                flex: `0 0 ${cardWidth}px`,
                width: cardWidth,
                height: cardHeight,
                borderRadius: 16,
                background: gradient,
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                border: isSelected ? `3px solid ${city.themeColors.border}` : '2px solid transparent',
                color: city.themeColors.border,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                userSelect: 'none',
                boxShadow: isSelected
                  ? `0 0 10px 3px ${city.themeColors.glow}50, 0 0 20px 5px ${city.themeColors.glow}30`
                  : isHovered && !isMobile
                    ? '0 8px 28px rgba(0,0,0,0.35)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                transform: `translateY(${liftOffset}px) ${isHovered && !isMobile ? 'scale(1.05)' : 'scale(1)'}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? 6 : 10,
                  left: isMobile ? 8 : 12,
                  right: isMobile ? 8 : 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? 2 : 4,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontSize: nameFontSize,
                    color: '#ffffff',
                    fontWeight: 600,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
                    lineHeight: 1.2,
                  }}
                >
                  {city.name}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: `${isMobile ? 1 : 2}px ${isMobile ? 5 : 8}px`,
                    background: 'rgba(0, 0, 0, 0.35)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 999,
                    fontSize: tempTagFontSize,
                    color: '#ffffff',
                    fontWeight: 500,
                    width: 'fit-content',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    letterSpacing: 0.3,
                  }}
                >
                  {city.temperature}°C
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: isHovered && !isMobile ? isMobile ? 28 : 40 : isMobile ? 6 : 10,
                  right: isMobile ? 8 : 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: isMobile ? 2 : 4,
                  zIndex: 2,
                  transition: 'bottom 0.25s ease',
                }}
              >
                <div style={{ fontSize: iconSize, lineHeight: 1 }}>{city.weatherIcon}</div>
                {!isHovered && (
                  <div
                    style={{
                      fontSize: tempFontSize,
                      color: '#ffffff',
                      fontWeight: 500,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                      lineHeight: 1,
                    }}
                  >
                    {city.temperature}°C
                  </div>
                )}
              </div>

              {!isMobile && (
                <div
                  className={isHovered ? 'weather-desc-enter' : hoveredId !== null ? 'weather-desc-leave' : ''}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: `${isMobile ? 6 : 10}px ${isMobile ? 8 : 12}px`,
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                    color: '#ffffff',
                    fontSize: descFontSize,
                    fontWeight: 500,
                    textAlign: 'center',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    zIndex: 3,
                    letterSpacing: 1,
                    opacity: isHovered ? 1 : 0,
                    pointerEvents: 'none',
                    transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
                    transition: isHovered ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
                  }}
                >
                  {city.weatherDesc}
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at top right, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitySelector;
