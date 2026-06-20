import React, { useState, useEffect, useRef, useCallback } from 'react';
import RequirementCard from './RequirementCard';
import { api, type Requirement, type Order, type Application } from '../api';

type TabType = 'plaza' | 'orders';
type OrderStatusFilter = 'all' | 'pending_payment' | 'in_progress' | 'completed';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('plaza');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [petType, setPetType] = useState('all');
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(500);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [sortByDate, setSortByDate] = useState<'asc' | 'desc'>('desc');

  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [acceptingAppId, setAcceptingAppId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const activeTabRef = useRef<TabType>('plaza');
  const mountedRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const lastRequirementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || !mountedRef.current) return;

      observerRef.current = new IntersectionObserver(
        (entries, obs) => {
          if (!mountedRef.current) {
            obs.disconnect();
            return;
          }
          const entry = entries[0];
          if (
            entry.isIntersecting &&
            !loadingRef.current &&
            hasMoreRef.current &&
            activeTabRef.current === 'plaza'
          ) {
            loadingRef.current = true;
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );
      observerRef.current.observe(node);
    },
    []
  );

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRequirements = async () => {
      setLoading(true);
      try {
        const response = await api.getRequirements(page, 20, {
          pet_type: petType,
          min_budget: minBudget,
          max_budget: maxBudget,
        });
        if (!cancelled) {
          if (page === 1) {
            setRequirements(response.data);
          } else {
            setRequirements((prev) => [...prev, ...response.data]);
          }
          setHasMore(page * response.per_page < response.total);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        if (!cancelled) {
          console.error('Failed to load requirements:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadRequirements();
    return () => {
      cancelled = true;
    };
  }, [page, petType, minBudget, maxBudget]);

  const firstFilterRef = useRef(true);
  useEffect(() => {
    if (firstFilterRef.current) {
      firstFilterRef.current = false;
      return;
    }
    api.cancelAllRequests();
    setPage(1);
    setRequirements([]);
    setHasMore(true);
    loadingRef.current = false;
  }, [petType, minBudget, maxBudget]);

  useEffect(() => {
    if (activeTab === 'orders') {
      const loadOrders = async () => {
        try {
          const response = await api.getOrders({
            status: orderStatusFilter,
            sort_by_date: sortByDate,
          });
          setOrders(response.data);
        } catch (error) {
          console.error('Failed to load orders:', error);
        }
      };
      loadOrders();
    }
  }, [activeTab, orderStatusFilter, sortByDate]);

  const handleCardClick = async (req: Requirement) => {
    try {
      const fullReq = await api.getRequirement(req.id);
      setSelectedRequirement(fullReq);
    } catch {
      setSelectedRequirement(req);
    }
  };

  const handleAcceptApplication = async (app: Application) => {
    if (!selectedRequirement) return;
    setAcceptingAppId(app.id);
    try {
      const result = await api.acceptApplication(selectedRequirement.id, app.id);
      showNotification(`已通知 ${app.foster_name}，订单已创建！`);
      setSelectedRequirement(null);
      console.log('Created order:', result.order);
    } catch (error) {
      showNotification('操作失败，请重试');
    } finally {
      setAcceptingAppId(null);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const updated = await api.confirmPayment(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      showNotification('付款成功，寄养服务已开始！');
    } catch {
      showNotification('付款失败，请重试');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { label: '待付款', color: '#9CA3AF', progress: 33 };
      case 'in_progress':
        return { label: '进行中', color: '#3B82F6', progress: 66 };
      case 'completed':
        return { label: '已完成', color: '#10B981', progress: 100 };
      default:
        return { label: '未知', color: '#6B7280', progress: 0 };
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= Math.round(rating) ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">🐾 宠物寄养平台</div>
          <div className="nav-tabs desktop-only">
            <button
              className={`nav-tab ${activeTab === 'plaza' ? 'active' : ''}`}
              onClick={() => setActiveTab('plaza')}
            >
              需求广场
            </button>
            <button
              className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              订单管理
            </button>
          </div>
          <button
            className="hamburger mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <button
              className={`mobile-menu-item ${activeTab === 'plaza' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('plaza');
                setMobileMenuOpen(false);
              }}
            >
              需求广场
            </button>
            <button
              className={`mobile-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                setMobileMenuOpen(false);
              }}
            >
              订单管理
            </button>
          </div>
        )}
      </nav>

      <main className="main-content">
        {activeTab === 'plaza' && (
          <>
            <div className="mobile-filter-header mobile-only">
              <button
                className="filter-toggle-btn"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                🔍 筛选 {mobileFilterOpen ? '▲' : '▼'}
              </button>
            </div>
            <div className={`filter-bar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
              <div className="filter-item">
                <label>宠物类型</label>
                <select value={petType} onChange={(e) => setPetType(e.target.value)}>
                  <option value="all">全部</option>
                  <option value="金毛">金毛</option>
                  <option value="柯基">柯基</option>
                  <option value="布偶猫">布偶猫</option>
                  <option value="泰迪">泰迪</option>
                  <option value="比熊">比熊</option>
                  <option value="哈士奇">哈士奇</option>
                  <option value="英短">英短</option>
                  <option value="拉布拉多">拉布拉多</option>
                </select>
              </div>
              <div className="filter-item budget-filter">
                <label>预算区间: ¥{minBudget} - ¥{maxBudget}</label>
                <div className="dual-slider">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={minBudget}
                    onChange={(e) =>
                      setMinBudget(Math.min(Number(e.target.value), maxBudget - 10))
                    }
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={maxBudget}
                    onChange={(e) =>
                      setMaxBudget(Math.max(Number(e.target.value), minBudget + 10))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="requirements-grid" key={`${petType}-${minBudget}-${maxBudget}`}>
              {requirements.map((req, index) => (
                <div
                  key={req.id}
                  ref={index === requirements.length - 1 ? lastRequirementRef : null}
                >
                  <RequirementCard
                    requirement={req}
                    onClick={() => handleCardClick(req)}
                    index={index}
                  />
                </div>
              ))}
            </div>

            {loading && (
              <div className="loading-indicator">
                <div className="spinner" />
                <span>加载中...</span>
              </div>
            )}

            {!hasMore && requirements.length > 0 && (
              <div className="no-more">已经到底啦 ~</div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            <div className="filter-bar">
              <div className="filter-item">
                <label>状态筛选</label>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
                >
                  <option value="all">全部</option>
                  <option value="pending_payment">待付款</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div className="filter-item">
                <label>排序方式</label>
                <select
                  value={sortByDate}
                  onChange={(e) => setSortByDate(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">日期倒序</option>
                  <option value="asc">日期正序</option>
                </select>
              </div>
            </div>

            <div className="orders-list">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div
                    key={order.id}
                    className="order-card"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-avatars">
                      <img src={order.owner_avatar} alt="主人" className="avatar-thumb" />
                      <img src={order.foster_avatar} alt="寄养" className="avatar-thumb" />
                      <img src={order.pet_avatar} alt="宠物" className="avatar-thumb pet-avatar-thumb" />
                    </div>
                    <div className="order-info">
                      <div className="order-pet-name">{order.pet_name}</div>
                      <div className="order-dates">
                        {formatDate(order.start_date)} - {formatDate(order.end_date)}
                      </div>
                      <div className="order-total">总计: ¥{order.total_fee.toFixed(2)}</div>
                    </div>
                    <div className="order-status-section">
                      <div
                        className="order-status-label"
                        style={{ color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${statusInfo.progress}%`,
                            backgroundColor: statusInfo.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && <div className="empty-state">暂无订单</div>}
            </div>
          </>
        )}
      </main>

      <nav className="bottom-nav mobile-only">
        <button
          className={`bottom-nav-item ${activeTab === 'plaza' ? 'active' : ''}`}
          onClick={() => setActiveTab('plaza')}
        >
          🏠 广场
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 订单
        </button>
      </nav>

      {selectedRequirement && (
        <div className="overlay" onClick={() => setSelectedRequirement(null)}>
          <div
            className="detail-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedRequirement(null)}
            >
              ×
            </button>
            <div className="detail-hero">
              <img
                src={selectedRequirement.pet_avatar}
                alt={selectedRequirement.pet_name}
                className="detail-hero-image"
              />
              <div className="detail-hero-overlay">
                <h2>{selectedRequirement.pet_name}</h2>
                <p>
                  {selectedRequirement.pet_breed} · {selectedRequirement.pet_age}岁
                </p>
              </div>
            </div>
            <div className="detail-content">
              <section className="detail-section">
                <h3>基本信息</h3>
                <p>
                  <strong>寄养日期：</strong>
                  {formatDate(selectedRequirement.start_date)} -{' '}
                  {formatDate(selectedRequirement.end_date)}
                </p>
                <p>
                  <strong>每日预算：</strong>¥{selectedRequirement.daily_budget.toFixed(2)}
                </p>
                <div className="personality-tags">
                  {selectedRequirement.pet_personality.map((trait) => (
                    <span key={trait} className="personality-tag large">
                      {trait}
                    </span>
                  ))}
                </div>
                <p>
                  <strong>发布人：</strong>{selectedRequirement.owner_name}
                </p>
              </section>

              <section className="detail-section">
                <h3>寄养家庭申请 ({selectedRequirement.applications.length})</h3>
                <div className="applications-list">
                  {selectedRequirement.applications.map((app) => (
                    <div key={app.id} className="application-card">
                      <img
                        src={app.foster_avatar}
                        alt={app.foster_name}
                        className="application-avatar"
                      />
                      <div className="application-info">
                        <div className="application-header">
                          <span className="application-name">{app.foster_name}</span>
                          {renderStars(app.foster_rating)}
                        </div>
                        <p className="application-intro">{app.foster_intro}</p>
                      </div>
                      <button
                        className={`accept-btn ${app.status === 'accepted' ? 'accepted' : ''}`}
                        disabled={app.status === 'accepted' || acceptingAppId === app.id}
                        onClick={() => handleAcceptApplication(app)}
                      >
                        {acceptingAppId === app.id
                          ? '处理中...'
                          : app.status === 'accepted'
                          ? '已接受'
                          : '接受'}
                      </button>
                    </div>
                  ))}
                  {selectedRequirement.applications.length === 0 && (
                    <div className="empty-state">暂无申请</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="detail-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedOrder(null)}
            >
              ×
            </button>
            <div className="order-detail-header">
              <h2>订单详情</h2>
              <span
                className="order-status-badge"
                style={{ backgroundColor: getStatusInfo(selectedOrder.status).color }}
              >
                {getStatusInfo(selectedOrder.status).label}
              </span>
            </div>

            <div className="order-progress-section">
              <div className="progress-bar large">
                <div
                  className="progress-fill animated"
                  style={{
                    width: `${getStatusInfo(selectedOrder.status).progress}%`,
                    backgroundColor: getStatusInfo(selectedOrder.status).color,
                  }}
                />
              </div>
            </div>

            <div className="order-detail-body">
              <div className="order-detail-top">
                <section className="detail-section contract-section">
                  <h3>寄养合同摘要</h3>
                  <div className="contract-summary">
                    <ul className="contract-terms">
                      {selectedOrder.contract_terms.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                    <div className="contract-status">
                      {selectedOrder.contract_confirmed ? (
                        <span className="confirmed">✓ 双方已确认</span>
                      ) : (
                        <span className="pending">待确认</span>
                      )}
                    </div>
                  </div>
                  {selectedOrder.status === 'pending_payment' && (
                    <button
                      className="pay-btn"
                      onClick={() => handleConfirmPayment(selectedOrder.id)}
                    >
                      确认付款 ¥{selectedOrder.total_fee.toFixed(2)}
                    </button>
                  )}
                </section>
              </div>

              <div className="order-detail-bottom">
                <section className="detail-section logs-section">
                  <h3>日常日志</h3>
                  <div className="timeline">
                    {selectedOrder.daily_logs.map((log, index) => (
                      <div key={log.id} className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="log-date">{formatDate(log.date)}</div>
                          <div className="log-photos">
                            {log.photos.map((photo, i) => (
                              <img key={i} src={photo} alt="" className="log-photo" />
                            ))}
                          </div>
                          <p className="log-content">{log.content}</p>
                          <div className="log-comments">
                            {log.comments.map((comment) => (
                              <div key={comment.id} className="comment-item">
                                <strong>{comment.user_name}：</strong>
                                {comment.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedOrder.daily_logs.length === 0 && (
                      <div className="empty-state">暂无日志记录</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && <div className="notification">{notification}</div>}
    </div>
  );
};

export default Dashboard;
