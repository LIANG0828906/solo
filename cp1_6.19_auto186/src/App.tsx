import { useEffect, useRef } from 'react';
import Scene3D from './components/Scene3D';
import UIOverlay from './components/UIOverlay';
import RT60Chart from './components/RT60Chart';
import { useSceneStore } from './store/useSceneStore';
import Stats from 'stats.js';

function App() {
  const statsRef = useRef<Stats | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '60px';
    stats.dom.style.right = '10px';
    statsRef.current = stats;

    if (containerRef.current) {
      containerRef.current.appendChild(stats.dom);
    }

    const animate = () => {
      stats.begin();
      stats.end();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      if (stats.dom.parentNode) {
        stats.dom.parentNode.removeChild(stats.dom);
      }
    };
  }, []);

  const showPanel = useSceneStore((state) => state.showPanel);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-[#1C1C1C] relative"
      style={{ minWidth: '800px', minHeight: '600px' }}
    >
      <div className="absolute inset-0 pt-12">
        <Scene3D />
      </div>

      <UIOverlay />

      <div className="fixed right-4 top-16 z-40">
        <RT60Chart />
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        button {
          cursor: pointer;
          border: none;
          outline: none;
          font-family: inherit;
        }

        button:disabled {
          cursor: not-allowed;
        }

        select {
          font-family: inherit;
        }

        @media (max-width: 900px) {
          .mobile-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
