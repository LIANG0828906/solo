import { useAppStore } from '../store';
import { CITIES } from '../cityConfig';
import type { CityConfig } from '../types';

const CitySelector: React.FC = () => {
  const { currentCityId, setCurrentCity, isMobile } = useAppStore();

  const cardWidth = isMobile ? 80 : 120;
  const cardHeight = isMobile ? 100 : 160;
  const fontSize = isMobile ? 12 : 14;
  const tempFontSize = isMobile ? 11 : 13;
  const iconSize = isMobile ? 16 : 22;

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
        background: 'linear-gradient(180deg, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.5) 70%, rgba(26,26,46,0) 100%)',
        pointerEvents: 'none',
      }}
    >
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
        `}</style>
        {CITIES.map((city: CityConfig) => {
          const isSelected = city.id === currentCityId;
          const gradient = `linear-gradient(135deg, ${city.themeColors.gradient[0]} 0%, ${city.themeColors.gradient[1]} 100%)`;

          return (
            <div
              key={city.id}
              onClick={() => setCurrentCity(city.id)}
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
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                userSelect: 'none',
                boxShadow: isSelected
                  ? `0 0 10px 3px ${city.themeColors.glow}50, 0 0 20px 5px ${city.themeColors.glow}30`
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1.05)';
                  el.style.boxShadow = `0 4px 20px rgba(255,255,255,0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'scale(1)';
                if (!isSelected) {
                  el.style.boxShadow = 'none';
                } else {
                  el.style.boxShadow = `0 0 10px 3px ${city.themeColors.glow}50, 0 0 20px 5px ${city.themeColors.glow}30`;
                }
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? 6 : 10,
                  left: isMobile ? 8 : 12,
                  fontSize,
                  color: '#ffffff',
                  fontWeight: 600,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
                  zIndex: 2,
                }}
              >
                {city.name}
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: isMobile ? 6 : 10,
                  right: isMobile ? 8 : 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: isMobile ? 2 : 4,
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: iconSize, lineHeight: 1 }}>{city.weatherIcon}</div>
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
              </div>

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
