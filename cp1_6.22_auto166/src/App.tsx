import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Seat, Reservation, CheckInRecord, User, PageType, SeatStatus } from './types';
import FloorPlan from './components/FloorPlan';
import SidePanel from './components/SidePanel';
import Modal from './components/Modal';
import HistoryPage from './components/HistoryPage';

const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  let num = 1;
  const rows = 5;
  const cols = 6;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      seats.push({
        id: `seat-${num}`,
        number: num,
        x: col * 70 + 50,
        y: row * 70 + 50,
        status: 'available'
      });
      num++;
    }
  }
  return seats;
};

const STORAGE_KEY = 'study_room_data';
const defaultUser: User = { id: 'user-1', name: '学生用户' };
const roomLocation = { latitude: 39.9042, longitude: 116.4074 };

const loadFromStorage = (): Partial<AppState> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from storage', e);
  }
  return {};
};

const saveToStorage = (state: Partial<AppState>) => {
  try {
    const data = {
      seats: state.seats,
      reservations: state.reservations,
      checkInRecords: state.checkInRecords,
      activeReservation: state.activeReservation,
      activeCheckIn: state.activeCheckIn
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage', e);
  }
};

export default function App() {
  const stored = useMemo(() => loadFromStorage(), []);
  
  const [seats, setSeats] = useState<Seat[]>(stored.seats || generateSeats());
  const [reservations, setReservations] = useState<Reservation[]>(stored.reservations || []);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>(stored.checkInRecords || []);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(stored.activeReservation || null);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInRecord | null>(stored.activeCheckIn || null);
  const [currentPage, setCurrentPage] = useState<PageType>('main');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [modalType, setModalType] = useState<'seat' | 'error' | 'warning' | 'success'>('seat');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    saveToStorage({
      seats,
      reservations,
      checkInRecords,
      activeReservation,
      activeCheckIn
    });
  }, [seats, reservations, checkInRecords, activeReservation, activeCheckIn]);

  const updateSeatStatus = useCallback((seatId: string, status: SeatStatus) => {
    setSeats(prev => prev.map(s => 
      s.id === seatId ? { ...s, status } : s
    ));
  }, []);

  const handleSeatClick = useCallback((seat: Seat) => {
    setSelectedSeat(seat);
    setModalType('seat');
    setShowModal(true);
  }, []);

  const handleReserveClick = useCallback(() => {
    if (activeReservation || activeCheckIn) {
      setModalType('error');
      setModalMessage('您已有未完成的预约或进行中的签到，请先完成后再预约新座位');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }
    setShowModal(false);
    setShowDateTimePicker(true);
    const now = new Date();
    setSelectedDate(now);
    const hours = now.getHours();
    const mins = now.getMinutes();
    setSelectedStartTime(`${hours.toString().padStart(2, '0')}:${mins < 30 ? '00' : '30'}`);
  }, [activeReservation, activeCheckIn]);

  const confirmReservation = useCallback(() => {
    if (!selectedSeat) return;

    const [hours, mins] = selectedStartTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, mins, 0, 0);
    const endDate = new Date(startDate.getTime() + selectedDuration * 60 * 60 * 1000);

    const newReservation: Reservation = {
      id: uuidv4(),
      seatId: selectedSeat.id,
      seatNumber: selectedSeat.number,
      userId: defaultUser.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: selectedDuration,
      createdAt: new Date().toISOString()
    };

    setReservations(prev => [...prev, newReservation]);
    setActiveReservation(newReservation);
    updateSeatStatus(selectedSeat.id, 'reserved');
    setShowDateTimePicker(false);
    setModalType('success');
    setModalMessage(`预约成功！座位 ${selectedSeat.number} 号，时间 ${selectedStartTime} - ${new Date(endDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    setShowModal(true);
  }, [selectedSeat, selectedDate, selectedStartTime, selectedDuration, updateSeatStatus]);

  const handleCheckInClick = useCallback(() => {
    if (!selectedSeat || !activeReservation) return;

    const reservationStart = new Date(activeReservation.startTime).getTime();
    const now = currentTime;
    const diffMinutes = Math.abs(now - reservationStart) / (1000 * 60);

    if (diffMinutes > 30) {
      setModalType('error');
      setModalMessage('已超过预约时间前后30分钟，无法签到');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    if (!navigator.geolocation) {
      setModalType('error');
      setModalMessage('浏览器不支持地理位置定位');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const R = 6371000;
        const φ1 = latitude * Math.PI / 180;
        const φ2 = roomLocation.latitude * Math.PI / 180;
        const Δφ = (roomLocation.latitude - latitude) * Math.PI / 180;
        const Δλ = (roomLocation.longitude - longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > 100) {
          setModalType('error');
          setModalMessage(`您距离自习室 ${distance.toFixed(0)} 米，请先到达自习室（误差允许100米）`);
          setShakeError(true);
          setTimeout(() => setShakeError(false), 500);
          return;
        }

        const newCheckIn: CheckInRecord = {
          id: uuidv4(),
          seatId: selectedSeat.id,
          seatNumber: selectedSeat.number,
          userId: defaultUser.id,
          reservationId: activeReservation.id,
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          actualDuration: 0,
          reservedDuration: activeReservation.duration,
          deviation: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'active'
        };

        setCheckInRecords(prev => [...prev, newCheckIn]);
        setActiveCheckIn(newCheckIn);
        setActiveReservation(null);
        updateSeatStatus(selectedSeat.id, 'in-use');
        setShowModal(false);
        setModalType('success');
        setModalMessage('签到成功！开始记录学习时长，加油！');
        setShowModal(true);
      },
      () => {
        setModalType('error');
        setModalMessage('无法获取位置信息，请检查浏览器位置权限设置');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
      }
    );
  }, [selectedSeat, activeReservation, currentTime, updateSeatStatus]);

  const handleCheckOut = useCallback(() => {
    if (!activeCheckIn || !selectedSeat) return;

    const checkOutTime = new Date();
    const checkInTime = new Date(activeCheckIn.checkInTime);
    const actualDurationMs = checkOutTime.getTime() - checkInTime.getTime();
    const actualDurationHours = actualDurationMs / (1000 * 60 * 60);
    const reservedDurationHours = activeCheckIn.reservedDuration;
    const deviation = ((actualDurationHours - reservedDurationHours) / reservedDurationHours) * 100;

    const updatedCheckIn: CheckInRecord = {
      ...activeCheckIn,
      checkOutTime: checkOutTime.toISOString(),
      actualDuration: actualDurationHours,
      deviation,
      status: 'completed'
    };

    setCheckInRecords(prev => prev.map(r => 
      r.id === activeCheckIn.id ? updatedCheckIn : r
    ));
    setActiveCheckIn(null);
    updateSeatStatus(selectedSeat.id, 'available');

    if (actualDurationHours < reservedDurationHours * 0.8) {
      setModalType('warning');
      setModalMessage(`本次学习时长 ${actualDurationHours.toFixed(1)} 小时，少于预约时长的80%。下次继续努力，按计划完成学习目标哦！`);
      setShowModal(true);
    } else {
      setModalType('success');
      setModalMessage(`签退成功！本次学习 ${actualDurationHours.toFixed(1)} 小时，表现很棒！`);
      setShowModal(true);
    }
  }, [activeCheckIn, selectedSeat, updateSeatStatus]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedSeat(null);
  }, []);

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkInRecords.filter(r => r.date === today && r.status === 'completed');
  }, [checkInRecords]);

  const todayDuration = useMemo(() => {
    return todayRecords.reduce((sum, r) => sum + r.actualDuration, 0);
  }, [todayRecords]);

  const totalDuration = useMemo(() => {
    return checkInRecords
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.actualDuration, 0);
  }, [checkInRecords]);

  const currentElapsedTime = useMemo(() => {
    if (!activeCheckIn) return 0;
    return Math.floor((currentTime - new Date(activeCheckIn.checkInTime).getTime()) / 1000);
  }, [activeCheckIn, currentTime]);

  if (currentPage === 'history') {
    return (
      <HistoryPage 
        records={checkInRecords.filter(r => r.status === 'completed')}
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        height: '64px',
        background: 'linear-gradient(to right, #6366F1, #8B5CF6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: 600 }}>
          <span className="clock-icon" style={{ fontSize: '24px' }}>🕐</span>
          <span>自习室座位预约系统</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>👤 {defaultUser.name}</span>
          <button
            onClick={() => setCurrentPage('history')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'white',
              color: '#6366F1',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            签到记录
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px', minWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#FFFFFF' }}>
          <FloorPlan 
            seats={seats}
            onSeatClick={handleSeatClick}
            activeCheckInSeatId={activeCheckIn?.seatId || null}
            activeReservationSeatId={activeReservation?.seatId || null}
          />
        </div>

        <SidePanel
          todayDuration={todayDuration}
          totalDuration={totalDuration}
          todayRecords={todayRecords}
          activeCheckIn={activeCheckIn}
          elapsedSeconds={currentElapsedTime}
          onCheckOut={handleCheckOut}
        />
      </div>

      {showModal && selectedSeat && modalType === 'seat' && (
        <Modal onClose={closeModal}>
          <div className="fade-in" style={{ padding: '24px', minWidth: '280px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#1E293B' }}>座位 {selectedSeat.number}</h2>
            <p style={{ marginBottom: '8px', color: '#64748B' }}>
              状态：
              <span style={{
                color: selectedSeat.status === 'available' ? '#22C55E' : 
                       selectedSeat.status === 'reserved' ? '#F59E0B' : '#EF4444',
                fontWeight: 600
              }}>
                {selectedSeat.status === 'available' ? '空闲' : 
                 selectedSeat.status === 'reserved' ? '已预约' : '使用中'}
              </span>
            </p>
            {activeCheckIn && activeCheckIn.seatId === selectedSeat.id && (
              <p style={{ marginBottom: '16px', color: '#64748B', fontSize: '14px' }}>
                已学习：{formatDuration(currentElapsedTime)}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {selectedSeat.status === 'available' && (
                <button
                  onClick={handleReserveClick}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#6366F1',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  预约座位
                </button>
              )}
              {selectedSeat.status === 'reserved' && activeReservation && activeReservation.seatId === selectedSeat.id && (
                <button
                  onClick={handleCheckInClick}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#22C55E',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  签到
                </button>
              )}
              {selectedSeat.status === 'in-use' && activeCheckIn && activeCheckIn.seatId === selectedSeat.id && (
                <button
                  onClick={handleCheckOut}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  签退
                </button>
              )}
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#E2E8F0',
                  color: '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModal && modalType !== 'seat' && (
        <Modal onClose={closeModal}>
          <div className={`fade-in ${shakeError && modalType === 'error' ? 'shake-animation' : ''}`} style={{ 
            padding: '24px', 
            minWidth: '300px',
            borderRadius: '12px',
            background: modalType === 'error' ? '#FEE2E2' : 
                       modalType === 'warning' ? '#FEF3C7' : '#D1FAE5'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>
              {modalType === 'error' ? '❌' : modalType === 'warning' ? '⚠️' : '✅'}
            </div>
            <p style={{ 
              color: modalType === 'error' ? '#991B1B' : 
                     modalType === 'warning' ? '#92400E' : '#065F46',
              fontSize: '14px',
              lineHeight: 1.6
            }}>{modalMessage}</p>
            <button
              onClick={closeModal}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '10px',
                borderRadius: '8px',
                background: modalType === 'error' ? '#EF4444' : 
                           modalType === 'warning' ? '#F59E0B' : '#22C55E',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              确定
            </button>
          </div>
        </Modal>
      )}

      {showDateTimePicker && selectedSeat && (
        <Modal onClose={() => setShowDateTimePicker(false)}>
          <div className="fade-in" style={{ padding: '24px', minWidth: '340px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#1E293B' }}>
              预约座位 {selectedSeat.number}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                选择日期
              </label>
              <CalendarComponent 
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                  开始时间
                </label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {Array.from({ length: 14 }, (_, i) => {
                    const hour = i + 8;
                    return [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`];
                  }).flat().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                  时长（小时）
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {[1, 2, 3, 4].map(h => (
                    <option key={h} value={h}>{h}小时</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={confirmReservation}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                确认预约
              </button>
              <button
                onClick={() => setShowDateTimePicker(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#E2E8F0',
                  color: '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CalendarComponent({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const today = new Date();

  const goPrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (newDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      onSelect(newDate);
    }
  };

  const isSelected = (day: number) => {
    return selectedDate.getFullYear() === viewMonth.getFullYear() &&
           selectedDate.getMonth() === viewMonth.getMonth() &&
           selectedDate.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewMonth.getFullYear() &&
           today.getMonth() === viewMonth.getMonth() &&
           today.getDate() === day;
  };

  const isPast = (day: number) => {
    const checkDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return checkDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={goPrevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>‹</button>
        <span style={{ fontWeight: 500, fontSize: '14px' }}>
          {viewMonth.getFullYear()}年{viewMonth.getMonth() + 1}月
        </span>
        <button onClick={goNextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', padding: '4px' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              disabled={isPast(day)}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                borderRadius: '8px',
                background: isSelected(day) ? '#6366F1' : isToday(day) ? '#EEF2FF' : 'transparent',
                color: isSelected(day) ? 'white' : isPast(day) ? '#CBD5E1' : '#1E293B',
                cursor: isPast(day) ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: isToday(day) && !isSelected(day) ? 600 : 400
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
