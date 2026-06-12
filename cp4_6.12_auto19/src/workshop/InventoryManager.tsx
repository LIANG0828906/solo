import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { inventoryApi, InventoryItem, InventoryData } from '../utils/api';

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
      left: 0, top: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{
        padding: expanded ? '20px 24px' : '20px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: 72
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(192,160,128,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginLeft: expanded ? 0 : 12
        }}><span style={{ fontSize: 22 }}>⚒️</span></div>
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
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: expanded ? '12px 24px' : '12px 0',
              margin: '2px 8px', borderRadius: 8,
              textDecoration: 'none',
              color: active ? 'white' : 'rgba(255,255,255,0.7)',
              background: active ? 'rgba(192,160,128,0.2)' : 'transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              justifyContent: expanded ? 'flex-start' : 'center'
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              {expanded && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div onClick={onToggle} style={{
        padding: expanded ? '16px 24px' : '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
        fontSize: 13, justifyContent: expanded ? 'flex-start' : 'center'
      }}>
        <span style={{ fontSize: 18 }}>{expanded ? '◀' : '▶'}</span>
        {expanded && <span>收起菜单</span>}
      </div>
    </aside>
  );
};

const categoryMap: Record<string, { label: string; icon: string; color: string }> = {
  silver: { label: '银料', icon: '🥈', color: '#E3F2FD' },
  tool: { label: '工具', icon: '🔧', color: '#FFF3E0' },
  consumable: { label: '耗材', icon: '🧻', color: '#F3E5F5' }
};

