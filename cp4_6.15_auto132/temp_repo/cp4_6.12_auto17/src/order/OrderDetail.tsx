import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  YARN_TYPES,
  TASSEL_STYLES,
  type Order,
  type OrderStatus,
  type Pattern
} from '../types';

const STATUS_ORDER: OrderStatus[] = [
  'pending', 'confirmed', 'wiring', 'mounting', 'weaving',
  'finishing', 'qc', 'shipped', 'completed'
];

const ALL_STATUSES = STATUS_ORDER;

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [stockCheck, setStockCheck] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await axios.get(`/api/orders/${id}`);
      setOrder(res.data);
      setNewStatus(res.data.status);

      try {
        const patternRes = await axios.get(`/api/patterns/${res.data.pattern_id}`);
        setPattern(patternRes.data);
      } catch {
        setPattern(null);
      }

      try {
        const stockRes = await axios.post('/api/yarn/check', {
          yarn_type: res.data.yarn_type,
          colors: res.data.color_scheme,
          estimated_amount: res.data.estimated_yarn
        });
        setStockCheck(stockRes.data);
      } catch {
        setStockCheck(null);
      }
    } catch (err) {
      console.error('加载订单失败:', err);
      alert('订单不存在');
      navigate('/orders');
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !order) return;
    try {
      await axios.patch(`/api/orders/${order.id}/status`, {
        status: newStatus,
        note: '状态更新'
      });
      setShowStatusModal(false);
      loadOrder();
    } catch (err: any) {
      alert('更新失败: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!order) {
    return <div className="loading">加载中...</div>;
  }

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const progressPercent = Math.max(0, (currentIdx / (STATUS_ORDER.length - 1)) * 100);

  const yarnLabel = YARN_TYPES.find(y => y.value === order.yarn_type)?.label || order.yarn_type;
  const tasselLabel = TASSEL_STYLES.find(t => t.value === order.tassel_style)?.label || order.tassel_style;

  return (
    <div className="order-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>
          ← 返回订单列表
        </button>
        <div className="header-title-group">
          <h1 className="page-title" style={{ margin: 0 }}>
            订单详情 <span className="order-no-big">{order.order_no}</span>
          </h1>
          <span
            className="status-badge"
            style={{
              backgroundColor: ORDER_STATUS_COLORS[order.status] + '25',
              color: ORDER_STATUS_COLORS[order.status],
              border: `2px solid ${ORDER_STATUS_COLORS[order.status]}`
            }}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <button className="btn-primary" onClick={() => setShowStatusModal(true)}>
          更新状态
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-left">
          <div className="detail-card card">
            <h3 className="card-title">进度追踪</h3>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="progress-steps">
                {STATUS_ORDER.map((s, idx) => (
                  <div
                    key={s}
                    className={`progress-step ${idx <= currentIdx ? 'active' : ''} ${idx === currentIdx ? 'current' : ''}`}
                    style={{ left: `${(idx / (STATUS_ORDER.length - 1)) * 100}%` }}
                  >
                    <div
                      className="step-dot"
                      style={{ backgroundColor: idx <= currentIdx ? ORDER_STATUS_COLORS[s] : '#ddd' }}
                    />
                    <span className="step-label">{ORDER_STATUS_LABELS[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-card card">
            <h3 className="card-title">客户信息</h3>
            <div className="info-row">
              <span className="info-label">客户姓名</span>
              <span className="info-value">{order.customer_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">联系电话</span>
              <span className="info-value">{order.customer_phone || '未填写'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">下单时间</span>
              <span className="info-value">{new Date(order.created_at).toLocaleString('zh-CN')}</span>
            </div>
            <div className="info-row">
              <span className="info-label">预计完成</span>
              <span className="info-value">{order.expected_date || '未设置'}</span>
            </div>
          </div>

          <div className="detail-card card">
            <h3 className="card-title">定制详情</h3>
            <div className="info-row">
              <span className="info-label">图案名称</span>
              <span className="info-value">{order.pattern_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">产品尺寸</span>
              <span className="info-value">{order.size_length}cm × {order.size_width}cm</span>
            </div>
            <div className="info-row">
              <span className="info-label">纱线材质</span>
              <span className="info-value">{yarnLabel}</span>
            </div>
            <div className="info-row">
              <span className="info-label">配色方案</span>
              <div className="color-swatches">
                {order.color_scheme.map((c, i) => (
                  <span
                    key={i}
                    className="swatch"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">流苏样式</span>
              <span className="info-value">{tasselLabel}</span>
            </div>
          </div>
        </div>

        <div className="detail-right">
          <div className="detail-card card">
            <h3 className="card-title">用线量估算</h3>
            <div className="yarn-estimate-display">
              <span className="estimate-value">{order.estimated_yarn.toFixed(1)}</span>
              <span className="estimate-unit">克</span>
            </div>
            <div className="estimate-formula">
              <small>计算公式：(针数×0.15g + 面积×0.08g/cm²) × 材质系数</small>
            </div>
            {stockCheck && (
              <div className="stock-check">
                <h4 className="stock-title">库存检查</h4>
                {!stockCheck.sufficient && (
                  <div className="stock-warning">
                    ⚠️ 部分颜色库存不足，请及时备料
                  </div>
                )}
                {stockCheck.sufficient && (
                  <div className="stock-ok">
                    ✓ 库存充足
                  </div>
                )}
                <div className="stock-list">
                  {stockCheck.details?.map((item: any, idx: number) => (
                    <div key={idx} className="stock-item">
                      <span className="stock-color" style={{ backgroundColor: item.color }} />
                      <span className="stock-info">
                        需求: {item.required}g / 库存: {item.available.toFixed(1)}g
                      </span>
                      <span className={`stock-status ${item.sufficient ? 'ok' : 'low'}`}>
                        {item.sufficient ? '充足' : '不足'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {pattern && (
            <div className="detail-card card">
              <h3 className="card-title">图案预览</h3>
              {pattern.thumbnail ? (
                <img src={pattern.thumbnail} alt={pattern.name} className="pattern-detail-img" />
              ) : (
                <div className="no-preview">暂无预览图</div>
              )}
            </div>
          )}

          <div className="detail-card card">
            <h3 className="card-title">状态历史</h3>
            <div className="status-timeline">
              {[...order.status_history].reverse().map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <div
                    className="timeline-dot"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[item.status as OrderStatus] || '#888' }}
                  />
                  <div className="timeline-content">
                    <div className="timeline-status">
                      <strong>{ORDER_STATUS_LABELS[item.status as OrderStatus] || item.status}</strong>
                    </div>
                    <div className="timeline-time">
                      {new Date(item.timestamp).toLocaleString('zh-CN')}
                    </div>
                    {item.note && <div className="timeline-note">{item.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>更新订单状态</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                选择新状态
              </label>
              <div className="status-grid-modal">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`status-option-btn ${newStatus === s ? 'selected' : ''}`}
                    onClick={() => setNewStatus(s)}
                    style={{
                      borderColor: newStatus === s ? ORDER_STATUS_COLORS[s] : 'var(--border)',
                      backgroundColor: newStatus === s ? ORDER_STATUS_COLORS[s] + '20' : 'white'
                    }}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleStatusChange}>
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .order-detail-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .back-btn {
          padding: 10px 18px;
          background: white;
          border: 2px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .back-btn:hover {
          border-color: var(--secondary);
          background: var(--background);
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .order-no-big {
          font-family: monospace;
          color: var(--primary);
          font-size: 22px;
        }
        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr; }
        }
        .detail-left, .detail-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-card {
          padding: 24px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-dark);
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border);
        }
        .progress-bar-wrapper {
          position: relative;
          padding: 20px 0 60px 0;
        }
        .progress-bar-track {
          width: 100%;
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8B7355 0%, #A67C52 50%, #D2B48C 100%);
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }
        .progress-steps {
          position: relative;
          margin-top: 16px;
        }
        .progress-step {
          position: absolute;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .step-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .progress-step.current .step-dot {
          box-shadow: 0 0 0 4px rgba(139, 115, 85, 0.2);
          transform: scale(1.2);
        }
        .step-label {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          transform: rotate(-30deg);
          transform-origin: top left;
          margin-top: 4px;
        }
        .progress-step.active .step-label {
          color: var(--text-primary);
          font-weight: 500;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px dashed var(--border);
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .info-value {
          font-weight: 500;
          color: var(--text-primary);
        }
        .color-swatches {
          display: flex;
          gap: 8px;
        }
        .swatch {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .yarn-estimate-display {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, var(--background) 0%, #EDE0D4 100%);
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .estimate-value {
          font-size: 48px;
          font-weight: 700;
          color: var(--primary-dark);
        }
        .estimate-unit {
          font-size: 20px;
          color: var(--text-secondary);
          margin-left: 6px;
        }
        .estimate-formula {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .stock-check {
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }
        .stock-title {
          font-size: 14px;
          margin: 0 0 12px 0;
          color: var(--primary-dark);
        }
        .stock-warning {
          padding: 10px 14px;
          background: #fff3cd;
          color: #856404;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .stock-ok {
          padding: 10px 14px;
          background: #d4edda;
          color: #155724;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .stock-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stock-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--background);
          border-radius: 8px;
          font-size: 12px;
        }
        .stock-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        }
        .stock-info {
          flex: 1;
        }
        .stock-status {
          font-weight: 600;
        }
        .stock-status.ok { color: #228B22; }
        .stock-status.low { color: #dc3545; }
        .pattern-detail-img {
          width: 100%;
          max-width: 300px;
          display: block;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }
        .no-preview {
          padding: 60px;
          text-align: center;
          color: var(--text-secondary);
          background: var(--background);
          border-radius: 8px;
        }
        .status-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .timeline-item {
          display: flex;
          gap: 12px;
        }
        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        .timeline-content {
          flex: 1;
          padding-bottom: 12px;
          border-bottom: 1px dashed var(--border);
        }
        .timeline-item:last-child .timeline-content {
          border-bottom: none;
        }
        .timeline-status {
          font-size: 14px;
          color: var(--text-primary);
        }
        .timeline-time {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .timeline-note {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
          font-style: italic;
        }
        .status-grid-modal {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .status-option-btn {
          padding: 12px 8px;
          border: 2px solid;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .status-option-btn.selected {
          font-weight: 600;
        }
        .loading {
          text-align: center;
          padding: 60px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
