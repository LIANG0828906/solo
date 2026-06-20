import { useEffect } from 'react';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import PropertyPanel from '@/components/PropertyPanel';
import { useStore } from '@/store/slice';

export default function App() {
  const responsiveMode = useStore((s) => s.responsiveMode);
  const setResponsiveMode = useStore((s) => s.setResponsiveMode);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const selectedIds = useStore((s) => s.selectedIds);

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth;
      if (w < 768) setResponsiveMode('mobile');
      else if (w < 1024) setResponsiveMode('tablet');
      else setResponsiveMode('desktop');
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [setResponsiveMode]);

  const showPropertyPanel = selectedIds.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div className="app-bg" />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
        <Toolbar />

        {responsiveMode === 'desktop' && (
          <div
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              bottom: 0,
              width: sidebarCollapsed ? 0 : 280,
              transition: 'width 0.35s ease',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <Sidebar />
          </div>
        )}

        {(responsiveMode === 'tablet' || responsiveMode === 'mobile') && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
            }}
          >
            <Sidebar drawerMode />
          </div>
        )}

        <Canvas />

        {responsiveMode === 'desktop' && (
          <div
            style={{
              position: 'absolute',
              top: 56,
              right: 0,
              bottom: 0,
              width: showPropertyPanel ? 340 : 0,
              transition: 'width 0.35s ease',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            {showPropertyPanel && <PropertyPanel />}
          </div>
        )}

        {(responsiveMode === 'tablet' || responsiveMode === 'mobile') &&
          showPropertyPanel && (
            <div
              style={{
                position: 'absolute',
                top: 56,
                right: 8,
                bottom: 16,
                width: responsiveMode === 'tablet' ? 320 : 'calc(100% - 16px)',
                maxWidth: 360,
                zIndex: 25,
              }}
            >
              <PropertyPanel closeable />
            </div>
          )}
      </div>
    </div>
  );
}
