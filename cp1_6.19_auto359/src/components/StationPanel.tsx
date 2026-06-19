import { memo, useCallback, type FC } from 'react';
import { useOrderStore } from '../store/orderStore';
import type { Station } from '../types';

interface StationRingProps {
  station: Station;
  onLock: (stationType: string) => void;
}

const StationRing: FC<StationRingProps> = memo(({ station, onLock }) => {
  const { orders } = useOrderStore();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (station.load / 100) * circumference;
  const isOverload = station.load > 80;
  const recommended = station.recommendedOrderId
    ? orders.find((o) => o.id === station.recommendedOrderId)
    : null;

  const handleClick = useCallback(() => {
    onLock(station.type);
  }, [onLock, station.type]);

  return (
    <div
      className={`station-ring ${isOverload ? 'station-ring--overload' : ''}`}
      onClick={handleClick}
    >
      <svg viewBox="0 0 100 100" className="station-ring__svg">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={station.color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)' }}
          className={isOverload ? 'station-ring__path--blink' : ''}
        />
      </svg>
      <div className="station-ring__content">
        <span className="station-ring__name" style={{ color: station.color }}>
          {station.name}
        </span>
        <span className="station-ring__load">{Math.round(station.load)}%</span>
      </div>
      <div className="station-ring__active">{station.activeOrders.length}单</div>
      {recommended && isOverload && (
        <div className="station-ring__recommend" title={`推荐加塞: #${recommended.tableNumber}`}>
          ⚡ #{recommended.tableNumber}
        </div>
      )}
    </div>
  );
});

StationRing.displayName = 'StationRing';

const StationPanel: FC = memo(() => {
  const { stations, orders, lockOrderToStation, draggingOrder } = useOrderStore();

  const handleLock = useCallback(
    (stationType: string) => {
      if (draggingOrder) {
        lockOrderToStation(draggingOrder.id, stationType as any);
      } else {
        const pending = orders.find((o) => o.status === 'pending');
        if (pending) {
          lockOrderToStation(pending.id, stationType as any);
        }
      }
    },
    [draggingOrder, lockOrderToStation, orders]
  );

  return (
    <div className="station-panel">
      <div className="station-panel__title">档口负载</div>
      <div className="station-panel__rings">
        {stations.map((s) => (
          <StationRing key={s.type} station={s} onLock={handleLock} />
        ))}
      </div>
      <div className="station-panel__hint">
        {draggingOrder ? '点击环锁定拖拽订单' : '点击环锁定优先订单'}
      </div>
    </div>
  );
});

StationPanel.displayName = 'StationPanel';

export default StationPanel;
