import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useFacilityStore } from '../facility/facilityStore';
import FacilityGantt from './components/FacilityGantt';
import type { Facility, Booking } from '../facility/types';
import { formatDateTime } from '../facility/facilityService';

type TabType = 'approvals' | 'facilities' | 'stats' | 'timeline';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('approvals');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSuggestion, setRejectSuggestion] = useState('');
  const [deletingFacilityId, setDeletingFacilityId] = useState<string | null>(null);
  const [view, setView] = useState<'slideInLeft' | 'slideInRight'>('slideInLeft');

  const {
    facilities = [],
    bookings = [],
    currentUser,
    addFacility,
    updateFacility,
    deleteFacility,
    approveBooking,
    rejectBooking,
    getPendingBookings,
    getFacilityBookings,
    getFacilityStats,
    getDailyStats,
    showNotification,
  } = useFacilityStore();

  const pendingBookings = getPendingBookings();
  const facilityStats = getFacilityStats(30);
  const dailyStats = getDailyStats(30);
  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || null;

  const handleTabChange = (tab: TabType) => {
    setView(tab > activeTab ? 'slideInRight' : 'slideInLeft');
    setActiveTab(tab);
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setShowFacilityModal(true);
  };

  const handleEditFacility = (f: Facility) => {
    setEditingFacility(f);
    setShowFacilityModal(true);
  };

  const handleSaveFacility = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      maxCapacity: parseInt((form.elements.namedItem('maxCapacity') as HTMLInputElement).value),
      openHour: parseInt((form.elements.namedItem('openHour') as HTMLInputElement).value),
      closeHour: parseInt((form.elements.namedItem('closeHour') as HTMLInputElement).value),
      feePerHour: parseInt((form.elements.namedItem('feePerHour') as HTMLInputElement).value),
      icon: (form.elements.namedItem('icon') as HTMLInputElement).value || '📅',
    };

    if (editingFacility) {
      await updateFacility(editingFacility.id, data);
      showNotification('success', '设施信息已更新');
    } else {
      await addFacility(data);
      showNotification('success', '设施已添加');
    }
    setShowFacilityModal(false);
    setEditingFacility(null);
  };

  const handleDeleteFacility = (id: string) => {
    setDeletingFacilityId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingFacilityId) {
      await deleteFacility(deletingFacilityId);
      showNotification('success', '设施已删除');
      setDeletingFacilityId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingFacilityId(null);
  };

  const handleApprove = async (id: string) => {
    await approveBooking(id);
    showNotification('success', '预约已批准');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingBookingId || !rejectReason.trim()) return;
    await rejectBooking(rejectingBookingId, rejectReason, rejectSuggestion || undefined);
    showNotification('success', '已驳回预约');
    setRejectingBookingId(null);
    setRejectReason('');
    setRejectSuggestion('');
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'approvals', label: '预约审批', icon: '📋' },
    { key: 'facilities', label: '设施管理', icon: '🏢' },
    { key: 'timeline', label: '时间线', icon: '📅' },
    { key: 'stats', label: '统计分析', icon: '📊' },
  ];

  const getStatusBadge = (status: Booking['status']) => {
    const labels = { pending: '待审核', confirmed: '已确认', rejected: '已驳回' };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🏘️</span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600 }}>物业管理后台</h1>
              <p className="text-muted">{currentUser?.name}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                background: activeTab === t.key ? 'var(--primary)' : 'transparent',
                color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
                fontWeight: activeTab === t.key ? 600 : 400,
                fontSize: '14px',
                transition: 'all var(--transition)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: '6px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ animation: `${view} 0.3s ease` }}>
        {activeTab === 'approvals' && (
          <div>
            <h2 className="section-title">待审批预约 ({pendingBookings.length})</h2>
            {pendingBookings.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <p className="text-muted">暂无待审批的预约</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {pendingBookings.map((b) => {
                  const facility = facilities.find((f) => f.id === b.facilityId);
                  return (
                    <div key={b.id} className="card" style={{ padding: '20px' }}>
                      <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{facility?.icon} {facility?.name}</h3>
                        {getStatusBadge(b.status)}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <div>👤 {b.userName} {b.userRoom ? `(${b.userRoom})` : ''}</div>
                        <div>📅 {formatDateTime(parseISO(b.startTime))} - {format(parseISO(b.endTime), 'HH:mm')}</div>
                        <div>👥 {b.peopleCount} 人</div>
                        <div>📝 {b.purpose}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)}>
                          ✓ 批准
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setRejectingBookingId(b.id)}
                        >
                          ✗ 驳回
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'facilities' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>设施列表</h2>
              <button className="btn btn-primary" onClick={handleAddFacility}>
                + 添加设施
              </button>
            </div>
            <div className="grid grid-3">
              {facilities.map((f) => (
                <div key={f.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{f.name}</h3>
                  <p className="text-muted" style={{ marginBottom: '12px', minHeight: '40px' }}>{f.description}</p>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    容量：{f.maxCapacity} 人
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    开放时间：{f.openHour}:00 - {f.closeHour}:00
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    费用：¥{f.feePerHour}/小时
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditFacility(f)}>
                      编辑
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFacility(f.id)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h2 className="section-title">设施时间线</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${selectedFacilityId ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => setSelectedFacilityId(null)}
              >
                全部
              </button>
              {facilities.map((f) => (
                <button
                  key={f.id}
                  className={`btn btn-sm ${selectedFacilityId === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedFacilityId(f.id)}
                >
                  {f.icon} {f.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(selectedFacility ? [selectedFacility] : facilities).map((f) => (
                <div key={f.id} className="card" style={{ overflow: 'hidden' }}>
                  <FacilityGantt
                    facility={f}
                    bookings={getFacilityBookings(f.id)}
                    days={14}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="section-title">过去30天数据统计</h2>
            <div className="grid grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>各设施预约次数</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="facilityName" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalBookings" name="预约次数" fill="#4A6FA5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>设施使用率 (%)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="facilityName" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="utilizationRate" name="使用率%" fill="#48BB78" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>每日预约趋势</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="预约数"
                        stroke="#4A6FA5"
                        strokeWidth={2}
                        dot={{ fill: '#4A6FA5', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFacilityModal && (
        <div style={modalOverlayStyle} onClick={() => setShowFacilityModal(false)}>
          <div className="card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingFacility ? '编辑设施' : '添加设施'}
            </h3>
            <form onSubmit={handleSaveFacility}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">设施名称</label>
                  <input
                    className="input"
                    name="name"
                    defaultValue={editingFacility?.name}
                    required
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">描述</label>
                  <textarea
                    className="textarea"
                    name="description"
                    defaultValue={editingFacility?.description}
                    required
                  />
                </div>
                <div>
                  <label className="label">图标 (Emoji)</label>
                  <input className="input" name="icon" defaultValue={editingFacility?.icon || '📅'} />
                </div>
                <div>
                  <label className="label">最大容量</label>
                  <input
                    className="input"
                    name="maxCapacity"
                    type="number"
                    min="1"
                    defaultValue={editingFacility?.maxCapacity || 10}
                    required
                  />
                </div>
                <div>
                  <label className="label">开放时间 (时)</label>
                  <input
                    className="input"
                    name="openHour"
                    type="number"
                    min="0"
                    max="23"
                    defaultValue={editingFacility?.openHour || 8}
                    required
                  />
                </div>
                <div>
                  <label className="label">关闭时间 (时)</label>
                  <input
                    className="input"
                    name="closeHour"
                    type="number"
                    min="1"
                    max="24"
                    defaultValue={editingFacility?.closeHour || 22}
                    required
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">每小时费用 (¥)</label>
                  <input
                    className="input"
                    name="feePerHour"
                    type="number"
                    min="0"
                    defaultValue={editingFacility?.feePerHour || 0}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowFacilityModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingFacilityId && (
        <div style={modalOverlayStyle} onClick={handleCancelDelete}>
          <div className="card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              确认删除
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              ⚠️ 确定要删除此设施吗？该设施的所有预约记录也将被删除，此操作不可撤销。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={handleCancelDelete}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingBookingId && (
        <div style={modalOverlayStyle} onClick={() => setRejectingBookingId(null)}>
          <div className="card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              驳回预约
            </h3>
            <div>
              <label className="label">驳回理由 *</label>
              <textarea
                className="textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请说明驳回原因..."
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label className="label">修改建议</label>
              <textarea
                className="textarea"
                value={rejectSuggestion}
                onChange={(e) => setRejectSuggestion(e.target.value)}
                placeholder="可给出可选时间段或其他建议..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setRejectingBookingId(null)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '20px',
  animation: 'fadeIn 0.3s ease',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '500px',
  padding: '24px',
  maxHeight: '90vh',
  overflowY: 'auto',
};
