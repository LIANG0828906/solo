import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ParticleSystem } from './particle/ParticleSystem'
import { ControlPanel } from './ui/ControlPanel'
import { AudioManager } from './audio/AudioManager'
import { useAudioStore } from './store/useAudioStore'

function App() {
  const isCapturing = useAudioStore((state) => state.isCapturing)
  const permissionError = useAudioStore((state) => state.permissionError)
  const overallVolume = useAudioStore(
    (state) => state.audioFeatures.overallVolume
  )
  const setPermissionError = useAudioStore((state) => state.setPermissionError)

  const handleToggleCapture = async () => {
    if (isCapturing) {
      AudioManager.stop()
    } else {
      const success = await AudioManager.start()
      if (!success) {
        setPermissionError(true)
      }
    }
  }

  return (
    <div className="app-container">
      {permissionError && (
        <div className="permission-warning">
          ⚠ 麦克风权限被拒绝，请在浏览器设置中允许访问麦克风
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0A0A2A' }}
      >
        <color attach="background" args={['#0A0A2A']} />
        <fog attach="fog" args={['#0A0A2A', 10, 30]} />

        <ambientLight intensity={0.4} />
        <pointLight position={[5, 10, 5]} intensity={0.8} />

        <ParticleSystem />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
          enablePan={false}
        />
      </Canvas>

      <div className="capture-container">
        <button
          className={`capture-button ${isCapturing ? 'active' : ''}`}
          onClick={handleToggleCapture}
        >
          {isCapturing ? '停止捕获' : '开始捕获'}
        </button>
        <div className="volume-bar-container">
          <div
            className="volume-bar-fill"
            style={{ width: `${overallVolume * 100}%` }}
          />
        </div>
      </div>

      <ControlPanel />

      <style>{`
        .app-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .app-container canvas {
          width: 100%;
          height: 100%;
          display: block;
        }

        .permission-warning {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: #FF4444;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          z-index: 300;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .capture-container {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .capture-button {
          width: 120px;
          height: 36px;
          background: #4ECDC4;
          color: white;
          border: none;
          border-radius: 18px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        }

        .capture-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
        }

        .capture-button:active {
          transform: translateY(0);
        }

        .capture-button.active {
          background: #FF6B6B;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .capture-button.active:hover {
          box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
        }

        .volume-bar-container {
          width: 200px;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .volume-bar-fill {
          height: 100%;
          background: #00FF7F;
          border-radius: 4px;
          transition: width 0.05s ease-out;
          box-shadow: 0 0 8px rgba(0, 255, 127, 0.5);
        }

        @media (max-width: 768px) {
          .capture-container {
            bottom: auto;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            align-items: center;
          }

          .permission-warning {
            height: auto;
            padding: 8px 16px;
            font-size: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default App
