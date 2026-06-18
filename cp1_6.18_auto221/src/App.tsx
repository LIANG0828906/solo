import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneManager } from './components/SceneManager';
import { useSpeechToCommand } from './hooks/useSpeechToCommand';
import { useSceneStore, GeometryType } from './stores/sceneStore';

const GEOMETRY_NAMES: Record<GeometryType, string> = {
  cube: '立方体',
  sphere: '球体',
  cone: '圆锥',
  torus: '圆环',
  cylinder: '圆柱',
};

const MicIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
    <path d="M19 11a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.92V21h-3a1 1 0 100 2h8a1 1 0 100-2h-3v-3.08A7 7 0 0019 11z" />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12a9 9 0 109-9 9 9 0 00-9 9zm15 0A6 6 0 119.22 7.27l-1.42-1.42A8.94 8.94 0 0112 3a9 9 0 019 9z" />
    <path d="M8 7v6h6l-1.5-1.5L15 9l-3-3-2.5 2.5L10 7H8z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const CubeIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.27.11-.56.18-.87.18-.31 0-.6-.07-.87-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44C11.7 2.07 12 2 12.3 2c.31 0 .6.07.87.18l7.9 4.44c.32.17.53.5.53.88v9z" />
    <path d="M12 12.78L5.85 16.5 12 20.22l6.15-3.72L12 12.78zM12 12.78V3M5.85 7.5L12 11.28 18.15 7.5" />
  </svg>
);

const SphereIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" />
    <path d="M12 3c-3 2.5-3 15.5 0 18M12 3c3 2.5 3 15.5 0 18" />
  </svg>
);

const ConeIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 20h18L12 2z" />
    <ellipse cx="12" cy="20" rx="9" ry="2" />
  </svg>
);

const TorusIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <ellipse cx="12" cy="12" rx="4" ry="1.8" />
    <path d="M3 12c2 2.5 6 4 9 4s7-1.5 9-4" />
  </svg>
);

const CylinderIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="4" rx="7" ry="2.5" />
    <path d="M5 4v16c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V4" />
    <ellipse cx="12" cy="20" rx="7" ry="2.5" />
  </svg>
);

const GeometryIcon: React.FC<{ type: GeometryType }> = ({ type }) => {
  switch (type) {
    case 'cube': return <CubeIcon />;
    case 'sphere': return <SphereIcon />;
    case 'cone': return <ConeIcon />;
    case 'torus': return <TorusIcon />;
    case 'cylinder': return <CylinderIcon />;
    default: return <CubeIcon />;
  }
};

const formatNumber = (n: number) => n.toFixed(1);

