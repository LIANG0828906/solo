import { useState, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import ParameterPanel from './components/ParameterPanel';
import { useStore } from './store';

function ViewInfo() {
  const viewState = useStore((state) => state.viewState);
  const fps = useStore((state) => state.fps);

  const formatAngle = (rad: number) => {
    const deg = (rad * 180) / Math.PI;
    return deg.toFixed(1);
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-[#16213e]/90 backdrop-blur-sm rounded-lg p-3 text-xs font-mono text-[#e0e0e0] border border-[#0f3460]/50 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[#8b9dc3]">X轴: </span>
          <span className="text-[#64ffda]">{formatAngle(viewState.rotationX)}°</span>
        </div>
        <div>
          <span className="text-[#8b9dc3]">Y轴: </span>
          <span className="text-[#64ffda]">{formatAngle(viewState.rotationY)}°</span>
        </div>
        <div>
          <span className="text-[#8b9dc3]">缩放: </span>
          <span className="text-[#64ffda]">{viewState.zoom.toFixed(2)}x</span>
        </div>
        <div>
          <span className="text-[#8b9dc3]">FPS: </span>
          <span className={fps >= 25 ? 'text-[#6bcb77]' : 'text-[#ff6b6b]'}>{fps}</span>
        </div>
      </div>
    </div>
  );
}

function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const startY = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY[1](e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = startY[0] - e.touches[0].clientY;
      const newHeight = Math.min(Math.max(100, drawerHeight + deltaY), window.innerHeight * 0.8);
      setDrawerHeight(newHeight);
      startY[1](e.touches[0].clientY);
    },
    [drawerHeight, startY]
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startY[1](e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY[0] - moveEvent.clientY;
      const newHeight = Math.min(Math.max(100, drawerHeight + deltaY), window.innerHeight * 0.8);
      setDrawerHeight(newHeight);
      startY[1](moveEvent.clientY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [drawerHeight, startY]);

  useEffect(() => {
    if (isOpen && drawerHeight === 0) {
      setDrawerHeight(Math.min(400, window.innerHeight * 0.5));
    }
  }, [isOpen, drawerHeight]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-20 w-14 h-14 bg-[#0f3460] hover:bg-[#1a4a7a] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(15,52,96,0.8)] transition-all duration-200"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setIsOpen(false)} />}

      <div
        className={`fixed bottom-0 left-0 right-0 z-20 bg-[#16213e] rounded-t-2xl transition-transform duration-200 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: drawerHeight || undefined }}
      >
        <div
          className="h-6 flex items-center justify-center cursor-row-resize"
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <div className="w-12 h-1.5 bg-[#0f3460] rounded-full" />
        </div>
        <div className="h-[calc(100%-24px)] overflow-y-auto">
          <ParameterPanel isMobile />
        </div>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#1a1a2e] flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-[#0f3460] border-t-[#64ffda] rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-bold text-[#e0e0e0]" style={{ fontFamily: "'Space Mono', monospace" }}>
        Fractal Lab
      </h2>
      <p className="text-sm text-[#8b9dc3] mt-2">正在加载3D渲染引擎...</p>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setLoaded(true), 100);
    }, 1500);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: '#1a1a2e', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div className="flex-1 relative">
        <ViewInfo />
        <Scene />
      </div>

      {!isMobile && <ParameterPanel />}

      {isMobile && <MobileDrawer />}
    </div>
  );
}
