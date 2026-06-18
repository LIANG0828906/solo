import { useState, useEffect, useRef, useCallback } from 'react';
import { BodyPart, ActionType, OutfitState, WardrobeItem } from '../types';
import { wardrobeCategories, defaultOutfit } from '../data/wardrobe';
import { useAnimation } from '../hooks/useAnimation';
import { drawToCanvas } from '../engine/pixelRenderer';
import { WardrobePanel } from './WardrobePanel';

const PIXEL_SIZE = 20;
const CANVAS_SIZE = 16 * PIXEL_SIZE;

function App() {
  const [outfit, setOutfit] = useState<OutfitState>(defaultOutfit);
  const [actionType, setActionType] = useState<ActionType>('idle');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['hair1', 'top1', 'bottom1', 'shoes1', 'weapon1']));
  const [topPattern, setTopPattern] = useState<string | undefined>();
  const [flashStates, setFlashStates] = useState<Map<BodyPart, number>>(new Map());
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelMatrix = useAnimation(actionType, outfit, flashStates, topPattern);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pixelMatrix.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawToCanvas(ctx, pixelMatrix, PIXEL_SIZE);
  }, [pixelMatrix]);

  useEffect(() => {
    if (flashStates.size === 0) return;
    
    const timer = setTimeout(() => {
      setFlashStates(new Map());
    }, 250);
    
    return () => clearTimeout(timer);
  }, [flashStates]);

  const handleSelect = useCallback((item: WardrobeItem) => {
    setOutfit(prev => ({
      ...prev,
      [item.part]: item.color,
    }));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const cat of wardrobeCategories) {
        for (const i of cat.items) {
          if (i.part === item.part) {
            next.delete(i.id);
          }
        }
      }
      next.add(item.id);
      return next;
    });
    
    if (item.part === BodyPart.TOP) {
      setTopPattern(item.pattern);
    }
    
    setFlashStates(new Map([[item.part, performance.now()]]));
  }, []);

  const handleActionChange = useCallback((action: ActionType) => {
    setActionType(action);
  }, []);

  const actionButtons: { type: ActionType; label: string }[] = [
    { type: 'walk', label: '行走' },
    { type: 'jump', label: '跳跃' },
    { type: 'idle', label: '待机' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.displayArea}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={styles.canvas}
          />
        </div>
        
        {!isMobile && (
          <WardrobePanel
            categories={wardrobeCategories}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        )}
      </div>
      
      <div style={styles.actionBar}>
        {actionButtons.map((btn) => (
          <button
            key={btn.type}
            style={{
              ...styles.actionButton,
              backgroundColor: actionType === btn.type ? '#6C63FF' : '#E0E0E0',
              color: actionType === btn.type ? '#FFFFFF' : '#333333',
            }}
            onClick={() => handleActionChange(btn.type)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      
      {isMobile && (
        <>
          <button
            style={styles.mobileToggle}
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <span style={styles.toggleArrow}>
              {panelOpen ? '›' : '‹'}
            </span>
          </button>
          <div
            style={{
              ...styles.mobilePanel,
              transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            <WardrobePanel
              categories={wardrobeCategories}
              selectedIds={selectedIds}
              onSelect={(item) => {
                handleSelect(item);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F0E6FF 0%, #E0D4F0 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },
  mainContent: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '0',
    height: '480px',
  },
  displayArea: {
    width: '420px',
    height: '480px',
    backgroundColor: '#F5F5F5',
    borderRadius: '20px',
    border: '2px dashed #D0D0D0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  canvas: {
    imageRendering: 'pixelated',
  },
  actionBar: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  actionButton: {
    width: '80px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  mobileToggle: {
    position: 'fixed',
    right: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '80px',
    backgroundColor: '#6C63FF',
    border: 'none',
    borderRadius: '8px 0 0 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
  },
  toggleArrow: {
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  mobilePanel: {
    position: 'fixed',
    right: '0',
    top: '0',
    height: '100vh',
    zIndex: 100,
    transition: 'transform 0.3s ease',
    boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
  },
};

export default App;
