import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { NebulaCore } from './components/NebulaCore';
import { ControlPanel } from './components/ControlPanel';
import { ExportDialog } from './components/ExportDialog';
import { useNebulaStore } from './store/useNebulaStore';
import './App.css';

function CameraResetter() {
  const { camera } = useThree();
  const resetKey = useNebulaStore((state) => state.resetKey);

  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }, [resetKey, camera]);

  return null;
}

function App() {
  const togglePlaying = useNebulaStore((state) => state.togglePlaying);
  const togglePanel = useNebulaStore((state) => state.togglePanel);
  const setShowExportDialog = useNebulaStore((state) => state.setShowExportDialog);
  const isExporting = useNebulaStore((state) => state.isExporting);
  const setResetKey = useNebulaStore((state) => state.setResetKey);

  const [hintVisible, setHintVisible] = useState(true);
  const hintTimeoutRef = useRef<number | null>(null);

  const startHintTimer = useCallback(() => {
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    startHintTimer();
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [startHintTimer]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (!isExporting) {
          togglePlaying();
        }
        break;
      case 'KeyR':
        e.preventDefault();
        setResetKey();
        break;
      case 'KeyE':
        e.preventDefault();
        togglePanel();
        break;
      case 'KeyS':
        e.preventDefault();
        if (!isExporting) {
          setShowExportDialog(true);
        }
        break;
    }
  }, [togglePlaying, togglePanel, setShowExportDialog, isExporting, setResetKey]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleMouseMove = useCallback(() => {
    setHintVisible(true);
    startHintTimer();
  }, [startHintTimer]);

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      <div className="nebula-bg">
        <div className="bg-gradient" />
      </div>

      <Canvas
        className="nebula-canvas"
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <CameraResetter />
        <NebulaCore />
      </Canvas>

      <ControlPanel />
      <ExportDialog />

      <div className={`hint-box ${hintVisible ? 'visible' : 'hidden'}`}>
        <div className="hint-title">快捷键</div>
        <div className="hint-list">
          <div className="hint-item">
            <span className="hint-key">空格</span>
            <span className="hint-desc">播放 / 暂停</span>
          </div>
          <div className="hint-item">
            <span className="hint-key">R</span>
            <span className="hint-desc">重置视角</span>
          </div>
          <div className="hint-item">
            <span className="hint-key">E</span>
            <span className="hint-desc">展开 / 收起面板</span>
          </div>
          <div className="hint-item">
            <span className="hint-key">S</span>
            <span className="hint-desc">导出视频 / GIF</span>
          </div>
        </div>
        <div className="hint-footer">5秒后自动隐藏</div>
      </div>

      <div className="app-header">
        <h1 className="app-title">NEBULA STUDIO</h1>
        <p className="app-subtitle">交互式3D星云粒子生成器</p>
      </div>
    </div>
  );
}

export default App;
