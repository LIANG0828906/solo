import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getOrders, mergeOrders, optimizeRoute, getDeliveryOrders } from '../api/orderApi';
import type { Order, DeliveryOrder } from '../types';
import RouteMap from '../components/RouteMap';
import RippleButton from '../components/RippleButton';

interface Address {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, showToast, loadOrders, loadDeliveryOrders } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [optimizingId, setOptimizingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      showToast('请先登录', 'warning');
      navigate('/login');
      return;
    }
    fetchData();
  }, [isLoggedIn, navigate, showToast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, deliveryData] = await Promise.all([
        getOrders(),
        getDeliveryOrders(),
      ]);
      setOrders(ordersData.filter((o) => o.status === 'pending'));
      setDeliveryOrders(deliveryData);
      loadOrders(ordersData);
      loadDeliveryOrders(deliveryData);
    } catch (error) {
      showToast('获取订单数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleMerge = async () => {
    if (selectedOrderIds.length < 2) {
      showToast('请至少选择2个订单进行合并', 'warning');
      return;
    }
    setMerging(true);
    try {
      const newDelivery = await mergeOrders(selectedOrderIds);
      setDeliveryOrders((prev) => [...prev, newDelivery]);
      setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
      setSelectedOrderIds([]);
      showToast('订单合并成功', 'success');
    } catch (error) {
      showToast('合并订单失败', 'error');
    } finally {
      setMerging(false);
    }
  };

  const handleOptimizeRoute = async (deliveryId: number) => {
    setOptimizingId(deliveryId);
    try {
      const optimized = await optimizeRoute(deliveryId);
      setDeliveryOrders((prev) =>
        prev.map((d) => (d.id === deliveryId ? optimized : d))
      );
      showToast('路线优化成功', 'success');
    } catch (error) {
      showToast('优化路线失败', 'error');
    } finally {
      setOptimizingId(null);
    }
  };

  const parseAddresses = (addresses: string[]): Address[] => {
    return addresses.map((addr, index) => ({
      id: index + 1,
      name: addr,
      lat: 30 + Math.random() * 5,
      lng: 116 + Math.random() * 5,
    }));
  };

  const parseOptimizedRoute = (optimized_route: string[], addresses: Address[]): number[] => {
    return optimized_route.map((addr) => {
      const found = addresses.find((a) => a.name === addr);
      return found ? found.id : 0;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 24px 0' }}>
        团长订单管理
      </h1>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  未合并订单 ({orders.length})
                </h2>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#d1d5db',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#4f46e5',
                    }}
                  />
                  全选
                </label>
              </div>

              <div
                style={{
                  maxHeight: '500px',
                  overflowY: 'auto',
                  paddingRight: '8px',
                }}
              >
                {orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: '#9ca3af',
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                    <div>暂无待合并订单</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleSelectOrder(order.id)}
                        style={{
                          backgroundColor: selectedOrderIds.includes(order.id)
                            ? 'rgba(79, 70, 229, 0.2)'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: selectedOrderIds.includes(order.id)
                            ? '2px solid #4f46e5'
                            : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedOrderIds.includes(order.id)) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedOrderIds.includes(order.id)) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectOrder(order.id);
                            }}
                            style={{
                              marginTop: '4px',
                              width: '18px',
                              height: '18px',
                              accentColor: '#4f46e5',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <span style={{ fontWeight: 600, fontSize: '15px' }}>
                                {order.user}
                              </span>
                              <span
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  color: '#10b981',
                                }}
                              >
                                ¥{order.total.toFixed(2)}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: '#d1d5db',
                                marginBottom: '8px',
                                lineHeight: 1.5,
                              }}
                            >
                              {order.items.map((item) => `${item.product.name}×${item.quantity}`).join('、')}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                              }}
                            >
                              {formatDate(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
                合并操作
              </h2>
              <div
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  flex: 1,
                }}
              >
                <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                  已选择订单：
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>
                  {selectedOrderIds.length} 个
                </div>
                {selectedOrderIds.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    订单号：{selectedOrderIds.join(', ')}
                  </div>
                )}
              </div>
              <RippleButton
                onClick={handleMerge}
                disabled={selectedOrderIds.length < 2 || merging}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  filter: 'brightness(1)',
                  transition: 'filter 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                {merging ? '合并中...' : '合并订单'}
              </RippleButton>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
              配送单列表
            </h2>
            {deliveryOrders.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: '#ede9fe',
                  borderRadius: '16px',
                  color: '#6b7280',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚚</div>
                <div>暂无配送单</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {deliveryOrders.map((delivery) => {
                  const addresses = parseAddresses(delivery.addresses);
                  const optimizedRoute = delivery.optimized_route
                    ? parseOptimizedRoute(delivery.optimized_route, addresses)
                    : addresses.map((a) => a.id);

                  return (
                    <div
                      key={delivery.id}
                      style={{
                        backgroundColor: '#ede9fe',
                        borderRadius: '16px',
                        padding: '20px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#4c1d95',
                            }}
                          >
                            配送单 #{delivery.id}
                          </span>
                          <span
                            style={{
                              marginLeft: '12px',
                              fontSize: '13px',
                              color: '#7c3aed',
                            }}
                          >
                            包含订单：{delivery.order_ids.join(', ')}
                          </span>
                        </div>
                        <RippleButton
                          onClick={() => handleOptimizeRoute(delivery.id)}
                          disabled={optimizingId === delivery.id}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                          }}
                        >
                          {optimizingId === delivery.id ? '优化中...' : '优化路线'}
                        </RippleButton>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '16px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '12px',
                          }}
                        >
                          配送地址：
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {(delivery.optimized_route?.length
                            ? delivery.optimized_route
                            : delivery.addresses
                          ).map((addr, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                              }}
                            >
                              <span
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: index === 0 ? '#10b981' : '#4f46e5',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {index + 1}
                              </span>
                              <span style={{ fontSize: '13px', color: '#374151' }}>
                                {addr}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {delivery.optimized_route && (
                        <RouteMap
                          addresses={addresses}
                          optimized_route={optimizedRoute}
                          width={800}
                          height={350}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        div[style*="overflowY: auto"]::-webkit-scrollbar {
          width: '6px';
        }
        div[style*="overflowY: auto"]::-webkit-scrollbar-track {
          background: 'rgba(255, 255, 255, 0.1)';
          borderRadius: '3px';
        }
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
          background: 'rgba(255, 255, 255, 0.3)';
          border-radius: '3px';
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;