const InventoryManager: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'silver', quantity: 0, unit: 'g', threshold: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setData(await inventoryApi.list()); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', category: 'silver', quantity: 0, unit: 'g', threshold: 0 });
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setShowAddModal(true); };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, threshold: item.threshold });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('请输入物料名称'); return; }
    try {
      if (editingItem) await inventoryApi.update(editingItem.id, form);
      else await inventoryApi.create(form);
      setShowAddModal(false); resetForm(); await loadData();
    } catch (err: any) { alert(err.message || '操作失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此物料吗？')) return;
    try { await inventoryApi.remove(id); await loadData(); }
    catch (err: any) { alert(err.message || '删除失败'); }
  };

  const handleRestock = (item: InventoryItem, amount: number) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, quantity: item.quantity + amount, unit: item.unit, threshold: item.threshold });
    setShowAddModal(true);
  };

  const filteredItems = (data?.items || []).filter(i => {
    if (activeCategory !== 'all' && i.category !== activeCategory) return false;
    if (search && !i.name.includes(search)) return false;
    return true;
  });

  const byCategory = (data?.items || []).reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
        .pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(78, 52, 46, 0.1); }
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 10px 24px; border: none; border-radius: 6px;
          background-color: #C0A080; color: white; font-size: 14px;
          cursor: pointer; transition: all 0.2s ease; text-decoration: none; font-weight: 500;
        }
        .btn:hover { background-color: #A08060; }
        .btn-secondary {
          background-color: transparent; color: #4E342E; border: 1px solid #D7CCC8;
        }
        .btn-secondary:hover { background-color: #EFEBE9; border-color: #C0A080; }
        input, select {
          width: 100%; padding: 10px 14px; border: 1px solid #D7CCC8;
          border-radius: 6px; font-size: 14px; color: #4E342E;
          background: white; transition: border-color 0.2s; font-family: inherit;
        }
        input:focus, select:focus { outline: none; border-color: #C0A080; box-shadow: 0 0 0 3px rgba(192,160,128,0.15); }
        label { display: block; font-size: 13px; color: #6D4C41; margin-bottom: 6px; font-weight: 500; }
        .form-group { margin-bottom: 18px; }
      `}</style>

      <WorkshopSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />

      <div style={{
        flex: 1, marginLeft: sidebarExpanded ? 256 : 64,
        transition: 'margin-left 0.2s ease', minHeight: '100vh'
      }}>
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, color: '#4E342E', marginBottom: 6 }}>库存管理</h1>
              <p style={{ color: '#8D6E63', fontSize: 14 }}>管理银料、工具和耗材的库存状态</p>
            </div>
            <button className="btn" onClick={openAdd} style={{ padding: '12px 28px' }}>
              <span style={{ marginRight: 8 }}>＋</span>新增物料
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
            {Object.entries(categoryMap).map(([key, info]) => {
              const items = byCategory[key] || [];
              const lowCount = items.filter(i => i.quantity < i.threshold).length;
              const totalQty = items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={key} style={{
                  background: `linear-gradient(135deg, ${info.color} 0%, white 100%)`,
                  borderRadius: 16, padding: 24, border: '1px solid #F0E8E0', position: 'relative'
                }} className="card-hover">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>{info.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, color: '#8D6E63' }}>{info.label}类</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#4E342E' }}>
                        {items.length} <span style={{ fontSize: 13, fontWeight: 400, color: '#A1887F' }}>种物料</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, color: '#6D4C41', paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.5)'
                  }}>
                    <span>总库存: <strong style={{ color: '#4E342E' }}>{Math.floor(totalQty)}</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: lowCount > 0 ? '#E65100' : '#6D4C41', fontWeight: lowCount > 0 ? 600 : 400 }}>
                      {lowCount > 0 && (
                        <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8C00', display: 'inline-block' }} />
                      )}
                      预警: {lowCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(78,52,46,0.06)' }}>
            <div style={{
              padding: '20px 28px', borderBottom: '1px solid #E8DFD6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span onClick={() => setActiveCategory('all')} style={{
                  padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  background: activeCategory === 'all' ? '#4E342E' : '#F5F0EB',
                  color: activeCategory === 'all' ? 'white' : '#6D4C41', transition: 'all 0.15s'
                }}>全部 ({data?.items.length || 0})</span>
                {Object.entries(categoryMap).map(([key, info]) => (
                  <span key={key} onClick={() => setActiveCategory(key)} style={{
                    padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    background: activeCategory === key ? '#C0A080' : '#F5F0EB',
                    color: activeCategory === key ? 'white' : '#6D4C41', transition: 'all 0.15s'
                  }}>{info.icon} {info.label} ({(byCategory[key] || []).length})</span>
                ))}
                {(data?.lowStock.length || 0) > 0 && (
                  <span style={{
                    padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'default',
                    background: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80', fontWeight: 500
                  }}>⚠️ 预警物料 ({data!.lowStock.length})</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索物料名称..." style={{ paddingLeft: 36, minWidth: 220 }} />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#8D6E63' }}>加载中...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#A1887F' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div>暂无符合条件的物料</div>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAF7F4' }}>
                      {['物料名称', '分类', '当前库存', '预警阈值', '库存状态', '操作'].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i < 4 ? (i === 0 || i === 1 ? 'left' : 'right') : 'center',
                          padding: i === 0 ? '14px 28px' : i === 5 ? '14px 28px' : '14px 20px',
                          fontSize: 12, fontWeight: 600, color: '#6D4C41',
                          ...(i === 5 ? { width: 240 } : i === 4 ? { width: 200 } : {})
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const catInfo = categoryMap[item.category] || { label: item.category, icon: '📦', color: '#F5F0EB' };
                      const isLow = item.quantity < item.threshold;
                      const percent = item.threshold > 0 ? Math.min(100, (item.quantity / item.threshold) * 100) : 100;
                      return (
                        <tr key={item.id} style={{ borderTop: '1px solid #F0E8E0', background: idx % 2 === 0 ? 'white' : '#FEFCFA' }}>
                          <td style={{ padding: '16px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: catInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{catInfo.icon}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#4E342E', fontSize: 14 }}>
                                  {item.name}
                                  {isLow && <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#FF8C00', marginLeft: 8 }} />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: 12, background: catInfo.color, color: '#4E342E' }}>{catInfo.label}</span>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: isLow ? '#E65100' : '#4E342E' }}>
                              {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1)}
                              <span style={{ fontSize: 12, fontWeight: 400, color: '#A1887F', marginLeft: 4 }}>{item.unit}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <span style={{ color: '#6D4C41', fontSize: 14 }}>{item.threshold}{item.unit}</span>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                              <div style={{ flex: 1, height: 6, background: '#F0E8E0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${percent}%`, borderRadius: 3,
                                  background: isLow ? 'linear-gradient(90deg, #FF8C00, #FF6F00)' : percent < 50 ? 'linear-gradient(90deg, #FFB74D, #FF8C00)' : 'linear-gradient(90deg, #C0A080, #A08060)',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{ fontSize: 12, minWidth: 36, color: isLow ? '#E65100' : '#8D6E63', fontWeight: isLow ? 600 : 400 }}>{Math.floor(percent)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 28px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {isLow ? (
                                <button className="btn" onClick={() => handleRestock(item, Math.max(item.threshold * 2 - item.quantity, item.threshold * 0.5))} style={{ padding: '6px 14px', fontSize: 12, background: '#FF8C00' }}>补货</button>
                              ) : (
                                <button className="btn btn-secondary" onClick={() => handleRestock(item, item.threshold)} style={{ padding: '6px 14px', fontSize: 12 }}>+补货</button>
                              )}
                              <button className="btn btn-secondary" onClick={() => openEdit(item)} style={{ padding: '6px 14px', fontSize: 12 }}>编辑</button>
                              <button onClick={() => handleDelete(item.id)} style={{
                                padding: '6px 14px', background: 'transparent',
                                border: '1px solid #FFCDD2', color: '#E57373',
                                borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s'
                              }} onMouseOver={e => (e.target as HTMLElement).style.background = '#FFEBEE'}
                                onMouseOut={e => (e.target as HTMLElement).style.background = 'transparent'}>删除</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{
            marginTop: 28, background: 'white', borderRadius: 16,
            padding: '24px 28px', boxShadow: '0 4px 16px rgba(78,52,46,0.06)'
          }}>
            <h3 style={{ fontSize: 16, color: '#4E342E', marginBottom: 14 }}>💡 系统耗用规则说明</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, fontSize: 13, color: '#6D4C41', lineHeight: 1.8 }}>
              <div>
                <strong style={{ color: '#4E342E' }}>银料耗用（按饰品类型）：</strong>
                <div>• 手镯：约 25g 银料 / 件</div>
                <div>• 吊坠：约 12g 银料 / 件</div>
                <div>• 戒指：约 10g 银料 / 件</div>
                <div>• 耳环：约 8g 银料 / 对</div>
              </div>
              <div>
                <strong style={{ color: '#4E342E' }}>耗材耗用（每件订单）：</strong>
                <div>• 砂纸：约 2 张 / 订单</div>
                <div style={{ marginTop: 8, color: '#8D6E63' }}>
                  当订单状态更新为「已完成」时，系统会根据以上规则自动扣减库存。
                  请定期检查库存预警，确保生产顺利进行。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(78,52,46,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease'
        }} onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, animation: 'fadeIn 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #E8DFD6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, color: '#4E342E', fontWeight: 600 }}>{editingItem ? '编辑物料' : '新增物料'}</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8D6E63' }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div className="form-group">
                <label>物料名称 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：银板、砂纸 P2000" />
              </div>
              <div className="form-group">
                <label>物料分类</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, unit: e.target.value === 'silver' ? 'g' : e.target.value === 'tool' ? '把' : form.unit }))}>
                  <option value="silver">🥈 银料</option>
                  <option value="tool">🔧 工具</option>
                  <option value="consumable">🧻 耗材</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>库存数量</label>
                  <input type="number" step="0.01" min="0" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label>计量单位</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="g / 张 / 把 / 盒" />
                </div>
              </div>
              <div className="form-group">
                <label>预警阈值（低于此值触发提醒）</label>
                <input type="number" step="0.01" min="0" value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ flex: 1 }}>取消</button>
                <button className="btn" onClick={handleSubmit} style={{ flex: 1 }}>{editingItem ? '保存修改' : '确认新增'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
