import React from 'react';

export interface PlanetData {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
}

interface StarMapProps {
  planets: PlanetData[];
  currentPlanetId: string;
  selectedPlanetId: string | null;
  onSelectPlanet: (planetId: string) => void;
  isTraveling: boolean;
}

const StarMap: React.FC<StarMapProps> = ({
  planets,
  currentPlanetId,
  selectedPlanetId,
  onSelectPlanet,
  isTraveling
}) => {
  const stars = React.useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3
    }));
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0B0E27 0%, #0A0A1A 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(0, 255, 255, 0.15)'
      }}
    >
      {stars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            animation: `starTwinkle 2s ease-in-out ${star.delay}s infinite`
          }}
        />
      ))}

      {planets.map(planet => {
        const isCurrent = planet.id === currentPlanetId;
        const isSelected = planet.id === selectedPlanetId;

        return (
          <div
            key={planet.id}
            className="planet-node"
            onClick={() => !isTraveling && onSelectPlanet(planet.id)}
            style={{
              position: 'absolute',
              left: `${planet.position.x}%`,
              top: `${planet.position.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isTraveling ? 'not-allowed' : 'pointer',
              opacity: isTraveling ? 0.6 : 1
            }}
          >
            {isCurrent && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 80,
                  height: 80,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `2px solid ${planet.color}`,
                  opacity: 0.4,
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }}
              />
            )}

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88, ${planet.color}44)`,
                boxShadow: isSelected
                  ? `0 0 20px ${planet.color}, 0 0 40px ${planet.color}88`
                  : `0 0 10px ${planet.color}66`,
                border: isSelected ? '3px solid #00FFFF' : '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              {isCurrent && (
                <span style={{ fontSize: 20 }}>🛸</span>
              )}
            </div>

            <div className="planet-tooltip">
              {planet.name}
              {isCurrent && ' (当前)'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StarMap;
