import { useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { useCanvasDraw } from './hooks/useCanvasDraw';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setRedrawCount] = useState(0);

  const { handleUndo, handleRedo, exportToPNG } = useCanvasDraw({
    canvasRef,
    onRedrawNeeded: () => setRedrawCount((c) => c + 1),
  });

  return (
    <div className="app">
      <h1 className="app-title">SketchPulse</h1>
      <p className="app-subtitle">交互式数字绘画应用</p>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="drawing-canvas"
        />
      </div>

      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={exportToPNG}
      />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
          width: 100%;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .app-title {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
          background: linear-gradient(90deg, #6C63FF, #FF6B6B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .app-subtitle {
          color: #888;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .canvas-container {
          margin-bottom: 20px;
        }

        .drawing-canvas {
          display: block;
          background-color: #1E1E2E;
          width: 800px;
          height: 500px;
          border-radius: 12px;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          cursor: crosshair;
          touch-action: none;
          transition: width 0.3s ease;
        }

        @media (max-width: 900px) {
          .drawing-canvas {
            width: 100%;
            height: auto;
            aspect-ratio: 800 / 500;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
