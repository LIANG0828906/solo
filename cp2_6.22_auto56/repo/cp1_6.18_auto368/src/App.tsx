import { useRef, useState, useEffect } from 'react';
import { DrawCanvas } from '@/components/DrawCanvas';
import { ControlPanel } from '@/components/ControlPanel';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🎭 角色动态预览器</h1>
        {isMobile && (
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
              {isMobileMenuOpen ? '✕ 关闭' : '☰ 菜单'}
          </button>
        )}
      </header>

      <div className="app-main">
        <main className="canvas-section">
          <DrawCanvas canvasRef={canvasRef} />
        </main>

        {!isMobile && (
          <aside className="panel-section">
            <ControlPanel canvasRef={canvasRef} />
          </aside>
        )}
      </div>

      {isMobile && isMobileMenuOpen && (
        <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <ControlPanel canvasRef={canvasRef} />
        </div>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
