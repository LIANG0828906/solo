import { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { Inventory, LeatherType, LeatherGrade, Order } from '../types';

const LEATHER_TYPES: LeatherType[] = ['植鞣革', '铬鞣革', '马臀革', '疯马皮'];
const GRADES: LeatherGrade[] = ['A', 'B', 'C'];

interface InventoryForm {
  leatherType: LeatherType;
  color: string;
  colorCode: string;
  thickness: number;
  availableArea: number;
  grade: LeatherGrade;
  source: string;
}

export default function InventoryManager() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterThicknessMin, setFilterThicknessMin] = useState('');
  const [filterThicknessMax, setFilterThicknessMax] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [editArea, setEditArea] = useState('');
  const [formData, setFormData] = useState<InventoryForm>({
    leatherType: '植鞣革',
    color: '',
    colorCode: '',
    thickness: 2.0,
    availableArea: 0,
    grade: 'A',
    source: '',
  });
  const filterTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, ordersRes] = await Promise.all([
          axios.get<Inventory[]>('/api/inventory'),
          axios.get<Order[]>('/api/orders'),
        ]);
        setInventory(invRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (filterType && item.leatherType !== filterType) return false;
      if (filterThicknessMin && item.thickness < parseFloat(filterThicknessMin)) return false;
      if (filterThicknessMax && item.thickness > parseFloat(filterThicknessMax)) return false;
      return true;
    });
  }, [inventory, filterType, filterThicknessMin, filterThicknessMax]);

  const handleFilterChange = (callback: () => void) => {
    if (filterTimerRef.current) {
      clearTimeout(filterTimerRef.current);
    }
    filterTimerRef.current = setTimeout(callback, 150);
  };

  const handleAddInventory = async () => {
    try {
      await axios.post('/api/inventory', {
        ...formData,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: '可用',
      });
      const { data } = await axios.get<Inventory[]>('/api/inventory');
      setInventory(data);
      setShowAddModal(false);
      setFormData({
        leatherType: '植鞣革',
        color: '',
        colorCode: '',
        thickness: 2.0,
        availableArea: 0,
        grade: 'A',
        source: '',
      });
    } catch (error) {
      console.error('Failed to add inventory:', error);
    }
  };

  const handleUpdateInventory = async (id: number) => {
    try {
      await axios.put(`/api/inventory/${id}`, {
        availableArea: parseFloat(editArea),
        status: parseFloat(editArea) <= 0 ? '已用尽' : '可用',
      });
      const { data } = await axios.get<Inventory[]>('/api/inventory');
      setInventory(data);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  };

  const handleMarkExhausted = async (id: number) => {
    try {
      await axios.put(`/api/inventory/${id}`, { status: '已用尽', availableArea: 0 });
      const { data } = await axios.get<Inventory[]>('/api/inventory');
      setInventory(data);
    } catch (error) {
      console.error('Failed to mark exhausted:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>皮革库存管理</h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8B5E3C',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#A06A42';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8B5E3C';
          }}
        >
          + 新增入库
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>
            皮革种类
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              minWidth: '120px',
            }}
          >
            <option value="">全部</option>
            {LEATHER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>
            最小厚度 (mm)
          </label>
          <input
            type="number"
            step="0.5"
            value={filterThicknessMin}
            onChange={(e) => handleFilterChange(() => setFilterThicknessMin(e.target.value))}
            placeholder="最小值"
            style={{
              padding: '8px 12px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              width: '100px',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>
            最大厚度 (mm)
          </label>
          <input
            type="number"
            step="0.5"
            value={filterThicknessMax}
            onChange={(e) => handleFilterChange(() => setFilterThicknessMax(e.target.value))}
            placeholder="最大值"
            style={{
              padding: '8px 12px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              width: '100px',
            }}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F0E8' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  皮革种类
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  颜色
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  厚度
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  可用面积
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  等级
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  皮源
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  购入日期
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  状态
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderTop: '1px solid #F0F0F0',
                    transition: 'background-color 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAFA';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{item.leatherType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {item.color}
                    {item.colorCode && (
                      <span style={{ color: '#999', fontSize: '12px', marginLeft: '4px' }}>
                        ({item.colorCode})
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{item.thickness}mm</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span
                      style={{
                        color: item.availableArea < 5 ? '#E57373' : '#4CAF50',
                        fontWeight: 500,
                      }}
                    >
                      {item.availableArea} dm²
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.grade === 'A' ? '#E8F5E9' : item.grade === 'B' ? '#FFF8E1' : '#FFEBEE',
                        color: item.grade === 'A' ? '#2E7D32' : item.grade === 'B' ? '#F57F17' : '#C62828',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {item.grade}级
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{item.source}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {item.purchaseDate}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.status === '可用' ? '#E8F5E9' : '#FFEBEE',
                        color: item.status === '可用' ? '#2E7D32' : '#C62828',
                        fontSize: '12px',
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditArea(item.availableArea.toString());
                        }}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: '#8B5E3C',
                          border: '1px solid #D4A574',
                          borderRadius: '4px',
                          fontSize: '12px',
                          transition: 'all 0.2s ease-out',
                        }}
                      >
                        编辑
                      </button>
                      {item.status === '可用' && (
                        <button
                          onClick={() => handleMarkExhausted(item.id)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            color: '#E57373',
                            border: '1px solid #E57373',
                            borderRadius: '4px',
                            fontSize: '12px',
                            transition: 'all 0.2s ease-out',
                          }}
                        >
                          用尽
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                    暂无符合条件的库存记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '16px' }}>
          最近订单皮料消耗明细
        </h3>
        {recentOrders.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: '24px' }}>暂无订单记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#FAFAFA',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#8B5E3C', fontWeight: 500 }}>
                    {order.orderNo}
                  </span>
                  <span style={{ color: '#666', fontSize: '13px', marginLeft: '12px' }}>
                    {order.customerName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#666' }}>
                      {item.productName}: {item.leatherType} {item.thickness}mm ·{' '}
                      <span style={{ color: '#E57373' }}>
                        -{item.estimatedArea[0]}-{item.estimatedArea[1]} dm²
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '20px' }}>
              新增皮革入库
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  皮革种类
                </label>
                <select
                  value={formData.leatherType}
                  onChange={(e) => setFormData({ ...formData, leatherType: e.target.value as LeatherType })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  {LEATHER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    颜色
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="如：深棕色"
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
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    色号
                  </label>
                  <input
                    type="text"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    placeholder="如：#8B5E3C"
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    厚度 (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.0"
                    max="4.0"
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: parseFloat(e.target.value) })}
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
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    可用面积 (dm²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.availableArea}
                    onChange={(e) => setFormData({ ...formData, availableArea: parseFloat(e.target.value) })}
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    等级
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as LeatherGrade })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    {GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}级
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    皮源
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="如：意大利进口"
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
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F5F5F5',
                  color: '#666',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease-out',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddInventory}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#8B5E3C',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A06A42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5E3C';
                }}
              >
                确认入库
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '360px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '20px' }}>
              编辑库存
            </h3>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              {editingItem.leatherType} · {editingItem.color} · {editingItem.thickness}mm
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                可用面积 (dm²)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                设为0时自动标记为已用尽
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F5F5F5',
                  color: '#666',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease-out',
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleUpdateInventory(editingItem.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#8B5E3C',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A06A42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5E3C';
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
