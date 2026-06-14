import { useState, useEffect, useCallback } from 'react';
import type { Artist, Booking, Toast as ToastType } from './types';
import { getArtists, getBookings } from './utils/api';
import ArtistList from './components/ArtistList';
import BookingCalendar from './components/BookingCalendar';
import BookingList from './components/BookingList';
import { ToastContainer } from './components/Toast';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

export default function App() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const newToast: ToastType = {
      id: `toast-${uuidv4()}`,
      type,
      message,
      icon: icons[type],
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      const error = err as Error;
      showToast('error', error.message || '加载预约列表失败');
    }
  }, [showToast]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [artistsData] = await Promise.all([
          getArtists(),
        ]);
        setArtists(artistsData);
        await fetchBookings();
      } catch (err) {
        const error = err as Error;
        showToast('error', error.message || '加载数据失败');
      } finally {
        setLoadingArtists(false);
      }
    };
    loadInitial();
  }, [fetchBookings, showToast]);

  const handleBookArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setSidebarOpen(false);
  };

  const handleBackToList = () => {
    setSelectedArtist(null);
  };

  const handleBookSuccess = () => {
    fetchBookings();
    setSidebarOpen(true);
  };

  const handleCancelSuccess = () => {
    fetchBookings();
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <button className="logo" onClick={handleBackToList}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>艺术工作室</span>
          </button>
          <nav className="header-nav">
            <h1 className="page-title">
              {selectedArtist ? '预约日历' : '艺术家列表'}
            </h1>
          </nav>
          <button
            className={`sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {bookings.filter(b => b.status === 'confirmed').length > 0 && (
              <span className="badge">{bookings.filter(b => b.status === 'confirmed').length}</span>
            )}
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          <div className="main-content">
            {!selectedArtist ? (
              <>
                <div className="page-intro">
                  <h2>选择您的艺术导师</h2>
                  <p>浏览我们精心挑选的艺术家团队，预约一对一创作指导</p>
                </div>
                <ArtistList
                  artists={artists}
                  onBook={handleBookArtist}
                  loading={loadingArtists}
                />
              </>
            ) : (
              <BookingCalendar
                artist={selectedArtist}
                onBack={handleBackToList}
                onBookSuccess={handleBookSuccess}
                onToast={showToast}
              />
            )}
          </div>
        </main>

        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-inner">
            <BookingList
              bookings={bookings}
              artists={artists}
              onCancelSuccess={handleCancelSuccess}
              onToast={showToast}
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
