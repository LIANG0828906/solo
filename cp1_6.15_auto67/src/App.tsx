import React, { useState, useEffect, useCallback } from 'react';
import { Event, Participant, TabType } from './types';
import EventList from './EventList';
import SignIn from './SignIn';
import CreateEvent from './CreateEvent';
import ManageEvents from './ManageEvents';
import EnrollModal from './EnrollModal';

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollModalEvent, setEnrollModalEvent] = useState<Event | null>(null);
  const [newEventId, setNewEventId] = useState<string | null>(null);

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showAlert('无法加载活动数据，请确保后端服务已启动', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEnroll = useCallback((event: Event) => {
    setEnrollModalEvent(event);
  }, []);

  const confirmEnroll = useCallback(async (eventId: string, name: string, phone: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/events/${eventId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '报名失败');
      }

      setEvents(prev => prev.map(e => e.id === eventId ? data.event : e));
      showAlert('报名成功！', 'success');
      setEnrollModalEvent(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '报名失败';
      showAlert(errorMessage, 'error');
    }
  }, [showAlert]);

  const handleCreateEvent = useCallback(async (eventData: Omit<Event, 'id' | 'participants' | 'createdAt'>) => {
    try {
      const response = await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建活动失败');
      }

      setEvents(prev => [data, ...prev]);
      setNewEventId(data.id);
      setTimeout(() => setNewEventId(null), 500);
      showAlert('活动创建成功！', 'success');
      setActiveTab('list');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建活动失败';
      showAlert(errorMessage, 'error');
    }
  }, [showAlert]);

  const handleSignIn = useCallback(async (eventId: string, participantId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/events/${eventId}/signin/${participantId}`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '签到失败');
      }

      setEvents(prev => prev.map(e => e.id === eventId ? data.event : e));
      showAlert('签到成功！', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '签到失败';
      showAlert(errorMessage, 'error');
    }
  }, [showAlert]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'list', label: '活动列表' },
    { key: 'create', label: '创建活动' },
    { key: 'signin', label: '活动签到' },
    { key: 'manage', label: '活动管理' },
  ];

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <div className="header">
        <h1>社区活动报名与签到平台</h1>
        <p>轻松创建活动，高效管理参与</p>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <EventList
          events={events}
          onEnroll={handleEnroll}
          newEventId={newEventId}
        />
      )}

      {activeTab === 'create' && (
        <CreateEvent onCreate={handleCreateEvent} />
      )}

      {activeTab === 'signin' && (
        <SignIn
          events={events}
          onSignIn={handleSignIn}
        />
      )}

      {activeTab === 'manage' && (
        <ManageEvents events={events} />
      )}

      {enrollModalEvent && (
        <EnrollModal
          event={enrollModalEvent}
          onConfirm={confirmEnroll}
          onCancel={() => setEnrollModalEvent(null)}
        />
      )}
    </div>
  );
};

export default App;
