import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Timeline from '@/components/Timeline';
import Editor from '@/components/Editor';
import HistoryModal from '@/components/HistoryModal';
import ExportModal from '@/components/ExportModal';
import { useNoteStore } from '@/store/noteStore';
import { COLORS, SIDEBAR_WIDTH } from '@/utils/constants';

function App() {
  const { isLoading, currentNoteId, notes, loadNotes } = useNoteStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentNote = notes.find((note) => note.id === currentNoteId);

  const handleOpenHistory = () => {
    setShowHistory(true);
  };

  const handleOpenExport = () => {
    setShowExport(true);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: COLORS.woodMedium,
        }}
      >
        <p style={{ color: COLORS.paper, fontSize: '16px' }}>加载中...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: COLORS.woodMedium,
          overflow: 'hidden',
        }}
      >
        {isMobile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '56px',
              backgroundColor: COLORS.woodDark,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              zIndex: 50,
              borderBottom: `1px solid ${COLORS.woodMedium}`,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={24} />
            </button>
            <span
              style={{
                color: '#fff',
                marginLeft: '12px',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              RetroType
            </span>
          </div>
        )}

        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99,
            }}
          />
        )}

        <Timeline
          isOpen={isMobile ? sidebarOpen : true}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            marginLeft: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
            paddingTop: isMobile ? '56px' : 0,
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <Editor
                  onOpenHistory={handleOpenHistory}
                  onOpenExport={handleOpenExport}
                />
              }
            />
          </Routes>
        </main>

        {showHistory && currentNoteId && (
          <HistoryModal
            noteId={currentNoteId}
            onClose={() => setShowHistory(false)}
          />
        )}

        {showExport && currentNote && (
          <ExportModal
            title={currentNote.title}
            content={currentNote.content}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
