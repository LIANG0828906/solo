import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { OrderTimeline } from '../components/OrderTimeline';
import { Order, StatusLog, STATUS_LABELS, STATUS_COLORS, FABRIC_TYPES, SIZES } from '../types';

const STATUS_FLOW: string[] = ['pending', 'confirmed', 'soaking', 'extracting', 'dyeing', 'fixing', 'washing', 'inspecting', 'completed'];

export const AdminOrders: React.FC = () => {
  const { orders, fetchOrders, fetchOrderLogs, updateOrderStatus } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLogs, setOrderLogs] = useState<StatusLog[]>([]);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewTimeline = async (order: Order) => {
    setSelectedOrder(order);
    const logs = await fetchOrderLogs(order.id);
    setOrderLogs(logs);
    setShowTimelineModal(true);
  };

  const handleUpdateStatus = async (order: Order) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex < STATUS_FLOW.length - 1) {
      setChangingStatusId(order.id);
      const nextStatus = STATUS_FLOW[currentIndex + 1];
      await updateOrderStatus(order.id, nextStatus);
      setTimeout(() => setChangingStatusId(null), 400);
    }
  };

  const getFabricLabel = (value: string) => {
    return FABRIC_TYPES.find(f => f.value === value)?.label || value;
  };

  const getSizeLabel = (value: string) => {
    return SIZES.find(s => s.value === value)?.label || value;
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const statusCounts = STATUS_FLOW.reduce((acc, status) => {
    acc[status] = orders.filter(o => o.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h1 className="page-title">📋 订单管理</h1>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部 ({orders.length})
        </button>
        {STATUS_FLOW.map(status => (
          <button 
            key={status}
            className={`tab ${activeTab === status ? 'active' : ''}`}
            onClick={() => setActiveTab(status)}
            style={{ 
              color: activeTab === status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : undefined 
            }}
          >
            {STATUS_LABELS[status as keyof typeof STATUS_LABELS]} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">暂无该状态的订单</p>
        </div>
      ) : (
        filteredOrders.map(order => {
          const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS];
          const currentIndex = STATUS_FLOW.indexOf(order.status);
          const isChanging = changingStatusId === order.id;

          return (
            <div 
              key={order.id} 
              className={`order-card ${isChanging ? 'status-changing' : ''}`}
              style={{ 
                ['--status-color' as any]: statusColor,
                borderLeftColor: statusColor
              }}
            >
              <div className="order-header">
                <div className="order-info">
                  <div className="order-id">订单 #{order.id.toString().padStart(6, '0')}</div>
                  <div className="order-formula">
                    <span className="color-preview">
                      <span 
                        className="color-block"
                        style={{ 
                          background: `linear-gradient(135deg, ${order.colorFrom}, ${order.colorTo})` 
                        }}
                      ></span>
                      {order.formulaName}
                    </span>
                  </div>
                </div>
                <span 
                  className="status-badge"
                  style={{ background: statusColor }}
                >
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>

              <div className="order-details">
                <div className="order-detail-item">
                  <span className="order-detail-label">客户</span>
                  <span className="order-detail-value">{order.customerName}</span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">电话</span>
                  <span className="order-detail-value">{order.customerPhone}</span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">布料</span>
                  <span className="order-detail-value">{getFabricLabel(order.fabricType)}</span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">尺寸</span>
                  <span className="order-detail-value">{getSizeLabel(order.size)}</span>
                </div>
                {order.referenceImage && (
                  <div className="order-detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="order-detail-label">参考图</span>
                    <img 
                      src={order.referenceImage} 
                      alt="参考图" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover',
                        borderRadius: '8px' 
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="order-actions">
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => handleViewTimeline(order)}
                >
                  查看进度
                </button>
                {currentIndex < STATUS_FLOW.length - 1 && (
                  <button 
                    className="btn" 
                    style={{ flex: 1 }}
                    onClick={() => handleUpdateStatus(order)}
                    disabled={isChanging}
                  >
                    更新为：{STATUS_LABELS[STATUS_FLOW[currentIndex + 1] as keyof typeof STATUS_LABELS]}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {showTimelineModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowTimelineModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>订单 #{selectedOrder.id.toString().padStart(6, '0')} 生产进度</h2>
              <button className="close-btn" onClick={() => setShowTimelineModal(false)}>×</button>
            </div>
            
            <OrderTimeline 
              logs={orderLogs} 
              currentStatus={selectedOrder.status}
            />

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '24px' }}
              onClick={() => setShowTimelineModal(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
