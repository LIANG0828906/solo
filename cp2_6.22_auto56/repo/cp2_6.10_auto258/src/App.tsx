import { LoomScene } from './scene/LoomScene';
import { ControlPanel } from './ui/ControlPanel';
import { EventLog } from './ui/EventLog';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1a1a2e]">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1
          className="text-3xl font-bold tracking-widest"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(90deg, #e94560, #16c79a, #e94560)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient 3s linear infinite',
            textShadow: '0 0 30px rgba(233, 69, 96, 0.5)',
          }}
        >
          光音织锦
        </h1>
        <p
          className="text-sm text-gray-400 mt-1 tracking-wider"
          style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          LIGHT SOUND TAPESTRY
        </p>
      </div>

      <LoomScene />
      <ControlPanel />
      <EventLog />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <p
          className="text-xs text-gray-500"
          style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          鼠标拖拽旋转视角 · 滚轮缩放 · 点击创建光点
        </p>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Noto Sans SC', sans-serif;
          overflow: hidden;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          background: rgba(15, 52, 96, 0.8);
          border-radius: 4px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #16c79a;
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(22, 199, 154, 0.6);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(22, 199, 154, 0.9);
        }

        input[type="range"]:nth-of-type(2)::-webkit-slider-thumb {
          background: #e94560;
          box-shadow: 0 0 10px rgba(233, 69, 96, 0.6);
        }

        input[type="range"]:nth-of-type(2)::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px rgba(233, 69, 96, 0.9);
        }
      `}</style>
    </div>
  );
}
