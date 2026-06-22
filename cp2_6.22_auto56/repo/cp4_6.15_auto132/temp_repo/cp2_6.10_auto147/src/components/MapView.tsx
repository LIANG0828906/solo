import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import type { Town } from '../types';
import '../styles/MapView.css';

const MapView = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTown, setHoveredTown] = useState<Town | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const {
    towns,
    risks,
    route,
    mapScale,
    mapOffset,
    addTownToRoute,
    removeTownFromRoute,
    setMapTransform,
  } = useAppStore((state) => ({
    towns: state.towns,
    risks: state.risks,
    route: state.route,
    mapScale: state.mapScale,
    mapOffset: state.mapOffset,
    addTownToRoute: state.addTownToRoute,
    removeTownFromRoute: state.removeTownFromRoute,
    setMapTransform: state.setMapTransform,
  }));

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.town-marker')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapOffset.x,
      y: e.clientY - mapOffset.y,
    });
  }, [mapOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };

    requestAnimationFrame(() => {
      setMapTransform(mapScale, newOffset);
    });
  }, [isDragging, dragStart, mapScale, setMapTransform]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, mapScale * delta));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newOffset = {
        x: mouseX - (mouseX - mapOffset.x) * (newScale / mapScale),
        y: mouseY - (mouseY - mapOffset.y) * (newScale / mapScale),
      };

      setMapTransform(newScale, newOffset);
    }
  }, [mapScale, mapOffset, setMapTransform]);

  const handleTownClick = useCallback((town: Town, e: React.MouseEvent) => {
    e.stopPropagation();
    const isInRoute = route.some((r) => r.townId === town.id);
    if (isInRoute) {
      removeTownFromRoute(town.id);
    } else {
      addTownToRoute(town.id);
    }
  }, [route, addTownToRoute, removeTownFromRoute]);

  const handleTownHover = useCallback((town: Town | null, e?: React.MouseEvent) => {
    setHoveredTown(town);
    if (e && town) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left + 15,
          y: e.clientY - rect.top - 10,
        });
      }
    }
  }, []);

  const getTerrainPath = () => {
    const terrainPaths = [
      { type: 'desert', d: 'M0,100 Q200,50 400,120 Q600,180 800,100 L800,600 L0,600 Z', className: 'terrain-desert' },
      { type: 'oasis', d: 'M150,200 Q250,150 350,220 Q450,280 400,350 Q300,400 200,360 Q100,320 150,200', className: 'terrain-oasis' },
      { type: 'gobi', d: 'M500,50 Q700,30 800,100 Q850,200 800,300 Q700,350 550,300 Q450,250 500,50', className: 'terrain-gobi' },
      { type: 'desert', d: 'M0,400 Q150,350 300,420 Q450,500 600,450 Q750,400 800,450 L800,600 L0,600 Z', className: 'terrain-desert' },
    ];
    return terrainPaths;
  };

  const getRouteOrder = (townId: string) => {
    const node = route.find((r) => r.townId === townId);
    return node ? node.order + 1 : null;
  };

  const renderRoute = () => {
    if (route.length < 2) return null;

    const points = route
      .map((node) => {
        const town = towns.find((t) => t.id === node.townId);
        return town ? { x: town.x, y: town.y } : null;
      })
      .filter(Boolean) as Array<{ x: number; y: number }>;

    if (points.length < 2) return null;

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2 - 20;
      pathD += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
    }

    return (
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        className="route-line"
        style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}
      />
    );
  };

  const getTownIcon = (type: Town['type']) => {
    const icons: Record<Town['type'], string> = {
      fortress: '🏰',
      oasis: '🌴',
      desert: '🏜️',
      gobi: '🪨',
    };
    return icons[type] || '📍';
  };

  const getRiskIcon = (type: string) => {
    const icons: Record<string, string> = {
      sandstorm: '🌪️',
      bandits: '⚔️',
      plague: '☠️',
      drought: '☀️',
    };
    return icons[type] || '⚠️';
  };

  return (
    <div
      ref={containerRef}
      className="map-container ink-border"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="map-svg"
        style={{
          transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <pattern id="sandPattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="var(--color-desert)" />
            <circle cx="3" cy="3" r="0.5" fill="rgba(0,0,0,0.1)" />
            <circle cx="7" cy="7" r="0.5" fill="rgba(0,0,0,0.1)" />
          </pattern>

          <filter id="terrainShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="800" height="600" fill="url(#sandPattern)" opacity="0.3" />

        <g filter="url(#terrainShadow)">
          {getTerrainPath().map((path, index) => (
            <path
              key={index}
              d={path.d}
              className={path.className}
              opacity="0.7"
            />
          ))}
        </g>

        <g>
          {risks.map((risk) => (
            <g key={risk.id} className="risk-marker">
              <circle
                cx={risk.x}
                cy={risk.y}
                r={risk.radius}
                fill="rgba(194, 59, 34, 0.2)"
                stroke="var(--color-risk-high)"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
              <text
                x={risk.x}
                y={risk.y + 6}
                textAnchor="middle"
                fontSize="20"
              >
                {getRiskIcon(risk.type)}
              </text>
            </g>
          ))}
        </g>

        <g>
          {renderRoute()}
        </g>

        <g>
          {towns.map((town) => {
            const order = getRouteOrder(town.id);
            return (
              <g
                key={town.id}
                className="town-marker ripple-target"
                onClick={(e) => handleTownClick(town, e)}
                onMouseEnter={(e) => handleTownHover(town, e)}
                onMouseMove={(e) => handleTownHover(town, e)}
                onMouseLeave={() => handleTownHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <motion.circle
                  cx={town.x}
                  cy={town.y}
                  r={order ? 22 : 18}
                  fill={order ? 'var(--color-accent)' : 'var(--color-parchment-light)'}
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                  whileHover={{ r: order ? 26 : 22 }}
                  whileTap={{ scale: 0.9 }}
                  filter={order ? 'url(#glow)' : undefined}
                  animate={{ r: order ? [22, 24, 22] : 18 }}
                  transition={{ duration: 1, repeat: order ? Infinity : 0 }}
                />
                <text
                  x={town.x}
                  y={town.y + 6}
                  textAnchor="middle"
                  fontSize="16"
                  style={{ pointerEvents: 'none' }}
                >
                  {order !== null ? order : getTownIcon(town.type)}
                </text>
                <text
                  x={town.x}
                  y={town.y + 36}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-ink)"
                  fontFamily="var(--font-serif)"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {town.name}
                </text>
              </g>
            );
          })}
        </g>

        <g className="map-decoration" style={{ pointerEvents: 'none' }}>
          <path
            d="M20,20 L780,20 L780,20 L780,580 L20,580 L20,20"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2"
            strokeDasharray="20,10"
            opacity="0.5"
          />

          <text x="60" y="50" fontSize="24" opacity="0.6">📜</text>
          <text x="720" y="50" fontSize="24" opacity="0.6">🗺️</text>
          <text x="60" y="570" fontSize="24" opacity="0.6">🧭</text>
          <text x="720" y="570" fontSize="24" opacity="0.6">⚔️</text>

          <text x="400" y="40" textAnchor="middle" fontSize="14" fill="var(--color-ink-light)" fontFamily="var(--font-calligraphy)">
            西域丝绸之路北道
          </text>
        </g>
      </svg>

      <div className="map-controls">
        <button
          className="ink-button"
          onClick={(e) => {
            e.stopPropagation();
            setMapTransform(1, { x: 0, y: 0 });
          }}
        >
          重置视图
        </button>
        <span className="zoom-indicator">缩放: {Math.round(mapScale * 100)}%</span>
      </div>

      <AnimatePresence>
        {hoveredTown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="town-tooltip ink-border"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <h4 className="title-calligraphy">{hoveredTown.name}</h4>
            <p className="tooltip-type">
              {hoveredTown.type === 'fortress' && '🏰 军事重镇'}
              {hoveredTown.type === 'oasis' && '🌴 绿洲城邦'}
              {hoveredTown.type === 'desert' && '🏜️ 沙漠驿站'}
              {hoveredTown.type === 'gobi' && '🪨 戈壁据点'}
            </p>
            <p className="tooltip-desc">{hoveredTown.description}</p>
            {getRouteOrder(hoveredTown.id) && (
              <p className="tooltip-order">路线顺序: 第 {getRouteOrder(hoveredTown.id)} 站</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="map-legend">
        <h4 className="title-calligraphy legend-title">图例</h4>
        <div className="legend-item">
          <span className="legend-icon">🏰</span>
          <span>军事重镇</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🌴</span>
          <span>绿洲城邦</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🌪️</span>
          <span>沙暴区域</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">⚔️</span>
          <span>马贼出没</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
