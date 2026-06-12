import { useState, useEffect } from 'react';
import { woodsApi, Wood } from '../api';

const CATEGORY_LABELS: Record<string, string> = {
  top: '面板',
  back: '背板',
  side: '侧板',
  fingerboard: '指板',
  neck: '琴颈',
};

const InventoryPage = () => {
  const [woods, setWoods] = useState<Wood[]>([]);
  const [lowStockWoods, setLowStockWoods] = useState<Wood[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  const loadData = async () => {
    try {
      const [allWoods, lowStock] = await Promise.all([
        woodsApi.getWoods(),
        woodsApi.getLowStockWoods(),
      ]);
      setWoods(allWoods);
      setLowStockWoods(lowStock);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStock = async (woodId: number) => {
    try {
      await woodsApi.updateWoodStock(woodId, editStock);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const startEditing = (wood: Wood) => {
    setEditingId(wood.id);
    setEditStock(wood.stock);
  };

  const getStockBarColor = (stock: number, threshold: number): string => {
    const ratio = threshold > 0 ? stock / threshold : 0;
    if (ratio >= 1) return 'stock-progress-fill-green';
    if (ratio >= 0.5) return 'stock-progress-fill-yellow';
    return 'stock-progress-fill-red';
  };

  const getStockBarWidth = (stock: number, threshold: number): string => {
    const maxDisplay = Math.max(threshold * 2, 1);
    const ratio = Math.min(stock / maxDisplay, 1);
    return `${ratio * 100}%`;
  };

  const getRestockSuggestion = (wood: Wood): number => {
    if (wood.stock >= wood.threshold) return 0;
    return wood.threshold - wood.stock + 5;
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="inventory-page">
      <h2 className="page-title">木材库存管理</h2>
      <p className="page-subtitle">管理木材库存，及时补充原材料</p>

      {lowStockWoods.length > 0 && (
        <div className="low-stock-alert">
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <strong>低库存预警</strong>
            <div>
              {lowStockWoods.map(w => (
                <span key={w.id}>
                  {w.name}（库存 {w.stock}，阈值 {w.threshold}）
                  {lowStockWoods.indexOf(w) < lowStockWoods.length - 1 ? '、' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>产地</th>
              <th>类别</th>
              <th>库存数量</th>
              <th>库存状态</th>
              <th>阈值</th>
              <th>补货建议</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {woods.map(wood => {
              const restock = getRestockSuggestion(wood);
              const isEditing = editingId === wood.id;

              return (
                <tr key={wood.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: `linear-gradient(135deg, ${wood.color} 0%, ${adjustColor(wood.color, -30)} 100%)`,
                          flexShrink: 0,
                        }}
                      />
                      <strong>{wood.name}</strong>
                    </div>
                  </td>
                  <td>{wood.origin}</td>
                  <td>
                    <span className="category-badge">
                      {CATEGORY_LABELS[wood.category] || wood.category}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editStock}
                        onChange={e => setEditStock(Number(e.target.value))}
                        style={{
                          width: '70px',
                          padding: '0.3rem 0.5rem',
                          border: '1px solid var(--color-accent)',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <strong>{wood.stock}</strong>
                    )}
                  </td>
                  <td>
                    <div className="stock-progress-container">
                      <div className="stock-progress-bar">
                        <div
                          className={`stock-progress-fill ${getStockBarColor(wood.stock, wood.threshold)}`}
                          style={{ width: getStockBarWidth(wood.stock, wood.threshold) }}
                        />
                      </div>
                      <span className="stock-progress-label">
                        {wood.stock >= wood.threshold
                          ? '充足'
                          : wood.stock >= 5
                            ? '少量'
                            : '缺货'}
                      </span>
                    </div>
                  </td>
                  <td>{wood.threshold}</td>
                  <td>
                    {restock > 0 ? (
                      <span className="restock-suggestion">+{restock}</span>
                    ) : (
                      <span style={{ color: 'var(--color-success)' }}>充足</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleUpdateStock(wood.id)}
                        >
                          保存
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => startEditing(wood)}
                      >
                        补货
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default InventoryPage;
