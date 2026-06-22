import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvasRenderer from './components/CanvasRenderer';
import {
  WorldState,
  Vec2,
  ToolMode,
  SpawnAnimation,
} from './physics/types';
import {
  createWorld,
  createNode,
  createConstraint,
  addNode,
  addConstraint,
  removeNode,
  clearWorld,
  updatePhysics,
  findNodeAtPosition,
  createRopePreset,
  createClothPreset,
  createSoftBodyPreset,
} from './physics/PhysicsEngine';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const MAX_NODES = 100;
const MAX_CONSTRAINTS = 200;

type PresetType = 'rope' | 'cloth' | 'softbody';

const App: React.FC = () => {
  const worldRef = useRef<WorldState>(createWorld(0.4, 0.998, 6));
  const [, setTick] = useState(0);
  const forceRender = useCallback(() => setTick((t) => (t + 1) % 1000000), []);

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [constraintStartNodeId, setConstraintStartNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragMousePos, setDragMousePos] = useState<Vec2 | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [mousePos, setMousePos] = useState<Vec2 | null>(null);
  const [spawnAnimations, setSpawnAnimations] = useState<SpawnAnimation[]>([]);
  const [fps, setFps] = useState(60);
  const [fpsWarning, setFpsWarning] = useState(false);
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);

  const lastFrameTimeRef = useRef<number>(performance.now());
  const fpsFrameCountRef = useRef(0);
  const fpsAccumulatorRef = useRef(0);
  const rafRef = useRef<number>(0);
  const dragStartPosRef = useRef<Vec2 | null>(null);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Escape') {
        setConstraintStartNodeId(null);
        setSelectedNodeId(null);
        setToolMode('select');
      }
      if (e.key === '1') setToolMode('node');
      if (e.key === '2') setToolMode('constraint');
      if (e.key === '3') setToolMode('select');
      if (e.key === 'Delete' && selectedNodeId) {
        if (!fpsWarning) {
          removeNode(worldRef.current, selectedNodeId);
        }
        setSelectedNodeId(null);
        forceRender();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeId, fpsWarning, forceRender]);

  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min(now - lastFrameTimeRef.current, 32);
      lastFrameTimeRef.current = now;

      fpsFrameCountRef.current++;
      fpsAccumulatorRef.current += dt;
      if (fpsAccumulatorRef.current >= 500) {
        const currentFps = Math.round(
          (fpsFrameCountRef.current * 1000) / fpsAccumulatorRef.current
        );
        setFps(currentFps);
        setFpsWarning(currentFps < 30);
        fpsFrameCountRef.current = 0;
        fpsAccumulatorRef.current = 0;
      }

      const world = worldRef.current;
      if (isDragging && dragNodeId) {
        const node = world.nodes.get(dragNodeId);
        if (node && dragMousePos) {
          node.pos.x = dragMousePos.x;
          node.pos.y = dragMousePos.y;
          node.prevPos.x = dragMousePos.x;
          node.prevPos.y = dragMousePos.y;
        }
      }

      updatePhysics(world, dt / 16.666, CANVAS_WIDTH, CANVAS_HEIGHT);

      setSpawnAnimations((prev) => {
        const updated = prev
          .map((a) => ({ ...a, elapsed: a.elapsed + dt }))
          .filter((a) => a.elapsed - a.delay < 0.4);
        return updated;
      });

      forceRender();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isDragging, dragNodeId, dragMousePos, forceRender]);

  const handleCanvasClick = useCallback(
    (pos: Vec2) => {
      if (fpsWarning) return;
      if (dragMovedRef.current) return;

      const world = worldRef.current;
      const hitNode = findNodeAtPosition(world, pos);

      if (toolMode === 'node') {
        if (!hitNode && world.nodes.size < MAX_NODES) {
          const newNode = createNode(pos.x, pos.y, 8, false);
          addNode(world, newNode);
          setSelectedNodeId(newNode.id);
          setSpawnAnimations((prev) => [
            ...prev,
            { nodeId: newNode.id, delay: 0, elapsed: 0 },
          ]);
          forceRender();
        } else if (hitNode) {
          setSelectedNodeId(hitNode.id);
        }
      } else if (toolMode === 'constraint') {
        if (hitNode) {
          if (constraintStartNodeId === null) {
            setConstraintStartNodeId(hitNode.id);
            setSelectedNodeId(hitNode.id);
          } else if (constraintStartNodeId !== hitNode.id) {
            if (world.constraints.size < MAX_CONSTRAINTS) {
              const nodeA = world.nodes.get(constraintStartNodeId);
              const nodeB = hitNode;
              if (nodeA && nodeB) {
                let exists = false;
                world.constraints.forEach((c) => {
                  if (
                    (c.nodeAId === constraintStartNodeId && c.nodeBId === hitNode.id) ||
                    (c.nodeAId === hitNode.id && c.nodeBId === constraintStartNodeId)
                  ) {
                    exists = true;
                  }
                });
                if (!exists) {
                  const c = createConstraint(constraintStartNodeId, hitNode.id);
                  if (c) {
                    addConstraint(world, c, nodeA, nodeB);
                  }
                }
              }
            }
            setConstraintStartNodeId(null);
            setSelectedNodeId(hitNode.id);
            forceRender();
          }
        }
      } else {
        if (hitNode) {
          setSelectedNodeId(hitNode.id);
        } else {
          setSelectedNodeId(null);
          setConstraintStartNodeId(null);
        }
      }
    },
    [toolMode, constraintStartNodeId, fpsWarning, forceRender]
  );

  const handleCanvasMouseDown = useCallback(
    (pos: Vec2) => {
      if (fpsWarning) return;

      const world = worldRef.current;
      const hitNode = findNodeAtPosition(world, pos);

      if (isCtrlPressed && hitNode) {
        setIsDragging(true);
        setDragNodeId(hitNode.id);
        setDragMousePos({ ...pos });
        dragStartPosRef.current = { ...pos };
        dragMovedRef.current = false;
        setSelectedNodeId(hitNode.id);
      } else if (toolMode === 'select' && hitNode) {
        setIsDragging(true);
        setDragNodeId(hitNode.id);
        setDragMousePos({ ...pos });
        dragStartPosRef.current = { ...pos };
        dragMovedRef.current = false;
      }
    },
    [isCtrlPressed, toolMode, fpsWarning]
  );

  const handleCanvasMouseMove = useCallback(
    (pos: Vec2) => {
      setMousePos(pos);

      if (isDragging) {
        if (dragStartPosRef.current) {
          const dx = pos.x - dragStartPosRef.current.x;
          const dy = pos.y - dragStartPosRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) > 3) {
            dragMovedRef.current = true;
          }
        }
        setDragMousePos({ ...pos });
      }
    },
    [isDragging]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNodeId(null);
    setDragMousePos(null);
    dragStartPosRef.current = null;
    setTimeout(() => {
      dragMovedRef.current = false;
    }, 50);
  }, []);

  const handleContextMenu = useCallback(
    (pos: Vec2) => {
      if (fpsWarning) return;

      const world = worldRef.current;
      const hitNode = findNodeAtPosition(world, pos);
      if (hitNode) {
        removeNode(world, hitNode.id);
        if (selectedNodeId === hitNode.id) setSelectedNodeId(null);
        if (constraintStartNodeId === hitNode.id) setConstraintStartNodeId(null);
        forceRender();
      }
    },
    [fpsWarning, selectedNodeId, constraintStartNodeId, forceRender]
  );

  const addSpawnAnimationsForNodes = useCallback((nodeIds: string[]) => {
    setSpawnAnimations((prev) => {
      const newAnims = nodeIds.map((nodeId, i) => ({
        nodeId,
        delay: i * 100,
        elapsed: 0,
      }));
      return [...prev, ...newAnims];
    });
  }, []);

  const handlePreset = useCallback(
    (preset: PresetType) => {
      if (fpsWarning) return;
      const world = worldRef.current;
      const cx = CANVAS_WIDTH / 2;

      let nodeIds: string[] = [];
      if (preset === 'rope') {
        if (world.nodes.size + 12 > MAX_NODES) return;
        nodeIds = createRopePreset(world, cx, 80, 12, 32);
      } else if (preset === 'cloth') {
        if (world.nodes.size + 64 > MAX_NODES) return;
        nodeIds = createClothPreset(world, cx, 60, 8, 8, 28);
      } else if (preset === 'softbody') {
        if (world.nodes.size + 17 > MAX_NODES) return;
        nodeIds = createSoftBodyPreset(world, cx, CANVAS_HEIGHT / 2, 70, 16);
      }

      addSpawnAnimationsForNodes(nodeIds);
      forceRender();
    },
    [fpsWarning, addSpawnAnimationsForNodes, forceRender]
  );

  const handleClear = useCallback(() => {
    clearWorld(worldRef.current);
    setSelectedNodeId(null);
    setConstraintStartNodeId(null);
    forceRender();
  }, [forceRender]);

  const handleToolButton = useCallback(
    (mode: ToolMode) => {
      setToolMode(mode);
      if (mode !== 'constraint') {
        setConstraintStartNodeId(null);
      }
    },
    []
  );

  const handleButtonPress = (btnId: string) => {
    setButtonPressed(btnId);
    setTimeout(() => setButtonPressed(null), 100);
  };

  const buttonStyle = (active: boolean, btnId: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: active ? '#ff8c00' : '#333',
    color: '#fff',
    border: 'none',
    cursor: fpsWarning ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    transform: buttonPressed === btnId ? 'scale(0.95)' : 'scale(1)',
    opacity: fpsWarning && !active ? 0.5 : 1,
    userSelect: 'none',
  });

  const nodeCount = worldRef.current.nodes.size;
  const constraintCount = worldRef.current.constraints.size;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
          <button
            style={buttonStyle(toolMode === 'node', 'tool-node')}
            onMouseDown={() => handleButtonPress('tool-node')}
            onClick={() => handleToolButton('node')}
            title="创建节点 (1)"
          >
            ● 创建节点
          </button>
          <button
            style={buttonStyle(toolMode === 'constraint', 'tool-constraint')}
            onMouseDown={() => handleButtonPress('tool-constraint')}
            onClick={() => handleToolButton('constraint')}
            title="创建约束 (2)"
          >
            ═ 创建约束
          </button>
          <button
            style={buttonStyle(false, 'tool-clear')}
            onMouseDown={() => handleButtonPress('tool-clear')}
            onClick={() => {
              handleClear();
            }}
            title="清空画布"
          >
            ✕ 清空画布
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '12px 0 0 12px',
          marginRight: 0,
        }}
      >
        <div
          style={{
            color: '#aaa',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '4px',
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          预设模板
        </div>
        <button
          style={buttonStyle(false, 'preset-rope')}
          onMouseDown={() => handleButtonPress('preset-rope')}
          onClick={() => handlePreset('rope')}
          disabled={fpsWarning}
          title="绳索"
        >
          🪢 绳索
        </button>
        <button
          style={buttonStyle(false, 'preset-cloth')}
          onMouseDown={() => handleButtonPress('preset-cloth')}
          onClick={() => handlePreset('cloth')}
          disabled={fpsWarning}
          title="布料"
        >
          📜 布料
        </button>
        <button
          style={buttonStyle(false, 'preset-softbody')}
          onMouseDown={() => handleButtonPress('preset-softbody')}
          onClick={() => handlePreset('softbody')}
          disabled={fpsWarning}
          title="软体"
        >
          ● 软体
        </button>
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '10px',
            color: '#777',
            lineHeight: '1.5',
            maxWidth: '120px',
          }}
        >
          <div>左键: {toolMode === 'node' ? '创建节点' : toolMode === 'constraint' ? '选择节点连线' : '选择/拖动'}</div>
          <div>Ctrl+拖: 牵引节点</div>
          <div>右键: 删除节点</div>
          <div>Del: 删除选中</div>
        </div>
      </div>

      {fpsWarning && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '16px',
            zIndex: 20,
            padding: '10px 14px',
            background: 'rgba(220,50,50,0.9)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'blinkWarning 0.8s ease-in-out infinite',
            boxShadow: '0 4px 20px rgba(220,50,50,0.4)',
          }}
        >
          <span style={{ fontSize: '16px' }}>⚠</span>
          性能警告: FPS过低，已暂停新增交互
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: CANVAS_WIDTH,
            height: '100%',
            maxHeight: CANVAS_HEIGHT,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <CanvasRenderer
            world={worldRef.current}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            selectedNodeId={selectedNodeId}
            constraintStartNodeId={constraintStartNodeId}
            toolMode={toolMode}
            isDragging={isDragging}
            dragNodeId={dragNodeId}
            dragMousePos={dragMousePos}
            spawnAnimations={spawnAnimations}
            mousePos={mousePos}
            onCanvasClick={handleCanvasClick}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseUp={handleCanvasMouseUp}
            onContextMenu={handleContextMenu}
          />

          <div
            style={{
              position: 'absolute',
              left: '12px',
              bottom: '12px',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#ccc',
              lineHeight: '1.6',
              minWidth: '140px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <span style={{ color: '#888', fontSize: '10px' }}>FPS</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '16px',
                  color: fps < 30 ? '#ff4444' : fps < 45 ? '#ffaa00' : '#4caf50',
                  animation: fps < 30 ? 'blinkWarning 0.8s ease-in-out infinite' : 'none',
                  fontFamily: '"SF Mono", Consolas, Monaco, monospace',
                }}
              >
                {fps}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <span style={{ color: '#888' }}>节点</span>
              <span style={{ color: nodeCount > 80 ? '#ffaa00' : '#ddd', fontWeight: 600 }}>
                {nodeCount}
                <span style={{ color: '#555', fontWeight: 400 }}>/{MAX_NODES}</span>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <span style={{ color: '#888' }}>约束</span>
              <span
                style={{
                  color: constraintCount > 160 ? '#ffaa00' : '#ddd',
                  fontWeight: 600,
                }}
              >
                {constraintCount}
                <span style={{ color: '#555', fontWeight: 400 }}>/{MAX_CONSTRAINTS}</span>
              </span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '6px 10px',
              background: 'rgba(255,140,0,0.15)',
              border: '1px solid rgba(255,140,0,0.3)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#ffb86c',
              fontWeight: 500,
            }}
          >
            {toolMode === 'node' && '🔘 节点模式 - 点击空白处创建节点'}
            {toolMode === 'constraint' &&
              (constraintStartNodeId
                ? '🔗 连接中 - 点击另一个节点完成连线'
                : '🔗 约束模式 - 点击两个节点创建弹性绳')}
            {toolMode === 'select' && '👆 选择模式 - 拖动节点或Ctrl+拖动牵引'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blinkWarning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        button:hover {
          filter: brightness(1.15);
        }
        button:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default App;
