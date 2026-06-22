import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { orderAPI } from '@/services/orderAPI';
import { inspectionAPI, userAPI, deviceAPI } from '@/services/inspectionAPI';
import type { Order, User, Device, Inspection, OrderStatus } from '@/types';

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const statusLabel: Record<OrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
};

const DashboardPage: React.FC = () => {
  const { currentUser, showNotification, setFocusedOrder } = useApp();

  const [orders, setOrders] = useState<Order[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeSelections, setAssigneeSelections] = useState<
    Record<string, string>
  >({});

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDeviceSearch, setFilterDeviceSearch] = useState('');
  const [deviceSuggestions, setDeviceSuggestions] = useState<Device[]>([]);
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
  const searchTimer = React.useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const inspParams: any = {};
      if (filterStartDate) inspParams.startDate = filterStartDate;
      if (filterEndDate) inspParams.endDate = filterEndDate;
      if (filterDeviceSearch.trim()) inspParams.search = filterDeviceSearch.trim();

      const [oList, iList, uList, dList] = await Promise.all([
        orderAPI.list(),
        inspectionAPI.list(inspParams),
        userAPI.list(),
        deviceAPI.list(),
      ]);
      setOrders(oList);
      setInspections(iList);
      setUsers(uList.filter((u: User) => u.role === 'engineer'));
      setDevices(dList);
    } catch (e) {
      showNotification('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterDeviceSearch, showNotification]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (filterDeviceSearch.trim()) {
        const data = await deviceAPI.list(filterDeviceSearch);
        setDeviceSuggestions(data);
        setShowDeviceSuggestions(true);
      } else {
        setDeviceSuggestions([]);
        setShowDeviceSuggestions(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [filterDeviceSearch]);

  const summary = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayCount = inspections.filter((i) =>
      i.createdAt.startsWith(todayStr)
    ).length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const total = inspections.length;
    const abnormal = inspections.filter(
      (i) => i.abnormalItems.length > 0
    ).length;
    const rate = total > 0 ? ((abnormal / total) * 100).toFixed(1) : '0.0';

    return { todayCount, pendingCount, rate, total, abnormal };
  }, [orders, inspections]);

  const handleAssign = async (orderId: string) => {
    const assigneeId = assigneeSelections[orderId];
    if (!assigneeId) {
      showNotification('请先选择负责人', 'error');
      return;
    }
    const assignee = users.find((u) => u.id === assigneeId);
    if (!assignee) return;

    try {
      const updated = await orderAPI.update(orderId, {
        assigneeId: assignee.id,
        assigneeName: assignee.name,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      setFocusedOrder(updated);
      showNotification(`已分配给 ${assignee.name}，状态变为处理中`);
    } catch (e) {
      showNotification('分配失败', 'error');
    }
  };

  const handleMarkProcessing = async (orderId: string) => {
    try {
      const updated = await orderAPI.update(orderId, { status: 'processing' });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      setFocusedOrder(updated);
      showNotification('工单状态已更新为处理中');
    } catch (e) {
      showNotification('更新失败', 'error');
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      const updated = await orderAPI.update(orderId, { status: 'completed' });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      setFocusedOrder(updated);
      showNotification('工单已完成！');
    } catch (e) {
      showNotification('更新失败', 'error');
    }
  };

  const handleExport = () => {
    const deviceMap: Record<
      string,
      { deviceName: string; count: number; abnormal: number; orders: number }
    > = {};

    for (const insp of inspections) {
      if (!deviceMap[insp.deviceId]) {
        deviceMap[insp.deviceId] = {
          deviceName: insp.deviceName,
          count: 0,
          abnormal: 0,
          orders: 0,
        };
      }
      deviceMap[insp.deviceId].count += 1;
      if (insp.abnormalItems.length > 0) {
        deviceMap[insp.deviceId].abnormal += 1;
      }
    }

    for (const order of orders) {
      if (deviceMap[order.deviceId]) {
        deviceMap[order.deviceId].orders += 1;
      } else {
        deviceMap[order.deviceId] = {
          deviceName: order.deviceName,
          count: 0,
          abnormal: 0,
          orders: 1,
        };
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.name,
      filters: {
        startDate: filterStartDate || null,
        endDate: filterEndDate || null,
        deviceKeyword: filterDeviceSearch || null,
      },
      summary: {
        totalInspections: summary.total,
        abnormalInspections: summary.abnormal,
        abnormalRate: summary.rate + '%',
        totalOrders: orders.length,
        pendingOrders: summary.pendingCount,
      },
      details: Object.keys(deviceMap).map((id) => ({
        deviceId: id,
        ...deviceMap[id],
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-report-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('报告导出成功！');
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterDeviceSearch.trim()) {
      const kw = filterDeviceSearch.toLowerCase();
      result = result.filter((o) =>
        o.deviceName.toLowerCase().includes(kw)
      );
    }
    if (filterStartDate) {
      result = result.filter(
        (o) => new Date(o.createdAt) >= new Date(filterStartDate)
      );
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= end);
    }
    return result;
  }, [orders, filterDeviceSearch, filterStartDate, filterEndDate]);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="page-title" style={{ margin: 0 }}>
          📊 工单管理看板
        </h1>
        <button className="export-btn" onClick={handleExport}>
          📤 导出报告
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card purple">
          <div className="summary-card-value">{summary.todayCount}</div>
          <div className="summary-card-label">今日巡检总数</div>
        </div>
        <div className="summary-card orange">
          <div className="summary-card-value">{summary.pendingCount}</div>
          <div className="summary-card-label">待处理工单数</div>
        </div>
        <div className="summary-card red">
          <div className="summary-card-value">{summary.rate}%</div>
          <div className="summary-card-label">异常率</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-dropdown">
          <input
            type="search"
            placeholder="🔍 按设备名称筛选..."
            value={filterDeviceSearch}
            onChange={(e) => setFilterDeviceSearch(e.target.value)}
            onFocus={() =>
              deviceSuggestions.length > 0 && setShowDeviceSuggestions(true)
            }
            onBlur={() =>
              setTimeout(() => setShowDeviceSuggestions(false), 200)
            }
          />
          {showDeviceSuggestions && deviceSuggestions.length > 0 && (
            <div className="search-suggestions">
              {deviceSuggestions.map((d) => (
                <div
                  key={d.id}
                  className="search-suggestion-item"
                  onMouseDown={() => {
                    setFilterDeviceSearch(d.name);
                    setShowDeviceSuggestions(false);
                  }}
                >
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="date-range">
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
          <span style={{ color: '#94A3B8' }}>至</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        {(filterStartDate || filterEndDate || filterDeviceSearch) && (
          <button
            type="button"
            onClick={() => {
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterDeviceSearch('');
            }}
            style={{
              flex: '0 0 auto',
              minWidth: 'auto',
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            清除筛选
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
          工单列表
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: '#94A3B8',
              marginLeft: 8,
            }}
          >
            共 {filteredOrders.length} 条
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div>加载中...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div>暂无工单数据</div>
        </div>
      ) : (
        <div className="order-table">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>工单编号</th>
                  <th>关联设备</th>
                  <th>创建时间</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>描述</th>
                  <th style={{ minWidth: 260 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>
                      {order.id}
                    </td>
                    <td>{order.deviceName}</td>
                    <td style={{ fontSize: 13, color: '#64748B' }}>
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td>
                      <span className={`status-tag ${order.status}`}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td>
                      {order.assigneeName || (
                        <span style={{ color: '#94A3B8' }}>未分配</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 13 }}>
                      {order.description || '-'}
                    </td>
                    <td>
                      <div className="table-actions">
                        {order.status === 'pending' && (
                          <>
                            <select
                              className="assignee-select"
                              value={assigneeSelections[order.id] || ''}
                              onChange={(e) =>
                                setAssigneeSelections((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">选择负责人...</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn-action"
                              onClick={() => handleAssign(order.id)}
                            >
                              分配
                            </button>
                          </>
                        )}
                        {order.status === 'processing' && (
                          <button
                            className="btn-action"
                            style={{ background: '#10B981' }}
                            onClick={() => handleComplete(order.id)}
                          >
                            完成
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <span
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                              padding: '4px 8px',
                              background: '#F1F5F9',
                              borderRadius: 6,
                            }}
                          >
                            完成于
                            {order.completedAt
                              ? ' ' + formatDateTime(order.completedAt)
                              : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
