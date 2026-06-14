import { useMemo, useEffect, useState, memo } from 'react';
import {
  calculateOptimalRoute,
  buildRoutePath,
  START_POINT,
  COMMUNITY_LOCATIONS,
} from './utils/routing';
import './styles/DeliveryMap.css';

interface DeliveryMapProps {
  communities: string[];
}

function DeliveryMap({ communities }: DeliveryMapProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  const route = useMemo(() => calculateOptimalRoute(communities), [communities]);
  const pathD = useMemo(() => buildRoutePath(route.order), [route]);

  const activeCommunitySet = useMemo(() => new Set(communities), [communities]);

  useEffect(() => {
    setAnimationProgress(0);
    let frame: number;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pathD]);

  const routeInfo = route.order
    .filter((_, i) => i > 0)
    .map((loc) => loc.community)
    .join(' → ');

  return (
    <div className="delivery-map-card">
      <h2 className="map-title">配送路线</h2>
      <div className="map-container">
        <svg viewBox="0 0 650 380" className="map-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#e8f5e9"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e67e22" />
              <stop offset="100%" stopColor="#2ecc71" />
            </linearGradient>
          </defs>

          <rect width="650" height="380" fill="url(#grid)" />

          <path
            d={pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - animationProgress)}
            className="route-path"
          />

          <g className="start-point">
            <circle cx={START_POINT.x} cy={START_POINT.y} r="12" fill="#e67e22" />
            <circle cx={START_POINT.x} cy={START_POINT.y} r="6" fill="#fff" />
            <text
              x={START_POINT.x}
              y={START_POINT.y + 30}
              textAnchor="middle"
              className="location-label start-label"
            >
              {START_POINT.community}
            </text>
          </g>

          {COMMUNITY_LOCATIONS.map((loc) => {
            const isActive = activeCommunitySet.has(loc.community);
            const routeIndex = route.order.findIndex((r) => r.community === loc.community);
            const isInRoute = routeIndex > 0;
            const shouldShow = animationProgress >= (routeIndex - 1) / Math.max(route.order.length - 1, 1);

            return (
              <g
                key={loc.community}
                className={`community-point ${isActive ? 'active' : 'inactive'} ${isInRoute && shouldShow ? 'visible' : ''}`}
              >
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isActive ? 10 : 7}
                  fill={isActive ? '#2ecc71' : '#bdc3c7'}
                />
                <circle cx={loc.x} cy={loc.y} r="4" fill="#fff" />
                <text
                  x={loc.x}
                  y={loc.y + 24}
                  textAnchor="middle"
                  className={`location-label ${isActive ? 'active-label' : 'inactive-label'}`}
                >
                  {loc.community}
                  {isActive && routeIndex > 0 && (
                    <tspan className="route-index"> #{routeIndex}</tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="route-info">
        <div className="route-legend">
          <span className="legend-item">
            <span className="legend-dot start"></span>
            起点（团长仓库）
          </span>
          <span className="legend-item">
            <span className="legend-dot active"></span>
            配送小区
          </span>
          <span className="legend-item">
            <span className="legend-dot inactive"></span>
            暂无订单
          </span>
        </div>
        {routeInfo && (
          <div className="route-path-text">
            <strong>路线：</strong>
            <span>{START_POINT.community} → {routeInfo}</span>
            <span className="distance-info">（总距离约 {Math.round(route.totalDistance)} 单位）</span>
          </div>
        )}
        {communities.length === 0 && (
          <div className="route-empty">暂无配送订单，请先录入订单</div>
        )}
      </div>
    </div>
  );
}

export default memo(DeliveryMap);
