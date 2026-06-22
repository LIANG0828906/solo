import React, { useState, useEffect, useRef, useCallback } from 'react';
import ElementInventory from './ElementInventory';
import SynthesisFurnace from './SynthesisFurnace';
import OutputPanel, { LogEntry } from './OutputPanel';
import {
  Element,
  ALL_ELEMENTS,
  INITIAL_ELEMENT_IDS,
  RARITY_MULTIPLIER,
  BASE_GOLD_PER_SECOND,
} from './synthesisData';

const INITIAL_SLOTS: (Element | null)[] = [null, null, null, null];
const MAX_LOGS = 100;

const getInitialElements = (): Element[] => {
  return INITIAL_ELEMENT_IDS.map((id) => ALL_ELEMENTS[id]);
};

const calculateGoldPerSecond = (elements: Element[]): number => {
  let total = 0;
  for (const element of elements) {
    const multiplier = RARITY_MULTIPLIER[element.rarity] || 1;
    total += BASE_GOLD_PER_SECOND * multiplier;
  }
  return total;
};

const AlchemyGame: React.FC = () => {
  const [ownedElements, setOwnedElements] = useState<Element[]>(getInitialElements);
  const [slots, setSlots] = useState<(Element | null)[]>(INITIAL_SLOTS);
  const [gold, setGold] = useState<number>(0);
  const [goldPerSecond, setGoldPerSecond] = useState<number>(() =>
    calculateGoldPerSecond(getInitialElements())
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState<boolean>(false);

  const logIdRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;
      setGold((prev) => prev + goldPerSecond * delta);
    }, 100);
    return () => clearInterval(interval);
  }, [goldPerSecond]);

  const handleDragStart = useCallback(() => {
  }, []);

  const handleSlotChange = useCallback((slotIndex: number, element: Element | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = element;
      return next;
    });
  }, []);

  const handleSynthesis = useCallback((outputElement: Element, inputs: Element[]) => {
    setOwnedElements((prev) => {
      const exists = prev.some((e) => e.id === outputElement.id);
      if (exists) return prev;
      const next = [...prev, outputElement];
      setGoldPerSecond(calculateGoldPerSecond(next));
      return next;
    });

    setLogs((prev) => {
      const newEntry: LogEntry = {
        id: ++logIdRef.current,
        timestamp: new Date(),
        inputs: inputs.map((e) => e.name),
        output: outputElement,
      };
      const next = [...prev, newEntry];
      if (next.length > MAX_LOGS) {
        return next.slice(next.length - MAX_LOGS);
      }
      return next;
    });

    setSlots([null, null, null, null]);
  }, []);

  const handleReset = useCallback(() => {
    setShowResetDialog(false);
    setOwnedElements(getInitialElements());
    setSlots(INITIAL_SLOTS);
    setGold(0);
    setGoldPerSecond(calculateGoldPerSecond(getInitialElements()));
    setLogs([]);
    lastUpdateRef.current = Date.now();
  }, []);

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes goldFlash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
          25% { box-shadow: 0 0 30px 10px rgba(255, 215, 0, 0.9), 0 0 60px 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 20px 6px rgba(255, 215, 0, 0.7); }
          75% { box-shadow: 0 0 30px 10px rgba(255, 215, 0, 0.9), 0 0 60px 20px rgba(255, 215, 0, 0.5); }
        }
        @keyframes flyToInventory {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateX(-120%) translateY(-60px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateX(-220%) translateY(-100px) scale(0.6);
          }
        }
        .element-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 16px rgba(0, 0, 0, 0.3) !important;
        }
        .element-card:active {
          cursor: grabbing;
          transform: scale(1.2);
        }
        * {
          -webkit-user-drag: element;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #777;
        }
      `}</style>

      <button style={styles.resetButton} onClick={() => setShowResetDialog(true)} title="重置游戏">
        ↻
      </button>

      {isMobile && (
        <>
          <button
            style={{ ...styles.hamburger, left: 12 }}
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
          >
            ☰
          </button>
          <button
            style={{ ...styles.hamburger, right: 12 }}
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
          >
            ☰
          </button>
        </>
      )}

      <div style={styles.mainContainer}>
        <div
          style={{
            ...styles.inventoryWrap,
            ...(isMobile ? {
              position: 'fixed',
              left: leftDrawerOpen ? 0 : -300,
              top: 0,
              height: '100vh',
              zIndex: 50,
              transition: 'left 0.3s ease',
              boxShadow: leftDrawerOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
            } : {}),
          }}
        >
          <ElementInventory elements={ownedElements} onDragStart={handleDragStart} />
        </div>

        <div style={styles.centerArea}>
          <div style={styles.header}>
            <h1 style={styles.appTitle}>⚗️ 炼金术模拟器</h1>
          </div>
          <SynthesisFurnace
            slots={slots}
            onSlotChange={handleSlotChange}
            onSynthesis={handleSynthesis}
          />
        </div>

        <div
          style={{
            ...styles.outputWrap,
            ...(isMobile ? {
              position: 'fixed',
              right: rightDrawerOpen ? 0 : -270,
              top: 0,
              height: '100vh',
              zIndex: 50,
              transition: 'right 0.3s ease',
              boxShadow: rightDrawerOpen ? '-4px 0 20px rgba(0,0,0,0.5)' : 'none',
            } : {}),
          }}
        >
          <OutputPanel gold={gold} goldPerSecond={goldPerSecond} logs={logs} />
        </div>
      </div>

      {showResetDialog && (
        <div style={styles.dialogOverlay} onClick={() => setShowResetDialog(false)}>
          <div style={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.dialogTitle}>确认重置</h3>
            <p style={styles.dialogText}>确定要重置所有进度吗？所有已合成的元素将消失，金币和日志将被清空。</p>
            <div style={styles.dialogActions}>
              <button style={styles.dialogCancel} onClick={() => setShowResetDialog(false)}>
                取消
              </button>
              <button style={styles.dialogConfirm} onClick={handleReset}>
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile && (leftDrawerOpen || rightDrawerOpen) && (
        <div
          style={styles.drawerMask}
          onClick={() => {
            setLeftDrawerOpen(false);
            setRightDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F1A 100%)',
    padding: 20,
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    color: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContainer: {
    display: 'flex',
    gap: 20,
    minHeight: 'calc(100vh - 40px)',
    alignItems: 'stretch',
  },
  inventoryWrap: {
    display: 'flex',
  },
  outputWrap: {
    display: 'flex',
  },
  centerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 0,
  },
  header: {
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
  },
  appTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
    letterSpacing: 2,
  },
  resetButton: {
    position: 'fixed',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#FF5252',
    color: '#FFFFFF',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, transform 0.2s',
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    fontWeight: 700,
  },
  hamburger: {
    position: 'fixed',
    top: 70,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
    color: '#FFD700',
    border: '1px solid #FFD700',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  dialogOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  dialogBox: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    border: '1px solid #2A2A3E',
  },
  dialogTitle: {
    color: '#FF5252',
    fontSize: 20,
    fontWeight: 600,
    margin: '0 0 12px 0',
  },
  dialogText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },
  dialogActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  dialogCancel: {
    padding: '8px 20px',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#AAAAAA',
    border: '1px solid #555',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  dialogConfirm: {
    padding: '8px 20px',
    borderRadius: 8,
    backgroundColor: '#FF5252',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  drawerMask: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 45,
  },
};

export default AlchemyGame;
