import { create } from 'zustand';
import { eventBus } from './engine/EventBus';
import { galleryManager, GraffitiWork } from './gallery/GalleryManager';
import CreateWall from './components/CreateWall';
import GalleryView from './components/GalleryView';

type Page = 'create' | 'gallery';

interface AppState {
  page: Page;
  works: GraffitiWork[];
  setPage: (page: Page) => void;
  refreshWorks: () => void;
  toggleLike: (id: string) => void;
  addComment: (workId: string, text: string) => void;
}

const useStore = create<AppState>((set) => {
  eventBus.on('gallery:updated', (works: GraffitiWork[]) => {
    set({ works: [...works] });
  });

  return {
    page: 'create',
    works: galleryManager.getWorks(),
    setPage: (page) => set({ page }),
    refreshWorks: () => set({ works: galleryManager.getWorks() }),
    toggleLike: (id) => {
      galleryManager.toggleLike(id);
    },
    addComment: (workId, text) => {
      galleryManager.addComment(workId, text);
    },
  };
});

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  padding: '0 32px',
  height: '56px',
  background: '#16213E',
  borderBottom: '1px solid #2A2A4A',
  flexShrink: 0,
};

const logoStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#E74C3C',
  letterSpacing: '1px',
  marginRight: '16px',
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  color: active ? '#E74C3C' : '#AAA',
  fontSize: '14px',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: '6px',
  transition: 'color 0.2s, background 0.2s',
  borderBottom: active ? '2px solid #E74C3C' : '2px solid transparent',
});

export default function App() {
  const page = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1A1A2E', color: '#EEE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav style={navStyle}>
        <span style={logoStyle}>GRAFFITI</span>
        <button
          style={navBtnStyle(page === 'create')}
          onClick={() => setPage('create')}
          onMouseEnter={e => { if (page !== 'create') (e.target as HTMLElement).style.background = '#2A2A4A'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
        >
          创作涂鸦
        </button>
        <button
          style={navBtnStyle(page === 'gallery')}
          onClick={() => setPage('gallery')}
          onMouseEnter={e => { if (page !== 'gallery') (e.target as HTMLElement).style.background = '#2A2A4A'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
        >
          涂鸦画廊
        </button>
      </nav>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {page === 'create' && <CreateWall />}
        {page === 'gallery' && <GalleryView />}
      </div>
    </div>
  );
}
