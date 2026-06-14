import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Order, Recipe, CalculationResult } from '../types';

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    items: [{ recipeId: '', quantity: 1 }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, recipesData] = await Promise.all([
        api.getOrders(),
        api.getRecipes(),
      ]);
      setOrders(ordersData);
      setRecipes(recipesData);
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      setLoading(false);
    }
  };

  const addOrderItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { recipeId: '', quantity: 1 }],
    }));
  };

  const removeOrderItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateOrderItem = (
    idx: number,
    field: 'recipeId' | 'quantity',
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formData.items.filter(
      (i) => i.recipeId && i.quantity >= 1 && i.quantity <= 100
    );
    if (!formData.customerName.trim() || validItems.length === 0) {
      alert('请填写客户姓名并选择有效的配方和数量(1-100)');
      return;
    }
    try {
      await api.createOrder({
        customerName: formData.customerName.trim(),
        items: validItems,
      });
      setFormData({ customerName: '', items: [{ recipeId: '', quantity: 1 }] });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert('创建订单失败');
    }
  };

  const toggleOrderStatus = async (order: Order) => {
    try {
      const newStatus = order.status === 'pending' ? 'completed' : 'pending';
      await api.updateOrderStatus(order.id, newStatus);
      loadData();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, status: newStatus });
      }
    } catch (e) {
      alert('状态切换失败');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('确定要删除这个订单吗？')) return;
    try {
      await api.deleteOrder(id);
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
        setCalcResult(null);
      }
      loadData();
    } catch (e) {
      alert('删除失败');
    }
  };

  const viewOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const result = await api.calculateIngredients(
        order.items.map((i) => ({ recipeId: i.recipeId, quantity: i.quantity }))
      );
      setCalcResult(result);
    } catch (e) {
      console.error('计算失败', e);
    }
  };

  const [calcLoading, setCalcLoading] = useState(false);
  useEffect(() => {
    if (!showForm) return;
    const validItems = formData.items.filter(
      (i) => i.recipeId && i.quantity >= 1 && i.quantity <= 100
    );
    if (validItems.length === 0) {
      setCalcResult(null);
      return;
    }
    setCalcLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.calculateIngredients(validItems);
        setCalcResult(result);
      } finally {
        setCalcLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [formData.items, showForm]);

  return (
    <div className="page-content">
      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 320px);
          gap: 16px;
        }
        .order-card {
          width: 320px;
          height: 160px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.2s ease-out;
        }
        .order-card.completed {
          background: #d1fae5;
          border-color: #6ee7b7;
        }
        .order-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .order-customer {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        .order-card.completed .order-customer {
          color: #065f46;
        }
        .order-items-preview {
          font-size: 13px;
          color: #78350f;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .order-card.completed .order-items-preview {
          color: #064e3b;
        }
        .order-amount {
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
          margin-top: 8px;
        }
        .order-status {
          position: absolute;
          right: 16px;
          bottom: 16px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-out;
          border: none;
        }
        .order-status.pending {
          background: #f59e0b;
          color: #ffffff;
        }
        .order-status.pending:hover {
          background: #d97706;
        }
        .order-status.completed {
          background: #10b981;
          color: #ffffff;
        }
        .order-status.completed:hover {
          background: #059669;
        }
        .order-delete {
          position: absolute;
          right: 16px;
          top: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 18px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s ease-out;
        }
        .order-delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        .form-container {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          animation: fade-in 0.3s ease-out;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          margin-bottom: 10px;
          align-items: end;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .detail-panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          animation: fade-in 0.3s ease-out;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .detail-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 20px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease-out;
        }
        .detail-close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        .detail-section {
          margin-bottom: 16px;
        }
        .detail-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .detail-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #fef3c7;
          border-radius: 8px;
          font-size: 14px;
        }
        .ingredient-totals {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }
        .ingredient-chip {
          padding: 10px 14px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ingredient-name {
          font-size: 13px;
          color: #78350f;
          font-weight: 500;
        }
        .ingredient-amount {
          font-size: 18px;
          font-weight: 600;
          color: #dc2626;
        }
        @media (max-width: 768px) {
          .orders-grid {
            grid-template-columns: 1fr;
          }
          .order-card {
            width: 100%;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
        <button className="btn ripple" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 新建订单'}
        </button>
      </div>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">客户姓名</label>
            <input
              className="form-input"
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="请输入客户姓名"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">订单商品</label>
            {formData.items.map((item, idx) => (
              <div key={idx} className="form-grid">
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>选择配方</label>
                  <select
                    className="form-select"
                    value={item.recipeId}
                    onChange={(e) => updateOrderItem(idx, 'recipeId', e.target.value)}
                  >
                    <option value="">请选择配方</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (¥{r.price}/{r.yieldCount}个)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>数量(1-100)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) =>
                      updateOrderItem(idx, 'quantity', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div style={{ paddingBottom: '10px' }}>
                  {item.recipeId && (
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      小计: ¥
                      {(recipes.find((r) => r.id === item.recipeId)?.price || 0) * item.quantity}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeOrderItem(idx)}
                  disabled={formData.items.length === 1}
                >
                  删除
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addOrderItem}>
              + 添加商品
            </button>
          </div>

          {calcResult && Object.keys(calcResult.ingredients).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">预计原料用量（实时计算）</div>
              <div className="ingredient-totals">
                {Object.entries(calcResult.ingredients).map(([name, amount]) => (
                  <div key={name} className="ingredient-chip">
                    <span className="ingredient-name">{name}</span>
                    <span className="ingredient-amount">{amount.toFixed(1)}g</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
                预计成本：<span style={{ color: '#dc2626', fontWeight: 600 }}>¥{calcResult.totalCost}</span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button type="submit" className="btn ripple">
              创建订单
            </button>
          </div>
        </form>
      )}

      {selectedOrder && (
        <div className="detail-panel">
          <div className="detail-header">
            <span className="detail-title">
              {selectedOrder.customerName}的订单详情
            </span>
            <button className="detail-close" onClick={() => setSelectedOrder(null)}>
              ✕
            </button>
          </div>
          <div className="detail-section">
            <div className="detail-section-title">订单商品</div>
            <div className="detail-items-list">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="detail-item">
                  <span>{item.recipeName} × {item.quantity}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
              订单金额：¥{selectedOrder.totalAmount}
            </div>
          </div>
          {calcResult && Object.keys(calcResult.ingredients).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">原料总用量</div>
              <div className="ingredient-totals">
                {Object.entries(calcResult.ingredients).map(([name, amount]) => (
                  <div key={name} className="ingredient-chip">
                    <span className="ingredient-name">{name}</span>
                    <span className="ingredient-amount">{amount.toFixed(1)}g</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
                成本：<span style={{ color: '#dc2626', fontWeight: 600 }}>¥{calcResult.totalCost}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>加载中...</p>
      ) : (
        <div className="orders-grid">
          {orders.length === 0 ? (
            <p style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              暂无订单，点击右上角创建
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${order.status}`}
                onClick={() => viewOrderDetail(order)}
              >
                <button
                  className="order-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOrder(order.id);
                  }}
                >
                  ✕
                </button>
                <div className="order-customer">{order.customerName}</div>
                <div className="order-items-preview">
                  {order.items.map((i) => `${i.recipeName}×${i.quantity}`).join('、')}
                </div>
                <div className="order-amount">¥{order.totalAmount}</div>
                <button
                  className={`order-status ${order.status}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOrderStatus(order);
                  }}
                >
                  {order.status === 'pending' ? '待处理' : '已完成'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
