import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Inbox,
  Check,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Phone,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS } from '@/types';
import type { ExchangeRequest, Product } from '@/types';

type TabType = 'products' | 'requests';

export default function ProfilePage() {
  const navigate = useNavigate();
  const getMyProducts = useDataStore((state) => state.getMyProducts);
  const getMyReceivedRequests = useDataStore((state) => state.getMyReceivedRequests);
  const getProduct = useDataStore((state) => state.getProduct);
  const updateProduct = useDataStore((state) => state.updateProduct);
  const markRequestRead = useDataStore((state) => state.markRequestRead);
  const acceptRequest = useDataStore((state) => state.acceptRequest);
  const rejectRequest = useDataStore((state) => state.rejectRequest);
  const deleteProduct = useDataStore((state) => state.deleteProduct);

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const myProducts = useMemo(() => getMyProducts(), [getMyProducts]);
  const receivedRequests = useMemo(
    () => getMyReceivedRequests(),
    [getMyReceivedRequests]
  );

  const unreadCount = receivedRequests.filter((r) => !r.isRead).length;

  const handleRequestClick = (request: ExchangeRequest) => {
    if (!request.isRead) {
      markRequestRead(request.id);
    }
    setExpandedRequest(expandedRequest === request.id ? null : request.id);
  };

  const handleAccept = (requestId: string) => {
    acceptRequest(requestId);
  };

  const handleReject = (requestId: string) => {
    rejectRequest(requestId);
  };

  const toggleProductStatus = (product: Product) => {
    if (product.status === 'published') {
      updateProduct(product.id, { status: 'offline' });
    } else if (product.status === 'offline') {
      updateProduct(product.id, { status: 'published' });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('确定要删除这件商品吗？')) {
      deleteProduct(productId);
    }
  };

  const getRequestProduct = (productId: string) => {
    return getProduct(productId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (diffDays === 0) return `今天 ${timeStr}`;
    if (diffDays === 1) return `昨天 ${timeStr}`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '上架中';
      case 'sold':
        return '已交换';
      case 'offline':
        return '已下架';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-morandi-green';
      case 'sold':
        return 'text-morandi-blue';
      case 'offline':
        return 'text-morandi-brown';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-morandi-white pb-24">
      <div className="bg-morandi-blue pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User size={32} className="text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">我的好物</h1>
              <p className="text-sm opacity-90">让闲置流转起来</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto -mt-4 px-4">
        <div className="bg-white rounded-card shadow-sm flex overflow-hidden">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'products'
                ? 'text-morandi-blue bg-morandi-blue/5 border-b-2 border-morandi-blue'
                : 'text-morandi-brown hover:bg-morandi-gray/50'
            }`}
          >
            <Package size={18} />
            <span className="text-sm font-medium">我的发布</span>
            <span className="px-1.5 py-0.5 text-xs bg-morandi-gray rounded-full">
              {myProducts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all duration-300 relative ${
              activeTab === 'requests'
                ? 'text-morandi-blue bg-morandi-blue/5 border-b-2 border-morandi-blue'
                : 'text-morandi-brown hover:bg-morandi-gray/50'
            }`}
          >
            <Inbox size={18} />
            <span className="text-sm font-medium">收到的申请</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-morandi-red text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'products' && (
          <div className="space-y-3 animate-fade-in">
            {myProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-morandi-gray rounded-full flex items-center justify-center">
                  <Package size={32} className="text-morandi-brown" />
                </div>
                <p className="text-morandi-brown mb-2">还没有发布任何物品</p>
                <button
                  onClick={() => navigate('/publish')}
                  className="px-6 py-2 bg-morandi-blue text-white rounded-full text-sm hover:bg-morandi-blue-dark transition-colors duration-300"
                >
                  去发布
                </button>
              </div>
            ) : (
              myProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-card p-4 shadow-sm border border-morandi-gray/50 hover:shadow-card transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="flex gap-4 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-morandi-gray">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-700 line-clamp-1 mb-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-morandi-brown">
                          {CATEGORY_LABELS[product.category]}
                        </span>
                        <span className="text-xs text-morandi-brown">·</span>
                        <span className="text-xs text-morandi-brown">
                          {product.condition}/10成新
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-morandi-brown self-center" />
                  </div>
                  {product.status !== 'sold' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-morandi-gray/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProductStatus(product);
                        }}
                        className="flex-1 py-2 text-xs rounded-full border border-morandi-gray text-morandi-brown hover:bg-morandi-gray/50 transition-colors duration-300 flex items-center justify-center gap-1"
                      >
                        {product.status === 'published' ? (
                          <>
                            <EyeOff size={14} />
                            下架
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            上架
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id);
                        }}
                        className="flex-1 py-2 text-xs rounded-full border border-morandi-red/30 text-morandi-red hover:bg-morandi-red/10 transition-colors duration-300 flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3 animate-fade-in">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-morandi-gray rounded-full flex items-center justify-center">
                  <Inbox size={32} className="text-morandi-brown" />
                </div>
                <p className="text-morandi-brown mb-2">还没有收到交换申请</p>
                <p className="text-sm text-morandi-brown/70">
                  发布好物后，别人就可以向你发起交换申请啦
                </p>
              </div>
            ) : (
              receivedRequests.map((request, index) => {
                const product = getRequestProduct(request.productId);
                const isExpanded = expandedRequest === request.id;

                return (
                  <div
                    key={request.id}
                    className={`bg-white rounded-card shadow-sm border border-morandi-gray/50 overflow-hidden transition-all duration-300 animate-slide-up ${
                      !request.isRead ? 'ring-1 ring-morandi-blue/30' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className="flex cursor-pointer"
                      onClick={() => handleRequestClick(request)}
                    >
                      <div
                        className={`w-1 flex-shrink-0 transition-colors duration-300 ${
                          !request.isRead ? 'bg-morandi-blue' : 'bg-morandi-gray'
                        }`}
                      />
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Gift size={16} className="text-morandi-sand" />
                            <span className="text-sm font-medium text-gray-700">
                              交换申请
                            </span>
                            {!request.isRead && (
                              <span className="w-2 h-2 bg-morandi-blue rounded-full" />
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              request.status === 'accepted'
                                ? 'bg-morandi-green/20 text-morandi-green-dark'
                                : request.status === 'rejected'
                                ? 'bg-morandi-red/20 text-morandi-red-dark'
                                : 'bg-morandi-yellow/20 text-morandi-brown'
                            }`}
                          >
                            {request.status === 'accepted'
                              ? '已接受'
                              : request.status === 'rejected'
                              ? '已拒绝'
                              : '待处理'}
                          </span>
                        </div>

                        {product && (
                          <div className="flex items-center gap-2 mb-2 p-2 bg-morandi-gray/30 rounded-lg">
                            <div className="w-10 h-10 rounded overflow-hidden bg-morandi-gray flex-shrink-0">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600 truncate">
                                物品：{product.title}
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-morandi-brown line-clamp-2 mb-1">
                          提供：{request.offerDescription}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-morandi-brown">
                          <Clock size={12} />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-morandi-gray/50 animate-fade-in">
                            <div className="mb-3">
                              <p className="text-xs text-morandi-brown mb-1">
                                提供的物品描述
                              </p>
                              <p className="text-sm text-gray-700">
                                {request.offerDescription}
                              </p>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs text-morandi-brown mb-1">
                                联系方式
                              </p>
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-morandi-green" />
                                <p className="text-sm text-gray-700 font-medium">
                                  {request.contactInfo}
                                </p>
                              </div>
                            </div>

                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(request.id);
                                  }}
                                  className="flex-1 py-2 text-sm rounded-full border border-morandi-gray text-morandi-brown hover:bg-morandi-gray/50 transition-colors duration-300 flex items-center justify-center gap-1"
                                >
                                  <XCircle size={16} />
                                  拒绝
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(request.id);
                                  }}
                                  className="flex-1 py-2 text-sm rounded-full bg-morandi-green text-white hover:bg-morandi-green-dark transition-colors duration-300 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle size={16} />
                                  接受
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="pr-4 self-center">
                        <ChevronRight
                          size={20}
                          className={`text-morandi-brown transition-transform duration-300 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
