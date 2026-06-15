import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Trophy, CheckCircle, Menu, X } from 'lucide-react';
import { Page, EventItem, Participant, CheckInRecord, PointsLog, ToastState } from './types';
import {
  initData, getEvents, saveEvents,
  getParticipants, saveParticipants,
  getCheckInRecords, saveCheckInRecords,
  getPointsLogs, savePointsLogs,
  generateId,
} from './data';
import EventList from './EventList';
import CheckInPage from './CheckInPage';
import PointsManager from './PointsManager';

const Toast: React.FC<{ toast: ToastState; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, onClose]);

  if (!toast.visible) return null;

  return (
    <div
      className="animate-toast-in"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        background: toast.type === 'success'
          ? 'linear-gradient(135deg, #10B981, #34D399)'
          : 'linear-gradient(135deg, #EF4444, #F87171)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '360px',
      }}
    >
      <span>{toast.message}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('events');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>([]);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshAllData = useCallback(() => {
    setEvents(getEvents());
    setParticipants(getParticipants());
    setCheckInRecords(getCheckInRecords());
    setPointsLogs(getPointsLogs());
  }, []);

  useEffect(() => {
    initData();
    refreshAllData();
  }, [refreshAllData]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(t => ({ ...t, visible: false }));
  }, []);

  const handleEventsChange = useCallback((newEvents: EventItem[]) => {
    setEvents(newEvents);
    saveEvents(newEvents);
  }, []);

  const handleParticipantsChange = useCallback((newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    saveParticipants(newParticipants);
  }, []);

  const handleCheckInRecordsChange = useCallback((newRecords: CheckInRecord[]) => {
    setCheckInRecords(newRecords);
    saveCheckInRecords(newRecords);
  }, []);

  const handlePointsLogsChange = useCallback((newLogs: PointsLog[]) => {
    setPointsLogs(newLogs);
    savePointsLogs(newLogs);
  }, []);

  const handleCheckIn = useCallback((
    record: CheckInRecord,
    event: EventItem,
    participant: Participant
  ) => {
    const newRecords = [record, ...checkInRecords];
    handleCheckInRecordsChange(newRecords);

    const newEvents = events.map(e =>
      e.id === event.id
        ? {
            ...e,
            checkedInIds: e.checkedInIds.includes(participant.id)
              ? e.checkedInIds
              : [...e.checkedInIds, participant.id],
            participantIds: e.participantIds.includes(participant.id)
              ? e.participantIds
              : [...e.participantIds, participant.id],
          }
        : e
    );
    handleEventsChange(newEvents);

    const newParticipants = participants.map(p =>
      p.id === participant.id
        ? { ...p, points: p.points + 10 }
        : p
    );
    handleParticipantsChange(newParticipants);

    const newLog: PointsLog = {
      id: generateId(),
      participantId: participant.id,
      participantName: participant.name,
      eventId: event.id,
      eventName: event.name,
      change: 10,
      reason: '活动签到',
      timestamp: record.timestamp,
    };
    handlePointsLogsChange([newLog, ...pointsLogs]);
  }, [
    checkInRecords, events, participants, pointsLogs,
    handleCheckInRecordsChange, handleEventsChange,
    handleParticipantsChange, handlePointsLogsChange
  ]);

  const currentEvent = useMemo(() =>
    events.find(e => e.id === currentEventId) || null,
    [events, currentEventId]
  );

  const navigateTo = (page: Page, eventId?: string) => {
    setCurrentPage(page);
    if (eventId) setCurrentEventId(eventId);
    setMobileMenuOpen(false);
  };

  const navItems = [
    {
      id: 'events' as Page,
      label: '活动管理',
      icon: Calendar,
    },
    {
      id: 'points' as Page,
      label: '积分管理',
      icon: Trophy,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
          color: '#fff',
          boxShadow: 'var(--shadow-md)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
            onClick={() => navigateTo('events')}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>
                签到积分系统
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                Event Check-in & Points
              </div>
            </div>
          </div>

          <nav
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: currentPage === item.id
                      ? 'rgba(255,255,255,0.2)'
                      : 'transparent',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: currentPage === item.id ? '600' : '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div
            style={{
              display: 'none',
              flexDirection: 'column',
              padding: '0 24px 16px',
              gap: '4px',
            }}
          >
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: currentPage === item.id
                    ? 'rgba(255,255,255,0.2)'
                    : 'transparent',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px',
        }}
      >
        {currentPage === 'events' && (
          <EventList
            events={events}
            onEventsChange={handleEventsChange}
            onNavigateToCheckIn={(eventId) => navigateTo('checkin', eventId)}
            onShowToast={showToast}
            onRefreshData={refreshAllData}
          />
        )}

        {currentPage === 'checkin' && currentEvent && (
          <CheckInPage
            event={currentEvent}
            participants={participants}
            checkInRecords={checkInRecords}
            onBack={() => navigateTo('events')}
            onCheckIn={handleCheckIn}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'checkin' && !currentEvent && (
          <div
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '64px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              请先选择一个活动
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              请从活动列表中选择一个活动进入签到页面
            </p>
            <button
              onClick={() => navigateTo('events')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
            >
              <Calendar size={16} />
              前往活动列表
            </button>
          </div>
        )}

        {currentPage === 'points' && (
          <PointsManager
            participants={participants}
            onParticipantsChange={handleParticipantsChange}
            pointsLogs={pointsLogs}
            onPointsLogsChange={handlePointsLogsChange}
            events={events}
            onShowToast={showToast}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      <footer
        style={{
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-card)',
        }}
      >
        活动签到与积分管理系统 © 2026
      </footer>

      <Toast toast={toast} onClose={hideToast} />

      <style>{`
        @media (max-width: 768px) {
          header > div {
            padding: 12px 16px !important;
          }
          main {
            padding: 20px 16px !important;
          }
          header nav > div:first-child {
            display: none !important;
          }
          header nav button:last-child {
            display: flex !important;
          }
          header div[style*="display: none"] {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
