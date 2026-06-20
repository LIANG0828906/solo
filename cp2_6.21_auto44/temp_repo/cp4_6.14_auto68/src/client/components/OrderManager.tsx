import { useState, useEffect } from 'react';
import { Eye, Check, XCircle } from 'lucide-react';
import { orderApi, type Order } from '../api';

const statusColors: Record<Order['status'], string> = {
  '待确认': '#9ca3af',
  '制作中': '#3b82f6',
  '配送中': '#06b6d4',
  '已完成': '#22c55e',
  '已取消': '#ef4444',
};

function StatusBar({ status }: { status: Order['status'] }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 4,
        height: '100%',
        backgroundColor: statusColors[status],
      }}
    />
  );
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      await orderApi.updateStatus(id, status);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: 32 }}>加载中...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1e293b' }}>
        订单管理
      </h1>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.3s ease',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                订单ID
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                顾客名称
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                菜品列表
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                总金额
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                状态
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#475569',
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                style={{
                  position: 'relative',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.2s',
                }}
              >
                <StatusBar status={order.status} />
                <td style={{ padding: '12px 16px', paddingLeft: 20, fontSize: 14, color: '#1e293b' }}>
                  #{order.id}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#1e293b' }}>
                  {order.customerName}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#1e293b' }}>
                  {order.items.map((item) => (
                    <div key={item.menuId}>
                      {item.name} × {item.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  ¥{order.totalAmount.toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      backgroundColor: `${statusColors[order.status]}15`,
                      color: statusColors[order.status],
                      fontWeight: 500,
                    }}
                  >
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        backgroundColor: '#e2e8f0',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'filter 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                    >
                      <Eye size={14} />
                      详情
                    </button>
                    {order.status !== '已完成' && order.status !== '已取消' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, '已完成')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'filter 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                        >
                          <Check size={14} />
                          完成
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, '已取消')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'filter 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                        >
                          <XCircle size={14} />
                          取消
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 24,
              width: 500,
              maxHeight: '70vh',
              overflowY: 'auto',
              height: 'auto',
              animation: 'fadeIn 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
              订单详情
            </h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>订单ID</span>
                <span style={{ fontWeight: 500 }}>#{selectedOrder.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>顾客名称</span>
                <span style={{ fontWeight: 500 }}>{selectedOrder.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>下单时间</span>
                <span style={{ fontWeight: 500 }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>订单状态</span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    backgroundColor: `${statusColors[selectedOrder.status]}15`,
                    color: statusColors[selectedOrder.status],
                    fontWeight: 500,
                  }}
                >
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>菜品明细</h3>
              {selectedOrder.items.map((item) => (
                <div
                  key={item.menuId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: 500 }}>¥{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600 }}>总金额</span>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>
                ¥{selectedOrder.totalAmount.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
