import { useRef } from 'react';
import { Scene } from '@/modules/scene/Scene';
import { ControlPanel } from '@/modules/controls/ControlPanel';
import { useNebulaStore } from '@/store/nebulaStore';
import * as THREE from 'three';
import styles from './App.module.css';

function App() {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const currentFPS = useNebulaStore((state) => state.currentFPS);
  const particleScale = useNebulaStore((state) => state.particleScale);
  const uiVisible = useNebulaStore((state) => state.uiVisible);

  const handleRendererReady = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) => {
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
  };

  const getFpsColor = () => {
    if (currentFPS >= 55) return '#66ff99';
    if (currentFPS >= 45) return '#ffcc66';
    return '#ff6666';
  };

  return (
    <div className={styles.app}>
      <div className={styles.sceneContainer}>
        <div className={styles.backgroundGradient} />
        <Scene onRendererReady={handleRendererReady} />

        {uiVisible && (
          <div className={styles.fpsMonitor}>
            <span className={styles.fpsValue} style={{ color: getFpsColor() }}>
              {currentFPS}
            </span>
            <span className={styles.fpsLabel}>FPS</span>
            {particleScale < 1.0 && (
              <span className={styles.perfHint}>性能模式</span>
            )}
          </div>
        )}
      </div>

      <ControlPanel
        rendererRef={rendererRef}
        sceneRef={sceneRef}
        cameraRef={cameraRef}
      />
    </div>
  );
}

export default App;
