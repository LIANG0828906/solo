import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LickPanel from './components/LickPanel';
import ChordEditor from './components/ChordEditor';
import WaveformPlayer from './components/WaveformPlayer';
import PresetPanel from './components/PresetPanel';
import { useAppStore } from './store';

const MIN_PANEL = 200;
const MAX_PANEL = 600;

export default function App() {
  const ui = useAppStore((s) => s.ui);
  const setLeftWidth = useAppStore((s) => s.setLeftPanelWidth);
  const setRightWidth = useAppStore((s) => s.setRightPanelWidth);
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const setIsMobile = useAppStore((s) => s.setIsMobile);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setIsMobile]);

  const handleDragStart = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    if (ui.isMobile) return;
    e.preventDefault();
    setDragging(side);
    dragStartX.current = e.clientX;
    dragStartWidth.current = side === 'left' ? ui.leftPanelWidth : ui.rightPanelWidth;
  }, [ui.isMobile, ui.leftPanelWidth, ui.rightPanelWidth]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      if (dragging === 'left') {
        const newW = Math.max(MIN_PANEL, Math.min(MAX_PANEL, dragStartWidth.current + delta));
        setLeftWidth(newW);
      } else {
        const newW = Math.max(MIN_PANEL, Math.min(MAX_PANEL, dragStartWidth.current - delta));
        setRightWidth(newW);
      }
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, setLeftWidth, setRightWidth]);

  const leftWidth = ui.leftPanelCollapsed ? 0 : ui.leftPanelWidth;
  const rightWidth = ui.rightPanelCollapsed ? 0 : ui.rightPanelWidth;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: ui.isMobile ? 'column' : 'row',
        backgroundColor: '#121212',
        overflow: 'hidden',
      }}
    >
      {ui.isMobile && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#1E1E1E',
            borderBottom: '1px solid #424242',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 14,
              fontWeight: 900,
              color: '#64B5F6',
              letterSpacing: 2,
            }}
          >
            BandSync Studio
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleLeft}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                backgroundColor: ui.leftPanelCollapsed ? '#2A2A2A' : '#64B5F6',
                color: ui.leftPanelCollapsed ? '#B0B0B0' : '#121212',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              乐句
            </button>
            <button
              onClick={toggleRight}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                backgroundColor: ui.rightPanelCollapsed ? '#2A2A2A' : '#64B5F6',
                color: ui.rightPanelCollapsed ? '#B0B0B0' : '#121212',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              预设
            </button>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {(ui.isMobile ? !ui.leftPanelCollapsed : true) && (
          <motion.aside
            key="left"
            initial={ui.isMobile ? { height: 0, opacity: 0 } : false}
            animate={{
              width: ui.isMobile ? '100%' : leftWidth,
              height: ui.isMobile ? 'auto' : '100%',
              opacity: 1,
              flexShrink: 0,
              minHeight: ui.isMobile ? 0 : 0,
              maxHeight: ui.isMobile ? 320 : 'none',
            }}
            exit={ui.isMobile ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {!ui.isMobile && !ui.leftPanelCollapsed && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 8,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={toggleLeft}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: '#2A2A2A',
                    color: '#B0B0B0',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="收起面板"
                >
                  ‹
                </button>
              </div>
            )}
            <div
              style={{
                width: ui.isMobile ? '100%' : ui.leftPanelWidth,
                height: '100%',
              }}
            >
              <LickPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!ui.isMobile && (
        <div
          onMouseDown={(e) => handleDragStart('left', e)}
          style={{
            width: ui.leftPanelCollapsed ? 0 : 4,
            backgroundColor: '#424242',
            cursor: ui.leftPanelCollapsed ? 'default' : (dragging === 'left' ? 'col-resize' : 'col-resize'),
            flexShrink: 0,
            transition: 'background-color 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!ui.leftPanelCollapsed) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#64B5F6';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#424242';
          }}
        />
      )}

      {!ui.isMobile && ui.leftPanelCollapsed && (
        <button
          onClick={toggleLeft}
          style={{
            width: 24,
            backgroundColor: '#1E1E1E',
            color: '#64B5F6',
            border: 'none',
            borderRight: '1px solid #424242',
            fontSize: 16,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          title="展开乐句面板"
        >
          ›
        </button>
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121212',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!ui.isMobile && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#1E1E1E',
              borderBottom: '1px solid #2A2A2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 15,
                fontWeight: 900,
                color: '#64B5F6',
                letterSpacing: 3,
                background: 'linear-gradient(90deg, #64B5F6 0%, #AB47BC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              BandSync Studio
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#757575' }}>协作创作 · 灵感不熄</span>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#66BB6A',
                  boxShadow: '0 0 6px #66BB6A88',
                }}
              />
            </div>
          </div>
        )}
        <ChordEditor />
        <WaveformPlayer />
      </main>

      {!ui.isMobile && ui.rightPanelCollapsed && (
        <button
          onClick={toggleRight}
          style={{
            width: 24,
            backgroundColor: '#1E1E1E',
            color: '#64B5F6',
            border: 'none',
            borderLeft: '1px solid #424242',
            fontSize: 16,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          title="展开音色预设面板"
        >
          ‹
        </button>
      )}

      {!ui.isMobile && (
        <div
          onMouseDown={(e) => handleDragStart('right', e)}
          style={{
            width: ui.rightPanelCollapsed ? 0 : 4,
            backgroundColor: '#424242',
            cursor: ui.rightPanelCollapsed ? 'default' : 'col-resize',
            flexShrink: 0,
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!ui.rightPanelCollapsed) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#64B5F6';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#424242';
          }}
        />
      )}

      <AnimatePresence initial={false}>
        {(ui.isMobile ? !ui.rightPanelCollapsed : true) && (
          <motion.aside
            key="right"
            initial={ui.isMobile ? { height: 0, opacity: 0 } : false}
            animate={{
              width: ui.isMobile ? '100%' : rightWidth,
              height: ui.isMobile ? 'auto' : '100%',
              opacity: 1,
              flexShrink: 0,
              maxHeight: ui.isMobile ? 400 : 'none',
            }}
            exit={ui.isMobile ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {!ui.isMobile && !ui.rightPanelCollapsed && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 8,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={toggleRight}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: '#2A2A2A',
                    color: '#B0B0B0',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="收起面板"
                >
                  ›
                </button>
              </div>
            )}
            <div
              style={{
                width: ui.isMobile ? '100%' : ui.rightPanelWidth,
                height: '100%',
              }}
            >
              <PresetPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
