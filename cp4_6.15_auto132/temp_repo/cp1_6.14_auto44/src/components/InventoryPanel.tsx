import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { itemApi, locationApi } from '../api';
import { ToastContext } from '../App';
import type { InventoryItem, StorageLocation } from '../types';

interface InventoryPanelProps {
  family: { id: string; name: string; location: string };
}

const PAGE_SIZE = 20;

const InventoryPanel: React.FC<InventoryPanelProps> = ({ family }) => {
  const showToast = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationColor, setNewLocationColor] = useState('#4caf50');

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: '个',
    purchaseDate: moment().format('YYYY-MM-DD'),
    expiryDate: '',
    storageLocationId: '',
    minThreshold: '1',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const searchQuery = searchParams.get('search') || '';
  const filterLocation = searchParams.get('locationId') || '';
  const filterStatus = searchParams.get('status') || '';

  const loadData = useCallback(async () => {
    try {
      const [itemsData, locationsData] = await Promise.all([
        itemApi.getAll(family.id),
        locationApi.getAll(family.id),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch {
      showToast('加载数据失败', 'error');
    }
  }, [family.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLocation, filterStatus]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (filterLocation) {
      result = result.filter((i) => i.storageLocationId === filterLocation);
    }
    const now = moment();
    if (filterStatus === 'expired') {
      result = result.filter((i) => moment(i.expiryDate).isBefore(now, 'day'));
    } else if (filterStatus === 'expiring') {
      result = result.filter(
        (i) => moment(i.expiryDate).diff(now, 'days') >= 0 && moment(i.expiryDate).diff(now, 'days') <= 3
      );
    } else if (filterStatus === 'lowstock') {
      result = result.filter((i) => i.quantity < i.minThreshold);
    }
    return result;
  }, [items, searchQuery, filterLocation, filterStatus]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    locations.forEach((loc) => {
      const locItems = filteredItems
        .filter((i) => i.storageLocationId === loc.id)
        .sort((a, b) => {
          const daysA = moment(a.expiryDate).diff(moment(), 'days');
          const daysB = moment(b.expiryDate).diff(moment(), 'days');
          return daysA - daysB;
        });
      if (locItems.length > 0) {
        groups[loc.id] = locItems;
      }
    });
    const ungrouped = filteredItems.filter(
      (i) => !locations.some((l) => l.id === i.storageLocationId)
    );
    if (ungrouped.length > 0) {
      groups['ungrouped'] = ungrouped.sort((a, b) => {
        const daysA = moment(a.expiryDate).diff(moment(), 'days');
        const daysB = moment(b.expiryDate).diff(moment(), 'days');
        return daysA - daysB;
      });
    }
    return groups;
  }, [filteredItems, locations]);

  const allGroupedItems = useMemo(() => {
    const all: InventoryItem[] = [];
    Object.values(groupedItems).forEach((groupItems) => {
      all.push(...groupItems);
    });
    return all;
  }, [groupedItems]);

  const totalPages = Math.max(1, Math.ceil(allGroupedItems.length / PAGE_SIZE));
  const paginatedItems = allGroupedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedSet = new Set(paginatedItems.map((i) => i.id));

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = '请输入物品名称';
    const qty = parseInt(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      errors.quantity = '数量必须为正整数';
    }
    if (!form.unit.trim()) errors.unit = '请输入单位';
    if (!form.purchaseDate) errors.purchaseDate = '请选择购买日期';
    if (!form.expiryDate) errors.expiryDate = '请选择保质期';
    if (form.expiryDate && form.purchaseDate && form.expiryDate < form.purchaseDate) {
      errors.expiryDate = '保质期不能早于购买日期';
    }
    if (!form.storageLocationId) errors.storageLocationId = '请选择存放位置';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;
    try {
      await itemApi.create(family.id, {
        name: form.name.trim(),
        quantity: parseInt(form.quantity),
        unit: form.unit.trim(),
        purchaseDate: form.purchaseDate,
        expiryDate: form.expiryDate,
        storageLocationId: form.storageLocationId,
        familyId: family.id,
        minThreshold: parseInt(form.minThreshold) || 1,
      });
      showToast('物品添加成功');
      setForm({ name: '', quantity: '', unit: '个', purchaseDate: moment().format('YYYY-MM-DD'), expiryDate: '', storageLocationId: '', minThreshold: '1' });
      setShowAddForm(false);
      loadData();
    } catch {
      showToast('添加失败', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await itemApi.delete(family.id, id);
      showToast('物品已删除');
      loadData();
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      await locationApi.create(family.id, { name: newLocationName.trim(), color: newLocationColor });
      showToast('位置添加成功');
      setNewLocationName('');
      setNewLocationColor('#4caf50');
      setShowAddLocation(false);
      loadData();
    } catch {
      showToast('添加失败', 'error');
    }
  };

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLocationName = (id: string) => {
    if (id === 'ungrouped') return '未分组';
    return locations.find((l) => l.id === id)?.name || '未知位置';
  };

  const getLocationColor = (id: string) => {
    if (id === 'ungrouped') return '#999';
    return locations.find((l) => l.id === id)?.color || '#4caf50';
  };

  const getDaysRemaining = (expiryDate: string) => {
    return moment(expiryDate).diff(moment(), 'days');
  };

  const renderExpiryBadge = (item: InventoryItem) => {
    const days = getDaysRemaining(item.expiryDate);
    if (days < 0) {
      return <span className="item-expiry-badge">❗</span>;
    }
    if (days <= 3) {
      return <span className="item-expiry-badge">❗</span>;
    }
    return null;
  };

  const renderLowStockBadge = (item: InventoryItem) => {
    if (item.quantity < item.minThreshold) {
      return <span className="item-lowstock-badge">⚠️</span>;
    }
    return null;
  };

  return (
    <div>
      <h2 className="section-title">📦 库存管理</h2>

      <div className="toolbar">
        <input
          className="search-box"
          placeholder="🔍 搜索物品名称..."
          value={searchQuery}
          onChange={(e) => updateSearchParam('search', e.target.value)}
        />
        <select
          className="filter-select"
          value={filterLocation}
          onChange={(e) => updateSearchParam('locationId', e.target.value)}
        >
          <option value="">所有位置</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => updateSearchParam('status', e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="expiring">即将过期</option>
          <option value="lowstock">低库存</option>
          <option value="expired">已过期</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowAddLocation(!showAddLocation)}>
          + 位置
        </button>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          + 物品
        </button>
      </div>

      {showAddLocation && (
        <div className="add-location-section">
          <h3>添加存储位置</h3>
          <div className="add-location-form">
            <input
              type="text"
              placeholder="位置名称（如冰箱、橱柜）"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
            />
            <input
              type="color"
              value={newLocationColor}
              onChange={(e) => setNewLocationColor(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleAddLocation}>确认添加</button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="add-item-form">
          <h3>添加物品</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>物品名称</label>
              <input
                className={formErrors.name ? 'error' : ''}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：牛奶"
              />
              {formErrors.name && <span className="form-error">{formErrors.name}</span>}
            </div>
            <div className="form-field">
              <label>数量</label>
              <input
                type="number"
                className={formErrors.quantity ? 'error' : ''}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="正整数"
                min="1"
                step="1"
              />
              {formErrors.quantity && <span className="form-error">{formErrors.quantity}</span>}
            </div>
            <div className="form-field">
              <label>单位</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="个">个</option>
                <option value="瓶">瓶</option>
                <option value="盒">盒</option>
                <option value="袋">袋</option>
                <option value="斤">斤</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
              </select>
            </div>
            <div className="form-field">
              <label>购买日期</label>
              <input
                type="date"
                className={formErrors.purchaseDate ? 'error' : ''}
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
              {formErrors.purchaseDate && <span className="form-error">{formErrors.purchaseDate}</span>}
            </div>
            <div className="form-field">
              <label>保质期至</label>
              <input
                type="date"
                className={formErrors.expiryDate ? 'error' : ''}
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
              {formErrors.expiryDate && <span className="form-error">{formErrors.expiryDate}</span>}
            </div>
            <div className="form-field">
              <label>存放位置</label>
              <select
                className={formErrors.storageLocationId ? 'error' : ''}
                value={form.storageLocationId}
                onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })}
              >
                <option value="">请选择</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {formErrors.storageLocationId && <span className="form-error">{formErrors.storageLocationId}</span>}
            </div>
            <div className="form-field">
              <label>最低库存阈值</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.minThreshold}
                onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
                placeholder="如：2"
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddItem}>确认添加</button>
        </div>
      )}

      {Object.keys(groupedItems).length === 0 ? (
        <div className="empty-list">
          {searchQuery || filterLocation || filterStatus
            ? '没有找到匹配的物品'
            : '暂无物品，请先添加存储位置和物品'}
        </div>
      ) : (
        Object.entries(groupedItems).map(([locId, locItems]) => {
          const visibleItems = locItems.filter((i) => paginatedSet.has(i.id));
          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsedGroups.has(locId);
          return (
            <div key={locId} className={`location-group ${isCollapsed ? 'collapsed' : ''}`}>
              <button className="accordion-toggle" onClick={() => toggleGroup(locId)}>
                <span className={`arrow ${isCollapsed ? '' : 'open'}`}>▶</span>
                <span
                  className="location-dot"
                  style={{ backgroundColor: getLocationColor(locId), display: 'inline-block', marginRight: 8 }}
                />
                {getLocationName(locId)} ({locItems.length})
              </button>
              <div className="location-header">
                <span
                  className="location-dot"
                  style={{ backgroundColor: getLocationColor(locId) }}
                />
                <span className="location-name">{getLocationName(locId)}</span>
                <span style={{ color: '#999', fontSize: '14px' }}>({locItems.length}件)</span>
              </div>
              <div className="items-grid">
                {visibleItems.map((item) => {
                  const days = getDaysRemaining(item.expiryDate);
                  const isExpired = days < 0;
                  const isExpiring = days >= 0 && days <= 3;
                  const isLowStock = item.quantity < item.minThreshold;
                  let cardClass = 'item-card';
                  if (isExpired) cardClass += ' expired';
                  else if (isExpiring) cardClass += ' expiring';

                  return (
                    <div key={item.id} className={cardClass}>
                      {renderExpiryBadge(item)}
                      {renderLowStockBadge(item)}
                      <div className="item-name">{item.name}</div>
                      <div className="item-info">
                        <span className={`item-quantity ${isLowStock ? 'low' : ''}`}>
                          {item.quantity} {item.unit}
                        </span>
                        <span>阈值: {item.minThreshold} {item.unit}</span>
                        <span className={`item-expiry ${days <= 3 ? 'urgent' : ''}`}>
                          {isExpired
                            ? `已过期 ${Math.abs(days)} 天`
                            : days === 0
                            ? '今天过期'
                            : `还剩 ${days} 天`}
                        </span>
                        <span>购买: {moment(item.purchaseDate).format('MM-DD')}</span>
                      </div>
                      <div className="item-actions">
                        <button
                          className="btn btn-outline"
                          onClick={async () => {
                            const newQty = item.quantity + 1;
                            try {
                              await itemApi.update(family.id, item.id, { quantity: newQty });
                              showToast('数量 +1');
                              loadData();
                            } catch {
                              showToast('操作失败', 'error');
                            }
                          }}
                        >
                          +1
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={async () => {
                            if (item.quantity <= 1) {
                              handleDeleteItem(item.id);
                            } else {
                              try {
                                await itemApi.update(family.id, item.id, { quantity: item.quantity - 1 });
                                showToast('数量 -1');
                                loadData();
                              } catch {
                                showToast('操作失败', 'error');
                              }
                            }
                          }}
                        >
                          -1
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {allGroupedItems.length > PAGE_SIZE && (
        <div className="pagination">
          <button
            className="btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] < page - 1 && <span style={{ color: '#999' }}>...</span>}
                <button
                  className={`btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
          <button
            className="btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            下一页
          </button>
          <span className="pagination-info">
            共 {allGroupedItems.length} 项，第 {currentPage}/{totalPages} 页
          </span>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;
