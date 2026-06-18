import { useState, useRef } from 'react';
import { useOrderStore } from '../store';
import { OrderStatus, STATUS_COLORS, PRODUCT_ICONS } from '../types';
import { fileToBase64 } from '../utils/api';

const statuses: OrderStatus[] = ['待确认', '设计中', '制作中', '待发货', '已完成'];

const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
  '待确认': '设计中',
  '设计中': '制作中',
  '制作中': '待发货',
  '待发货': '已完成',
  '已完成': null
};

const statusActionLabels: Record<OrderStatus, string> = {
  '待确认': '进入设计',
  '设计中': '标记制作中',
  '制作中': '标记待发货',
  '待发货': '标记已完成',
  '已完成': '已完成'
};

const Dashboard = () => {
  const {
    orders,
    filter,
    selectedOrder,
    isModalOpen,
    isLoading,
    setFilter,
    openModal,
    closeModal,
    updateOrderStatus,
    addLog,
    uploadDesignImage,
    uploadFinalImage,
    deleteOrder
  } = useOrderStore();

  const [logContent, setLogContent] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'images'>('details');
  const designInputRef = useRef<HTMLInputElement>(null);
  const finalInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return getFilteredOrders().filter(o => o.status === status);
  };

  const handleAddLog = async () => {
    if (!selectedOrder || !logContent.trim()) return;
    try {
      await addLog(selectedOrder.id, {
        author: '工作室成员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=craft',
        content: logContent.trim()
      });
      setLogContent('');
    } catch (error) {
      alert('添加日志失败');
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    uploadFn: (orderId: string, image: string) => Promise<void>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      await uploadFn(selectedOrder.id, base64);
    } catch (error) {
      alert('上传失败');
    }

    e.target.value = '';
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
    } catch (error) {
      alert('更新状态失败');
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!confirm(`确定要删除订单 ${selectedOrder.orderNo} 吗？`)) return;
    try {
      await deleteOrder(selectedOrder.id);
    } catch (error) {
      alert('删除失败');
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>订单看板</h2>
          <span className="order-count">共 {filteredOrders.length} 个订单</span>
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({orders.length})
          </button>
          {statuses.map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
              style={filter === status ? { borderColor: STATUS_COLORS[status], color: STATUS_COLORS[status] } : {}}
            >
              {status} ({orders.filter(o => o.status === status).length})
            </button>
          ))}
        </div>
      </div>

      <div className="kanban-board">
        {statuses.map(status => (
          <div key={status} className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <span
                  className="status-dot"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                ></span>
                <span>{status}</span>
              </div>
              <span className="column-count">{getOrdersByStatus(status).length}</span>
            </div>
            <div className="cards-container">
              {getOrdersByStatus(status).map((order, index) => (
                <div
                  key={order.id}
                  className="order-card"
                  onClick={() => openModal(order)}
                  style={{
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  <div className="card-header">
                    <span className="order-no">{order.orderNo}</span>
                    <span
                      className="status-tag"
                      style={{
                        backgroundColor: `${STATUS_COLORS[order.status]}20`,
                        color: STATUS_COLORS[order.status]
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="customer-info">
                      <i className="fas fa-user-circle"></i>
                      <span className="customer-name">{order.customerName}</span>
                    </div>
                    <div className="product-type">
                      <i className={`fas ${PRODUCT_ICONS[order.productType]}`}></i>
                      <span>{order.productType}</span>
                    </div>
                    <div className="submit-time">
                      <i className="far fa-clock"></i>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div
                    className="card-border"
                    style={{ backgroundColor: STATUS_COLORS[order.status] }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <h3>订单详情</h3>
                <span className="modal-order-no">{selectedOrder.orderNo}</span>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <i className="fas fa-info-circle"></i>
                基本信息
              </button>
              <button
                className={`modal-tab ${activeTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveTab('images')}
              >
                <i className="fas fa-images"></i>
                图片管理
              </button>
              <button
                className={`modal-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <i className="fas fa-history"></i>
                制作日志 ({selectedOrder.logs.length})
              </button>
            </div>

            <div className="modal-body">
              {activeTab === 'details' && (
                <div className="details-tab">
                  <div className="detail-section">
                    <h4><i className="fas fa-user"></i> 客户信息</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">姓名</span>
                        <span className="detail-value">{selectedOrder.customerName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">电话</span>
                        <span className="detail-value">{selectedOrder.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4><i className="fas fa-box"></i> 订单信息</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">产品类型</span>
                        <span className="detail-value">
                          <i className={`fas ${PRODUCT_ICONS[selectedOrder.productType]}`} style={{ marginRight: '8px' }}></i>
                          {selectedOrder.productType}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">当前状态</span>
                        <span
                          className="detail-value status-badge"
                          style={{
                            backgroundColor: `${STATUS_COLORS[selectedOrder.status]}20`,
                            color: STATUS_COLORS[selectedOrder.status]
                          }}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">提交时间</span>
                        <span className="detail-value">{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">更新时间</span>
                        <span className="detail-value">{formatDate(selectedOrder.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4><i className="fas fa-align-left"></i> 需求描述</h4>
                    <p className="description-text">{selectedOrder.description}</p>
                  </div>

                  {selectedOrder.referenceImages.length > 0 && (
                    <div className="detail-section">
                      <h4><i className="fas fa-image"></i> 参考图片</h4>
                      <div className="image-thumbnails">
                        {selectedOrder.referenceImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="thumbnail"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img src={img} alt={`参考图${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div className="images-tab">
                  <div className="image-section">
                    <div className="section-header">
                      <h4><i className="fas fa-drafting-compass"></i> 设计草图</h4>
                      <input
                        ref={designInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageUpload(e, uploadDesignImage)}
                      />
                      <button
                        className="btn-outline"
                        onClick={() => designInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <i className="fas fa-upload"></i>
                        上传设计图
                      </button>
                    </div>
                    {selectedOrder.designImages.length > 0 ? (
                      <div className="image-thumbnails">
                        {selectedOrder.designImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="thumbnail"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img src={img} alt={`设计图${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">暂无设计草图</p>
                    )}
                  </div>

                  <div className="image-section">
                    <div className="section-header">
                      <h4><i className="fas fa-gift"></i> 成品图片</h4>
                      <input
                        ref={finalInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageUpload(e, uploadFinalImage)}
                      />
                      <button
                        className="btn-outline"
                        onClick={() => finalInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <i className="fas fa-upload"></i>
                        上传成品图
                      </button>
                    </div>
                    {selectedOrder.finalImages.length > 0 ? (
                      <div className="image-thumbnails">
                        {selectedOrder.finalImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="thumbnail"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img src={img} alt={`成品图${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">暂无成品图片</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="logs-tab">
                  <div className="log-input-section">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=craft"
                      alt="avatar"
                      className="log-avatar"
                    />
                    <div className="log-input-wrapper">
                      <textarea
                        value={logContent}
                        onChange={e => setLogContent(e.target.value)}
                        placeholder="记录制作过程中的重要信息..."
                        rows={3}
                      />
                      <button
                        className="btn-primary"
                        onClick={handleAddLog}
                        disabled={!logContent.trim() || isLoading}
                      >
                        <i className="fas fa-paper-plane"></i>
                        发送
                      </button>
                    </div>
                  </div>

                  <div className="timeline">
                    {selectedOrder.logs.length > 0 ? (
                      selectedOrder.logs.map((log, index) => (
                        <div
                          key={log.id}
                          className="timeline-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className="timeline-dot"
                            style={{ backgroundColor: STATUS_COLORS[selectedOrder.status] }}
                          ></div>
                          <div className="timeline-line"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <img src={log.avatar} alt={log.author} className="timeline-avatar" />
                              <div className="timeline-meta">
                                <span className="timeline-author">{log.author}</span>
                                <span className="timeline-time">{formatDate(log.timestamp)}</span>
                              </div>
                            </div>
                            <p className="timeline-text">{log.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">暂无制作日志</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={handleDeleteOrder}
                disabled={isLoading}
              >
                <i className="fas fa-trash"></i>
                删除订单
              </button>
              <div className="footer-actions">
                <button className="btn-cancel" onClick={closeModal}>
                  关闭
                </button>
                {nextStatusMap[selectedOrder.status] && (
                  <button
                    className="btn-primary"
                    onClick={() => handleStatusUpdate(nextStatusMap[selectedOrder.status]!)}
                    disabled={isLoading}
                  >
                    <i className="fas fa-arrow-right"></i>
                    {statusActionLabels[selectedOrder.status]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-content">
            <button className="image-preview-close" onClick={() => setPreviewImage(null)}>
              <i className="fas fa-times"></i>
            </button>
            <img src={previewImage} alt="预览" />
          </div>
        </div>
      )}

      <style>{`
        .dashboard {
          min-height: calc(100vh - 120px);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .header-left h2 {
          font-size: 28px;
          color: #5D4037;
        }

        .order-count {
          color: #8D6E63;
          font-size: 15px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 8px 20px;
          background: #fff;
          border: 2px solid #E0E0E0;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: #616161;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          border-color: #BDBDBD;
        }

        .filter-tab.active {
          background: #fff;
          border-color: #FF7043;
          color: #FF7043;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .kanban-column {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 16px;
          min-height: 200px;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #E0E0E0;
        }

        .column-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #424242;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .column-count {
          background: #E0E0E0;
          color: #616161;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-card {
          position: relative;
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          opacity: 0;
          animation: slideUp 0.5s ease-out forwards;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .card-border {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          transition: width 0.2s ease-out;
        }

        .order-card:hover .card-border {
          width: 4px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .order-no {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #5D4037;
          font-size: 15px;
        }

        .status-tag {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .customer-info,
        .product-type,
        .submit-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #616161;
        }

        .customer-info i,
        .product-type i,
        .submit-time i {
          width: 16px;
          color: #8D6E63;
        }

        .customer-name {
          font-weight: 500;
          color: #424242;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #fff;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: modalIn 0.3s ease-out;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #E0E0E0;
        }

        .modal-title {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .modal-title h3 {
          font-size: 22px;
          color: #5D4037;
        }

        .modal-order-no {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: 700;
          color: #FF7043;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F5F5F5;
          color: #757575;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #EEEEEE;
          color: #F44336;
        }

        .modal-tabs {
          display: flex;
          padding: 0 24px;
          border-bottom: 1px solid #E0E0E0;
          gap: 8px;
        }

        .modal-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #757575;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s ease;
        }

        .modal-tab:hover {
          color: #FF7043;
        }

        .modal-tab.active {
          color: #FF7043;
          border-bottom-color: #FF7043;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .detail-section {
          margin-bottom: 28px;
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-section h4 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          color: #5D4037;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #EEE;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 13px;
          color: #9E9E9E;
        }

        .detail-value {
          font-size: 15px;
          color: #424242;
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          width: fit-content;
        }

        .description-text {
          background: #FAFAFA;
          padding: 16px;
          border-radius: 8px;
          line-height: 1.7;
          color: #424242;
          white-space: pre-wrap;
        }

        .image-thumbnails {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .thumbnail {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
          border: 2px solid #EEE;
        }

        .thumbnail:hover {
          transform: scale(1.05);
          border-color: #FF7043;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .images-tab .image-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h4 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          color: #5D4037;
        }

        .btn-outline {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: transparent;
          border: 1px solid #FF7043;
          color: #FF7043;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-outline:hover:not(:disabled) {
          background: rgba(255, 112, 67, 0.1);
        }

        .btn-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-text {
          text-align: center;
          padding: 40px;
          color: #9E9E9E;
          font-size: 14px;
        }

        .logs-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .log-input-section {
          display: flex;
          gap: 16px;
        }

        .log-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .log-input-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .log-input-wrapper textarea {
          padding: 12px 16px;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .log-input-wrapper textarea:focus {
          outline: none;
          border-color: #FF7043;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #FF7043;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease;
          align-self: flex-end;
        }

        .btn-primary:hover:not(:disabled) {
          background: #F4511E;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .timeline {
          position: relative;
          padding-left: 8px;
        }

        .timeline-item {
          position: relative;
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .timeline-dot {
          position: absolute;
          left: -4px;
          top: 8px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 2px #E0E0E0;
          z-index: 1;
          animation: dotFadeIn 0.3s ease-out;
        }

        @keyframes dotFadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .timeline-line {
          position: absolute;
          left: 1px;
          top: 24px;
          bottom: -24px;
          width: 2px;
          background: #E0E0E0;
        }

        .timeline-item:last-child .timeline-line {
          display: none;
        }

        .timeline-content {
          flex: 1;
          margin-left: 24px;
          background: #FAFAFA;
          padding: 16px;
          border-radius: 8px;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .timeline-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .timeline-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timeline-author {
          font-weight: 600;
          color: #424242;
          font-size: 14px;
        }

        .timeline-time {
          font-size: 12px;
          color: #9E9E9E;
        }

        .timeline-text {
          color: #616161;
          line-height: 1.6;
          font-size: 14px;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid #E0E0E0;
          background: #FAFAFA;
          border-radius: 0 0 12px 12px;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          color: #F44336;
          border: 1px solid #F44336;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(244, 67, 54, 0.1);
        }

        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
        }

        .btn-cancel {
          padding: 10px 24px;
          background: transparent;
          color: #757575;
          border: 1px solid #BDBDBD;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          background: #F5F5F5;
        }

        .image-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .image-preview-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .image-preview-content img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
        }

        .image-preview-close {
          position: absolute;
          top: -40px;
          right: 0;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .image-preview-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .kanban-board {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .footer-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
