import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SceneManager from '@/three/SceneManager';
import ControlPanel from '@/components/ControlPanel';
import ViewpointToolbar from '@/components/ViewpointToolbar';
import HeatmapOverlay from '@/heatmap/HeatmapOverlay';
import { Viewpoint, HeatPoint } from '@/types';
import { Activity, Info } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';
const VIEWPOINTS_KEY = 'museum_viewpoints';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);
  const [animateTo, setAnimateTo] = useState<{
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const getCameraStateRef = useRef<(() => {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null)>(null);

  useEffect(() => {
    const saved = localStorage.getItem(VIEWPOINTS_KEY);
    if (saved) {
      try {
        setViewpoints(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load viewpoints:', e);
      }
    }
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSocketConnected(true);
      newSocket.emit('client:connect');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setSocketConnected(false);
    });

    newSocket.on('heatmap:update', (points: HeatPoint[]) => {
      setHeatPoints(points);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(VIEWPOINTS_KEY, JSON.stringify(viewpoints));
  }, [viewpoints]);

  const handleSetGetCameraState = useCallback((fn: () => {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null) => {
    getCameraStateRef.current = fn;
  }, []);

  const handleSaveViewpoint = useCallback(() => {
    const cameraState = getCameraStateRef.current?.();
    if (!cameraState) return;

    const newViewpoint: Viewpoint = {
      id: `vp-${Date.now()}`,
      name: `视点 ${viewpoints.length + 1}`,
      position: cameraState.position,
      target: cameraState.target,
      createdAt: Date.now(),
    };

    setViewpoints((prev) => [...prev, newViewpoint].slice(0, 4));
  }, [viewpoints.length]);

  const handleLoadViewpoint = useCallback((viewpoint: Viewpoint) => {
    setIsAnimating(true);
    setAnimateTo({
      position: viewpoint.position,
      target: viewpoint.target,
    });
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setAnimateTo(null);
    setIsAnimating(false);
  }, []);

  const handleDeleteViewpoint = useCallback((id: string) => {
    setViewpoints((prev) => prev.filter((vp) => vp.id !== id));
  }, []);

  const getCameraState = useCallback(() => {
    return getCameraStateRef.current?.() || null;
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container">
        <SceneManager
          animateTo={animateTo}
          onAnimationComplete={handleAnimationComplete}
          getCameraState={getCameraState}
          setGetCameraState={handleSetGetCameraState}
        />
      </div>

      <ViewpointToolbar
        viewpoints={viewpoints}
        onSaveViewpoint={handleSaveViewpoint}
        onLoadViewpoint={handleLoadViewpoint}
        onDeleteViewpoint={handleDeleteViewpoint}
        isAnimating={isAnimating}
      />

      <ControlPanel />

      <div className="heatmap-wrapper">
        <div className="heatmap-header">
          <Activity size={14} />
          <span>参观动线热力图</span>
          <span className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
            {socketConnected ? '● 实时' : '● 断开'}
          </span>
        </div>
        <HeatmapOverlay heatPoints={heatPoints} />
      </div>

      <div className="info-tip">
        <Info size={14} />
        <span>拖拽展品调整布局 | 鼠标滚轮缩放 | 右键拖动旋转视角</span>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        }

        body {
          background: #1a1a2e;
          color: #fff;
        }

        .app-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .scene-container {
          width: 100%;
          height: 100%;
        }

        .heatmap-wrapper {
          position: fixed;
          left: 24px;
          bottom: 24px;
          z-index: 1000;
        }

        .heatmap-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 6px 6px 0 0;
          font-size: 12px;
          color: #aaa;
        }

        .connection-status {
          margin-left: auto;
          font-size: 11px;
        }

        .connection-status.connected {
          color: #4CAF50;
        }

        .connection-status.disconnected {
          color: #f44336;
        }

        .info-tip {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 20px;
          font-size: 12px;
          color: #aaa;
          z-index: 1000;
        }

        @media (max-width: 768px) {
          .heatmap-wrapper,
          .info-tip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
