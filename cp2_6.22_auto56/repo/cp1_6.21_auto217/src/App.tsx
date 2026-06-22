import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NebulaProvider } from './context/NebulaContext';
import NebulaScene from './scene/NebulaScene';
import ControlPanel from './ui/ControlPanel';

const canvasStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: '#05050A',
};

export default function App() {
  return (
    <NebulaProvider>
      <div style={canvasStyle}>
        <Canvas
          camera={{ position: [0, 0, 35], fov: 60, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
          style={{ background: '#05050A' }}
        >
          <NebulaScene />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            enablePan={false}
          />
        </Canvas>
        <ControlPanel />
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .nebula-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #818CF8;
          transition: all 0.2s;
        }
        .nebula-slider::-webkit-slider-thumb:hover {
          background: #818CF8;
          transform: scale(1.1);
        }
        .nebula-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #818CF8;
          transition: all 0.2s;
        }
        .nebula-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: #334155;
        }
        input[type="color"] {
          -webkit-appearance: none;
          border: none;
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
          border: 2px solid #334155;
          border-radius: 8px;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </NebulaProvider>
  );
}
