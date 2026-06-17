import React, { useEffect } from 'react';
import { useLunchMateStore } from '../store';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import type { OrderItem } from '../types';

const PeopleCountSelector: React.FC = () => {
  const { peopleCount, setPeopleCount } = useLunchMateStore();

  return (
    <div className="people-selector">
      <span className="people-label">拼单人数</span>
      <div className="people-buttons">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <button
            key={num}
            className={`people-btn ${peopleCount === num ? 'active' : ''}`}
            onClick={() => setPeopleCount(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

interface OrderItemRowProps {
  item: OrderItem;
  index: number;
  onRemove: (orderId: string) => void;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item, index, onRemove }) => {
  return (
    <Draggable draggableId={item.orderId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`order-item-row ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <span className="order-item-name">{item.name}</span>
          <span className="order-item-price">¥{item.discountedPrice.toFixed(1)}</span>
          <button
            className="remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.orderId);
            }}
          >
            ×
          </button>
        </div>
      )}
    </Draggable>
  );
};

const DiscountProgress: React.FC = () => {
  const { calculationResult } = useLunchMateStore();

  if (!calculationResult) return null;

  const {
    totalPrice,
    discountAmount,
    currentTier,
    nextTier,
    progressToNextTier,
    amountToNextTier,
  } = calculationResult;

  return (
    <div className="discount-progress">
      <div className="progress-info">
        <div className="progress-labels">
          <span className="total-label">
            总价: <strong>¥{totalPrice.toFixed(1)}</strong>
          </span>
          {discountAmount > 0 && (
            <span className="discount-label">
              已减: <strong>-¥{discountAmount}</strong>
            </span>
          )}
        </div>
        {currentTier && (
          <span className="current-tier">
            当前档位: 满{currentTier.threshold}减{currentTier.discount}
          </span>
        )}
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressToNextTier}%` }}
        />
      </div>
      {nextTier && amountToNextTier > 0 && (
        <p className="progress-hint">
          再加 <strong>¥{amountToNextTier.toFixed(1)}</strong> 可享满{nextTier.threshold}减{nextTier.discount}
        </p>
      )}
      {!nextTier && (
        <p className="progress-hint max">🎉 已达最高优惠档位！</p>
      )}
    </div>
  );
};

const PerPersonCard: React.FC = () => {
  const { calculationResult, peopleCount } = useLunchMateStore();

  if (!calculationResult) return null;

  const { perPersonPrice, finalPrice } = calculationResult;

  const minPrice = 5;
  const maxPrice = 60;
  const ratio = Math.min(1, Math.max(0, (perPersonPrice - minPrice) / (maxPrice - minPrice)));

  const startColor = [168, 230, 207];
  const endColor = [255, 139, 148];
  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
  const bgColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div
      className="per-person-card"
      style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)` }}
    >
      <div className="per-person-info">
        <span className="per-person-label">每人分摊</span>
        <span className="per-person-count">{peopleCount}人</span>
      </div>
      <div className="per-person-price">
        <span className="currency">¥</span>
        <span className="amount">{perPersonPrice.toFixed(1)}</span>
      </div>
      <div className="final-price">
        实付总计: <strong>¥{finalPrice.toFixed(1)}</strong>
      </div>
    </div>
  );
};

const OrderHistory: React.FC = () => {
  const { orderHistory } = useLunchMateStore();

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-history">
      <h3 className="history-title">📋 历史拼单</h3>
      {orderHistory.length === 0 ? (
        <p className="empty-history">暂无拼单记录</p>
      ) : (
        <div className="history-list">
          {orderHistory.map((order) => (
            <div key={order.id} className="history-item">
              <div className="history-item-header">
                <span className="history-time">{formatTime(order.createdAt)}</span>
                <span className="history-people">{order.peopleCount}人拼单</span>
              </div>
              <div className="history-item-body">
                <div className="history-avatars">
                  {order.participants.map((p) => (
                    <div
                      key={p.id}
                      className="avatar-circle"
                      style={{ backgroundColor: p.avatarColor }}
                      title={p.name}
                    />
                  ))}
                </div>
                <span className="history-total">¥{order.finalPrice.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const OrderPanel: React.FC = () => {
  const {
    orderItems,
    removeItemFromOrder,
    submitOrder,
    clearOrder,
    recalculate,
  } = useLunchMateStore();

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  const handleSubmit = () => {
    const btn = document.querySelector('.submit-btn') as HTMLButtonElement;
    if (btn) {
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
      }, 100);
    }
    submitOrder();
  };

  return (
    <div className="order-panel">
      <div className="panel-header">
        <h2>🛒 我的拼单</h2>
        <PeopleCountSelector />
      </div>

      <Droppable droppableId="order-items">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`order-items-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {orderItems.length === 0 ? (
              <div className="empty-order">
                <p>从左侧拖拽菜品到这里</p>
                <p className="empty-hint">或点击菜品快速添加</p>
              </div>
            ) : (
              orderItems.map((item, index) => (
                <OrderItemRow
                  key={item.orderId}
                  item={item}
                  index={index}
                  onRemove={removeItemFromOrder}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <DiscountProgress />
      <PerPersonCard />

      <div className="order-actions">
        <button className="clear-btn" onClick={clearOrder}>
          清空
        </button>
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={orderItems.length === 0}
        >
          提交拼单
        </button>
      </div>

      <OrderHistory />
    </div>
  );
};
