import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { DeliveryMarker } from './deliveryMarker';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { DeliveryRoute } from '@/types';

const TRAIL_LENGTH = 5;
const MOVE_INTERVAL = 2000;

export const DeliveryMap: React.FC = () => {
  const { orders, deliveryRoutes, updateDeliveryLocation } = useStore();
  const [routes, setRoutes] = useState<DeliveryRoute[]>(deliveryRoutes);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status === 'delivering' || order.status === 'delivered'
    );
  }, [orders]);

  const getCurrentPosition = useCallback((route: DeliveryRoute) => {
    const { path, currentIndex, progress } = route;
    if (currentIndex >= path.length - 1) {
      return path[path.length - 1];
    }
    const start = path[currentIndex];
    const end = path[currentIndex + 1];
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    };
  }, []);

  const getTrail = useCallback((route: DeliveryRoute) => {
    const trail: { x: number; y: number }[] = [];
    const { path, currentIndex, progress } = route;

    for (let i = 1; i <= TRAIL_LENGTH; i++) {
      let idx = currentIndex;
      let prog = progress - i * 0.15;

      while (prog < 0 && idx > 0) {
        idx--;
        prog += 1;
      }

      if (idx >= 0 && prog >= 0) {
        const start = path[idx];
        const end = path[Math.min(idx + 1, path.length - 1)];
        trail.push({
          x: start.x + (end.x - start.x) * Math.min(prog, 1),
          y: start.y + (end.y - start.y) * Math.min(prog, 1),
        });
      }
    }

    return trail;
  }, []);

  useEffect(() => {
    setRoutes(deliveryRoutes);
  }, [deliveryRoutes]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= MOVE_INTERVAL) {
        lastUpdateRef.current = timestamp;

        setRoutes((prevRoutes) => {
          const updatedRoutes = prevRoutes.map((route) => {
            const order = orders.find((o) => o.id === route.orderId);
            if (!order || order.status === 'delivered' || order.status === 'completed') {
              return { ...route, progress: 1, currentIndex: route.path.length - 1 };
            }

            let newProgress = route.progress + 0.25;
            let newIndex = route.currentIndex;

            if (newProgress >= 1) {
              newProgress = 0;
              newIndex = Math.min(newIndex + 1, route.path.length - 1);
            }

            const newRoute = {
              ...route,
              currentIndex: newIndex,
              progress: newProgress,
            };

            const position = getCurrentPosition(newRoute);
            updateDeliveryLocation(route.orderId, position);

            return newRoute;
          });

          storage.set(STORAGE_KEYS.DELIVERY_ROUTES, updatedRoutes);
          return updatedRoutes;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [orders, getCurrentPosition, updateDeliveryLocation]);

  const deliveringCount = activeOrders.filter((o) => o.status === 'delivering').length;
  const deliveredCount = activeOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;

  return (
    <div className="delivery-map-page">
      <div className="page-header">
        <h2 className="page-title">配送追踪</h2>
        <div className="delivery-stats">
          <span className="stat-item delivering">
            <span className="stat-dot" />
            配送中 {deliveringCount}
          </span>
          <span className="stat-item delivered">
            <span className="stat-dot" />
            已送达 {deliveredCount}
          </span>
        </div>
      </div>

      <div className="map-container">
        <div className="map-grid">
          {activeOrders.map((order) => {
            const route = routes.find((r) => r.orderId === order.id);
            if (!route) return null;
            const position = getCurrentPosition(route);
            const trail = getTrail(route);
            return (
              <DeliveryMarker
                key={order.id}
                order={order}
                position={position}
                trail={trail}
              />
            );
          })}

          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot delivering" />
              <span>配送中</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot delivered" />
              <span>已送达</span>
            </div>
          </div>
        </div>
      </div>

      <div className="delivery-list">
        <h3 className="list-title">配送订单</h3>
        <div className="order-cards">
          {activeOrders.map((order) => {
            const route = routes.find((r) => r.orderId === order.id);
            const progress = route
              ? Math.round(
                  ((route.currentIndex + route.progress) / (route.path.length - 1)) * 100
                )
              : 0;

            return (
              <div key={order.id} className="delivery-order-card">
                <div className="order-info">
                  <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-user">{order.userName}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor:
                        order.status === 'delivered' || order.status === 'completed'
                          ? 'var(--color-success)'
                          : 'var(--color-accent)',
                    }}
                  />
                </div>
                <div className="progress-info">
                  <span
                    className={`status ${order.status === 'delivered' || order.status === 'completed' ? 'delivered' : 'delivering'}`}
                  >
                    {order.status === 'delivered' || order.status === 'completed' ? '已送达' : '配送中'}
                  </span>
                  <span className="progress-text">{Math.min(progress, 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .delivery-map-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 300ms ease-out;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }
        .delivery-stats {
          display: flex;
          gap: 20px;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .stat-item.delivering {
          color: var(--color-accent);
        }
        .stat-item.delivering .stat-dot {
          background-color: var(--color-accent);
          animation: pulse 2s ease-in-out infinite;
        }
        .stat-item.delivered {
          color: var(--color-success);
        }
        .stat-item.delivered .stat-dot {
          background-color: var(--color-success);
        }
        .map-container {
          background-color: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
        .map-grid {
          position: relative;
          width: 100%;
          height: 400px;
          background-image: 
            linear-gradient(rgba(42, 157, 143, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(42, 157, 143, 0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          background-color: #F8FBF9;
        }
        .map-legend {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.9);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .legend-dot.delivering {
          background-color: var(--color-accent);
        }
        .legend-dot.delivered {
          background-color: var(--color-success);
        }
        .delivery-list {
          background-color: var(--color-surface);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .list-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 16px 0;
        }
        .order-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        .delivery-order-card {
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .order-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-id {
          font-family: monospace;
          font-size: 13px;
          color: var(--color-primary);
          font-weight: 600;
        }
        .order-user {
          font-size: 14px;
          color: var(--color-text);
          font-weight: 500;
        }
        .progress-bar {
          height: 6px;
          background-color: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 2s linear, background-color var(--transition-normal);
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status {
          font-size: 12px;
          font-weight: 500;
        }
        .status.delivering {
          color: var(--color-accent);
        }
        .status.delivered {
          color: var(--color-success);
        }
        .progress-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-light);
        }
        @media (max-width: 768px) {
          .delivery-map-page {
            padding: 16px;
          }
          .page-title {
            font-size: 20px;
          }
          .map-grid {
            height: 300px;
          }
          .order-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
