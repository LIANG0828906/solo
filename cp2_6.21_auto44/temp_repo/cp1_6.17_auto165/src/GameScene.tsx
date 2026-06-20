import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './gameStore';
import { getConnections } from './EconomyEngine';
import { getCargoUsed } from './ShipState';
import type { Planet, Commodity } from './types';

const PLANET_COLORS = ['#45A29E', '#66FCF1', '#45A29E'];

export const GameScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const planets = useGameStore(s => s.planets);
  const ship = useGameStore(s => s.ship);
  const currentPlanet = useGameStore(s => s.currentPlanet);
  const isMoving = useGameStore(s => s.isMoving);
  const mapZoom = useGameStore(s => s.mapZoom);
  const travelToPlanet = useGameStore(s => s.travelToPlanet);
  const setMapZoom = useGameStore(s => s.setMapZoom);

  const connections = React.useMemo(() => getConnections(planets), [planets]);

  const handleClick = useCallback((planet: Planet) => {
    if (ship.currentPlanetId === planet.id) return;
    travelToPlanet(planet);
  }, [ship.currentPlanetId, travelToPlanet]);

  const mapWidth = 600;
  const mapHeight = 420;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <svg
        ref={svgRef}
        width="100%"
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        style={{
          background: 'radial-gradient(ellipse at center, #0E1117 0%, #0B0C10 100%)',
          borderRadius: '8px',
          border: '1px solid #1F2833',
          cursor: 'default',
        }}
      >
        <defs>
          <radialGradient id="planetGlow">
            <stop offset="0%" stopColor="#66FCF1" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#45A29E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#45A29E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="currentPlanetGlow">
            <stop offset="0%" stopColor="#66FCF1" stopOpacity="1" />
            <stop offset="40%" stopColor="#45A29E" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#45A29E" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map(([p1, p2], i) => (
          <line
            key={`conn-${p1.id}-${p2.id}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="rgba(102,252,241,0.15)"
            strokeWidth="1"
            strokeDasharray="6,4"
          />
        ))}

        {planets.map(planet => {
          const isCurrent = planet.id === ship.currentPlanetId;
          return (
            <g
              key={planet.id}
              onClick={() => handleClick(planet)}
              style={{ cursor: isCurrent ? 'default' : 'pointer' }}
            >
              {isCurrent && (
                <circle cx={planet.x} cy={planet.y} r="25" fill="url(#currentPlanetGlow)" />
              )}
              <circle cx={planet.x} cy={planet.y} r="25" fill="url(#planetGlow)" opacity={isCurrent ? 0 : 0.4} />
              <circle
                cx={planet.x}
                cy={planet.y}
                r="10"
                fill={isCurrent ? '#66FCF1' : '#45A29E'}
                filter="url(#glow)"
                stroke={isCurrent ? '#66FCF1' : '#45A29E'}
                strokeWidth="1"
              />
              {planet.refusesTrade && (
                <text
                  x={planet.x}
                  y={planet.y - 18}
                  textAnchor="middle"
                  fill="#FF4444"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  禁止交易
                </text>
              )}
              <text
                x={planet.x}
                y={planet.y + 22}
                textAnchor="middle"
                fill="#C5C6C7"
                fontSize="9"
                fontFamily="monospace"
              >
                {planet.name}
              </text>
            </g>
          );
        })}

        <circle
          cx={ship.x}
          cy={ship.y}
          r="5"
          fill="#FFD700"
          stroke="#FFD700"
          strokeWidth="1"
          filter="url(#glow)"
          style={{
            transition: 'cx 0.3s ease, cy 0.3s ease',
          }}
        />
      </svg>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
      }}>
        <button
          onClick={() => setMapZoom(mapZoom + 0.1)}
          style={zoomBtnStyle}
        >
          放大 +
        </button>
        <button
          onClick={() => setMapZoom(mapZoom - 0.1)}
          style={zoomBtnStyle}
        >
          缩小 -
        </button>
        <span style={{ color: '#C5C6C7', fontFamily: 'monospace', fontSize: '12px', lineHeight: '28px' }}>
          缩放: {mapZoom.toFixed(1)}x
        </span>
      </div>
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  background: '#1F2833',
  border: '1px solid #45A29E',
  color: '#66FCF1',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '4px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};
