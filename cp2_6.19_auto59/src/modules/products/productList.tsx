import React, { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { ProductModal } from './productModal';
import type { Product } from '@/types';

function getSoldProgressColor(percentage: number): string {
  if (percentage < 30) return '#10B981';
  if (percentage < 70) return '#F97316';
  return '#EF4444';
}

export const ProductList: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, createQuickOrder } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductId, setNewProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderError, setOrderError] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const handleAddClick = useCallback(() => {
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (window.confirm('确定要删除这个商品吗？')) {
        deleteProduct(id);
      }
    },
    [deleteProduct]
  );

  const handleSubmit = useCallback(
    (data: {
      name: string;
      price: number;
      stock: number;
      dailyLimit: number;
    }) => {
      if (editingProduct) {
        updateProduct(editingProduct.id, data);
      } else {
        addProduct(data);
        const newId = products.length > 0 ? products[products.length - 1].id : null;
        if (newId) {
          setNewProductId(newId);
          setTimeout(() => setNewProductId(null), 300);
        }
      }
    },
    [editingProduct, updateProduct, addProduct, products]
  );

  const handleOpenOrderModal = useCallback((product: Product) => {
    setOrderModalProduct(product);
    setOrderQuantity(1);
    setOrderError('');
  }, []);

  const handleCloseOrderModal = useCallback(() => {
    setOrderModalProduct(null);
    setOrderQuantity(1);
    setOrderError('');
  }, []);

  const handleConfirmOrder = useCallback(() => {
    if (!orderModalProduct) return;

    const remainingStock = orderModalProduct.stock - orderModalProduct.sold;
    const remainingDaily = orderModalProduct.dailyLimit - orderModalProduct.sold;
    const maxAvailable = Math.min(remainingStock, remainingDaily);

    if (orderQuantity <= 0) {
      setOrderError('数量必须大于0');
      return;
    }
    if (orderQuantity > maxAvailable) {
      setOrderError(`数量超过可购买上限（最多${maxAvailable}件）`);
      return;
    }

    const success = createQuickOrder(orderModalProduct.id, orderQuantity);
    if (success) {
      handleCloseOrderModal();
    } else {
      setOrderError('下单失败，请稍后重试');
    }
  }, [orderModalProduct, orderQuantity, createQuickOrder, handleCloseOrderModal]);

  return (
    <div className="product-list-page">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <button className="btn btn-accent" onClick={handleAddClick}>
          + 添加商品
        </button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="input search-input"
          placeholder="搜索商品名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="清除搜索"
          >
            ×
          </button>
        )}
      </div>

      <div className="product-grid">
        {filteredProducts.map((product, index) => {
          const soldPercentage = product.dailyLimit > 0
            ? Math.min(100, (product.sold / product.dailyLimit) * 100)
            : 0;
          const progressColor = getSoldProgressColor(soldPercentage);
          const remainingStock = product.stock - product.sold;
          const remainingDaily = product.dailyLimit - product.sold;
          const maxAvailable = Math.min(remainingStock, remainingDaily);
          const isNew = index === filteredProducts.length - 1 && newProductId === product.id;

          return (
            <div
              key={product.id}
              className={`product-card card ${isNew ? 'scale-in' : ''}`}
            >
              <div className="product-header">
                <div className="product-title-row">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">¥{product.price.toFixed(2)}</div>
                </div>
              </div>

              <div className="product-stats">
                <div className="stat-item">
                  <span className="stat-label">总库存</span>
                  <span className="stat-value">{product.stock}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">今日限量</span>
                  <span className="stat-value">{product.dailyLimit}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">剩余可购</span>
                  <span className="stat-value highlight">{maxAvailable}</span>
                </div>
              </div>

              <div className="sold-progress-section">
                <div className="progress-header">
                  <span className="progress-label">今日销售进度</span>
                  <span className="progress-text" style={{ color: progressColor }}>
                    {product.sold} / {product.dailyLimit} ({soldPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${soldPercentage}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </div>
              </div>

              <div className="product-actions">
                <div className="action-left">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEditClick(product)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    删除
                  </button>
                </div>
                <button
                  className={`btn btn-primary btn-sm quick-order-btn ${maxAvailable <= 0 ? 'disabled' : ''}`}
                  onClick={() => handleOpenOrderModal(product)}
                  disabled={maxAvailable <= 0}
                >
                  {maxAvailable <= 0 ? '已售罄' : '快速下单'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{searchQuery ? '🔍' : '📦'}</div>
          <p className="empty-text">
            {searchQuery ? '没有找到匹配的商品' : '暂无商品，点击上方按钮添加'}
          </p>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        product={editingProduct}
      />

      {orderModalProduct && (
        <div className="modal-overlay" onClick={handleCloseOrderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">快速下单</h3>
              <button
                className="modal-close"
                onClick={handleCloseOrderModal}
                aria-label="关闭"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="order-product-info">
                <div className="order-product-name">{orderModalProduct.name}</div>
                <div className="order-product-meta">
                  <span>单价：<strong>¥{orderModalProduct.price.toFixed(2)}</strong></span>
                  <span>
                    可购：<strong>{Math.min(
                      orderModalProduct.stock - orderModalProduct.sold,
                      orderModalProduct.dailyLimit - orderModalProduct.sold
                    )}</strong> 件
                  </span>
                </div>
              </div>

              <div className="order-form-group">
                <label className="form-label">购买数量</label>
                <div className="quantity-input-row">
                  <button
                    className="quantity-btn"
                    onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="input quantity-input"
                    value={orderQuantity}
                    min={1}
                    max={Math.min(
                      orderModalProduct.stock - orderModalProduct.sold,
                      orderModalProduct.dailyLimit - orderModalProduct.sold
                    )}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setOrderQuantity(val);
                      setOrderError('');
                    }}
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => {
                      const max = Math.min(
                        orderModalProduct.stock - orderModalProduct.sold,
                        orderModalProduct.dailyLimit - orderModalProduct.sold
                      );
                      setOrderQuantity((q) => Math.min(max, q + 1));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="order-total-row">
                <span className="order-total-label">订单金额</span>
                <span className="order-total-amount">
                  ¥{(orderModalProduct.price * Math.max(0, orderQuantity)).toFixed(2)}
                </span>
              </div>

              {orderError && <div className="order-error">{orderError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseOrderModal}>
                取消
              </button>
              <button className="btn btn-accent" onClick={handleConfirmOrder}>
                确认下单
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .product-list-page {
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
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }
        .search-bar {
          position: relative;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          font-size: 16px;
          opacity: 0.5;
          pointer-events: none;
          z-index: 1;
        }
        .search-input {
          padding-left: 42px;
          padding-right: 40px;
        }
        .search-clear {
          position: absolute;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--color-border);
          color: var(--color-text-light);
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }
        .search-clear:hover {
          background-color: #bdbdbd;
          color: var(--color-text);
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .product-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .product-header {
          margin-bottom: 4px;
        }
        .product-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .product-name {
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          line-height: 1.4;
        }
        .product-price {
          font-size: 22px;
          font-weight: 700;
          color: var(--color-accent);
          white-space: nowrap;
        }
        .product-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          padding: 12px;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: var(--color-text-light);
        }
        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
        }
        .stat-value.highlight {
          color: var(--color-primary);
        }
        .sold-progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .progress-label {
          color: var(--color-text-light);
          font-weight: 500;
        }
        .progress-text {
          font-weight: 600;
        }
        .progress-bar-container {
          height: 10px;
          background-color: var(--color-background);
          border-radius: 5px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width var(--transition-slow) ease,
            background-color var(--transition-slow) ease;
        }
        .product-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }
        .action-left {
          display: flex;
          gap: 8px;
        }
        .quick-order-btn {
          min-width: 90px;
        }
        .quick-order-btn.disabled,
        .quick-order-btn:disabled {
          background-color: var(--color-border);
          color: var(--color-text-light);
          cursor: not-allowed;
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
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }
        .modal-close {
          font-size: 28px;
          line-height: 1;
          color: var(--color-text-light);
          transition: color var(--transition-normal);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
        }
        .modal-close:hover {
          color: var(--color-text);
          background-color: var(--color-background);
        }
        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .order-product-info {
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .order-product-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
        }
        .order-product-meta {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--color-text-light);
        }
        .order-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
        }
        .quantity-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quantity-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background-color: var(--color-background);
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          user-select: none;
        }
        .quantity-btn:hover {
          background-color: var(--color-border);
        }
        .quantity-btn:active {
          transform: scale(0.95);
        }
        .quantity-input {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
        }
        .order-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, rgba(42, 157, 143, 0.08), rgba(231, 111, 81, 0.08));
          border-radius: var(--radius-sm);
        }
        .order-total-label {
          font-size: 15px;
          color: var(--color-text-light);
          font-weight: 500;
        }
        .order-total-amount {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-accent);
        }
        .order-error {
          padding: 10px 14px;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--color-danger);
          border-radius: var(--radius-sm);
          font-size: 13px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--color-border);
        }
        @media (max-width: 768px) {
          .product-list-page {
            padding: 16px;
          }
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .page-title {
            font-size: 20px;
          }
          .product-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .product-stats {
            gap: 8px;
            padding: 10px;
          }
          .stat-value {
            font-size: 14px;
          }
          .product-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .action-left {
            justify-content: center;
          }
          .quick-order-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
