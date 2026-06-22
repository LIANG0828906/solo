import { memo, useCallback, useMemo, useState, type FC, type DragEvent, type ReactNode } from 'react';
import OrderCard from './OrderCard';
import { useOrderStore } from '../store/orderStore';
import { STATUS_CONFIG, type Order, type OrderStatus } from '../types';

const STATUSES: OrderStatus[] = ['pending', 'cooking', 'finishing', 'completed'];

const KitchenBoard: FC = memo(() => {
  const { orders, draggingOrder, moveOrder, setDragOverArea, dragOverArea } = useOrderStore();
  const [dropIndex, setDropIndex] = useState<{ status: OrderStatus; index: number } | null>(null);

  const ordersByStatus = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      pending: [],
      cooking: [],
      finishing: [],
      completed: [],
    };
    orders.forEach((o) => {
      map[o.status].push(o);
    });
    return map;
  }, [orders]);

  const handleDragOver = useCallback((e: DragEvent, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverArea(status);

    const container = e.currentTarget.querySelector('.board-area__scroll') as HTMLElement;
    if (!container || !draggingOrder) return;

    const cards = container.querySelectorAll<HTMLElement>('.order-card');
    let newIndex = cards.length;
    const mouseX = e.clientX;

    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardMid = rect.left + rect.width / 2;
      if (mouseX < cardMid) {
        newIndex = i;
      }
    });

    setDropIndex({ status, index: newIndex });
  }, [draggingOrder, setDragOverArea]);

  const handleDragLeave = useCallback(() => {
    setDragOverArea(null);
    setDropIndex(null);
  }, [setDragOverArea]);

  const handleDrop = useCallback((e: DragEvent, status: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (!orderId) return;
    const idx = dropIndex?.status === status ? dropIndex.index : (ordersByStatus[status].length);
    moveOrder(orderId, status, idx);
    setDragOverArea(null);
    setDropIndex(null);
  }, [moveOrder, dropIndex, ordersByStatus, setDragOverArea]);

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];
        const isOver = dragOverArea === status;
        const list = ordersByStatus[status];
        return (
          <div
            key={status}
            className={`board-area ${isOver ? 'board-area--over' : ''}`}
            style={{ background: `linear-gradient(180deg, ${config.bgColor} 0%, ${config.bgColor}dd 100%)` }}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="board-area__header">
              <h2 className="board-area__title">{config.label}</h2>
              <span className="board-area__count">{list.length}</span>
            </div>

            <div className="board-area__scroll">
              {(() => {
                const children: ReactNode[] = [];
                list.forEach((order, i) => {
                  if (dropIndex?.status === status && dropIndex.index === i) {
                    children.push(
                      <div key={`drop-${status}-${i}`} className="board-area__drop-indicator" />
                    );
                  }
                  children.push(<OrderCard key={order.id} order={order} />);
                });
                if (dropIndex?.status === status && dropIndex.index === list.length) {
                  children.push(
                    <div key={`drop-${status}-end`} className="board-area__drop-indicator" />
                  );
                }
                if (list.length === 0 && !draggingOrder) {
                  children.push(
                    <div key={`empty-${status}`} className="board-area__empty">暂无订单</div>
                  );
                }
                return children;
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
});

KitchenBoard.displayName = 'KitchenBoard';

export default KitchenBoard;
