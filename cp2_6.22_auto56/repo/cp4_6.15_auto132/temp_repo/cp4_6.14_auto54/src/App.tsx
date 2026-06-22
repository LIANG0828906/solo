import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Plus } from 'lucide-react';
import { useTripStore } from './store/tripStore';
import Navbar from './components/Navbar';
import BudgetProgress from './components/BudgetProgress';
import Timeline from './components/Timeline';
import HistoryPanel from './components/HistoryPanel';
import ExportModal from './components/ExportModal';
import type { SocketEventPayload, Trip, TripEvent } from './types';

const TRIP_ID = 'demo-trip-001';

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const format = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return `${format(start)} - ${format(end)}`;
}

function extractDayDate(startTime: string): string {
  const date = new Date(startTime);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const {
    trip,
    loading,
    error,
    fetchTrip,
    updateDay,
    addEventToDay,
    removeEventFromDay,
    updateEventInDay,
    addBlinkingEvent,
    setSocketId,
    setTrip,
    updateMemberStatus,
    currentMemberId,
    highlightedEventId,
    blinkingEvents,
    setHighlightedEvent,
  } = useTripStore();

  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  const handleAddEvent = useCallback((dayDate: string) => {
    console.log('Add event to day:', dayDate);
  }, []);

  const handleEditEvent = useCallback((event: TripEvent) => {
    setHighlightedEvent(event.id);
    setTimeout(() => setHighlightedEvent(null), 1000);
  }, [setHighlightedEvent]);

  const handleDeleteEvent = useCallback((dayDate: string, eventId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('eventDeleted', {
        tripId: TRIP_ID,
        eventId,
        dayDate,
        operatorId: currentMemberId,
        timestamp: new Date().toISOString(),
      } as SocketEventPayload);
    }
    removeEventFromDay(dayDate, eventId);
  }, [currentMemberId, removeEventFromDay]);

  const handleReorderEvents = useCallback((dayDate: string, events: TripEvent[]) => {
    const day = trip?.days.find((d) => d.date === dayDate);
    if (!day) return;
    updateDay({ ...day, events });
  }, [trip, updateDay]);

  useEffect(() => {
    fetchTrip(TRIP_ID);

    socketRef.current = io({ transports: ['websocket', 'polling'] });
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setSocketId(socket.id || null);
      socket.emit('syncRequest', { tripId: TRIP_ID, memberId: currentMemberId });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('syncResponse', (data: { trip: Trip }) => {
      console.log('[Socket] syncResponse received');
      if (data.trip) {
        setTrip(data.trip);
      }
    });

    socket.on('eventAdded', (payload: SocketEventPayload) => {
      console.log('[Socket] eventAdded:', payload);
      if (payload.event && payload.day) {
        addEventToDay(payload.day.date, payload.event);
        if (payload.operatorId !== currentMemberId) {
          addBlinkingEvent(payload.event.id);
        }
      }
    });

    socket.on('eventUpdated', (payload: SocketEventPayload) => {
      console.log('[Socket] eventUpdated:', payload);
      if (payload.event) {
        const dayDate = extractDayDate(payload.event.startTime);
        updateEventInDay(dayDate, payload.event);
        addBlinkingEvent(payload.event.id);
      }
    });

    socket.on('eventDeleted', (payload: SocketEventPayload) => {
      console.log('[Socket] eventDeleted:', payload);
      if (payload.eventId && payload.dayDate) {
        removeEventFromDay(payload.dayDate, payload.eventId);
      }
    });

    socket.on('memberStatusChanged', (data: { memberId: string; online: boolean }) => {
      console.log('[Socket] memberStatusChanged:', data);
      updateMemberStatus(data.memberId, data.online);
    });

    return () => {
      console.log('[Socket] Cleanup - disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    fetchTrip,
    setSocketId,
    setTrip,
    addEventToDay,
    updateEventInDay,
    removeEventFromDay,
    addBlinkingEvent,
    updateMemberStatus,
    currentMemberId,
  ]);

  const currentUser = trip?.members.find((m) => m.id === currentMemberId);
  const budget = trip?.budget || 0;
  const spent = trip?.totalSpent || 0;
  const remaining = budget - spent;

  const spentProgress = budget > 0 ? spent / budget : 0;
  let spentColor = '#10b981';
  if (spentProgress >= 1) spentColor = '#ef4444';
  else if (spentProgress >= 0.8) spentColor = '#f59e0b';

  const remainingColor = remaining >= 0 ? '#10b981' : '#ef4444';

  const dateRangeText = trip
    ? formatDateRange(trip.startDate, trip.endDate)
    : '2026年7月1日 - 2026年7月5日';

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f1f5f9',
        paddingTop: 56,
      }}
    >
      <Navbar
        tripName={trip?.name || '加载中...'}
        members={trip?.members || []}
        currentUser={currentUser}
        onExport={() => setExportOpen(true)}
        onToggleHistory={() => setHistoryOpen((prev) => !prev)}
      />

      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '3fr 1fr',
            gap: 24,
          }}
          className="layout-grid"
        >
          <div className="flex flex-col gap-5 min-w-0">
            <div className="flex flex-col gap-1">
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1e293b',
                  lineHeight: 1.3,
                }}
              >
                {loading ? '加载中...' : trip?.name || '行程名称'}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: '#64748b',
                }}
              >
                {dateRangeText}
              </p>
              {error && (
                <p
                  style={{
                    fontSize: 14,
                    color: '#ef4444',
                    marginTop: 4,
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            {loading ? (
              <div className="card-base p-8">
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div
                        className="h-12 rounded-lg mb-3"
                        style={{ backgroundColor: '#e2e8f0' }}
                      />
                      <div className="flex flex-col gap-2 pl-10">
                        {[1, 2].map((j) => (
                          <div
                            key={j}
                            className="h-20 rounded-xl"
                            style={{ backgroundColor: '#e2e8f0' }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Timeline
                days={trip?.days || []}
                blinkingEvents={blinkingEvents}
                highlightedEventId={highlightedEventId}
                currentMemberId={currentMemberId}
                onAddEvent={handleAddEvent}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onReorderEvents={handleReorderEvents}
              />
            )}
          </div>

          <div className="flex flex-col gap-5 min-w-0 sidebar-column">
            <div
              className="card-base p-5"
              style={{
                borderRadius: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#64748b',
                  marginBottom: 16,
                }}
              >
                预算概览
              </h2>

              <BudgetProgress budget={budget} spent={spent} />

              <div
                className="mt-5 pt-5 flex flex-col gap-3"
                style={{ borderTop: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: '#64748b' }}>总预算</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: '#1e293b',
                    }}
                  >
                    ¥{budget.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: '#64748b' }}>已花费</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: spentColor,
                    }}
                  >
                    ¥{spent.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: '#64748b' }}>剩余</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: remainingColor,
                    }}
                  >
                    ¥{remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="card-base p-5"
              style={{
                borderRadius: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#64748b',
                  marginBottom: 16,
                }}
              >
                团队成员
              </h2>

              <div className="flex flex-col gap-3">
                {(trip?.members || []).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="relative rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                      }}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.name}
                        {member.id === currentMemberId && (
                          <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: 12 }}>
                            {' '}(我)
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: member.online ? '#10b981' : '#94a3b8',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: member.online ? '#10b981' : '#94a3b8',
                          }}
                        >
                          {member.online ? '在线' : '离线'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="mobile-fab fixed flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          width: 56,
          height: 56,
          bottom: 24,
          right: 24,
          backgroundColor: '#f97316',
          zIndex: 90,
        }}
        onClick={() => {
          if (trip?.days && trip.days.length > 0) {
            handleAddEvent(trip.days[0].date);
          }
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={trip?.history || []}
      />

      {trip && (
        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          trip={trip as Trip}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .layout-grid {
            grid-template-columns: 1fr !important;
            display: flex !important;
            flex-direction: column;
          }
          .sidebar-column {
            order: -1;
          }
        }
        @media (min-width: 769px) {
          .mobile-fab {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
