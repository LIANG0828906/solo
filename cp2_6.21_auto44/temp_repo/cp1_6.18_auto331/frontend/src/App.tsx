import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { notesAPI } from './services/api';
import { saveNotesToCache, getNotesFromCache, saveUserToCache, getUserFromCache, setCacheTimestamp, getLastSyncTime } from './utils/indexedDB';
import Sidebar from './components/Sidebar';
import CardList from './components/CardList';
import MapView from './components/MapView';
import ComparePanel from './components/ComparePanel';
import Timeline from './components/Timeline';
import LoginModal from './components/LoginModal';
import OfflineBanner from './components/OfflineBanner';

function App() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setNotes = useAppStore((state) => state.setNotes);
  const setIsOnline = useAppStore((state) => state.setIsOnline);
  const isOnline = useAppStore((state) => state.isOnline);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const comparePanelOpen = useAppStore((state) => state.comparePanelOpen);

  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchNotes();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    const initApp = async () => {
      const cachedUser = await getUserFromCache();
      if (cachedUser) {
        setUser(cachedUser);
      }

      if (navigator.onLine) {
        fetchNotes();
      } else {
        const cachedNotes = await getNotesFromCache();
        if (cachedNotes.length > 0) {
          setNotes(cachedNotes);
        }
      }
    };

    initApp();
  }, [setUser, setNotes]);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await notesAPI.getAll(1);
      setNotes(data.notes);
      await saveNotesToCache(data.notes);
      await setCacheTimestamp();
    } catch (error) {
      console.error('获取笔记失败:', error);
      const cachedNotes = await getNotesFromCache();
      if (cachedNotes.length > 0) {
        setNotes(cachedNotes);
      }
    }
  }, [setNotes]);

  const handlePlayNote = useCallback((noteId: number) => {
    const notes = useAppStore.getState().notes;
    const note = notes.find((n) => n.id === noteId);
    
    if (!note || !note.audioUrl) return;

    if (!audioRefs.current[noteId]) {
      audioRefs.current[noteId] = new Audio(note.audioUrl);
    }

    const audio = audioRefs.current[noteId];
    
    Object.entries(audioRefs.current).forEach(([id, a]) => {
      if (Number(id) !== noteId) {
        a.pause();
        a.currentTime = 0;
      }
    });

    if (audio.paused) {
      audio.currentTime = 0;
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  if (!user) {
    return (
      <>
        <OfflineBanner />
        <LoginModal />
      </>
    );
  }

  return (
    <div className="app-container">
      <OfflineBanner />

      <header className="mobile-header">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <h1 className="mobile-title">语音地图</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="main-layout">
        <Sidebar />

        <div className="content-area">
          <div className="main-content">
            <div className="left-panel">
              <CardList onPlayNote={handlePlayNote} />
            </div>

            <div className="center-panel">
              <MapView />
            </div>

            <div className={`right-panel ${comparePanelOpen ? 'open' : ''}`}>
              <ComparePanel />
            </div>
          </div>

          <div className="timeline-wrapper">
            <Timeline />
          </div>
        </div>
      </div>

      <style>{appStyles}</style>
    </div>
  );
}

const appStyles = `
  .app-container {
    width: 100vw;
    height: 100vh;
    background: #121212;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .mobile-header {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #1E1E2E;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .menu-btn {
    width: 40px;
    height: 40px;
    background: #2A2A3A;
    border: none;
    border-radius: 8px;
    color: #E0E0E0;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-title {
    font-size: 16px;
    font-weight: 600;
    color: #E0E0E0;
    margin: 0;
    background: linear-gradient(135deg, #7C4DFF, #00BFFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .main-layout {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
    min-height: 0;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    min-height: 0;
  }

  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 320px 1fr 320px;
    gap: 16px;
    min-height: 0;
  }

  .left-panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1E1E2E;
    border-radius: 20px;
    padding: 16px;
  }

  .center-panel {
    min-height: 0;
    min-width: 0;
  }

  .right-panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }

  .right-panel:not(.open) {
    opacity: 0.7;
  }

  .timeline-wrapper {
    flex-shrink: 0;
  }

  @media (max-width: 1200px) {
    .main-content {
      grid-template-columns: 280px 1fr 280px;
    }
  }

  @media (max-width: 1024px) {
    .main-content {
      grid-template-columns: 1fr 1fr;
    }
    
    .right-panel {
      grid-column: 1 / -1;
      max-height: 300px;
    }
  }

  @media (max-width: 768px) {
    .mobile-header {
      display: flex;
    }

    .main-layout {
      padding: 12px;
      gap: 12px;
    }

    .main-content {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .left-panel {
      max-height: 400px;
      order: 2;
    }

    .center-panel {
      height: 300px;
      order: 1;
    }

    .right-panel {
      order: 3;
      max-height: none;
    }

    .content-area {
      gap: 12px;
    }
  }
`;

export default App;
