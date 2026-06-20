import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  orderApi, inventoryApi, dashboardApi, commonApi,
  Order, StatusInfo, DashboardStats, InventoryData
} from '../utils/api';

const jewelryTypeMap: Record<string, string> = {
  ring: '戒指', bracelet: '手镯', pendant: '吊坠', earring: '耳环'
};
const jewelryIconMap: Record<string, string> = {
  ring: '💍', bracelet: '📿', pendant: '🔮', earring: '✨'
};

const WorkshopSidebar: React.FC<{ expanded: boolean; onToggle: () => void }> = ({ expanded, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/workshop', icon: '📊', label: '数据总览' },
    { path: '/workshop/inventory', icon: '📦', label: '库存管理' }
  ];

  return (
    <aside style={{
      width: expanded ? 256 : 64,
      background: 'linear-gradient(180deg, #5D4037 0%, #3E2723 100%)',
      minHeight: '100vh',
      transition: 'width 0.2s ease',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: expanded ? '20px 24px' : '20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 72
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(192,160,128,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginLeft: expanded ? 0 : 12
        }}>
          <span style={{ fontSize: 22 }}>⚒️</span>
        </div>
        {expanded && (
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>工作室后台</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>匠心银饰</div>
          </div>
        )}
      </div>

      <nav style={{ padding: '16px 0', flex: 1 }}>
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: expanded ? '12px 24px' : '12px 0',
                margin: '2px 8px',
                borderRadius: 8,
                textDecoration: 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.7)',
                background: active ? 'rgba(192,160,128,0.2)' : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                justifyContent: expanded ? 'flex-start' : 'center'
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0, marginLeft: expanded ? 0 : 0 }}>{item.icon}</span>
              {expanded && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        onClick={onToggle}
        style={{
          padding: expanded ? '16px 24px' : '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          justifyContent: expanded ? 'flex-start' : 'center'
        }}
      >
        <span style={{ fontSize: 18 }}>{expanded ? '◀' : '▶'}</span>
        {expanded && <span>收起菜单</span>}
      </div>
    </aside>
  );
};

