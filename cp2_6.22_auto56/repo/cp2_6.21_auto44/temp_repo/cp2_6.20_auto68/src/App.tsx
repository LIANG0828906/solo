import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEditor } from './components/TimelineEditor';
import { PropertyPanel } from './components/PropertyPanel';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ExportModal } from './components/ExportModal';
import { useTimelineStore } from './store/timelineStore';
import { Image, PanelRightOpen, PanelRightClose } from 'lucide-react';
import './App.css';

function App() {
  const { currentTheme } = useTimelineStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      className={`app-container theme-${currentTheme}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">时间线故事编辑器</h1>
        </div>
        <div className="header-right">
          <ThemeSwitcher />
          <motion.button
            className="export-btn"
            onClick={() => setIsExportOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image size={16} />
            <span>导出</span>
          </motion.button>
          {isMobile && (
            <motion.button
              className="panel-toggle-btn"
              onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobilePanelOpen ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </motion.button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="editor-wrapper" ref={editorRef}>
          <TimelineEditor />
        </div>

        <AnimatePresence>
          {(!isMobile || isMobilePanelOpen) && (
            <motion.aside
              className="panel-wrapper"
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={{ x: 0, y: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90 } : undefined}
            >
              <PropertyPanel />
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        targetRef={editorRef}
      />
    </motion.div>
  );
}

export default App;
