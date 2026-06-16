import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  format,
  parseISO,
  differenceInMinutes,
  addMinutes,
} from 'date-fns';
import { useFacilityStore } from '../facility/facilityStore';
import {
  checkConflict,
  findFreeSlots,
  validateBookingTime,
  formatDateTime,
} from '../facility/facilityService';
import FacilityGantt from './components/FacilityGantt';
import type { Facility, TimeSlot } from '../facility/types';

export default function UserFacilityView() {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [shakeBookingForm, setShakeBookingForm] = useState(false);

  const {
    facilities,
    bookings,
    currentUser,
    addBooking,
    getFacilityBookings,
    showNotification,
  } = useFacilityStore();

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId) || null,
    [facilities, selectedFacilityId]
  );

  const facilityBookings = useMemo(
    () => (selectedFacilityId ? getFacilityBookings(selectedFacilityId) : []),
    [selectedFacilityId, bookings, getFacilityBookings]
  );

  const startDateTime = useMemo(() => {
    if (!startDate || !startTime) return null;
    return new Date(`${startDate}T${startTime}:00`);
  }, [startDate, startTime]);

  const endDateTime = useMemo(() => {
    if (!endDate || !endTime) return null;
    return new Date(`${endDate}T${endTime}:00`);
  }, [endDate, endTime]);

  const conflictResult = useMemo(() => {
    if (!selectedFacility || !startDateTime || !endDateTime) return null;
    return checkConflict(bookings, selectedFacility.id, startDateTime, endDateTime);
  }, [selectedFacility, startDateTime, endDateTime, bookings]);

  const validationResult = useMemo(() => {
    if (!selectedFacility || !startDateTime || !endDateTime) return null;
    return validateBookingTime(selectedFacility, startDateTime, endDateTime);
  }, [selectedFacility, startDateTime, endDateTime]);

  const freeSlots = useMemo(() => {
    if (!selectedFacility || !startDateTime) return [];
    const duration = endDateTime ? differenceInMinutes(endDateTime, startDateTime) : 60;
    if (duration <= 0) return [];
    return findFreeSlots(bookings, selectedFacility, startDateTime, duration, 3);
  }, [selectedFacility, startDateTime, endDateTime, bookings]);

  const handleSlotClick = (start: Date, end: Date) => {
    setSelectedFacilityId(selectedFacility?.id || facilities[0]?.id || null);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setStartTime(format(start, 'HH:mm'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    setEndTime(format(end, 'HH:mm'));
    setShowBookingForm(true);
  };

  const handleSelectFacility = (f: Facility) => {
    setSelectedFacilityId(f.id);
    resetForm();
  };

  const resetForm = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const nextHour = addMinutes(now, 60);
    const twoHours = addMinutes(nextHour, 60);

    setStartDate(format(now, 'yyyy-MM-dd'));
    setStartTime(format(nextHour, 'HH:mm'));
    setEndDate(format(twoHours, 'yyyy-MM-dd'));
    setEndTime(format(twoHours, 'HH:mm'));
    setPurpose('');
    setPeopleCount(1);
  };

  useEffect(() => {
    if (showBookingForm && !startDate) {
      resetForm();
    }
  }, [showBookingForm]);

  const handleFreeSlotClick = (slot: TimeSlot) => {
    setStartDate(format(slot.start, 'yyyy-MM-dd'));
    setStartTime(format(slot.start, 'HH:mm'));
    setEndDate(format(slot.end, 'yyyy-MM-dd'));
    setEndTime(format(slot.end, 'HH:mm'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !currentUser || !startDateTime || !endDateTime) return;

    if (validationResult && !validationResult.valid) {
      setShakeBookingForm(true);
      setTimeout(() => setShakeBookingForm(false), 500);
      showNotification('error', validationResult.error || '预约时间无效');
      return;
    }

    if (conflictResult?.hasConflict) {
      setShakeBookingForm(true);
      setTimeout(() => setShakeBookingForm(false), 500);
      showNotification('error', '该时段已被预约，请选择其他时间');
      return;
    }

    if (!purpose.trim()) {
      showNotification('error', '请填写用途');
      return;
    }

    if (peopleCount > selectedFacility.maxCapacity) {
      showNotification('error', `人数超过该设施最大容量 ${selectedFacility.maxCapacity} 人`);
      return;
    }

    await addBooking({
      facilityId: selectedFacility.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRoom: currentUser.roomNumber,
      purpose: purpose.trim(),
      peopleCount,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });

    showNotification('success', '预约申请已提交，请等待审批');
    setShowBookingForm(false);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = { pending: '待审核', confirmed: '已确认', rejected: '已驳回' };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🏘️</span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600 }}>社区设施预约</h1>
              <p className="text-muted">欢迎，{currentUser?.name} {currentUser?.roomNumber ? `(${currentUser.roomNumber})` : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link to="/profile" className="btn btn-ghost">
              📋 我的预约
            </Link>
            <Link to="/admin" className="btn btn-ghost">
              🔧 管理后台
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <h2 className="section-title">选择设施</h2>
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          {facilities.map((f) => (
            <div
              key={f.id}
              className="card"
              onClick={() => handleSelectFacility(f)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: selectedFacilityId === f.id ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '36px' }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{f.name}</h3>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    {f.openHour}:00 - {f.closeHour}:00
                  </p>
                </div>
              </div>
              <p className="text-muted" style={{ marginBottom: '12px', fontSize: '13px' }}>{f.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>👥 {f.maxCapacity}人</span>
                <span>¥{f.feePerHour}/小时</span>
              </div>
            </div>
          ))}
        </div>

        {selectedFacility && (
          <div>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                {selectedFacility.icon} {selectedFacility.name} - 预约时间线
              </h2>
              <button className="btn btn-primary" onClick={() => { resetForm(); setShowBookingForm(true); }}>
                + 发起预约
              </button>
            </div>

            <div className="card" style={{ overflow: 'hidden', marginBottom: '24px' }}>
              <FacilityGantt
                facility={selectedFacility}
                bookings={facilityBookings}
                days={14}
                onSlotClick={handleSlotClick}
              />
            </div>

            <h2 className="section-title">即将到来的预约</h2>
            {facilityBookings.filter((b) => parseISO(b.startTime) >= new Date()).length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p className="text-muted">暂无预约</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {facilityBookings
                  .filter((b) => parseISO(b.startTime) >= new Date())
                  .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
                  .slice(0, 6)
                  .map((b) => (
                    <div key={b.id} className="card" style={{ padding: '16px' }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 500 }}>
                          {formatDateTime(parseISO(b.startTime))} - {format(parseISO(b.endTime), 'HH:mm')}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <div className="text-muted" style={{ fontSize: '13px' }}>
                        👤 {b.userName} · 👥 {b.peopleCount}人 · 📝 {b.purpose}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showBookingForm && selectedFacility && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowBookingForm(false)}
        >
          <div
            className={`card ${shakeBookingForm ? 'shake' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                预约 {selectedFacility.icon} {selectedFacility.name}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBookingForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">开始日期</label>
                  <input
                    type="date"
                    className={`input ${conflictResult?.hasConflict ? 'conflict' : ''}`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">开始时间</label>
                  <input
                    type="time"
                    className={`input ${conflictResult?.hasConflict ? 'conflict' : ''}`}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">结束日期</label>
                  <input
                    type="date"
                    className={`input ${conflictResult?.hasConflict ? 'conflict' : ''}`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">结束时间</label>
                  <input
                    type="time"
                    className={`input ${conflictResult?.hasConflict ? 'conflict' : ''}`}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {validationResult && !validationResult.valid && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--danger-light)', borderRadius: '8px', color: '#742A2A', fontSize: '13px' }}>
                  ⚠️ {validationResult.error}
                </div>
              )}

              {conflictResult?.hasConflict && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--danger-light)', borderRadius: '8px', color: '#742A2A', fontSize: '13px' }}>
                  ⚠️ 该时段与以下预约冲突：
                  {conflictResult.conflictingBookings.map((b) => (
                    <div key={b.id} style={{ marginTop: '4px', fontSize: '12px' }}>
                      • {b.userName} - {formatDateTime(parseISO(b.startTime))} ~ {format(parseISO(b.endTime), 'HH:mm')}
                    </div>
                  ))}
                </div>
              )}

              {freeSlots.length > 0 && (conflictResult?.hasConflict || validationResult && !validationResult.valid) && (
                <div style={{ marginTop: '12px' }}>
                  <p className="text-muted" style={{ fontSize: '13px', marginBottom: '8px' }}>推荐空闲时段：</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {freeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleFreeSlotClick(slot)}
                      >
                        {format(slot.start, 'MM/dd HH:mm')} - {format(slot.end, 'HH:mm')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <label className="label">预约用途</label>
                <textarea
                  className="textarea"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="请简要说明使用用途..."
                  required
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="label">使用人数 (最多 {selectedFacility.maxCapacity} 人)</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={selectedFacility.maxCapacity}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.min(parseInt(e.target.value) || 1, selectedFacility.maxCapacity))}
                />
              </div>

              {startDateTime && endDateTime && validationResult?.valid && !conflictResult?.hasConflict && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-warm)', borderRadius: '8px' }}>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    预约时长：{Math.round(differenceInMinutes(endDateTime, startDateTime) / 60 * 10) / 10} 小时
                  </div>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    预估费用：¥{Math.round(differenceInMinutes(endDateTime, startDateTime) / 60 * selectedFacility.feePerHour)}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBookingForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