const App: React.FC = () => {
  const { isRecording, toggleRecording, currentTranscript, isSupported } = useSpeechToCommand();

  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const selectObject = useSceneStore((state) => state.selectObject);
  const setFocusTarget = useSceneStore((state) => state.setFocusTarget);
  const removeAllObjects = useSceneStore((state) => state.removeAllObjects);
  const errorMessage = useSceneStore((state) => state.errorMessage);
  const currentCommandText = useSceneStore((state) => state.currentCommandText);
  const commandHistory = useSceneStore((state) => state.commandHistory);
  const replay = useSceneStore((state) => state.replay);
  const setReplay = useSceneStore((state) => state.setReplay);
  const addObject = useSceneStore((state) => state.addObject);
  const updateObject = useSceneStore((state) => state.updateObject);

  const [commandDisplayVisible, setCommandDisplayVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (currentCommandText) {
      setCommandDisplayVisible(true);
      const timer = setTimeout(() => setCommandDisplayVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentCommandText]);

  useEffect(() => {
    if (commandHistory.length > 0 && !replay.isPlaying) {
      const lastTimestamp = commandHistory[commandHistory.length - 1].timestamp;
      setReplay({ totalDuration: Math.max(lastTimestamp + 2000, 5000) });
    }
  }, [commandHistory.length]);

  const handleObjectClick = useCallback((id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      selectObject(id);
      setFocusTarget({
        x: obj.targetPosition.x,
        y: obj.targetPosition.y,
        z: obj.targetPosition.z,
      });
    }
  }, [objects, selectObject, setFocusTarget]);

  const handleReset = useCallback(() => {
    removeAllObjects();
  }, [removeAllObjects]);

  const handleToggleReplay = useCallback(() => {
    if (commandHistory.length === 0) return;

    if (replay.isPlaying) {
      setReplay({ isPlaying: false });
    } else {
      removeAllObjects();
      setReplay({ currentTime: 0, isPlaying: true });
    }
  }, [commandHistory.length, replay.isPlaying, setReplay, removeAllObjects]);

  const handleToggleSpeed = useCallback(() => {
    setReplay({ speed: replay.speed === 1 ? 2 : 1 });
  }, [replay.speed, setReplay]);

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || replay.isPlaying) return;
    isDraggingRef.current = true;
    updateTimelinePosition(e.clientX);
    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);
  }, [replay.isPlaying]);

  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    updateTimelinePosition(e.clientX);
  }, []);

  const handleTimelineMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleTimelineMouseMove);
    document.removeEventListener('mouseup', handleTimelineMouseUp);
  }, [handleTimelineMouseMove]);

  const updateTimelinePosition = useCallback((clientX: number) => {
    if (!timelineRef.current || replay.totalDuration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * replay.totalDuration;

    removeAllObjects();
    const baseTime = commandHistory.length > 0 ? commandHistory[0].timestamp : 0;

    commandHistory.forEach((cmd) => {
      if (cmd.timestamp - baseTime <= newTime) {
        if (cmd.type === 'create' && cmd.geometryType && cmd.color) {
          addObject({
            type: cmd.geometryType,
            color: cmd.color as any,
            position: { x: 0, y: 0.5, z: 0 },
            targetPosition: { x: 0, y: 0.5, z: 0 },
            scale: 1,
            targetScale: 1,
            rotation: { x: 0, y: 0, z: 0 },
            rotationSpeed: { x: 0, y: 0, z: 0 },
            id: cmd.objectId,
          });
        }
      }
    });

    commandHistory.forEach((cmd) => {
      if (cmd.timestamp - baseTime <= newTime) {
        if (cmd.type === 'transform' && cmd.objectId && cmd.transformType && cmd.transformData) {
          const currentObj = useSceneStore.getState().objects.find((o) => o.id === cmd.objectId);
          if (currentObj) {
            if (cmd.transformType === 'move' && cmd.transformData.offset) {
              updateObject(cmd.objectId, {
                targetPosition: {
                  x: currentObj.targetPosition.x + cmd.transformData.offset.x,
                  y: Math.max(0.5, currentObj.targetPosition.y + cmd.transformData.offset.y),
                  z: currentObj.targetPosition.z + cmd.transformData.offset.z,
                },
                position: {
                  x: currentObj.targetPosition.x + cmd.transformData.offset.x,
                  y: Math.max(0.5, currentObj.targetPosition.y + cmd.transformData.offset.y),
                  z: currentObj.targetPosition.z + cmd.transformData.offset.z,
                },
                isSpawning: false,
                spawnProgress: 1,
              });
            } else if (cmd.transformType === 'scale' && cmd.transformData.scale) {
              const newScale = Math.max(0.2, Math.min(5, currentObj.targetScale * cmd.transformData.scale));
              updateObject(cmd.objectId, {
                targetScale: newScale,
                scale: newScale,
                isSpawning: false,
                spawnProgress: 1,
              });
            } else if (cmd.transformType === 'rotate' && cmd.transformData.rotationAxis && cmd.transformData.rotationSpeed) {
              const axis = cmd.transformData.rotationAxis;
              const currentSpeed = { ...currentObj.rotationSpeed };
              currentSpeed[axis] = currentSpeed[axis] === 0 ? cmd.transformData.rotationSpeed : 0;
              updateObject(cmd.objectId, {
                rotationSpeed: currentSpeed,
                isSpawning: false,
                spawnProgress: 1,
              });
            }
          }
        }
      }
    });

    setReplay({ currentTime: newTime });
  }, [replay.totalDuration, commandHistory, removeAllObjects, addObject, updateObject, setReplay]);

  const progressRatio = replay.totalDuration > 0 ? Math.min(1, replay.currentTime / replay.totalDuration) : 0;
  const handlePercent = progressRatio * 100;

  return (
    <div className="app-container">
      <div className="canvas-container">
        <SceneManager />
      </div>

      <div className="hint-text">
        点击右下角麦克风，说出指令：
        <span>创建红色立方体</span>
        <span>放大球体两倍</span>
        <span>绕Y轴旋转</span>
      </div>

      <div className="top-controls">
        <button className="speed-toggle" onClick={handleToggleSpeed}>
          {replay.speed}x
        </button>
        <button
          className={`playback-button ${replay.isPlaying ? 'playing' : ''}`}
          onClick={handleToggleReplay}
          title={replay.isPlaying ? '暂停回放' : '开始回放'}
        >
          {replay.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="reset-button"
          onClick={handleReset}
          title="重置场景"
        >
          <ResetIcon />
        </button>
      </div>

      <div className="panel-container">
        <div className="panel-title">场景物体 ({objects.length})</div>
        {objects.length === 0 ? (
          <div className="panel-empty">暂无物体<br />点击麦克风开始创建</div>
        ) : (
          objects.map((obj) => (
            <div
              key={obj.id}
              className={`object-list-item ${selectedObjectId === obj.id ? 'selected' : ''}`}
              onClick={() => handleObjectClick(obj.id)}
            >
              <div className="object-icon">
                <GeometryIcon type={obj.type} />
              </div>
              <div className="object-color" style={{ backgroundColor: obj.color }} />
              <div className="object-info">
                <div className="object-name">{GEOMETRY_NAMES[obj.type]}</div>
                <div className="object-transform">
                  位置: {formatNumber(obj.targetPosition.x)}, {formatNumber(obj.targetPosition.y)}, {formatNumber(obj.targetPosition.z)}
                  {' | '}缩放: {formatNumber(obj.targetScale)}x
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {errorMessage && (
        <div className="error-toast">{errorMessage}</div>
      )}

      {commandDisplayVisible && currentCommandText && (
        <div className="command-display">
          {isRecording ? '🎙️ 正在识别... ' : '✓ '}{currentCommandText}
        </div>
      )}

      <div className="timeline-container">
        <div className="timeline-label">
          <span>时间线</span>
          <span>
            {new Date(replay.currentTime).toISOString().substr(14, 5)} / {new Date(replay.totalDuration).toISOString().substr(14, 5)}
          </span>
        </div>
        <div
          className="timeline-track"
          ref={timelineRef}
          onMouseDown={handleTimelineMouseDown}
        >
          <div
            className="timeline-fill"
            style={{ width: `${handlePercent}%` }}
          />
          {commandHistory.map((cmd, idx) => {
            const ratio = replay.totalDuration > 0 ? cmd.timestamp / replay.totalDuration : 0;
            return (
              <div
                key={cmd.id}
                className="timeline-marker"
                style={{ left: `${ratio * 100}%` }}
                title={`${idx + 1}. ${cmd.originalText}`}
              />
            );
          })}
          <div
            className="timeline-handle"
            style={{ left: `${handlePercent}%` }}
          />
        </div>
      </div>

      <div className="voice-button-wrapper">
        {!isRecording && <div className="voice-button-ripple" />}
        <button
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? '停止录制' : (isSupported ? '开始录制语音指令' : '浏览器不支持语音识别')}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
    </div>
  );
};

export default App;
