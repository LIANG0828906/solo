import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, Undo2, Redo2, Users, Wifi, WifiOff } from 'lucide-react';
import MapView from '@/modules/map/MapView';
import DayCard from './DayCard';
import useTripStore from '@/stores/tripStore';
import useWebSocket from '@/hooks/useWebSocket';
import type { Trip, Attraction, Comment } from '@/types';

interface TripPlannerProps {
  tripId?: string;
  wsUrl?: string;
}

export function TripPlanner({ tripId, wsUrl = '/ws/trip' }: TripPlannerProps) {
  const {
    trip,
    selectedDayId,
    setSelectedDay,
    undo,
    redo,
    canUndo,
    canRedo,
    fetchTrip,
    moveAttraction,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    addComment,
    isLoading,
    error,
  } = useTripStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggedAttraction, setDraggedAttraction] = useState<{
    id: string;
    fromDayId: string;
  } | null>(null);
  const [dropDayId, setDropDayId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { isConnected, send, on } = useWebSocket({
    url: wsUrl,
    tripId,
    autoReconnect: true,
  });

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
    }
  }, [tripId, fetchTrip]);

  useEffect(() => {
    if (!on) return;

    const unsubAdd = on('attraction_add', (data: unknown) => {
      const { dayId, attraction } = data as { dayId: string; attraction: Attraction };
      if (dayId && attraction) {
        addAttraction(dayId, attraction);
      }
    });

    const unsubUpdate = on('attraction_update', (data: unknown) => {
      const { dayId, attractionId, updates } = data as {
        dayId: string;
        attractionId: string;
        updates: Partial<Attraction>;
      };
      if (dayId && attractionId && updates) {
        updateAttraction(dayId, attractionId, updates);
      }
    });

    const unsubDelete = on('attraction_delete', (data: unknown) => {
      const { dayId, attractionId } = data as { dayId: string; attractionId: string };
      if (dayId && attractionId) {
        deleteAttraction(dayId, attractionId);
      }
    });

    const unsubMove = on('attraction_move', (data: unknown) => {
      const { fromDayId, toDayId, attractionId, toIndex } = data as {
        fromDayId: string;
        toDayId: string;
        attractionId: string;
        toIndex: number;
      };
      if (fromDayId && toDayId && attractionId) {
        moveAttraction(fromDayId, toDayId, attractionId, toIndex);
      }
    });

    const unsubComment = on('comment_add', (data: unknown) => {
      const { dayId, attractionId, comment } = data as {
        dayId: string;
        attractionId: string;
        comment: Comment;
      };
      if (dayId && attractionId && comment) {
        addComment(dayId, attractionId, comment);
      }
    });

    return () => {
      unsubAdd();
      unsubUpdate();
      unsubDelete();
      unsubMove();
      unsubComment();
    };
  }, [on, addAttraction, updateAttraction, deleteAttraction, moveAttraction, addComment]);

  const handleDragStart = useCallback((attractionId: string, fromDayId: string) => {
    setDraggedAttraction({ id: attractionId, fromDayId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayId: string) => {
    e.preventDefault();
    setDropDayId(dayId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toDayId: string) => {
      e.preventDefault();
      setDropDayId(null);

      if (!draggedAttraction) return;

      const { id: attractionId, fromDayId } = draggedAttraction;

      if (fromDayId === toDayId) {
        setDraggedAttraction(null);
        return;
      }

      const day = trip?.days.find((d) => d.id === toDayId);
      const toIndex = day ? day.attractions.length : 0;

      moveAttraction(fromDayId, toDayId, attractionId, toIndex);

      if (send && isConnected) {
        send('attraction_move', {
          fromDayId,
          toDayId,
          attractionId,
          toIndex,
        });
      }

      setDraggedAttraction(null);
    },
    [draggedAttraction, trip, moveAttraction, send, isConnected]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedAttraction(null);
    setDropDayId(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#1a73e8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>加载中...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={() => tripId && fetchTrip(tripId)}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          height: '60px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderRadius: '6px',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {trip?.title || '旅行计划'}
          </h1>
          {trip && (
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
              {trip.startDate} - {trip.endDate}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '12px',
              color: isConnected ? '#34a853' : '#9ca3af',
            }}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isConnected ? '已连接' : '离线'}</span>
          </div>

          <button
            onClick={() => undo()}
            disabled={!canUndo()}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: canUndo() ? 'pointer' : 'not-allowed',
              borderRadius: '6px',
              color: canUndo() ? '#4b5563' : '#d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (canUndo()) e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="撤销"
          >
            <Undo2 size={20} />
          </button>

          <button
            onClick={() => redo()}
            disabled={!canRedo()}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: canRedo() ? 'pointer' : 'not-allowed',
              borderRadius: '6px',
              color: canRedo() ? '#4b5563' : '#d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (canRedo()) e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="重做"
          >
            <Redo2 size={20} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1a73e8',
            }}
          >
            <Users size={14} />
            <span>{trip?.collaborators.length || 1} 人协作中</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        <aside
          ref={sidebarRef}
          style={{
            width: '380px',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            position: window.innerWidth < 768 ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            height: '100%',
            zIndex: 50,
            boxShadow: sidebarOpen && window.innerWidth < 768 ? '2px 0 12px rgba(0,0,0,0.1)' : 'none',
          }}
          onDragOver={(e) => {
            if (draggedAttraction) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            if (draggedAttraction && dropDayId) {
              handleDrop(e, dropDayId);
            }
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
            }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
              行程列表
            </h2>
            {selectedDayId && (
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                点击地图添加景点到当前选中的日期
              </p>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            {trip?.days.map((day) => (
              <div
                key={day.id}
                onDragOver={(e) => handleDragOver(e, day.id)}
                onDrop={(e) => handleDrop(e, day.id)}
                onDragLeave={() => setDropDayId(null)}
                onClick={() => setSelectedDay(day.id)}
                style={{
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  transform: dropDayId === day.id ? 'scale(1.02)' : 'scale(1)',
                  outline: dropDayId === day.id ? '2px dashed #1a73e8' : 'none',
                  outlineOffset: '2px',
                  borderRadius: '12px',
                }}
              >
                <DayCard
                  dayPlan={day}
                  isExpanded={selectedDayId === day.id}
                  onToggle={() => setSelectedDay(selectedDayId === day.id ? null : day.id)}
                />
              </div>
            ))}
          </div>
        </aside>

        {sidebarOpen && window.innerWidth < 768 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 40,
              opacity: 1,
              transition: 'opacity 0.3s ease',
            }}
            onClick={toggleSidebar}
          />
        )}

        <main style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <MapView />

          {!selectedDayId && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                fontSize: '13px',
                color: '#6b7280',
                zIndex: 10,
                animation: 'fadeInDown 0.3s ease',
              }}
            >
              <span style={{ color: '#f59e0b' }}>提示：</span>
              请先在左侧选择一个日期，然后点击地图添加景点
              <style>{`
                @keyframes fadeInDown {
                  from {
                    opacity: 0;
                    transform: translate(-50%, -10px);
                  }
                  to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                  }
                }
              `}</style>
            </div>
          )}
        </main>

        {window.innerWidth < 768 && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(26,115,232,0.4)',
              zIndex: 60,
              display: sidebarOpen ? 'none' : 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,115,232,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,115,232,0.4)';
            }}
          >
            <Menu size={18} />
            行程列表
          </button>
        )}
      </div>
    </div>
  );
}

export default TripPlanner;
