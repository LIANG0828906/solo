import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneManager } from './SceneManager';
import { FossilLibrary } from './FossilLibrary';
import { useStore } from './store/useStore';
import { FossilFragment, fossilData } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastSnapTimeRef = useRef(0);

  const {
    fragments,
    selectedFragmentId,
    snapInfo,
    isSimulating,
    fps,
    addFragment,
    updateFragment,
    selectFragment,
    setSnapInfo,
    setDraggingFragmentId,
    setSimulating,
    setFps
  } = useStore();

  const selectedFragment = fragments.find((f) => f.id === selectedFragmentId);
  const addedFragmentIds = fragments.map((f) => f.id);

  useEffect(() => {
    if (!sceneContainerRef.current) return;

    const sceneManager = new SceneManager(sceneContainerRef.current, {
      onFragmentSelect: (id) => {
        selectFragment(id);
      },
      onSnapDetected: (info) => {
        setSnapInfo(info);
      },
      onFragmentPositionUpdate: (id, position, rotation) => {
        updateFragment(id, { position, rotation });
      },
      onFpsUpdate: (fps) => {
        setFps(fps);
      }
    });

    sceneManagerRef.current = sceneManager;
    setIsInitialized(true);

    const handleFragmentDropped = (e: Event) => {
      const customEvent = e as CustomEvent<{
        fragmentId: string;
        position: THREE.Vector3;
      }>;
      const { fragmentId, position } = customEvent.detail;

      const template = fossilData.find((f) => f.id === fragmentId);
      if (!template) return;

      const newFragment: FossilFragment = {
        id: `${fragmentId}_${Date.now()}`,
        name: template.name,
        geometryType: template.geometryType,
        dimensions: template.dimensions,
        position: {
          x: parseFloat(position.x.toFixed(4)),
          y: parseFloat(Math.max(0, position.y).toFixed(4)),
          z: parseFloat(position.z.toFixed(4))
        },
        rotation: { x: 0, y: 0, z: 0 },
        snapPoints: template.snapPoints
      };

      addFragment(newFragment);
      sceneManager.addFragment(newFragment);
      selectFragment(newFragment.id);
    };

    sceneContainerRef.current.addEventListener(
      'fragment-dropped',
      handleFragmentDropped
    );

    return () => {
      sceneContainerRef.current?.removeEventListener(
        'fragment-dropped',
        handleFragmentDropped
      );
      sceneManager.destroy();
    };
  }, [addFragment, selectFragment, setSnapInfo, updateFragment, setFps]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.highlightFragment(selectedFragmentId);
  }, [selectedFragmentId]);

  useEffect(() => {
    if (!sceneManagerRef.current || !snapInfo) return;
    sceneManagerRef.current.updateSnapLine(snapInfo);
  }, [snapInfo]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;

    for (const fragment of fragments) {
      sceneManagerRef.current.updateFragment(fragment.id, {
        position: fragment.position,
        rotation: fragment.rotation
      });
    }
  }, [fragments]);

  useEffect(() => {
    if (!sceneManagerRef.current || !selectedFragmentId || isSimulating) return;

    let animationId: number;
    let hasSnapped = false;

    const checkSnap = () => {
      if (!sceneManagerRef.current || hasSnapped) return;

      const now = performance.now();
      if (now - lastSnapTimeRef.current < 16) {
        animationId = requestAnimationFrame(checkSnap);
        return;
      }
      lastSnapTimeRef.current = now;

      const snapStartTime = performance.now();
      const snapEngine = sceneManagerRef.current.getSnapEngine();
      const detectedSnap = snapEngine.detectSnap(selectedFragmentId, fragments);

      const snapLatency = performance.now() - snapStartTime;
      if (snapLatency > 30) {
        console.warn(`Snap detection took ${snapLatency}ms, exceeds 30ms target`);
      }

      if (detectedSnap && !snapInfo) {
        sceneManagerRef.current.storeOriginalPosition(selectedFragmentId);
      }

      setSnapInfo(detectedSnap);

      animationId = requestAnimationFrame(checkSnap);
    };

    const handlePointerUp = () => {
      if (!sceneManagerRef.current || !snapInfo || hasSnapped) return;

      const snapEngine = sceneManagerRef.current.getSnapEngine();
      const transform = snapEngine.calculateSnapTransform(snapInfo, fragments);

      if (transform) {
        hasSnapped = true;
        sceneManagerRef.current.applySnap(selectedFragmentId, transform);
        updateFragment(selectedFragmentId, transform);
        
        updateFragment(selectedFragmentId, {
          connectedTo: snapInfo.fragmentIdB
        });
        updateFragment(snapInfo.fragmentIdB, {
          connectedTo: selectedFragmentId
        });
      }

      setTimeout(() => {
        setSnapInfo(null);
        if (sceneManagerRef.current) {
          sceneManagerRef.current.updateSnapLine(null);
        }
        hasSnapped = false;
      }, 300);
    };

    document.addEventListener('pointerup', handlePointerUp);
    animationId = requestAnimationFrame(checkSnap);

    return () => {
      document.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationId);
    };
  }, [selectedFragmentId, fragments, snapInfo, setSnapInfo, updateFragment, isSimulating]);

  const handleDragStart = useCallback((fragmentId: string) => {
    setDraggingFragmentId(fragmentId);
  }, [setDraggingFragmentId]);

  const handleRotate = useCallback(
    (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
      if (!selectedFragmentId || !sceneManagerRef.current || isSimulating) return;

      const degrees = 5;
      const radians = (degrees * Math.PI) / 180;

      const currentRot = selectedFragment?.rotation || { x: 0, y: 0, z: 0 };
      const newRotation = {
        x: currentRot.x + (axis === 'x' ? radians * direction : 0),
        y: currentRot.y + (axis === 'y' ? radians * direction : 0),
        z: currentRot.z + (axis === 'z' ? radians * direction : 0)
      };

      updateFragment(selectedFragmentId, { rotation: newRotation });
      sceneManagerRef.current.updateFragment(selectedFragmentId, {
        rotation: newRotation
      });
    },
    [selectedFragmentId, selectedFragment?.rotation, updateFragment, isSimulating]
  );

  const handlePositionAdjust = useCallback(
    (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
      if (!selectedFragmentId || !sceneManagerRef.current || isSimulating) return;

      const step = 0.1;
      const currentPos = selectedFragment?.position || { x: 0, y: 0, z: 0 };
      const newPosition = {
        x: currentPos.x + (axis === 'x' ? step * direction : 0),
        y: currentPos.y + (axis === 'y' ? step * direction : 0),
        z: currentPos.z + (axis === 'z' ? step * direction : 0)
      };

      updateFragment(selectedFragmentId, { position: newPosition });
      sceneManagerRef.current.updateFragment(selectedFragmentId, {
        position: newPosition
      });
    },
    [selectedFragmentId, selectedFragment?.position, updateFragment, isSimulating]
  );

  const handleCreateGroup = useCallback(() => {
    if (fragments.length < 2 || isSimulating) return;
    const groupName = `骨骼组 ${useStore.getState().groups.length + 1}`;
    useStore.getState().createGroup(groupName, fragments.map((f) => f.id));
  }, [fragments.length, isSimulating]);

  const handleToggleSimulation = useCallback(() => {
    if (!sceneManagerRef.current) return;

    if (isSimulating) {
      sceneManagerRef.current.stopSimulation();
      setSimulating(false);
    } else {
      if (fragments.length < 3) {
        alert('请至少添加3个化石碎片以进行运动模拟');
        return;
      }
      sceneManagerRef.current.startSimulation(fragments);
      setSimulating(true);
    }
  }, [isSimulating, fragments, setSimulating]);

  const formatNumber = (n: number) => n.toFixed(2);
  const formatAngle = (rad: number) => formatNumber((rad * 180) / Math.PI) + '°';

  return (
    <div className="app-container">
      <div ref={sceneContainerRef} className="scene-container" />

      <FossilLibrary
        onDragStart={handleDragStart}
        addedFragmentIds={addedFragmentIds}
      />

      <div className="app-title">
        化石<span>拼合模拟器</span>
      </div>

      <div className={`fps-counter ${fps < 50 ? 'low' : ''}`}>
        {fps} FPS
      </div>

      <AnimatePresence>
        {snapInfo && (
          <motion.div
            className="snap-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            🔗 可吸附 · 距离: {formatNumber(snapInfo.distance)}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="feedback-panel"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="feedback-title">
          <span className="status-dot" />
          实时操作反馈
        </div>
        {selectedFragment ? (
          <div className="feedback-content">
            <div className="feedback-row">
              <span className="feedback-label">碎片名称</span>
              <span className="feedback-value">{selectedFragment.name}</span>
            </div>

            <div className="feedback-section">
              <div className="feedback-section-title">位置坐标</div>
              <div className="feedback-row">
                <span className="feedback-label">X</span>
                <span className="feedback-value">
                  {formatNumber(selectedFragment.position.x)}
                </span>
              </div>
              <div className="feedback-row">
                <span className="feedback-label">Y</span>
                <span className="feedback-value">
                  {formatNumber(selectedFragment.position.y)}
                </span>
              </div>
              <div className="feedback-row">
                <span className="feedback-label">Z</span>
                <span className="feedback-value">
                  {formatNumber(selectedFragment.position.z)}
                </span>
              </div>
            </div>

            <div className="feedback-section">
              <div className="feedback-section-title">旋转角度</div>
              <div className="feedback-row">
                <span className="feedback-label">X</span>
                <span className="feedback-value">
                  {formatAngle(selectedFragment.rotation.x)}
                </span>
              </div>
              <div className="feedback-row">
                <span className="feedback-label">Y</span>
                <span className="feedback-value">
                  {formatAngle(selectedFragment.rotation.y)}
                </span>
              </div>
              <div className="feedback-row">
                <span className="feedback-label">Z</span>
                <span className="feedback-value">
                  {formatAngle(selectedFragment.rotation.z)}
                </span>
              </div>
            </div>

            {selectedFragment.connectedTo && (
              <div className="feedback-section">
                <div className="feedback-section-title">连接状态</div>
                <div className="feedback-row">
                  <span className="feedback-label">已连接到</span>
                  <span className="feedback-value" style={{ color: '#4caf50' }}>
                    ✓ 已吸附
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="feedback-empty">选择一个碎片查看详情</div>
        )}
      </motion.div>

      <motion.div
        className="control-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="control-group">
          <div className="control-group-label">旋转</div>
          <div className="control-buttons">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-x"
                  onClick={() => handleRotate('x', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="X轴 +5°"
                >
                  X+
                </button>
                <button
                  className="control-btn axis-x"
                  onClick={() => handleRotate('x', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="X轴 -5°"
                >
                  X-
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-y"
                  onClick={() => handleRotate('y', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Y轴 +5°"
                >
                  Y+
                </button>
                <button
                  className="control-btn axis-y"
                  onClick={() => handleRotate('y', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Y轴 -5°"
                >
                  Y-
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-z"
                  onClick={() => handleRotate('z', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Z轴 +5°"
                >
                  Z+
                </button>
                <button
                  className="control-btn axis-z"
                  onClick={() => handleRotate('z', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Z轴 -5°"
                >
                  Z-
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="control-group">
          <div className="control-group-label">位置</div>
          <div className="control-buttons">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-x"
                  onClick={() => handlePositionAdjust('x', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="X轴 +0.1"
                >
                  →
                </button>
                <button
                  className="control-btn axis-x"
                  onClick={() => handlePositionAdjust('x', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="X轴 -0.1"
                >
                  ←
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-y"
                  onClick={() => handlePositionAdjust('y', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Y轴 +0.1"
                >
                  ↑
                </button>
                <button
                  className="control-btn axis-y"
                  onClick={() => handlePositionAdjust('y', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Y轴 -0.1"
                >
                  ↓
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="control-btn axis-z"
                  onClick={() => handlePositionAdjust('z', 1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Z轴 +0.1"
                >
                  ↗
                </button>
                <button
                  className="control-btn axis-z"
                  onClick={() => handlePositionAdjust('z', -1)}
                  disabled={!selectedFragmentId || isSimulating}
                  title="Z轴 -0.1"
                >
                  ↙
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="control-group">
          <div className="control-group-label">编组</div>
          <div className="control-buttons">
            <button
              className="control-btn group-btn"
              onClick={handleCreateGroup}
              disabled={fragments.length < 2 || isSimulating}
            >
              📦 创建组
            </button>
          </div>
        </div>
      </motion.div>

      <motion.button
        className={`simulate-btn ${isSimulating ? 'stop' : ''}`}
        onClick={handleToggleSimulation}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={!isSimulating ? { scale: 1.05 } : {}}
        whileTap={{ scale: 0.95 }}
      >
        <span className="simulate-icon">{isSimulating ? '⏹' : '🏃'}</span>
        {isSimulating ? '停止模拟' : '模拟奔跑'}
      </motion.button>
    </div>
  );
};

export default App;
