import React, { useEffect, useState } from 'react';
import { useAppStore, useLowStockItems } from '../store/useAppStore';
import { MenuItem } from '../shared/types';
import { RoleSwitcher } from '../components/RoleSwitcher';
import './AdminPanel.css';

const categoryLabels: Record<string, string> = {
  burger: '汉堡',
  snack: '小食',
  drink: '饮品'
};

const categoryColors: Record<string, string> = {
  burger: '#FF6B35',
  snack: '#4CAF50',
  drink: '#2196F3'
};

interface EditableItemProps {
  item: MenuItem;
  onUpdate: (item: MenuItem) => void;
  onRestock: (id: string) => void;
  isLowStock: boolean;
}

const EditableMenuItem: React.FC<EditableItemProps> = ({ item, onUpdate, onRestock, isLowStock }) => {
  const [price, setPrice] = useState(item.price.toString());
  const [stock, setStock] = useState(item.stock.toString());
  const [enabled, setEnabled] = useState(item.enabled);
  const [isFlashing, setIsFlashing] = useState(false);
  const [editTimeout, setEditTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const scheduleUpdate = (updates: Partial<MenuItem>) => {
    if (editTimeout) clearTimeout(editTimeout);
    
    const timeout = setTimeout(() => {
      onUpdate({ ...item, ...updates });
    }, 500);
    
    setEditTimeout(timeout);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      scheduleUpdate({ price: numValue });
    }
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStock(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      scheduleUpdate({ stock: numValue });
    }
  };

  const handleEnabledChange = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onUpdate({ ...item, enabled: newValue });
  };

  const handleRestock = () => {
    setIsFlashing(true);
    onRestock(item.id);
    setStock((parseInt(stock, 10) + 100).toString());
    setTimeout(() => setIsFlashing(false), 300);
  };

  return (
    <tr className={`menu-table-row ${isFlashing ? 'animate-flash' : ''} ${isLowStock ? 'low-stock-row' : ''}`}>
      <td className="cell-name">
        <span className="item-emoji">{item.emoji}</span>
        <span className="item-name-text">{item.name}</span>
      </td>
      <td className="cell-category">
        <span 
          className="category-tag"
          style={{ backgroundColor: categoryColors[item.category] + '20', color: categoryColors[item.category] }}
        >
          {categoryLabels[item.category]}
        </span>
      </td>
      <td className="cell-price">
        <input
          type="number"
          className="price-input"
          value={price}
          onChange={handlePriceChange}
          min="0"
          step="0.01"
        />
      </td>
      <td className="cell-enabled">
        <label className="switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleEnabledChange}
          />
          <span className="slider round" />
        </label>
      </td>
      <td className="cell-stock">
        <input
          type="number"
          className={`stock-input ${isLowStock ? 'low-stock' : ''}`}
          value={stock}
          onChange={handleStockChange}
          min="0"
        />
      </td>
      <td className="cell-action">
        <button className="restock-btn" onClick={handleRestock}>
          <span className="material-icons">add_shopping_cart</span>
          补货
        </button>
      </td>
    </tr>
  );
};

export const AdminPanel: React.FC = () => {
  const menuItems = useAppStore(state => state.menuItems);
  const loadMenuItems = useAppStore(state => state.loadMenuItems);
  const updateMenuItem = useAppStore(state => state.updateMenuItem);
  const restockItem = useAppStore(state => state.restockItem);
  const lowStockItems = useLowStockItems();

  const [activeTab, setActiveTab] = useState<'menu' | 'stock'>('menu');

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  const lowStockIds = new Set(lowStockItems.map(item => item.id));

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="header-left">
          <h1 className="app-logo">OrderFlow 管理后台</h1>
          <p className="header-subtitle">菜单与库存管理</p>
        </div>
        <RoleSwitcher />
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <button
            className={`sidebar-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <span className="material-icons">restaurant_menu</span>
            菜单管理
          </button>
          <button
            className={`sidebar-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <span className="material-icons">inventory_2</span>
            库存预警
            {lowStockItems.length > 0 && (
              <span className="badge">{lowStockItems.length}</span>
            )}
          </button>
        </aside>

        <main className="admin-content">
          {activeTab === 'menu' ? (
            <div className="content-section">
              <div className="section-header">
                <h2>菜单管理</h2>
                <p className="section-desc">共 {menuItems.length} 个商品，点击编辑价格和库存</p>
              </div>
              
              <div className="table-container">
                <table className="menu-table">
                  <thead>
                    <tr>
                      <th>商品名称</th>
                      <th>分类</th>
                      <th className="text-right">价格 (¥)</th>
                      <th>启用</th>
                      <th>库存量</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => (
                      <EditableMenuItem
                        key={item.id}
                        item={item}
                        onUpdate={updateMenuItem}
                        onRestock={restockItem}
                        isLowStock={lowStockIds.has(item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="content-section">
              <div className="section-header">
                <h2>库存预警</h2>
                <p className="section-desc">
                  {lowStockItems.length > 0 
                    ? `有 ${lowStockItems.length} 个商品库存低于10件，请及时补货` 
                    : '所有商品库存充足'}
                </p>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="empty-state">
                  <span className="material-icons">check_circle</span>
                  <p>库存状态良好，没有需要补货的商品</p>
                </div>
              ) : (
                <div className="warning-list">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="warning-card">
                      <div className="warning-header">
                        <span className="material-icons warning-icon">warning</span>
                        <div className="warning-info">
                          <span className="warning-item-name">{item.name}</span>
                          <span className="warning-item-category">{categoryLabels[item.category]}</span>
                        </div>
                        <span className="warning-stock">库存: {item.stock}</span>
                      </div>
                      <button 
                        className="restock-btn-large"
                        onClick={() => {
                          const row = document.querySelector(`[data-id="${item.id}"]`);
                          row?.classList.add('animate-flash');
                          restockItem(item.id);
                          setTimeout(() => row?.classList.remove('animate-flash'), 300);
                        }}
                      >
                        <span className="material-icons">add_shopping_cart</span>
                        补货 +100
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
