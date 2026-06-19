import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { OrderCard } from './orderCard';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';

const FILTERS: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'delivering', 'delivered', 'completed'];

export const OrderList: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter((order) => order.status === activeFilter);
  }, [orders, activeFilter]);

  const handleStatusUpdate = useCallback(
    (id: string, status: OrderStatus) => {
      updateOrderStatus(id, status);
    },
    [updateOrderStatus]
  );

  const getFilterLabel = (filter: OrderStatus | 'all') => {
    if (filter === 'all') return '全部';
    return ORDER_STATUS_LABELS[filter];
  };

  const getFilterCount = (filter: OrderStatus | 'all') => {
    if (filter === 'all') return orders.length;
    return orders.filter((o) => o.status === filter).length;
  };

  return (
    <div className="order-list-page">
      <div className="page-header">
        <h2 className="page-title">订单处理</h2>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            <span>{getFilterLabel(filter)}</span>
            <span className="filter-count">{getFilterCount(filter)}</span>
          </button>
        ))}
      </div>

      <div className="order-grid">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p className="empty-text">暂无订单</p>
        </div>
      )}

      <style>{`
        .order-list-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 300ms ease-out;
        }
        .page-header {
          margin-bottom: 20px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .filter-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-light);
          white-space: nowrap;
          transition: all var(--transition-normal) ease;
          min-height: 40px;
        }
        .filter-tab:hover {
          background-color: var(--color-background);
          color: var(--color-text);
        }
        .filter-tab.active {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .filter-count {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 12px;
        }
        .filter-tab.active .filter-count {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
        }
        .empty-icon {
          font-size: 64px;
          opacity: 0.5;
        }
        .empty-text {
          color: var(--color-text-light);
          font-size: 16px;
        }
        @media (max-width: 768px) {
          .order-list-page {
            padding: 16px;
          }
          .page-title {
            font-size: 20px;
          }
          .order-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};
