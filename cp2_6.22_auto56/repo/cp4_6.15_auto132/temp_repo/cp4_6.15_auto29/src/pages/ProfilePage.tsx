import { useState, useMemo } from 'react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type ExchangeRequest, type Product } from '@/types';

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const InboxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const ChevronIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const GiftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PackageBoxIcon = PackageIcon;

type TabType = 'products' | 'requests';

export default function ProfilePage() {
  const {
    state,
    navigate,
    updateProduct,
    deleteProduct,
    getMyProducts,
    getMyReceivedRequests,
    markRequestRead,
    acceptRequest,
    rejectRequest,
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myProducts = useMemo(() => getMyProducts(), [state.products]);
  const receivedRequests = useMemo(
    () => getMyReceivedRequests(),
    [state.requests, state.products]
  );

  const unreadCount = receivedRequests.filter((r) => !r.isRead).length;

  const getProduct = (id: string) => state.products.find((p) => p.id === id);

  const handleRequestClick = (request: ExchangeRequest) => {
    if (!request.isRead) {
      markRequestRead(request.id);
    }
    setExpandedId(expandedId === request.id ? null : request.id);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (diffDays === 0) return `今天 ${timeStr}`;
    if (diffDays === 1) return `昨天 ${timeStr}`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getStatusText = (s: string) =>
    s === 'published' ? '上架中' : s === 'sold' ? '已交换' : '已下架';
  const getStatusClass = (s: string) =>
    s === 'published'
      ? 'published'
      : s === 'sold'
      ? 'sold'
      : 'offline';

  const toggleStatus = (p: Product) => {
    updateProduct(p.id, {
      status: p.status === 'published' ? 'offline' : 'published',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这件商品吗？')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="page-container">
      <div className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-avatar">
            <UserIcon style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <h1 className="profile-title">我的好物</h1>
            <p className="profile-subtitle">让闲置流转起来</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs-wrap">
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('products')}
            className={`profile-tab ${activeTab === 'products' ? 'active' : ''}`}
          >
            <PackageIcon style={{ width: 18, height: 18 }} />
            <span>我的发布</span>
            <span className="profile-tab-count">{myProducts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`profile-tab ${activeTab === 'requests' ? 'active' : ''}`}
          >
            <InboxIcon style={{ width: 18, height: 18 }} />
            <span>收到的申请</span>
            {unreadCount > 0 ? (
              <span className="profile-tab-count unread">{unreadCount}</span>
            ) : (
              <span className="profile-tab-count">{receivedRequests.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="profile-list">
        {activeTab === 'products' && (
          <>
            {myProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <PackageBoxIcon style={{ width: 32, height: 32 }} />
                </div>
                <p className="empty-title">还没有发布任何物品</p>
                <button
                  onClick={() => navigate({ name: 'publish' })}
                  className="btn btn-primary"
                  style={{ borderRadius: 999, padding: '10px 24px', marginTop: 8 }}
                >
                  去发布
                </button>
              </div>
            ) : (
              myProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="my-product-card"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="my-product-row"
                    onClick={() =>
                      navigate({ name: 'detail', params: { id: product.id } })
                    }
                  >
                    <div className="my-product-thumb">
                      {product.images[0] && (
                        <img src={product.images[0]} alt={product.title} />
                      )}
                    </div>
                    <div className="my-product-info">
                      <div>
                        <div className="my-product-title">{product.title}</div>
                        <div className="my-product-meta">
                          <span>{CATEGORY_LABELS[product.category]}</span>
                          <span style={{ color: 'var(--morandi-gray-dark)' }}>·</span>
                          <span>{product.condition}/10成新</span>
                        </div>
                      </div>
                      <div
                        className={`my-product-status ${getStatusClass(
                          product.status
                        )}`}
                      >
                        {getStatusText(product.status)}
                      </div>
                    </div>
                    <ChevronIcon
                      className="my-product-chevron"
                      style={{ width: 20, height: 20 }}
                    />
                  </div>
                  {product.status !== 'sold' && (
                    <div className="my-product-actions">
                      <button
                        onClick={() => toggleStatus(product)}
                        className="btn btn-secondary"
                      >
                        {product.status === 'published' ? (
                          <>
                            <EyeOffIcon style={{ width: 14, height: 14 }} />
                            下架
                          </>
                        ) : (
                          <>
                            <EyeIcon style={{ width: 14, height: 14 }} />
                            上架
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-danger"
                      >
                        <TrashIcon style={{ width: 14, height: 14 }} />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            {receivedRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <InboxIcon style={{ width: 32, height: 32 }} />
                </div>
                <p className="empty-title">还没有收到交换申请</p>
                <p className="empty-desc">
                  发布好物后，别人就可以向你发起交换申请啦
                </p>
              </div>
            ) : (
              receivedRequests.map((request, i) => {
                const product = getProduct(request.productId);
                const isExpanded = expandedId === request.id;
                return (
                  <div
                    key={request.id}
                    className={`request-card ${!request.isRead ? 'has-unread' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      className="request-card-row"
                      onClick={() => handleRequestClick(request)}
                    >
                      <div
                        className={`request-marker ${request.isRead ? '' : 'unread'}`}
                      />
                      <div className="request-content">
                        <div className="request-header">
                          <div className="request-title-row">
                            <GiftIcon
                              className="request-icon"
                              style={{ width: 16, height: 16 }}
                            />
                            <span className="request-title">交换申请</span>
                            {!request.isRead && <span className="unread-dot" />}
                          </div>
                          <span className={`request-status ${request.status}`}>
                            {request.status === 'accepted'
                              ? '已接受'
                              : request.status === 'rejected'
                              ? '已拒绝'
                              : '待处理'}
                          </span>
                        </div>
                        {product && (
                          <div className="request-product">
                            <div className="request-product-thumb">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                />
                              )}
                            </div>
                            <span className="request-product-name">
                              物品：{product.title}
                            </span>
                          </div>
                        )}
                        <p className="request-offer-preview">
                          提供：{request.offerDescription}
                        </p>
                        <div className="request-date">
                          <ClockIcon style={{ width: 12, height: 12 }} />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        {isExpanded && (
                          <div className="request-detail">
                            <div className="request-detail-section">
                              <div className="request-detail-label">提供的物品描述</div>
                              <div className="request-detail-text">
                                {request.offerDescription}
                              </div>
                            </div>
                            <div className="request-detail-section">
                              <div className="request-detail-label">联系方式</div>
                              <div className="request-contact">
                                <PhoneIcon
                                  className="request-contact-icon"
                                  style={{ width: 16, height: 16 }}
                                />
                                <span className="request-contact-value">
                                  {request.contactInfo}
                                </span>
                              </div>
                            </div>
                            {request.status === 'pending' && (
                              <div className="request-actions">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectRequest(request.id);
                                  }}
                                  className="btn btn-secondary"
                                >
                                  <XCircleIcon style={{ width: 16, height: 16 }} />
                                  拒绝
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acceptRequest(request.id);
                                  }}
                                  className="btn btn-success"
                                >
                                  <CheckCircleIcon style={{ width: 16, height: 16 }} />
                                  接受
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronIcon
                        className={`request-chevron ${isExpanded ? 'expanded' : ''}`}
                        style={{ width: 20, height: 20 }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
