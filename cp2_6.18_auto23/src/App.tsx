import { useState, useEffect, useCallback } from 'react';
import EventList from './modules/event/EventList';
import EventDetail from './modules/event/EventDetail';
import UserDashboard from './modules/user/UserDashboard';
import { useEventStore } from './store/eventStore';
import './styles/global.css';

type View = 'list' | 'detail' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { fetchEvents, fetchRegistrations } = useEventStore();

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, [fetchEvents, fetchRegistrations]);

  const navigateTo = useCallback((view: View, eventId?: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      if (eventId) {
        setSelectedEventId(eventId);
      }
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  }, []);

  const goToList = useCallback(() => {
    navigateTo('list');
  }, [navigateTo]);

  const goToDetail = useCallback((eventId: string) => {
    navigateTo('detail', eventId);
  }, [navigateTo]);

  const goToDashboard = useCallback(() => {
    navigateTo('dashboard');
  }, [navigateTo]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={goToList}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="logo-text">EventPulse</span>
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
              onClick={goToList}
            >
              活动列表
            </button>
            <button
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={goToDashboard}
            >
              个人中心
            </button>
          </nav>
        </div>
      </header>

      <main className={`app-main ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {currentView === 'list' && (
          <EventList onEventClick={goToDetail} />
        )}
        {currentView === 'detail' && selectedEventId && (
          <EventDetail eventId={selectedEventId} onBack={goToList} />
        )}
        {currentView === 'dashboard' && (
          <UserDashboard onEventClick={goToDetail} />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 EventPulse - 让每一场活动都精彩</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
