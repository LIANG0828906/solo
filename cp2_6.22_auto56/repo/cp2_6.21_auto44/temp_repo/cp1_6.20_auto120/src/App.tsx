import { createContext, useContext } from 'react';
import { useBrandState } from './hooks/useBrandState';
import { BrandContextType } from './types';
import BrandToolbar from './components/BrandToolbar';
import CanvasGrid from './components/CanvasGrid';

const BrandContext = createContext<BrandContextType | null>(null);

export function useBrand(): BrandContextType {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}

function BrandProvider({ children }: { children: React.ReactNode }) {
  const state = useBrandState();
  return <BrandContext.Provider value={state}>{children}</BrandContext.Provider>;
}

function AppLayout() {
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoIcon}>🎨</div>
          <div>
            <div style={styles.appTitle}>Brand Canvas</div>
            <div style={styles.appSubtitle}>品牌视觉多画板对比排版工具</div>
          </div>
        </div>
      </header>

      <div style={styles.main}>
        <BrandToolbar />
        <CanvasGrid />
      </div>

      <footer style={styles.footer}>
        <span style={styles.watermark}>Brand Canvas</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFA',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E8E8E8',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3498DB, #2980B9)',
    borderRadius: 10,
    color: '#fff',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A1A1A',
    lineHeight: 1.2,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  main: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E8E8E8',
  },
  watermark: {
    fontSize: 11,
    color: '#BBB',
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
};

export default function App() {
  return (
    <BrandProvider>
      <AppLayout />
    </BrandProvider>
  );
}
