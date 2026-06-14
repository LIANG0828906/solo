import { useMemo, useEffect, useState, memo, useRef, useCallback } from 'react';
import {
  calculateOptimalRoute,
  START_POINT,
  COMMUNITY_LOCATIONS,
  distance,
} from './utils/routing';
import type { CommunityLocation } from './types';
import './styles/DeliveryMap.css';

interface DeliveryMapProps {
  communities: string[];
}

interface SegmentInfo {
  from: CommunityLocation;
  to: CommunityLocation;
  length: number;
  path: string;
}

const SEGMENT_DURATION = 600;

function DeliveryMap({ communities }: DeliveryMapProps) {
  const [segmentProgress, setSegmentProgress] = useState<number[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  const route = useMemo(() => calculateOptimalRoute(communities), [communities]);
  const activeCommunitySet = useMemo(() => new Set(communities), [communities]);

  const segments: SegmentInfo[] = useMemo(() => {
    const result: SegmentInfo[] = [];
    for (let i = 1; i < route.order.length; i++) {
      const from = route.order[i - 1];
      const to = route.order[i];
      const len = distance(from, to);
      result.push({
        from,
        to,
        length: len,
        path: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      });
    }
    return result;
  }, [route]);

  const totalSegments = segments.length;

  const animate = useCallback((now: number) => {
    if (isPausedRef.current) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = now;
    }

    const elapsed = now - startTimeRef.current;
    const newProgress: number[] = [];

    for (let i = 0; i < totalSegments; i++) {
      const segmentStart = i * SEGMENT_DURATION;
      const segmentElapsed = elapsed - segmentStart;
      if (segmentElapsed <= 0) {
        newProgress.push(0);
      } else if (segmentElapsed >= SEGMENT_DURATION) {
        newProgress.push(1);
      } else {
        const t = segmentElapsed / SEGMENT_DURATION;
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        newProgress.push(easeT);
      }
    }

    setSegmentProgress((prev) => {
      if (prev.length !== newProgress.length) return newProgress;
      let changed = false;
      for (let i = 0; i < newProgress.length; i++) {
        if (Math.abs(prev[i] - newProgress[i]) > 0.001) {
          changed = true;
          break;
        }
      }
      return changed ? newProgress : prev;
    });

    const totalDuration = totalSegments * SEGMENT_DURATION;
    if (elapsed < totalDuration) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [totalSegments]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    pauseTimeRef.current = performance.now();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    const now = performance.now();
    const pausedDuration = now - pauseTimeRef.current;
    startTimeRef.current += pausedDuration;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    setSegmentProgress(new Array(totalSegments).fill(0));
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;
    isPausedRef.current = false;

    if (totalSegments === 0) return;

    rafRef.current = requestAnimationFrame(animate);

    const handleVisibility = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [totalSegments, animate, pause, resume]);

  const routeInfo = route.order
    .filter((_, i) => i > 0)
    .map((loc) => loc.community)
    .join(' → ');

  const reachedSegmentCount = segmentProgress.filter((p) => p >= 1).length;

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

          {segments.map((seg, i) => {
            const progress = segmentProgress[i] ?? 0;
            if (progress <= 0) return null;
            const dashOffset = seg.length * (1 - progress);
            return (
              <path
                key={`seg-${i}`}
                d={seg.path}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={seg.length}
                strokeDashoffset={dashOffset}
                className="route-segment"
              />
            );
          })}

          <g className={`start-point ${reachedSegmentCount > 0 || totalSegments === 0 ? 'visible' : ''}`}>
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
            const isReached = isInRoute && routeIndex <= reachedSegmentCount;
            const isAnimating = isInRoute && routeIndex === reachedSegmentCount + 1;

            return (
              <g
                key={loc.community}
                className={`community-point ${isActive ? 'active' : 'inactive'} ${isReached ? 'reached' : ''} ${isAnimating ? 'animating' : ''}`}
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
                  {isInRoute && (
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