interface StatCardProps {
  icon: string;
  title: string;
  value: number;
  max: number;
  unit?: string;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, max, unit, gradient }) => {
  const [animated, setAnimated] = useState(0);
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FAF7F4 0%, white 100%)',
      borderRadius: 16,
      padding: 20,
      height: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px rgba(78,52,46,0.06)',
      border: '1px solid #F0E8E0'
    }} className="card-hover">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 4 }}>{title}</div>
          <div style={{
            fontSize: 26, fontWeight: 700,
            color: '#4E342E', lineHeight: 1
          }}>
            {value}{unit || ''}
          </div>
        </div>
      </div>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#F0E8E0" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={radius} fill="none"
          stroke="url(#grad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C0A080" />
            <stop offset="100%" stopColor="#A08060" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const WorkshopDashboard: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<StatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designDesc, setDesignDesc] = useState('');
  const [designFinal, setDesignFinal] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, invData, oData, stData] = await Promise.all([
        dashboardApi.stats(),
        inventoryApi.list(),
        orderApi.list(),
        commonApi.getStatuses()
      ]);
      setStats(sData);
      setInventory(invData);
      setOrders(oData);
      setStatuses(stData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (selectedOrder) {
      let cancelled = false;
      const refresh = async () => {
        try {
          setDetailLoading(true);
          const detail = await orderApi.get(selectedOrder.id);
          if (!cancelled) setSelectedOrder(detail);
        } finally {
          if (!cancelled) setDetailLoading(false);
        }
      };
      const timer = setInterval(refresh, 500);
      refresh();
      return () => { cancelled = true; clearInterval(timer); };
    }
  }, [selectedOrder?.id]);

  const groupedOrders = statuses.reduce((acc, s) => {
    acc[s.key] = orders.filter(o => o.status === s.key);
    return acc;
  }, {} as Record<string, Order[]>);

  const filteredOrders = filterStatus === 'all' ? orders : (groupedOrders[filterStatus] || []);

  const getStatusInfo = (key: string) =>
    statuses.find(s => s.key === key) || { key, label: key, color: '#9E9E9E' };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      await orderApi.updateStatus(selectedOrder.id, newStatus, statusNote);
      setStatusNote('');
      setNewStatus('');
      await loadData();
      const detail = await orderApi.get(selectedOrder.id);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadDesign = async () => {
    if (!selectedOrder || !designFile) return;
    setUpdating(true);
    try {
      await orderApi.uploadDesign(selectedOrder.id, designFile, designDesc, designFinal);
      setDesignFile(null);
      setDesignDesc('');
      setDesignFinal(false);
      const input = document.getElementById('design-file-input') as HTMLInputElement;
      if (input) input.value = '';
      const detail = await orderApi.get(selectedOrder.id);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleSetFinal = async (designId: number) => {
    if (!selectedOrder) return;
    try {
      await orderApi.setFinalDesign(designId);
      const detail = await orderApi.get(selectedOrder.id);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes timelineFadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .timeline-item {
          animation: timelineFadeIn 0.3s ease forwards;
          opacity: 0;
        }
        .pulse-badge {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <WorkshopSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />

      <div style={{
        flex: 1,
        marginLeft: sidebarExpanded ? 256 : 64,
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh'
      }}>
        {(inventory?.lowStock.length || 0) > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #FFF3E0 0%, #FFE8CC 100%)',
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderBottom: '1px solid #FFE0B2'
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%',
              background: '#FF8C00', color: 'white', fontSize: 14,
              fontWeight: 600
            }} className="pulse-badge">
              {inventory!.lowStock.length}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ color: '#E65100', fontWeight: 600, fontSize: 14 }}>库存预警：</span>
              <span style={{ color: '#BF360C', fontSize: 13 }}>
                {inventory!.lowStock.map(i => `${i.name}(${Math.floor(i.quantity)}${i.unit})`).join('、')}
                {' '}数量低于阈值，请及时补货！
              </span>
            </div>
            <Link to="/workshop/inventory" className="btn" style={{
              background: '#FF8C00', padding: '8px 20px', fontSize: 13
            }}>去处理</Link>
          </div>
        )}

        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, color: '#4E342E', marginBottom: 6 }}>工作室总览</h1>
            <p style={{ color: '#8D6E63', fontSize: 14 }}>掌握订单进度，高效管理工作室运营</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#8D6E63' }}>加载中...</div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
                marginBottom: 36
              }}>
                <StatCard
                  icon="📋" title="今日新增订单"
                  value={stats?.todayNew || 0} max={10}
                  gradient="linear-gradient(135deg, #E3F2FD, #BBDEFB)"
                />
                <StatCard
                  icon="🔧" title="待处理订单"
                  value={stats?.pending || 0} max={Math.max(20, stats?.pending || 0)}
                  gradient="linear-gradient(135deg, #FFF3E0, #FFE0B2)"
                />
                <StatCard
                  icon="⏰" title="即将到期"
                  value={stats?.upcomingDeadlines || 0} max={10}
                  gradient="linear-gradient(135deg, #FFEBEE, #FFCDD2)"
                />
              </div>

              <div style={{
                background: 'white', borderRadius: 16, padding: '24px 28px',
                marginBottom: 28, boxShadow: '0 4px 16px rgba(78,52,46,0.06)'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 20
                }}>
                  <h2 style={{ fontSize: 18, color: '#4E342E' }}>订单管理</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      onClick={() => setFilterStatus('all')}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        background: filterStatus === 'all' ? '#4E342E' : '#F5F0EB',
                        color: filterStatus === 'all' ? 'white' : '#6D4C41',
                        transition: 'all 0.15s'
                      }}
                    >
                      全部 ({orders.length})
                    </span>
                    {statuses.map(s => {
                      const count = (groupedOrders[s.key] || []).length;
                      return (
                        <span
                          key={s.key}
                          onClick={() => setFilterStatus(s.key)}
                          style={{
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                            background: filterStatus === s.key ? s.color : '#F5F0EB',
                            color: filterStatus === s.key ? 'white' : '#6D4C41',
                            transition: 'all 0.15s'
                          }}
                        >
                          {s.label} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr auto',
                  padding: '12px 20px',
                  background: '#FAF7F4',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6D4C41',
                  marginBottom: 8
                }}>
                  <div>订单编号</div>
                  <div>客户</div>
                  <div>饰品 / 材质</div>
                  <div>截止日期</div>
                  <div>状态</div>
                  <div>更新时间</div>
                  <div style={{ textAlign: 'center' }}>操作</div>
                </div>

                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredOrders.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#A1887F' }}>暂无订单</div>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const sInfo = getStatusInfo(order.status);
                      const nearDeadline = new Date(order.deadline).getTime() - Date.now() < 3 * 86400000 && order.status !== 'completed';
                      return (
                        <div
                          key={order.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr auto',
                            padding: '14px 20px',
                            alignItems: 'center',
                            borderRadius: 10,
                            marginBottom: 4,
                            cursor: 'pointer',
                            animation: `fadeIn 0.3s ease ${idx * 0.03}s both`
                          }}
                          className="card-hover"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#4E342E' }}>
                            {order.order_number}
                          </div>
                          <div style={{ fontSize: 13 }}>
                            <div style={{ color: '#4E342E' }}>{order.customer_name}</div>
                            <div style={{ color: '#A1887F', fontSize: 11 }}>{order.customer_phone}</div>
                          </div>
                          <div style={{ fontSize: 13 }}>
                            <div style={{ color: '#4E342E' }}>
                              {jewelryIconMap[order.jewelry_type]} {jewelryTypeMap[order.jewelry_type]}
                            </div>
                            <div style={{ color: '#A1887F', fontSize: 11 }}>{order.material}</div>
                          </div>
                          <div style={{
                            fontSize: 13,
                            color: nearDeadline ? '#E64A19' : '#6D4C41',
                            fontWeight: nearDeadline ? 600 : 400
                          }}>
                            {order.deadline}
                            {nearDeadline && <span style={{ marginLeft: 4 }}>⚠️</span>}
                          </div>
                          <div>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 12px',
                              borderRadius: 12,
                              fontSize: 11,
                              color: 'white',
                              background: sInfo.color
                            }}>{sInfo.label}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#8D6E63' }}>
                            {formatDate(order.updated_at)}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span className="btn btn-secondary" style={{ padding: '5px 14px', fontSize: 12 }}>
                              处理
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(78,52,46,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 820,
            maxHeight: '90vh', overflow: 'auto', animation: 'fadeIn 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 28px', borderBottom: '1px solid #E8DFD6',
              position: 'sticky', top: 0, background: 'white', zIndex: 1
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#4E342E', fontFamily: 'monospace' }}>
                  {selectedOrder.order_number}
                </div>
                <div style={{ fontSize: 13, color: '#8D6E63', marginTop: 2 }}>
                  {jewelryIconMap[selectedOrder.jewelry_type]} {jewelryTypeMap[selectedOrder.jewelry_type]} · {selectedOrder.material}
                  <span style={{ marginLeft: 12 }}>👤 {selectedOrder.customer_name}</span>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#8D6E63' }}>×</button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {detailLoading && <div style={{ color: '#C0A080', fontSize: 12, marginBottom: 12 }}>同步中...</div>}

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                padding: 16, background: '#FAF7F4', borderRadius: 12, marginBottom: 24
              }}>
                <div><div style={{ fontSize: 11, color: '#8D6E63' }}>尺寸</div><div style={{ fontSize: 13, color: '#4E342E', fontWeight: 500, marginTop: 2 }}>{selectedOrder.size}</div></div>
                <div><div style={{ fontSize: 11, color: '#8D6E63' }}>刻字</div><div style={{ fontSize: 13, color: '#4E342E', fontWeight: 500, marginTop: 2 }}>{selectedOrder.engraving || '无'}</div></div>
                <div><div style={{ fontSize: 11, color: '#8D6E63' }}>截止</div><div style={{ fontSize: 13, color: '#4E342E', fontWeight: 500, marginTop: 2 }}>{selectedOrder.deadline}</div></div>
                <div><div style={{ fontSize: 11, color: '#8D6E63' }}>联系</div><div style={{ fontSize: 13, color: '#4E342E', fontWeight: 500, marginTop: 2 }}>{selectedOrder.customer_phone}</div></div>
              </div>

              <div style={{
                padding: '18px 20px', border: '1px solid #E8DFD6',
                borderRadius: 12, marginBottom: 24
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4E342E', marginBottom: 12 }}>更新订单状态</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label>新状态</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      <option value="">选择下一步状态...</option>
                      {statuses.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 2, minWidth: 240 }}>
                    <label>备注信息</label>
                    <input
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      placeholder="工艺细节、客户要求等..."
                    />
                  </div>
                  <button className="btn" onClick={handleUpdateStatus} disabled={!newStatus || updating}
                    style={{ padding: '10px 20px', opacity: (!newStatus || updating) ? 0.6 : 1 }}>
                    {updating ? '处理中...' : '更新状态'}
                  </button>
                </div>
                {selectedOrder.notes && (
                  <div style={{ marginTop: 14, fontSize: 13, color: '#6D4C41' }}>
                    <span style={{ color: '#8D6E63' }}>当前备注：</span>{selectedOrder.notes}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4E342E', marginBottom: 12 }}>设计稿管理</div>
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
                  padding: 16, border: '1px dashed #D7CCC8', borderRadius: 10, marginBottom: 16
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label>上传设计稿 (JPG/PNG ≤5MB)</label>
                    <input id="design-file-input" type="file" accept="image/jpeg,image/png"
                      onChange={e => setDesignFile(e.target.files?.[0] || null)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label>描述说明</label>
                    <input value={designDesc} onChange={e => setDesignDesc(e.target.value)}
                      placeholder="设计说明..." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10 }}>
                    <input type="checkbox" id="final-check" checked={designFinal}
                      onChange={e => setDesignFinal(e.target.checked)} />
                    <label htmlFor="final-check" style={{ margin: 0, whiteSpace: 'nowrap' }}>设为最终稿</label>
                  </div>
                  <button className="btn" onClick={handleUploadDesign} disabled={!designFile || updating}
                    style={{ padding: '10px 20px', opacity: (!designFile || updating) ? 0.6 : 1 }}>
                    上传
                  </button>
                </div>

                {(selectedOrder.designs?.length || 0) > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {selectedOrder.sketch_image && (
                      <div style={{ position: 'relative' }} className="card-hover">
                        <img src={selectedOrder.sketch_image} alt="客户草图"
                          onClick={() => setShowPreview(selectedOrder.sketch_image!)}
                          style={{
                            width: 200, height: 200, objectFit: 'cover',
                            borderRadius: 8, boxShadow: '0 2px 8px rgba(78,52,46,0.1)',
                            cursor: 'pointer'
                          }} />
                        <span style={{
                          position: 'absolute', top: 8, left: 8,
                          background: '#78909C', color: 'white',
                          padding: '2px 10px', borderRadius: 10, fontSize: 11
                        }}>客户草图</span>
                      </div>
                    )}
                    {selectedOrder.designs!.map(d => (
                      <div key={d.id} style={{ position: 'relative' }} className="card-hover">
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
                            padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500
                          }}>★ 最终定稿</span>
                        )}
                        {d.is_final !== 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetFinal(d.id); }}
                            style={{
                              position: 'absolute', bottom: 8, right: 8,
                              background: 'rgba(255,255,255,0.95)', color: '#6D4C41',
                              border: 'none', padding: '4px 10px', borderRadius: 6,
                              fontSize: 11, cursor: 'pointer'
                            }}
                          >设为定稿</button>
                        )}
                        {d.description && (
                          <div style={{ fontSize: 12, color: '#8D6E63', marginTop: 4, padding: '0 2px' }}>
                            {d.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#A1887F', fontSize: 13, textAlign: 'center', padding: 16 }}>
                    暂无设计稿，请上传
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4E342E', marginBottom: 14 }}>状态时间线</div>
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{
                    position: 'absolute', left: 9, top: 8, bottom: 8,
                    width: 2, background: '#E8DFD6'
                  }} />
                  {(selectedOrder.history || []).map((h, idx) => {
                    const sInfo = getStatusInfo(h.status);
                    const isLast = idx === (selectedOrder.history?.length || 0) - 1;
                    return (
                      <div key={h.id} className="timeline-item"
                        style={{
                          position: 'relative',
                          paddingBottom: isLast ? 0 : 16,
                          animationDelay: `${idx * 0.08}s`
                        }}>
                        <div style={{
                          position: 'absolute', left: -28, top: 2,
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#C0A080',
                          border: '3px solid white',
                          boxShadow: `0 0 0 2px ${isLast ? '#C0A080' : '#E8DFD6'}`
                        }} />
                        <div style={{ paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              padding: '2px 10px', borderRadius: 10,
                              fontSize: 11, color: 'white',
                              background: isLast ? '#C0A080' : sInfo.color
                            }}>{sInfo.label}</span>
                            <span style={{ fontSize: 11, color: '#A1887F' }}>
                              {formatDate(h.created_at)}
                            </span>
                          </div>
                          {h.note && (
                            <div style={{ marginTop: 4, fontSize: 12, color: '#6D4C41' }}>
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
          <img src={showPreview} alt="预览"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
};

export default WorkshopDashboard;
