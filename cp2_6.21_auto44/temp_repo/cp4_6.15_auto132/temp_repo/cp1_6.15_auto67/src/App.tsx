import React from 'react';
import { TabType } from './types';
import EventList from './EventList';
import SignIn from './SignIn';
import CreateEvent from './CreateEvent';
import ManageEvents from './ManageEvents';
import EnrollModal from './EnrollModal';
import { useEvent } from './context/EventContext';

const App: React.FC = () => {
  const { state, dispatch, enroll, createEvent, signIn } = useEvent();
  const { events, activeTab, alert, loading, enrollModalEvent, newEventId } = state;

  const handleEnroll = (event: typeof events[0]) => {
    dispatch({ type: 'SET_ENROLL_MODAL', payload: event });
  };

  const handleCreateEvent = async (eventData: Parameters<typeof createEvent>[0]): Promise<boolean> => {
    return await createEvent(eventData);
  };

  const handleSignIn = async (eventId: string, participantId: string): Promise<boolean> => {
    return await signIn(eventId, participantId);
  };

  const confirmEnroll = async (eventId: string, name: string, phone: string): Promise<boolean> => {
    return await enroll(eventId, name, phone);
  };

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
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
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
          onCancel={() => dispatch({ type: 'SET_ENROLL_MODAL', payload: null })}
        />
      )}
    </div>
  );
};

export default App;
