import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderApi, Order, STATUS_FLOW, SHAPE_NAMES } from '../api';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getById(Number(id));
      setOrder(res.data);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      await orderApi.updateStatus(order.id, newStatus, note || undefined);
      setNote('');
      loadOrder();
    } catch (err) {
      console.error('更新订单状态失败:', err);
      alert('更新失败，请稍后重试');
    }
  };

  const getStatusIndex = (status: string) => STATUS_FLOW.indexOf(status);

  const renderTilePreview = () => {
    if (!order) return null;
    const tileMap = new Map<string, { count: number; shape: string; color: string }>();

    order.tiles.forEach((tile) => {
      const key = `${tile.shape}-${tile.color}`;
      if (tileMap.has(key)) {
        tileMap.get(key)!.count++;
      } else {
        tileMap.set(key, { count: 1, shape: tile.shape, color: tile.color });
      }
    });

    return (
      <div className="tile-preview-list">
        {Array.from(tileMap.values()).map((item, index) => (
          <div key={index} className="tile-preview-item">
            <div
              className="tile-preview-color"
              style={{ backgroundColor: item.color }}
            />
            <span className="tile-preview-shape">{SHAPE_NAMES[item.shape] || item.shape}</span>
            <span className="tile-preview-count">×{item.count}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="order-detail-page"><p>加载中...</p></div>;
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <p>订单不存在</p>
        <Link to="/orders" className="btn btn-secondary">返回订单列表</Link>
      </div>
    );
  }

  const currentIndex = getStatusIndex(order.currentStatus);

  return (
    <div className="order-detail-page">
      <div className="detail-header">
        <button className="btn btn-secondary btn-small" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 className="page-title">订单详情 #{order.id}</h1>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="info-section card">
            <h3 className="section-title">客户信息</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">客户姓名</span>
                <span className="info-value">{order.customerName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">联系邮箱</span>
                <span className="info-value">{order.customerEmail || '未填写'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">创建时间</span>
                <span className="info-value">{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">瓷砖总数</span>
                <span className="info-value">{order.totalTiles} 块</span>
              </div>
            </div>
          </div>

          <div className="info-section card">
            <h3 className="section-title">材料清单</h3>
            {renderTilePreview()}
          </div>

          <div className="info-section card">
            <h3 className="section-title">更新状态</h3>
            <div className="status-actions">
              {STATUS_FLOW.map((status, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = status === order.currentStatus;
                const isNext = index === currentIndex + 1;

                return (
                  <button
                    key={status}
                    className={`status-action-btn ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isNext ? 'next' : ''}`}
                    onClick={() => isNext && handleUpdateStatus(status)}
                    disabled={!isNext}
                  >
                    <span className="status-action-dot" />
                    <span className="status-action-text">{status}</span>
                  </button>
                );
              })}
            </div>
            <div className="note-input">
              <label>备注信息</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="选填，记录本次状态更新的备注"
              />
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="timeline-section card">
            <h3 className="section-title">生产进度</h3>
            <div className="timeline">
              {STATUS_FLOW.map((status, index) => {
                const statusRecord = order.statuses.find((s) => s.status === status);
                const isCompleted = index <= currentIndex;
                const isCurrent = status === order.currentStatus;

                return (
                  <div
                    key={status}
                    className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="timeline-dot-wrapper">
                      <div className="timeline-dot">
                        {isCompleted && !isCurrent && <span className="check-icon">✓</span>}
                      </div>
                      {index < STATUS_FLOW.length - 1 && (
                        <div className={`timeline-line ${isCompleted && index < currentIndex ? 'completed' : ''}`} />
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{status}</div>
                      {statusRecord ? (
                        <>
                          <div className="timeline-time">
                            {new Date(statusRecord.timestamp).toLocaleString('zh-CN')}
                          </div>
                          {statusRecord.note && (
                            <div className="timeline-note">{statusRecord.note}</div>
                          )}
                        </>
                      ) : (
                        <div className="timeline-pending">待进行</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
