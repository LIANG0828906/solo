import { useState, useEffect, useCallback } from 'react';
import { EventData, ParticipantData } from './types';
import EventList from './EventList';
import EventDetail from './EventDetail';
import CreateEvent from './CreateEvent';
import AdminPanel from './AdminPanel';

type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'detail'; id: string }
  | { name: 'admin'; id: string };

function parseHash(): Route {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === '') {
    return { name: 'home' };
  }

  if (parts[0] === 'create') {
    return { name: 'create' };
  }

  if (parts[0] === 'event' && parts[1]) {
    return { name: 'detail', id: parts[1] };
  }

  if (parts[0] === 'admin' && parts[1]) {
    return { name: 'admin', id: parts[1] };
  }

  return { name: 'home' };
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>(parseHash());
  const [events, setEvents] = useState<EventData[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('获取活动列表失败:', err);
    }
  }, []);

  const fetchAllParticipants = useCallback(async () => {
    try {
      const allParticipants: ParticipantData[] = [];
      const eventsRes = await fetch('/api/events');
      const eventsData: EventData[] = await eventsRes.json();

      for (const event of eventsData) {
        const res = await fetch(`/api/events/${event.id}/participants`);
        const eventParticipants = await res.json();
        allParticipants.push(...eventParticipants);
      }
      setParticipants(allParticipants);
    } catch (err) {
      console.error('获取参与者数据失败:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchAllParticipants();
  }, [fetchEvents, fetchAllParticipants]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const refreshParticipants = useCallback(() => {
    fetchAllParticipants();
  }, [fetchAllParticipants]);

  const renderContent = () => {
    if (currentRoute.name === 'home') {
      return (
        <>
          <div className="header">
            <h1>活动管理系统</h1>
            <button className="btn-primary" onClick={() => navigate('/create')}>
              + 创建活动
            </button>
          </div>
          <EventList
            events={events}
            participants={participants}
            onEventClick={(id) => navigate(`/event/${id}`)}
          />
        </>
      );
    }
    if (currentRoute.name === 'create') {
      return (
        <CreateEvent
          onSuccess={(eventId) => {
            fetchEvents();
            showToast('活动创建成功', 'success');
            navigate(`/event/${eventId}`);
          }}
          onBack={() => navigate('/')}
          showToast={showToast}
        />
      );
    }
    if (currentRoute.name === 'detail') {
      return (
        <EventDetail
          eventId={currentRoute.id}
          onBack={() => navigate('/')}
          onNavigate={(path) => {
            if (path.startsWith('/admin/')) {
              refreshParticipants();
            }
            navigate(path);
          }}
          showToast={showToast}
        />
      );
    }
    if (currentRoute.name === 'admin') {
      return (
        <AdminPanel
          eventId={currentRoute.id}
          onBack={() => {
            refreshParticipants();
            navigate('/');
          }}
          showToast={showToast}
        />
      );
    }
    return null;
  };

  return (
    <div className="container">
      {renderContent()}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
