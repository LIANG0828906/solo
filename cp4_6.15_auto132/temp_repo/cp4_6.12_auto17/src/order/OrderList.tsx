import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderForm from './OrderForm';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type Order,
  type OrderStatus
} from '../types';

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'wiring', 'mounting', 'weaving',
  'finishing', 'qc', 'shipped', 'completed'
];

const STATUS_BAR_COLORS: Record<string, string> = {
  pending: '#888888',
  confirmed: '#8B7355',
  wiring: '#A67C52',
  mounting: '#B08050',
  weaving: '#A67C52',
  finishing: '#C4A484',
  qc: '#D2B48C',
  shipped: '#6B8E23',
  completed: '#228B22'
};

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    orderId: number | null;
    newStatus: OrderStatus | null;
    isBatch: boolean;
  }>({ show: false, orderId: null, newStatus: null, isBatch: false });

  const limit = 10;

  const loadOrders = async (p: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/orders?page=${p}&limit=${limit}`);
      setOrders(prev => p === 1 ? res.data.data : [...prev, ...res.data.data]);
      setTotal(res.data.total);
      setPage(p);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o.id));
    }
  };

  const handleStatusChange = (orderId: number, newStatus: OrderStatus) => {
    setConfirmModal({ show: true, orderId, newStatus, isBatch: false });
  };

  const handleBatchStatusChange = (newStatus: OrderStatus) => {
    if (selectedIds.length === 0) {
      alert('请先选择订单');
      return;
    }
    setConfirmModal({ show: true, orderId: null, newStatus, isBatch: true });
  };

  const confirmStatusChange = async () => {
    const { orderId, newStatus, isBatch } = confirmModal;
    if (!newStatus) return;

    try {
      if (isBatch) {
        setOrders(prev => prev.map(o =>
          selectedIds.includes(o.id) ? { ...o, status: newStatus } : o
        ));
        await axios.patch('/api/orders/status', {
          ids: selectedIds,
          status: newStatus,
          note: '批量更新'
        });
        setSelectedIds([]);
      } else if (orderId) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ));
        await axios.patch(`/api/orders/${orderId}/status`, {
          status: newStatus,
          note: '状态更新'
        });
      }
    } catch (err) {
      console.error('状态更新失败:', err);
      alert('状态更新失败，请重试');
      loadOrders(page);
    } finally {
      setConfirmModal({ show: false, orderId: null, newStatus: null, isBatch: false });
    }
  };

  const totalPages = Math.ceil(total / limit);

  const stats = useMemo(() => {
    const result: Record<string, number> = {};
    ALL_STATUSES.forEach(s => result[s] = 0);
    orders.forEach(o => {
      if (result[o.status] !== undefined) result[o.status]++;
    });
    return result;
  }, [orders]);

  return (
    <div className="order-list-page">
      <div className="page-header">
        <h1 className="page-title" style={{ margin: 0 }}>订单管理中心</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + 新建订单
        </button>
      </div>

      <div className="stats-bar">
        {ALL_STATUSES.map(status => (
          <div key={status} className="stat-item">
            <span className="stat-count" style={{ color: ORDER_STATUS_COLORS[status] }}>
              {stats[status]}
            </span>
            <span className="stat-label">{ORDER_STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      <div className="order-toolbar">
        <div className="selection-info">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectedIds.length === orders.length && orders.length > 0}
              onChange={toggleSelectAll}
            />
            全选 ({selectedIds.length}/{orders.length})
          </label>
        </div>
        <div className="batch-actions">
          <select
            className="batch-select"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleBatchStatusChange(e.target.value as OrderStatus);
                e.target.value = '';
              }
            }}
            disabled={selectedIds.length === 0}
          >
            <option value="">批量更新状态...</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="order-table-wrapper card">
        <table className="order-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>选择</th>
              <th>订单号</th>
              <th>客户</th>
              <th>图案</th>
              <th>尺寸</th>
              <th>材质</th>
              <th>预估用线</th>
              <th>状态</th>
              <th>预计完成</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr
                key={order.id}
                className="order-row"
                onClick={() => navigate(`/orders/${order.id}`)}
                style={{ borderLeft: `4px solid ${STATUS_BAR_COLORS[order.status] || '#ccc'}` }}
              >
                <td style={{ padding: 0 }}></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={() => toggleSelect(order.id)}
                  />
                </td>
                <td className="order-no">{order.order_no}</td>
                <td>
                  <div className="customer-cell">
                    <strong>{order.customer_name}</strong>
                    {order.customer_phone && (
                      <span className="phone">{order.customer_phone}</span>
                    )}
                  </div>
                </td>
                <td>{order.pattern_name}</td>
                <td>{order.size_length}×{order.size_width}cm</td>
                <td>{order.yarn_type}</td>
                <td>
                  <span className="yarn-amount">{order.estimated_yarn.toFixed(1)}g</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className="status-select"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] + '20',
                             borderColor: ORDER_STATUS_COLORS[order.status] }}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td>{order.expected_date || '-'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="loading-more">加载中...</div>}
        {orders.length === 0 && !loading && (
          <div className="empty-state">暂无订单，点击右上角新建订单</div>
        )}
      </div>

      {page < totalPages && !loading && (
        <div className="load-more-wrapper">
          <button
            className="btn-secondary"
            onClick={() => loadOrders(page + 1)}
          >
            加载更多 ({orders.length}/{total})
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: '720px', width: '95%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <OrderForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, orderId: null, newStatus: null, isBatch: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--primary-dark)', marginBottom: '16px' }}>确认状态变更</h3>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              {confirmModal.isBatch
                ? `确定将选中的 ${selectedIds.length} 个订单状态更新为「${ORDER_STATUS_LABELS[confirmModal.newStatus!]}」吗？`
                : `确定将订单状态更新为「${ORDER_STATUS_LABELS[confirmModal.newStatus!]}」吗？`
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => setConfirmModal({ show: false, orderId: null, newStatus: null, isBatch: false })}
              >
                取消
              </button>
              <button className="btn-primary" onClick={confirmStatusChange}>
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .order-list-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
        }
        .stat-count {
          font-size: 24px;
          font-weight: 700;
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .order-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .select-all-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .batch-select {
          padding: 8px 16px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: white;
          font-size: 13px;
          cursor: pointer;
        }
        .batch-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .order-table-wrapper {
          overflow: hidden;
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .order-table th {
          padding: 14px 12px;
          text-align: left;
          background: var(--background);
          font-weight: 600;
          color: var(--primary-dark);
          border-bottom: 2px solid var(--border);
        }
        .order-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border);
        }
        .order-row {
          cursor: pointer;
          transition: background 0.2s;
        }
        .order-row:hover {
          background: #EDE0D4;
        }
        .order-no {
          font-family: monospace;
          font-weight: 600;
          color: var(--primary-dark);
        }
        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .phone {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .yarn-amount {
          font-weight: 600;
          color: var(--primary);
        }
        .status-select {
          padding: 6px 10px;
          border-radius: 6px;
          border: 2px solid;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          min-width: 100px;
        }
        .view-btn {
          padding: 6px 14px;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          font-size: 12px;
        }
        .view-btn:hover {
          background: var(--primary-light);
        }
        .loading-more, .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--text-secondary);
        }
        .load-more-wrapper {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
