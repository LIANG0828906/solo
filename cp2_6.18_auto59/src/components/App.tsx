import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, CalendarDays } from 'lucide-react';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import ReportPreview from './ReportPreview';
import Resizer from './Resizer';
import SettingsModal from './SettingsModal';
import styles from '../styles/App.module.css';

export default function App() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.6);
  const [isResizing, setIsResizing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    setIsResizing(true);
  }, [leftPanelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const deltaX = e.clientX - startXRef.current;
      const deltaRatio = deltaX / containerWidth;
      const newRatio = startWidthRef.current + deltaRatio;
      const clamped = Math.max(0.2, Math.min(0.8, newRatio));
      setLeftPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    document.body.style.overflow = isResizing ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isResizing]);

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <CalendarDays size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span>DayBrief</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>日报生成器</span>
          </div>
        </div>
        <button
          className={styles.settingsBtn}
          onClick={() => setIsSettingsOpen(true)}
          aria-label="设置"
        >
          <Settings size={18} />
        </button>
      </header>

      <div className={styles.mainContent} ref={containerRef}>
        <div
          className={styles.taskPanel}
          style={{ width: `${leftPanelWidth * 100}%` }}
        >
          <div className={styles.taskPanelHeader}>
            <TaskInput />
          </div>
          <div className={styles.taskPanelBody}>
            <TaskList />
          </div>
        </div>

        <Resizer isDragging={isResizing} onResizeStart={handleResizeStart} />

        <div className={styles.previewPanel}>
          <div className={styles.previewPanelBody}>
            <ReportPreview />
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
