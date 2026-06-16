import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store';
import { format } from 'date-fns';
import type { Reservation } from './types';
import SeatMap from './components/SeatMap';
import Timer from './components/Timer';
import StatsPage from './components/StatsPage';

type PageType = 'map' | 'reservations' | 'stats';

const getStatusLabel = (status: Reservation['status']) => {
  switch (status) {
    case 'waiting': return '等待开始';
    case 'in-progress': return '进行中';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
  }
};

const getStatusClass = (status: Reservation['status']) => {
  switch (status) {
    case 'waiting': return 'status-waiting';
    case 'in-progress': return 'status-in-progress';
    case 'completed': return 'status-completed';
    case 'cancelled': return 'status-cancelled';
  }
};

const formatTimeRange = (r: Reservation) => {
  const start = new Date(r.startTime);
  const end = new Date(r.startTime + r.durationMinutes * 60 * 1000);
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')} · ${r.durationMinutes}分钟`;
};

function App() {
  const {
    initStore,
    reservations,
    timer,
    startTimer,
    cancelReservation,
    updateReservationStatus
  } = useAppStore();

  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('map');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<{ id: string; seat: number } | null>(null);
  const [cancelClosing, setCancelClosing] = useState(false);
  const initializedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initStore().then(() => setInitialized(true));
  }, [initStore]);

  useEffect(() => {
    if (!initialized) return;
    const id = setInterval(() => updateReservationStatus(), 30000);
    return () => clearInterval(id);
  }, [initialized, updateReservationStatus]);

  const todayReservations = reservations.filter(r => {
    const rDate = format(new Date(r.createdAt), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    return rDate === today;
  });

  const handleStartTimer = (reservationId: string) => {
    const r = reservations.find(x => x.id === reservationId);
    if (r && r.status === 'in-progress') {
      startTimer(reservationId);
    }
  };

  const handleCancelClick = (id: string, seat: number) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setCancelClosing(false);
    setCancelConfirm({ id, seat });
  };

  const closeCancelModal = () => {
    if (cancelClosing || !cancelConfirm) return;
    setCancelClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setCancelConfirm(null);
      setCancelClosing(false);
      closeTimerRef.current = null;
    }, 220);
  };

  const confirmCancel = async () => {
    if (!cancelConfirm || cancelClosing) return;
    await cancelReservation(cancelConfirm.id);
    closeCancelModal();
  };

  const renderSidebar = () => (
    <aside className={`sidebar ${showMobileSidebar ? 'mobile-visible' : ''}`}>
      <h2>今日预约</h2>
      {todayReservations.length === 0 ? (
        <div className="empty-state">
          暂无预约记录
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            在座位地图上选择空闲座位开始预约
          </div>
        </div>
      ) : (
        <ul className="reservation-list">
          {todayReservations.map(r => (
            <li key={r.id} className="reservation-item">
              <div className="reservation-header">
                <span className="reservation-seat">座位 #{r.seatNumber}</span>
                <span className={`reservation-status ${getStatusClass(r.status)}`}>
                  {getStatusLabel(r.status)}
                </span>
              </div>
              <div className="reservation-time">{formatTimeRange(r)}</div>
              {r.focusMinutes > 0 && (
                <div className="reservation-time" style={{ color: '#34d399' }}>
                  专注时长：{r.focusMinutes} 分钟
                </div>
              )}
              <div className="reservation-actions">
                {r.status === 'waiting' && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelClick(r.id, r.seatNumber)}
                  >
                    取消预约
                  </button>
                )}
                {r.status === 'in-progress' && !timer.isRunning && (
                  <button
                    className="btn-timer"
                    onClick={() => handleStartTimer(r.id)}
                  >
                    开始计时
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  const renderMainContent = () => {
    if (currentPage === 'map' || currentPage === 'reservations') {
      return (
        <SeatMap
          onStartTimer={handleStartTimer}
          onOpenCancelConfirm={handleCancelClick}
        />
      );
    }
    if (currentPage === 'stats') {
      return <StatsPage />;
    }
    return null;
  };

  if (!initialized) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#a0aec0',
        fontSize: 18
      }}>
        FocusHub 加载中...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Timer timer={timer} />

      <header className="app-header">
        <h1>📚 FocusHub</h1>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${(currentPage === 'map' || currentPage === 'reservations') ? 'active' : ''}`}
            onClick={() => setCurrentPage('map')}
          >
            🗺 座位地图
          </button>
          <button
            className={`nav-tab ${currentPage === 'stats' ? 'active' : ''}`}
            onClick={() => setCurrentPage('stats')}
          >
            📊 学习统计
          </button>
        </div>
      </header>

      <div className="app-main">
        <main className="main-content">
          {renderMainContent()}
        </main>
        {renderSidebar()}
      </div>

      <div className="bottom-tabbar">
        <div className="bottom-tabbar-inner">
          <button
            className={`bottom-tab ${currentPage === 'map' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('map'); setShowMobileSidebar(false); }}
          >
            <span className="bottom-tab-icon">🗺</span>
            <span>地图</span>
          </button>
          <button
            className={`bottom-tab ${currentPage === 'reservations' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('reservations'); setShowMobileSidebar(true); }}
          >
            <span className="bottom-tab-icon">📋</span>
            <span>预约</span>
          </button>
          <button
            className={`bottom-tab ${currentPage === 'stats' ? 'active' : ''}`}
            onClick={() => { setCurrentPage('stats'); setShowMobileSidebar(false); }}
          >
            <span className="bottom-tab-icon">📊</span>
            <span>统计</span>
          </button>
        </div>
      </div>

      {cancelConfirm && (
        <div
          className={`modal-overlay ${cancelClosing ? 'overlay-fade-out' : ''}`}
          onClick={closeCancelModal}
        >
          <div
            className={`modal-content confirm-modal ${cancelClosing ? 'closing' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{ minWidth: 320 }}
          >
            <h3 className="modal-title">确认取消预约</h3>
            <p className="modal-subtitle">
              您确定要取消座位 #{cancelConfirm.seat} 的预约吗？此操作无法撤销。
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeCancelModal}>
                再想想
              </button>
              <button className="btn-danger" onClick={confirmCancel}>
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
