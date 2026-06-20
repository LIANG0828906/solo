import React, { useEffect, useState } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { MaterialPanel } from '@/components/MaterialPanel';
import { ExhibitionSpace } from '@/components/ExhibitionSpace';
import { ExhibitionForm } from '@/components/ExhibitionForm';
import { VisitorPage } from '@/components/VisitorPage';
import { useExhibitionStore } from '@/store/useExhibitionStore';

const parseHashRoute = (): { mode: 'editor' | 'visitor'; id: string | null } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { mode: 'editor', id: null };
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'view' && parts[1]) {
    return { mode: 'visitor', id: parts[1] };
  }
  if (parts[0] === 'exhibition' && parts[1]) {
    return { mode: 'editor', id: parts[1] };
  }
  return { mode: 'editor', id: null };
};

const Home: React.FC = () => {
  const { setCurrentExhibition, currentExhibitionId, exhibitions, getExhibitionById } = useExhibitionStore();
  const [showForm, setShowForm] = useState(false);
  const [route, setRoute] = useState(parseHashRoute());
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (route.mode === 'editor' && route.id && !currentExhibitionId) {
      const ex = getExhibitionById(route.id);
      if (ex) setCurrentExhibition(route.id);
    }
  }, [route, currentExhibitionId, getExhibitionById, setCurrentExhibition]);

  useEffect(() => {
    if (exhibitions.length === 0 && route.mode === 'editor') {
      const timer = setTimeout(() => setShowForm(true), 500);
      return () => clearTimeout(timer);
    }
  }, [exhibitions.length, route.mode]);

  useEffect(() => {
    const onResize = () => {
      setPanelOpen(window.innerWidth >= 1024);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (route.mode === 'visitor' && route.id) {
    return (
      <VisitorPage
        exhibitionId={route.id}
        onBack={() => {
          window.location.hash = '';
          setRoute({ mode: 'editor', id: null });
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <Toolbar onNewExhibition={() => setShowForm(true)} />

      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {panelOpen ? (
          <div
            style={{
              width: window.innerWidth >= 1024 ? 320 : '100%',
              height: '100%',
              flexShrink: 0,
              zIndex: 40,
              borderRight: window.innerWidth >= 1024 ? undefined : 'none',
            }}
          >
            <MaterialPanel />
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            height: '100%',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <ExhibitionSpace readonly={false} />

          {window.innerWidth < 1024 && (
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="btn-secondary"
              style={{
                position: 'absolute',
                left: 16,
                top: 16,
                zIndex: 100,
                padding: '8px 14px',
                fontSize: 12,
              }}
            >
              {panelOpen ? '✕ 隐藏素材' : '📁 素材面板'}
            </button>
          )}
        </div>
      </div>

      {showForm && <ExhibitionForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

export default Home;
