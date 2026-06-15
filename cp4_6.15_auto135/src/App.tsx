import { useEffect, useRef, useCallback } from 'react';
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
  }, [resetKey, camera]);

  return null;
}

function App() {
  const togglePlaying = useNebulaStore((state) => state.togglePlaying);
  const togglePanel = useNebulaStore((state) => state.togglePanel);
  const setShowExportDialog = useNebulaStore((state) => state.setShowExportDialog);
  const showHint = useNebulaStore((state) => state.showHint);
  const setShowHint = useNebulaStore((state) => state.setShowHint);
  const isExporting = useNebulaStore((state) => state.isExporting);
  const setIsPlaying = useNebulaStore((state) => state.setIsPlaying);
  const setResetKey = useNebulaStore((state) => state.setResetKey);

  const hintTimeoutRef = useRef<number | null>(null);

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
      case 'Escape':
        if (showHint) {
          setShowHint(false);
        }
        break;
    }
  }, [togglePlaying, togglePanel, setShowExportDialog, isExporting, showHint, setShowHint, setResetKey]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (showHint) {
      hintTimeoutRef.current = window.setTimeout(() => {
        setShowHint(false);
      }, 5000);
    }
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [showHint, setShowHint]);

  const handleMouseMove = useCallback(() => {
    if (!showHint) {
      setShowHint(true);
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setShowHint(false);
    }, 5000);
  }, [showHint, setShowHint]);

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

      <div className={`hint-box ${showHint ? 'visible' : 'hidden'}`}>
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
