import { useState, useRef, useEffect, useCallback } from 'react';
import { SceneManager } from '@/modules/SceneManager';
import { ControlPanel } from './ControlPanel';
import { TimelineBar } from './TimelineBar';
import type { ToolType, ToolConfig, CameraMode, ParticleSnapshot } from '@/types';

const SNAPSHOT_INTERVAL = 500;

const DEFAULT_TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  carve: { brushSize: 2, brushStrength: 0.8 },
  stack: { brushSize: 2, brushStrength: 0.8 },
  spray: { brushSize: 2.5, brushStrength: 0.6 },
  smooth: { brushSize: 3, brushStrength: 0.5 },
};

export function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const isMouseDownRef = useRef(false);
  const lastBrushPosRef = useRef({ x: 0, y: 0 });
  const recordIntervalRef = useRef<number | null>(null);

  const [currentTool, setCurrentTool] = useState<ToolType>('carve');
  const [toolConfigs, setToolConfigs] = useState<Record<ToolType, ToolConfig>>(DEFAULT_TOOL_CONFIGS);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orthographic');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [snapshots, setSnapshots] = useState<ParticleSnapshot[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  const handleCameraModeChange = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
  }, []);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager(canvasContainerRef.current, handleCameraModeChange);
    sceneManagerRef.current = sceneManager;

    const initialSnapshot = sceneManager.getSnapshot();
    setSnapshots([initialSnapshot]);

    return () => {
      sceneManager.dispose();
    };
  }, [handleCameraModeChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.shiftKey) {
        e.preventDefault();
        sceneManagerRef.current?.toggleCameraMode();
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        sceneManagerRef.current?.resetScene();
        if (!isRecording) {
          const snapshot = sceneManagerRef.current?.getSnapshot();
          if (snapshot) {
            setSnapshots([snapshot]);
            setCurrentFrame(0);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && sceneManagerRef.current) {
      recordIntervalRef.current = window.setInterval(() => {
        const snapshot = sceneManagerRef.current?.getSnapshot();
        if (snapshot) {
          setSnapshots((prev) => [...prev, snapshot]);
        }
      }, SNAPSHOT_INTERVAL);
    } else {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
    }

    return () => {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, [isRecording]);

  const applyBrushAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!sceneManagerRef.current || isPlaying) return;
      const config = toolConfigs[currentTool];
      sceneManagerRef.current.applyBrush(
        currentTool,
        clientX,
        clientY,
        config.brushSize,
        config.brushStrength
      );
    },
    [currentTool, toolConfigs, isPlaying]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.shiftKey) return;
    isMouseDownRef.current = true;
    lastBrushPosRef.current = { x: e.clientX, y: e.clientY };
    applyBrushAt(e.clientX, e.clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || e.shiftKey) return;

    const dx = e.clientX - lastBrushPosRef.current.x;
    const dy = e.clientY - lastBrushPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3) {
      applyBrushAt(e.clientX, e.clientY);
      lastBrushPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const finalSnapshot = sceneManagerRef.current?.getSnapshot();
      if (finalSnapshot) {
        setSnapshots((prev) => [...prev, finalSnapshot]);
      }
    } else {
      const initialSnapshot = sceneManagerRef.current?.getSnapshot();
      setSnapshots(initialSnapshot ? [initialSnapshot] : []);
      setCurrentFrame(0);
      setIsPlaying(false);
      setIsRecording(true);
    }
  };

  const handlePlayToggle = () => {
    if (snapshots.length < 2) return;
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrame >= snapshots.length - 1) {
        setCurrentFrame(0);
      }
      setIsPlaying(true);
    }
  };

  const handleFrameChange = (frame: number, positions: Float32Array, colors: Float32Array) => {
    setCurrentFrame(frame);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setSnapshot({
        timestamp: 0,
        positions,
        colors,
      });
    }
  };

  const handleToolChange = (tool: ToolType) => {
    setCurrentTool(tool);
  };

  const handleConfigChange = (tool: ToolType, config: ToolConfig) => {
    setToolConfigs((prev) => ({
      ...prev,
      [tool]: config,
    }));
  };

  return (
    <div className="app-container">
      <TimelineBar
        isRecording={isRecording}
        isPlaying={isPlaying}
        snapshots={snapshots}
        currentFrame={currentFrame}
        onRecordToggle={handleRecordToggle}
        onPlayToggle={handlePlayToggle}
        onFrameChange={handleFrameChange}
      />

      <div className="main-content">
        <div
          ref={canvasContainerRef}
          className={`canvas-container ${cameraMode === 'perspective' ? 'dof' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />

        <ControlPanel
          currentTool={currentTool}
          onToolChange={handleToolChange}
          toolConfigs={toolConfigs}
          onConfigChange={handleConfigChange}
        />
      </div>

      <div className="shortcuts-hint">
        <div className="title">快捷键</div>
        <div>
          <kbd>Shift</kbd>+<kbd>Space</kbd> 切换视角
        </div>
        <div>
          <kbd>R</kbd> 重置场景
        </div>
        <div>
          <kbd>Shift</kbd>+拖拽 旋转视角
        </div>
        <div>
          <kbd>滚轮</kbd> 缩放
        </div>
        <div>
          <kbd>左键拖拽</kbd> 雕刻
        </div>
      </div>
    </div>
  );
}
