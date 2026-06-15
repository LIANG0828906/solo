import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Order, OrderStatus } from '../types';

const STATUS_ORDER: OrderStatus[] = [
  '待确认',
  '已确认',
  '皮料裁切',
  '手工缝制',
  '五金安装',
  '边油处理',
  '质检',
  '待发货',
  '已发货',
  '已完成',
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  '待确认': '#B0B0B0',
  '已完成': '#5CB85C',
  '已确认': '#8B5E3C',
  '皮料裁切': '#8B5E3C',
  '手工缝制': '#8B5E3C',
  '五金安装': '#8B5E3C',
  '边油处理': '#8B5E3C',
  '质检': '#8B5E3C',
  '待发货': '#8B5E3C',
  '已发货': '#8B5E3C',
};

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get<Order[]>('/api/orders');
        setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const groupedOrders = useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {} as Record<OrderStatus, Order[]>;
    STATUS_ORDER.forEach((s) => (groups[s] = []));
    orders.forEach((o) => groups[o.status].push(o));
    return groups;
  }, [orders]);

  const updateOrderStatus = async (order: Order, nextStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const payload: any = { status: nextStatus };
      if (nextStatus === '已确认' && estimatedHours) {
        payload.estimatedHours = parseInt(estimatedHours);
      }
      await axios.put(`/api/orders/${order.id}`, payload);
      const { data } = await axios.get<Order[]>('/api/orders');
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSelectedOrder(null);
      setEstimatedHours('');
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    const idx = STATUS_ORDER.indexOf(status);
    return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333', marginBottom: '24px' }}>
        订单看板
      </h2>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {STATUS_ORDER.map((status) => (
            <div
              key={status}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: STATUS_COLORS[status],
                  }}
                />
                <span style={{ fontWeight: 600, color: '#333' }}>{status}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#F5F5F5',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  {groupedOrders[status].length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedOrders[status].length === 0 ? (
                  <div style={{ color: '#BBB', fontSize: '13px', fontStyle: 'italic' }}>暂无订单</div>
                ) : (
                  groupedOrders[status].map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '12px',
                        backgroundColor: '#FAFAFA',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#D4A574';
                        e.currentTarget.style.backgroundColor = '#FFF8E1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = '#FAFAFA';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '13px' }}>
                          {order.orderNo}
                        </span>
                        <span style={{ color: '#D4A574', fontWeight: 600 }}>¥{order.totalPrice}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {order.customerName} · {order.items.map((i) => i.productName).join('、')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {selectedOrder ? (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                position: 'sticky',
                top: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
                  订单详情
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    color: '#666',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>订单编号</div>
                <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 600, color: '#8B5E3C' }}>
                  {selectedOrder.orderNo}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>客户</div>
                  <div style={{ fontSize: '14px', color: '#333' }}>{selectedOrder.customerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>电话</div>
                  <div style={{ fontSize: '14px', color: '#333' }}>{selectedOrder.customerPhone}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>定制明细</div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: '#FAFAFA', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, color: '#333', marginBottom: '6px' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      皮革：{item.leatherType} · {item.thickness}mm
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      五金：{item.hardware}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      预估面积：{item.estimatedArea[0]}-{item.estimatedArea[1]} dm²
                    </div>
                    {item.sketchImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        {item.sketchImages.map((img, j) => (
                          <img
                            key={j}
                            src={img}
                            alt=""
                            style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    )}
                    <div style={{ textAlign: 'right', marginTop: '8px', color: '#D4A574', fontWeight: 600 }}>
                      ¥{item.price}
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.status === '待确认' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>预计工时（小时）</div>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="请输入预计工时"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>状态变更记录</div>
                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                  {selectedOrder.statusHistory.map((record, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: i === selectedOrder.statusHistory.length - 1 ? 0 : '16px' }}>
                      {i < selectedOrder.statusHistory.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '-14px',
                            top: '12px',
                            bottom: '-4px',
                            width: '2px',
                            backgroundColor: '#E0E0E0',
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-18px',
                          top: '4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: STATUS_COLORS[record.status as OrderStatus] || '#8B5E3C',
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>
                        {record.status}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder, getNextStatus(selectedOrder.status)!)}
                  disabled={updating}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#8B5E3C',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-out',
                    opacity: updating ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!updating) e.currentTarget.style.backgroundColor = '#A06A42';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B5E3C';
                  }}
                >
                  {updating ? '更新中...' : `推进至：${getNextStatus(selectedOrder.status)}`}
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center',
                color: '#999',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              点击左侧订单查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
