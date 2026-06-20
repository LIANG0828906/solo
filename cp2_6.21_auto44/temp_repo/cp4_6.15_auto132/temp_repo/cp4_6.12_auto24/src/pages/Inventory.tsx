import { useState, useEffect } from 'react';
import { inventoryApi, InventoryItem, SHAPE_NAMES, COLOR_NAMES } from '../api';
import './Inventory.css';

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [editNote, setEditNote] = useState('');
  const [filterShape, setFilterShape] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('quantity');

  useEffect(() => {
    loadInventory();
    loadLowStock();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getAll();
      setItems(res.data);
    } catch (err) {
      console.error('加载库存失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLowStock = async () => {
    try {
      const res = await inventoryApi.getLowStock();
      setLowStockItems(res.data);
    } catch (err) {
      console.error('加载低库存失败:', err);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditQuantity(String(item.quantity));
    setEditThreshold(String(item.threshold));
    setEditNote(item.batchNote || '');
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      const quantity = parseInt(editQuantity, 10);
      const threshold = parseInt(editThreshold, 10);

      if (isNaN(quantity) || quantity < 0) {
        alert('请输入有效的数量');
        return;
      }

      await inventoryApi.update(editingItem.id, {
        quantity,
        threshold,
        batchNote: editNote,
      });

      setEditingItem(null);
      loadInventory();
      loadLowStock();
    } catch (err) {
      console.error('更新库存失败:', err);
      alert('更新失败，请稍后重试');
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const scrollToItem = (itemId: number) => {
    const element = document.getElementById(`inventory-item-${itemId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  };

  const getColorName = (color: string) => {
    return COLOR_NAMES[color] || color;
  };

  const filteredItems = filterShape === 'all'
    ? items
    : items.filter((item) => item.shape === filterShape);

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'quantity':
        return a.quantity - b.quantity;
      case 'quantity-desc':
        return b.quantity - a.quantity;
      case 'shape':
        return a.shape.localeCompare(b.shape);
      default:
        return a.quantity - b.quantity;
    }
  });

  const shapes = [...new Set(items.map((item) => item.shape))];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="inventory-page"><p>加载中...</p></div>;
  }

  return (
    <div className="inventory-page">
      <h1 className="page-title">材料库存管理</h1>

      {lowStockItems.length > 0 && (
        <div className="low-stock-banner" onClick={() => scrollToItem(lowStockItems[0].id)}>
          <span className="warning-icon">⚠</span>
          <span>
            有 {lowStockItems.length} 种材料库存低于阈值，请及时补货！
            （点击查看详情）
          </span>
        </div>
      )}

      <div className="inventory-stats card">
        <div className="stat-item">
          <span className="stat-label">材料种类</span>
          <span className="stat-value">{items.length} 种</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">库存总量</span>
          <span className="stat-value">{totalItems} 块</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">低库存种类</span>
          <span className="stat-value low">{lowStockItems.length} 种</span>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="filter-group">
          <span className="filter-label">形状筛选:</span>
          <button
            className={`filter-btn ${filterShape === 'all' ? 'active' : ''}`}
            onClick={() => setFilterShape('all')}
          >
            全部
          </button>
          {shapes.map((shape) => (
            <button
              key={shape}
              className={`filter-btn ${filterShape === shape ? 'active' : ''}`}
              onClick={() => setFilterShape(shape)}
            >
              {SHAPE_NAMES[shape] || shape}
            </button>
          ))}
        </div>

        <div className="sort-group">
          <span className="filter-label">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="quantity">数量从低到高</option>
            <option value="quantity-desc">数量从高到低</option>
            <option value="shape">按形状</option>
          </select>
        </div>
      </div>

      <div className="inventory-list">
        {sortedItems.length === 0 ? (
          <div className="empty-state card">
            <p>暂无库存数据</p>
          </div>
        ) : (
          sortedItems.map((item) => {
            const isLow = item.quantity < item.threshold;
            const isVeryLow = item.quantity < 10;
            const isEditing = editingItem?.id === item.id;

            return (
              <div
                key={item.id}
                id={`inventory-item-${item.id}`}
                className={`inventory-item card ${isVeryLow ? 'very-low' : ''} ${isLow ? 'low' : ''}`}
              >
                {isVeryLow && (
                  <div className="warning-indicator" title="库存低于10">
                    !
                  </div>
                )}

                <div className="item-color" style={{ backgroundColor: item.color }}>
                  <span className="color-name">{getColorName(item.color)}</span>
                </div>

                <div className="item-info">
                  <div className="item-name">
                    {getColorName(item.color)} {SHAPE_NAMES[item.shape] || item.shape}
                  </div>
                  {item.batchNote && (
                    <div className="item-note">批次: {item.batchNote}</div>
                  )}
                </div>

                <div className="item-quantity">
                  {isEditing ? (
                    <div className="edit-quantity">
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        min="0"
                      />
                      <span>块</span>
                    </div>
                  ) : (
                    <>
                      <span className={`quantity-value ${isLow ? 'low' : ''}`}>
                        {item.quantity}
                      </span>
                      <span className="quantity-unit">块</span>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="item-actions">
                    <div className="edit-threshold">
                      <label>阈值:</label>
                      <input
                        type="number"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="edit-note">
                      <label>批次:</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="批次备注"
                      />
                    </div>
                    <div className="action-buttons">
                      <button className="btn btn-primary btn-small" onClick={handleSave}>
                        保存
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={handleCancel}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="item-actions">
                    <div className="threshold-info">
                      阈值: {item.threshold}
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(item)}
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inventory;
