import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { orderApi, commonApi, Order, StatusInfo } from '../utils/api';

const jewelryTypeMap: Record<string, string> = {
  ring: '戒指',
  bracelet: '手镯',
  pendant: '吊坠',
  earring: '耳环'
};

const jewelryIconMap: Record<string, string> = {
  ring: '💍',
  bracelet: '📿',
  pendant: '🔮',
  earring: '✨'
};

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<StatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    orderNumber: '',
    customerPhone: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'status'>('date_desc');

  useEffect(() => {
    commonApi.getStatuses().then(setStatuses).catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.orderNumber) params.orderNumber = filters.orderNumber;
      if (filters.customerPhone) params.customer_phone = filters.customerPhone;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await orderApi.list(params);
      setOrders(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (selectedOrder) {
      let cancelled = false;
      const refreshDetail = async () => {
        try {
          setDetailLoading(true);
          const detail = await orderApi.get(selectedOrder.id);
          if (!cancelled) setSelectedOrder(detail);
        } finally {
          if (!cancelled) setDetailLoading(false);
        }
      };
      const timer = setInterval(refreshDetail, 500);
      refreshDetail();
      return () => { cancelled = true; clearInterval(timer); };
    }
  }, [selectedOrder?.id]);

  const filteredAndSorted = useMemo(() => {
    const sorted = [...orders];
    sorted.sort((a, b) => {
      if (sortBy === 'date_desc') return b.created_at.localeCompare(a.created_at);
      if (sortBy === 'date_asc') return a.created_at.localeCompare(b.created_at);
      return a.status.localeCompare(b.status);
    });
    return sorted;
  }, [orders, sortBy]);

  const getStatusInfo = (key: string) =>
    statuses.find(s => s.key === key) || { key, label: key, color: '#9E9E9E' };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      <style>{`
        @keyframes timelineFadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .timeline-item {
          animation: timelineFadeIn 0.3s ease forwards;
          opacity: 0;
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, color: '#4E342E', marginBottom: 12 }}>订单查询</h1>
        <p style={{ color: '#8D6E63', fontSize: 15 }}>输入筛选条件查看您的定制订单进度</p>
      </div>

      <div style={{
        background: 'white', borderRadius: 16, padding: '24px 28px',
        marginBottom: 28, boxShadow: '0 4px 16px rgba(78,52,46,0.06)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 16
        }}>
          <div>
            <label>订单编号</label>
            <input
              value={filters.orderNumber}
              onChange={e => setFilters(f => ({ ...f, orderNumber: e.target.value }))}
              placeholder="如 SS240115001"
            />
          </div>
          <div>
            <label>手机号码</label>
            <input
              value={filters.customerPhone}
              onChange={e => setFilters(f => ({ ...f, customerPhone: e.target.value }))}
              placeholder="下单时的手机号"
            />
          </div>
          <div>
            <label>饰品类型</label>
            <select
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            >
              <option value="all">全部类型</option>
              <option value="ring">戒指</option>
              <option value="bracelet">手镯</option>
              <option value="pendant">吊坠</option>
              <option value="earring">耳环</option>
            </select>
          </div>
          <div>
            <label>订单状态</label>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="all">全部状态</option>
              {statuses.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto auto',
          gap: 16,
          alignItems: 'end'
        }}>
          <div>
            <label>开始日期</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label>结束日期</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label>排序方式</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ minWidth: 140 }}
            >
              <option value="date_desc">最新创建</option>
              <option value="date_asc">最早创建</option>
              <option value="status">按状态排序</option>
            </select>
          </div>
          <button
            className="btn"
            onClick={() => setFilters({ orderNumber: '', customerPhone: '', type: 'all', status: 'all', startDate: '', endDate: '' })}
            style={{ background: '#8D6E63' }}
          >
            重置
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#8D6E63' }}>加载中...</div>
      ) : filteredAndSorted.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, padding: 60, textAlign: 'center',
          color: '#8D6E63'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div>暂无订单记录，请调整筛选条件后重试</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(78,52,46,0.06)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr auto',
            padding: '14px 24px',
            background: '#FAF7F4',
            borderBottom: '1px solid #E8DFD6',
            fontSize: 13,
            fontWeight: 600,
            color: '#6D4C41'
          }}>
            <div>订单编号</div>
            <div>饰品类型</div>
            <div>材质 / 尺寸</div>
            <div>状态</div>
            <div>最后更新</div>
            <div style={{ textAlign: 'center' }}>操作</div>
          </div>
          {filteredAndSorted.map((order, idx) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div
                key={order.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr auto',
                  padding: '18px 24px',
                  alignItems: 'center',
                  borderBottom: idx === filteredAndSorted.length - 1 ? 'none' : '1px solid #F0E8E0',
                  cursor: 'pointer',
                  animationDelay: `${idx * 0.05}s`
                }}
                className="card-hover"
                onClick={() => {
                  setSelectedOrder(null);
                  setTimeout(async () => {
                    setDetailLoading(true);
                    const detail = await orderApi.get(order.id);
                    setSelectedOrder(detail);
                  }, 0);
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#4E342E', fontFamily: 'monospace', fontSize: 14 }}>
                    {order.order_number}
                  </div>
                  <div style={{ fontSize: 12, color: '#A1887F', marginTop: 2 }}>
                    {formatDate(order.created_at).slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{jewelryIconMap[order.jewelry_type] || '💎'}</span>
                  <span style={{ color: '#4E342E' }}>{jewelryTypeMap[order.jewelry_type] || order.jewelry_type}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6D4C41' }}>
                  <div>{order.material}</div>
                  <div style={{ color: '#A1887F', marginTop: 2 }}>{order.size}</div>
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'white',
                    background: statusInfo.color
                  }}>
                    {statusInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#8D6E63' }}>
                  {formatDate(order.updated_at)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 13 }}>
                    查看详情
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(78,52,46,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 720,
            maxHeight: '90vh', overflow: 'auto', animation: 'fadeIn 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '24px 28px', borderBottom: '1px solid #E8DFD6',
              position: 'sticky', top: 0, background: 'white', zIndex: 1
            }}>
              <div>
                <div style={{
                  fontSize: 18, fontWeight: 600, color: '#4E342E',
                  fontFamily: 'monospace'
                }}>{selectedOrder.order_number}</div>
                <div style={{ fontSize: 13, color: '#8D6E63', marginTop: 4 }}>
                  {jewelryIconMap[selectedOrder.jewelry_type]} {jewelryTypeMap[selectedOrder.jewelry_type]} · {selectedOrder.material}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none', border: 'none', fontSize: 24,
                  cursor: 'pointer', color: '#8D6E63', padding: '0 8px'
                }}
              >×</button>
            </div>

            <div style={{ padding: '28px' }}>
              {detailLoading && <div style={{ color: '#C0A080', fontSize: 13, marginBottom: 16 }}>正在同步最新进度...</div>}

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
                padding: 20, background: '#FAF7F4', borderRadius: 12, marginBottom: 28
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 4 }}>尺寸</div>
                  <div style={{ color: '#4E342E', fontWeight: 500 }}>{selectedOrder.size}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 4 }}>刻字</div>
                  <div style={{ color: '#4E342E', fontWeight: 500 }}>{selectedOrder.engraving || '无'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 4 }}>期望交付</div>
                  <div style={{ color: '#4E342E', fontWeight: 500 }}>{selectedOrder.deadline}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 4 }}>联系人</div>
                  <div style={{ color: '#4E342E', fontWeight: 500 }}>{selectedOrder.customer_name} · {selectedOrder.customer_phone}</div>
                </div>
                {selectedOrder.sketch_image && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 8 }}>客户提供草图</div>
                    <img src={selectedOrder.sketch_image} alt="草图"
                      onClick={() => setShowPreview(selectedOrder.sketch_image!)}
                      style={{
                        maxHeight: 160, borderRadius: 8, cursor: 'pointer',
                        border: '1px solid #E8DFD6'
                      }} />
                  </div>
                )}
              </div>

              {(selectedOrder.designs?.length || 0) > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#4E342E', marginBottom: 16
                  }}>设计稿</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {selectedOrder.designs!.map(d => (
                      <div key={d.id} style={{ position: 'relative' }}
                        className="card-hover">
                        <img src={d.image_url} alt="设计稿"
                          onClick={() => setShowPreview(d.image_url)}
                          style={{
                            width: 200, height: 200, objectFit: 'cover',
                            borderRadius: 8, boxShadow: '0 2px 8px rgba(78,52,46,0.1)',
                            cursor: 'pointer'
                          }} />
                        {d.is_final === 1 && (
                          <span style={{
                            position: 'absolute', top: 8, right: 8,
                            background: '#C0A080', color: 'white',
                            padding: '2px 10px', borderRadius: 10,
                            fontSize: 11, fontWeight: 500
                          }}>最终定稿</span>
                        )}
                        {d.description && (
                          <div style={{
                            fontSize: 12, color: '#8D6E63',
                            marginTop: 4, padding: '0 4px'
                          }}>{d.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#4E342E', marginBottom: 16 }}>
                  生产进度
                </div>
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  <div style={{
                    position: 'absolute', left: 11, top: 8, bottom: 8,
                    width: 2, background: '#E8DFD6'
                  }} />
                  {(selectedOrder.history || []).map((h, idx) => {
                    const sInfo = getStatusInfo(h.status);
                    return (
                      <div key={h.id} className="timeline-item"
                        style={{
                          position: 'relative',
                          paddingBottom: idx === (selectedOrder.history?.length || 0) - 1 ? 0 : 20,
                          animationDelay: `${idx * 0.1}s`
                        }}>
                        <div style={{
                          position: 'absolute', left: -32, top: 2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#C0A080',
                          border: '4px solid white',
                          boxShadow: `0 0 0 2px ${idx === (selectedOrder.history?.length || 0) - 1 ? '#C0A080' : '#E8DFD6'}`
                        }} />
                        <div style={{ paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              padding: '2px 12px', borderRadius: 12,
                              fontSize: 12, color: 'white',
                              background: idx === (selectedOrder.history?.length || 0) - 1 ? '#C0A080' : sInfo.color
                            }}>{sInfo.label}</span>
                            <span style={{ fontSize: 12, color: '#A1887F' }}>
                              {formatDate(h.created_at)}
                            </span>
                          </div>
                          {h.note && (
                            <div style={{ marginTop: 6, fontSize: 13, color: '#6D4C41', lineHeight: 1.6 }}>
                              {h.note}
                            </div>
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
      )}

      {showPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', padding: 24
        }} onClick={() => setShowPreview(null)}>
          <img src={showPreview} alt="预览" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
};

export default OrderList;
