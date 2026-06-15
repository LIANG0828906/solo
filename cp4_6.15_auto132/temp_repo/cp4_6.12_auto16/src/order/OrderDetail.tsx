import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi, woodsApi, Order, Wood, TuningRecord, ProgressHistoryEntry } from '../api';

const STATUS_LABELS = [
  '材料准备',
  '木工成型',
  '打磨',
  '上漆',
  '装配',
  '调音',
  '最终检查',
  '完成',
];

const CATEGORY_LABELS: Record<string, string> = {
  top: '面板',
  back: '背板',
  side: '侧板',
  fingerboard: '指板',
  neck: '琴颈',
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [woodNames, setWoodNames] = useState<Record<string, string>>({});
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryEntry[]>([]);
  const [tuningRecords, setTuningRecords] = useState<TuningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [tuningDate, setTuningDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tuningPitch, setTuningPitch] = useState(440);
  const [tuningNotes, setTuningNotes] = useState('');

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const orderId = parseInt(id, 10);
      const [orderData, history, tunings, allWoods] = await Promise.all([
        ordersApi.getOrderById(orderId),
        ordersApi.getProgressHistory(orderId),
        ordersApi.getTuningRecords(orderId),
        woodsApi.getWoods(),
      ]);

      setOrder(orderData);
      setProgressHistory(history);
      setTuningRecords(tunings);

      const nameMap: Record<string, string> = {};
      const woodIds = [
        orderData.topWoodId,
        orderData.backWoodId,
        orderData.sideWoodId,
        orderData.fingerboardWoodId,
        orderData.neckWoodId,
      ];
      for (const wId of woodIds) {
        const wood = allWoods.find((w: Wood) => w.id === wId);
        if (wood) {
          nameMap[wId] = wood.name;
        }
      }
      setWoodNames(nameMap);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleAdvanceProgress = async () => {
    if (!order || order.status >= 7) return;
    try {
      await ordersApi.updateOrderStatus(order.id, order.status + 1);
      await loadOrder();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddTuning = async () => {
    if (!id || !tuningDate) return;
    try {
      await ordersApi.addTuningRecord(
        parseInt(id, 10),
        tuningDate,
        tuningPitch,
        tuningNotes
      );
      setTuningNotes('');
      await loadOrder();
    } catch (err) {
      console.error('Failed to add tuning record:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTuningGradientStyle = (index: number, total: number) => {
    const ratio = total <= 1 ? 1 : 1 - (index / (total - 1)) * 0.7;
    const r = Math.round(255 * ratio);
    const g = Math.round(107 * ratio);
    const b = Math.round(53 * ratio);
    return {
      background: `linear-gradient(180deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(211 * ratio)}, ${Math.round(47 * ratio)}, ${Math.round(47 * ratio)}) 100%)`,
    };
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!order) return <div className="error-message">订单不存在</div>;

  const currentStatus = order.status;

  return (
    <div className="order-detail">
      <div className="page-header">
        <Link to="/orders" className="back-link">← 返回订单列表</Link>
      </div>

      <div className="order-overview">
        <h2>订单 #{order.id.toString().padStart(4, '0')}</h2>
        <div className="overview-grid">
          <div className="overview-item">
            <span className="overview-label">乐器型号</span>
            <span className="overview-value">{order.instrumentName}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">面板</span>
            <span className="overview-value">{woodNames[order.topWoodId] || '-'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">背板</span>
            <span className="overview-value">{woodNames[order.backWoodId] || '-'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">侧板</span>
            <span className="overview-value">{woodNames[order.sideWoodId] || '-'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">指板</span>
            <span className="overview-value">{woodNames[order.fingerboardWoodId] || '-'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">琴颈</span>
            <span className="overview-value">{woodNames[order.neckWoodId] || '-'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">客户姓名</span>
            <span className="overview-value">{order.customerName}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">邮箱</span>
            <span className="overview-value">{order.customerEmail}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">电话</span>
            <span className="overview-value">{order.customerPhone}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">下单时间</span>
            <span className="overview-value">{formatDate(order.createdAt)}</span>
          </div>
          {order.notes && (
            <div className="overview-item" style={{ gridColumn: '1 / -1' }}>
              <span className="overview-label">备注</span>
              <span className="overview-value">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className="progress-section">
        <h3>制作进度</h3>
        <div className="progress-bar-container">
          <div className="progress-line">
            <div
              className="progress-line-filled"
              style={{ width: `${(currentStatus / 7) * 100}%` }}
            />
          </div>
          <div className="progress-nodes">
            {STATUS_LABELS.map((label, idx) => {
              const isCompleted = idx < currentStatus;
              const isCurrent = idx === currentStatus;

              return (
                <div key={idx} className="progress-node">
                  <div
                    className={`node-circle ${
                      isCompleted ? 'node-completed' : isCurrent ? 'node-current' : ''
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`node-label ${
                      isCurrent ? 'node-label-current' : isCompleted ? 'node-label-completed' : ''
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {progressHistory.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              进度记录
            </h4>
            {progressHistory.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                  padding: '0.2rem 0',
                }}
              >
                <span>{formatDate(entry.timestamp)}</span>
                <span>→</span>
                <span style={{ fontWeight: 500 }}>{STATUS_LABELS[entry.status]}</span>
              </div>
            ))}
          </div>
        )}

        {currentStatus < 7 && (
          <div className="progress-actions">
            <button className="btn" onClick={handleAdvanceProgress}>
              推进至：{STATUS_LABELS[currentStatus + 1]}
            </button>
          </div>
        )}
        {currentStatus === 7 && (
          <div className="success-message" style={{ textAlign: 'center' }}>
            🎉 该乐器已完成制作！
          </div>
        )}
      </div>

      <div className="tuning-section">
        <h3>调音记录</h3>

        <div className="tuning-form">
          <div className="form-group">
            <label>调音日期</label>
            <input
              type="date"
              value={tuningDate}
              onChange={e => setTuningDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>基本音高</label>
            <select
              value={tuningPitch}
              onChange={e => setTuningPitch(Number(e.target.value))}
            >
              <option value={440}>440Hz</option>
              <option value={442}>442Hz</option>
              <option value={444}>444Hz</option>
            </select>
          </div>
          <div className="form-group">
            <label>备注</label>
            <input
              type="text"
              value={tuningNotes}
              onChange={e => setTuningNotes(e.target.value)}
              placeholder="音色特点、调节的琴弦等"
            />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={handleAddTuning}>
              添加调音记录
            </button>
          </div>
        </div>

        {tuningRecords.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>暂无调音记录</p>
          </div>
        ) : (
          <div className="tuning-records">
            {tuningRecords.map((record, idx) => (
              <div key={record.id} className="tuning-record-card">
                <div
                  className="tuning-gradient-bar"
                  style={getTuningGradientStyle(idx, tuningRecords.length)}
                />
                <div className="tuning-record-content">
                  <div className="tuning-record-header">
                    <span className="tuning-record-date">
                      {formatDate(record.tuningDate)}
                    </span>
                    <span className="tuning-record-pitch">{record.pitch}Hz</span>
                  </div>
                  {record.notes && (
                    <p className="tuning-record-notes">{record.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
