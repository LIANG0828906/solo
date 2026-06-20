import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Stock } from '../types';

export default function StockWarning() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Stock>>({});

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (e) {
      console.error('加载库存失败', e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setEditData({
      currentStock: stock.currentStock,
      safetyLevel: stock.safetyLevel,
      costPerGram: stock.costPerGram,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.updateStock(id, editData);
      setEditingId(null);
      setEditData({});
      loadStocks();
    } catch (e) {
      alert('更新失败');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="page-content">
      <style>{`
        .stock-table-container {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }
        .stock-table {
          width: 100%;
          border-collapse: collapse;
        }
        .stock-table thead tr {
          background-color: #f59e0b;
          height: 44px;
        }
        .stock-table th {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          text-align: left;
          padding: 0 16px;
        }
        .stock-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.3s ease;
        }
        .stock-table tbody tr {
          transition: background-color 0.3s ease;
        }
        .stock-table tbody tr:hover {
          background-color: #fffbeb;
        }
        .warning-row {
          animation: pulse-warning 0.5s infinite;
        }
        .warning-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background-color: #fee2e2;
          color: #dc2626;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .safe-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background-color: #d1fae5;
          color: #059669;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .stock-amount {
          font-weight: 600;
          font-size: 15px;
        }
        .stock-amount.low {
          color: #dc2626;
        }
        .edit-input {
          width: 100px;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        .edit-input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
        }
        .action-btns {
          display: flex;
          gap: 6px;
        }
        .action-btn {
          padding: 4px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-out;
        }
        .action-btn.primary {
          background-color: #f59e0b;
          color: #ffffff;
        }
        .action-btn.primary:hover {
          background-color: #d97706;
        }
        .action-btn.secondary {
          background-color: #e5e7eb;
          color: #374151;
        }
        .action-btn.secondary:hover {
          background-color: #d1d5db;
        }
        .summary-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .summary-item {
          background: #ffffff;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 3px solid #f59e0b;
          font-size: 14px;
        }
        .summary-item strong {
          color: #92400e;
        }
        @media (max-width: 768px) {
          .stock-table-container {
            overflow-x: auto;
          }
          .stock-table {
            min-width: 600px;
          }
        }
      `}</style>
      <h1 className="page-title">库存预警</h1>

      {loading ? (
        <p>加载中...</p>
      ) : (
        <>
          <div className="summary-bar">
            <div className="summary-item">
              原料种类：<strong>{stocks.length}</strong>
            </div>
            <div className="summary-item">
              库存预警：
              <strong style={{ color: '#dc2626' }}>
                {stocks.filter((s) => s.currentStock < s.safetyLevel).length} 项
              </strong>
            </div>
          </div>

          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>原料名称</th>
                  <th>当前库存(克)</th>
                  <th>安全下限(克)</th>
                  <th>单价(元/克)</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const isLow = stock.currentStock < stock.safetyLevel;
                  const isEditing = editingId === stock.id;
                  return (
                    <tr key={stock.id} className={isLow && !isEditing ? 'warning-row' : ''}>
                      <td style={{ fontWeight: 600 }}>{stock.name}</td>
                      <td>
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="0"
                            value={editData.currentStock ?? 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                currentStock: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        ) : (
                          <span className={`stock-amount ${isLow ? 'low' : ''}`}>
                            {stock.currentStock.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="0"
                            value={editData.safetyLevel ?? 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                safetyLevel: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        ) : (
                          stock.safetyLevel.toLocaleString()
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="0"
                            step="0.001"
                            value={editData.costPerGram ?? 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                costPerGram: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        ) : (
                          `¥${stock.costPerGram.toFixed(3)}`
                        )}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="warning-badge">⚠ 库存不足</span>
                        ) : (
                          <span className="safe-badge">✓ 正常</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="action-btns">
                            <button
                              className="action-btn primary"
                              onClick={() => saveEdit(stock.id)}
                            >
                              保存
                            </button>
                            <button
                              className="action-btn secondary"
                              onClick={cancelEdit}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            className="action-btn primary"
                            onClick={() => startEdit(stock)}
                          >
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
