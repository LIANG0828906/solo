import { useNavigate } from 'react-router-dom';
import { Item } from '@/api';
import {
  CATEGORY_EMOJI,
  getItemStatus,
  getRemainingDays,
  StatusType,
} from '@/utils';

interface InventoryListProps {
  items: Item[];
  filter?: 'all' | 'healthy' | 'warning' | 'expired' | 'today';
}

const InventoryList = ({ items, filter = 'all' }: InventoryListProps) => {
  const navigate = useNavigate();

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toDateString();
      return new Date(item.createdAt).toDateString() === today;
    }
    return getItemStatus(item) === filter;
  });

  if (filteredItems.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🧊</div>
        <div className="empty-state-text">
          {filter === 'all' ? '冰箱还是空的，快去添加食材吧！' : '没有符合条件的食材'}
        </div>
        {filter === 'all' && (
          <button
            className="empty-btn"
            onClick={() => navigate('/add')}
          >
            ➕ 添加食材
          </button>
        )}
      </div>
    );
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    const statusOrder: Record<StatusType, number> = {
      expired: 0,
      warning: 1,
      healthy: 2,
    };
    return statusOrder[getItemStatus(a)] - statusOrder[getItemStatus(b)];
  });

  return (
    <div className="inventory-grid">
      {sortedItems.map((item, index) => {
        const status = getItemStatus(item);
        const remainingDays = getRemainingDays(item);
        const displayDays = remainingDays < 0 ? Math.abs(remainingDays) : remainingDays;
        const daysText = remainingDays < 0 ? `过期${displayDays}天` : `${displayDays}天`;

        return (
          <div
            key={item.id}
            className={`item-card status-${status}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/item/${item.id}`)}
          >
            <div className="item-card-header">
              <span className="item-icon">{CATEGORY_EMOJI[item.category]}</span>
              <span className={`days-badge ${status}`}>{daysText}</span>
            </div>
            <div className="item-name">{item.name}</div>
            <span className="item-category">{item.category}</span>
            <div className="item-meta">
              <span>数量</span>
              <span className="item-quantity">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryList;
