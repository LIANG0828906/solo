import React, { useState, useMemo, useCallback } from 'react';
import { differenceInDays, isPast, isToday, format } from 'date-fns';
import type { InventoryItem, ItemCategory } from '../types';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => Promise<void>;
  onUpdateQuantity: (id: string, newQuantity: number) => Promise<void>;
}

type FilterCategory = 'all' | ItemCategory;

const categoryLabels: Record<ItemCategory, string> = {
  food: '食品',
  daily: '日用品',
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onDelete,
  onUpdateQuantity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [flippingIds, setFlippingIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [outQuantity, setOutQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, filterCategory]);

  const { expiringSoonCount, expiredCount } = useMemo(() => {
    const today = new Date();
    let expiring = 0;
    let expired = 0;

    items.forEach((item) => {
      const expireDate = new Date(item.expireDate);
      const daysDiff = differenceInDays(expireDate, today);
      const isExpired = isPast(expireDate) && !isToday(expireDate);

      if (isExpired) {
        expired++;
      } else if (daysDiff < 7) {
        expiring++;
      }
    });

    return { expiringSoonCount: expiring, expiredCount: expired };
  }, [items]);

  const getRowClassName = useCallback((item: InventoryItem): string => {
    const classes: string[] = [];
    const today = new Date();
    const expireDate = new Date(item.expireDate);
    const daysDiff = differenceInDays(expireDate, today);
    const isExpired = isPast(expireDate) && !isToday(expireDate);

    if (isExpired) {
      classes.push('expired');
    } else if (daysDiff < 7) {
      classes.push('expiring-soon');
    }

    if (item.quantity === 0) {
      classes.push('out-of-stock');
    }

    if (deletingIds.has(item.id)) {
      classes.push('deleting');
    }

    return classes.join(' ');
  }, [deletingIds]);

  const getWarningBadge = useCallback((item: InventoryItem): React.ReactNode => {
    const today = new Date();
    const expireDate = new Date(item.expireDate);
    const daysDiff = differenceInDays(expireDate, today);
    const isExpired = isPast(expireDate) && !isToday(expireDate);

    if (isExpired) {
      return (
        <span className="danger-badge">
          <span className="icon">⚠</span>
          已过期
        </span>
      );
    }

    if (daysDiff < 7) {
      return (
        <span className="warning-badge">
          <span className="icon">⚠</span>
          还剩 {daysDiff} 天
        </span>
      );
    }

    return null;
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      await onDelete(id);
    } catch (error) {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      throw error;
    }
  };

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setOutQuantity(1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isProcessing) return;
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleConfirmOut = async () => {
    if (!selectedItem || isProcessing) return;

    const newQuantity = selectedItem.quantity - outQuantity;
    if (newQuantity < 0) return;

    setIsProcessing(true);

    try {
      setFlippingIds((prev) => new Set(prev).add(selectedItem.id));
      await onUpdateQuantity(selectedItem.id, newQuantity);

      setTimeout(() => {
        setFlippingIds((prev) => {
          const next = new Set(prev);
          next.delete(selectedItem.id);
          return next;
        });
      }, 300);

      setShowModal(false);
      setSelectedItem(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-transition">
      {(expiringSoonCount > 0 || expiredCount > 0) && (
        <div className={`alert-bar ${expiredCount > 0 ? 'warning' : ''}`}>
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">
            有 <strong>{expiringSoonCount}</strong> 件商品即将过期，
            <strong>{expiredCount}</strong> 件已过期
          </span>
        </div>
      )}

      <div className="filter-tabs">
        {(['all', 'food', 'daily'] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            className={`filter-tab ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? '全部' : categoryLabels[cat]}
          </button>
        ))}
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索商品名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>商品名称</th>
                <th>分类</th>
                <th>库存数量</th>
                <th>过期日期</th>
                <th>预警状态</th>
                <th style={{ width: '200px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-text">暂无商品数据</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={getRowClassName(item)}>
                    <td>
                      <strong style={{ color: '#333' }}>{item.name}</strong>
                    </td>
                    <td>
                      <span className={`category-tag ${item.category}`}>
                        {categoryLabels[item.category]}
                      </span>
                    </td>
                    <td>
                      <span className={`quantity-flip ${flippingIds.has(item.id) ? 'flipping' : ''}`}>
                        <span className="quantity-value">{item.quantity}</span>
                      </span>
                    </td>
                    <td>{format(new Date(item.expireDate), 'yyyy-MM-dd')}</td>
                    <td>{getWarningBadge(item)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-small"
                          onClick={() => handleOpenModal(item)}
                          disabled={item.quantity === 0}
                        >
                          出库
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(item.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">商品出库</h3>
            <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              商品：<strong>{selectedItem.name}</strong>
            </p>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              当前库存：<strong>{selectedItem.quantity}</strong> 件
            </p>

            <div className="form-group">
              <label className="form-label">出库数量</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={selectedItem.quantity}
                value={outQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= selectedItem.quantity) {
                    setOutQuantity(val);
                  }
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={isProcessing}
              >
                取消
              </button>
              <button
                className="btn"
                onClick={handleConfirmOut}
                disabled={isProcessing || outQuantity <= 0 || outQuantity > selectedItem.quantity}
              >
                {isProcessing ? '处理中...' : '确认出库'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
