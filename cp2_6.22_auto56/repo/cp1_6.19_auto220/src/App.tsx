import { AnimatePresence, motion } from 'framer-motion';
import { useDiaryStore } from './store';
import DiaryEditor from './components/DiaryEditor';
import TimelineView from './components/TimelineView';
import DiaryDetailCanvas from './components/DiaryDetailCanvas';
import { EMOTION_PALETTES } from './types';
import { Brush, BookOpenText, X } from 'lucide-react';

export default function App() {
  const view = useDiaryStore((s) => s.view);
  const selectedEntryId = useDiaryStore((s) => s.selectedEntryId);
  const setView = useDiaryStore((s) => s.setView);
  const getSelectedEntry = useDiaryStore((s) => s.getSelectedEntry);
  const setSelectedEntryId = useDiaryStore((s) => s.setSelectedEntryId);

  const selectedEntry = selectedEntryId ? getSelectedEntry() : null;
  const selectedPalette = selectedEntry
    ? EMOTION_PALETTES.find((p) => p.type === selectedEntry.emotion)
    : null;

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-title">
          <Brush size={24} />
          墨迹心情日记
        </div>
        <div className="navbar-actions">
          <button
            className={`btn ${view === 'editor' ? 'btn-primary' : ''}`}
            onClick={() => setView('editor')}
          >
            <Brush size={16} />
            书写
          </button>
          <button
            className={`btn ${view === 'timeline' ? 'btn-primary' : ''}`}
            onClick={() => setView('timeline')}
          >
            <BookOpenText size={16} />
            时间轴
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'editor' ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <DiaryEditor />
          </motion.div>
        ) : (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <TimelineView />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            className="detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedEntryId(null);
            }}
          >
            <motion.div
              className="detail-modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="detail-header">
                <div className="detail-title">
                  <span>{selectedEntry.date}</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: selectedPalette?.color + '33',
                      color: selectedPalette?.color,
                      fontSize: 14,
                      letterSpacing: 2,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: selectedPalette?.color,
                      }}
                    />
                    {selectedPalette?.name}
                  </span>
                </div>
                <button className="close-btn" onClick={() => setSelectedEntryId(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="detail-body">
                <DiaryDetailCanvas
                  points={selectedEntry.inkPoints}
                  emotion={selectedEntry.emotion}
                />
                <div className="detail-content">
                  {selectedEntry.content || '（本日记仅留墨迹，未着一字）'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
