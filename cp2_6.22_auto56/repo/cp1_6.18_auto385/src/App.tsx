import React, { useEffect, useState, useCallback, useRef } from 'react';
import ControlPanel from '@/components/ControlPanel';
import StatusBar from '@/components/StatusBar';
import RendererScene from '@/modules/sceneRenderer/RendererScene';
import { useStore } from '@/store/useStore';
import { parseShareUrl } from '@/modules/sceneRenderer/export';
import { processImage, getProcessedDimensions } from '@/modules/imageProcessor/processor';

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1A1A2E 0%, #0F0F1E 100%)',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    padding: 16,
    gap: 16,
  },
  sceneWrap: {
    flex: 1,
    background: '#0F0F1E',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 0 24px rgba(0, 212, 255, 0.06), inset 0 0 0 1px #00D4FF11',
  },
  emptyOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 2,
  },
  emptyTitle: {
    color: '#E0E0E0',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 4,
    marginBottom: 8,
    background: 'linear-gradient(90deg, #00D4FF, #00FF88, #00D4FF)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'shine 3s linear infinite',
  },
  emptySub: {
    color: '#6A6A7A',
    fontSize: 13,
    letterSpacing: 2,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.6,
  },
  cornerBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 3,
    padding: '6px 12px',
    borderRadius: 6,
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid #00D4FF33',
    color: '#00D4FF',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    pointerEvents: 'none',
  },
};

const DEMO_PATTERN_SIZE = 120;

function generateDemoDepthMap(): { map: number[]; w: number; h: number } {
  const w = DEMO_PATTERN_SIZE;
  const h = DEMO_PATTERN_SIZE;
  const map = new Array(w * h);
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = Math.min(w, h) * 0.42;
      let d = 0;
      if (dist < r) {
        const t = 1 - dist / r;
        d = 255 * (0.15 + 0.85 * Math.pow(t, 0.8));
        const rings = Math.sin(dist * 0.18) * 0.5 + 0.5;
        d *= 0.6 + 0.4 * rings;
        const spokes = Math.sin(Math.atan2(dy, dx) * 6 + dist * 0.05) * 0.5 + 0.5;
        d *= 0.75 + 0.25 * spokes;
      } else {
        d = 10 + (Math.random() - 0.5) * 10;
      }
      map[y * w + x] = Math.max(0, Math.min(255, d + (Math.random() - 0.5) * 4));
    }
  }
  return { map, w, h };
}

const App: React.FC = () => {
  const store = useStore();
  const [demoReady, setDemoReady] = useState(false);
  const demoInitRef = useRef(false);

  useEffect(() => {
    const params = parseShareUrl();
    if (params) {
      if (params.depth !== undefined) store.setBumpStrength(params.depth);
      if (params.lightX !== undefined) store.setLightX(params.lightX);
      if (params.lightY !== undefined) store.setLightY(params.lightY);
      if (params.material) store.setMaterial(params.material);
    }
  }, [store]);

  useEffect(() => {
    if (demoInitRef.current) return;
    demoInitRef.current = true;
    try {
      const { map, w, h } = generateDemoDepthMap();
      store.setDepthMap(map, w, h);
      setDemoReady(true);
    } catch (e) {
      console.warn('demo generation failed', e);
      setDemoReady(true);
    }
  }, [store]);

  const showEmptyHint = !store.depthMap;

  const cssAnim = `
    @keyframes shine {
      to { background-position: 200% center; }
    }
  `;

  return (
    <>
      <style>{cssAnim}</style>
      <div style={styles.root}>
        <div style={styles.mainArea}>
          <ControlPanel />
          <div style={styles.sceneWrap}>
            <div style={styles.cornerBadge}>WebGL · Three.js</div>
            <RendererScene />
            {showEmptyHint && demoReady && (
              <div style={styles.emptyOverlay}>
                <div style={styles.emptyIcon}>✨</div>
                <div style={styles.emptyTitle}>光影雕刻师</div>
                <div style={styles.emptySub}>上传图片，将光影凝固成浮雕</div>
              </div>
            )}
          </div>
        </div>
        <StatusBar />
      </div>
    </>
  );
};

export default App;
