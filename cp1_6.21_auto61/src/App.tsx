import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PipelineScene from './components/PipelineScene';
import { generateSinglePosition, getLoadColor } from './components/PipelineScene';
import type { NodeData, Edge, NodeType, PanelPosition } from './types';

interface CreateMenuState {
  visible: boolean;
  position: PanelPosition;
}

interface NodePanelState {
  visible: boolean;
  nodeId: string | null;
  position: PanelPosition;
  offset: { x: number; y: number };
  dragging: boolean;
}

export default function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedAll, setSelectedAll] = useState(false);
  const [createMenu, setCreateMenu] = useState<CreateMenuState>({ visible: false, position: { x: 0, y: 0 } });
  const [nodePanel, setNodePanel] = useState<NodePanelState>({
    visible: false,
    nodeId: null,
    position: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    dragging: false,
  });
  const [resetTrigger, setResetTrigger] = useState(0);
  const [fps, setFps] = useState(60);
  const fpsFrames = useRef(0);
  const fpsLastTime = useRef(performance.now());
  const nodeCounter = useRef(0);
  const panelDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          load: Math.max(0, Math.min(100, node.load + (Math.random() - 0.5) * 20)),
          throughput: Math.round(Math.max(10, node.throughput + (Math.random() - 0.5) * 30)),
          latency: Math.round(Math.max(1, node.latency + (Math.random() - 0.5) * 20)),
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let frameId: number;
    const measureFps = () => {
      fpsFrames.current++;
      const now = performance.now();
      if (now - fpsLastTime.current >= 1000) {
        setFps(fpsFrames.current);
        fpsFrames.current = 0;
        fpsLastTime.current = now;
      }
      frameId = requestAnimationFrame(measureFps);
    };
    frameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (nodePanel.dragging && panelDragRef.current) {
        const dx = e.clientX - panelDragRef.current.startX;
        const dy = e.clientY - panelDragRef.current.startY;
        setNodePanel((prev) => ({
          ...prev,
          position: {
            x: panelDragRef.current!.origX + dx,
            y: panelDragRef.current!.origY + dy,
          },
        }));
      }
    };
    const handleGlobalMouseUp = () => {
      if (nodePanel.dragging) {
        setNodePanel((prev) => ({ ...prev, dragging: false }));
        panelDragRef.current = null;
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [nodePanel.dragging]);

  const createNode = useCallback(
    (type: NodeType) => {
      nodeCounter.current++;
      const newNode: NodeData = {
        id: uuidv4(),
        name: `Node-${nodeCounter.current}`,
        type,
        position: generateSinglePosition(5),
        load: Math.random() * 100,
        throughput: Math.round(50 + Math.random() * 150),
        latency: Math.round(5 + Math.random() * 50),
      };
      setNodes((prev) => [...prev, newNode]);
      setCreateMenu({ visible: false, position: { x: 0, y: 0 } });
    },
    []
  );

  const handleBackgroundClick = useCallback((pos: PanelPosition) => {
    setCreateMenu({ visible: true, position: pos });
    setSelectedNodeId(null);
    setNodePanel((prev) => ({ ...prev, visible: false, nodeId: null }));
    setSelectedAll(false);
  }, []);

  const handleNodeClick = useCallback((nodeId: string, pos: PanelPosition) => {
    setSelectedNodeId(nodeId);
    setSelectedAll(false);
    setCreateMenu({ visible: false, position: { x: 0, y: 0 } });
    setNodePanel({
      visible: true,
      nodeId,
      position: pos,
      offset: { x: 0, y: 0 },
      dragging: false,
    });
  }, []);

  const handleNodeNameChange = useCallback((nodeId: string, name: string) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, name } : n)));
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedAll((prev) => !prev);
    setSelectedNodeId(null);
    setNodePanel((prev) => ({ ...prev, visible: false, nodeId: null }));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedAll) {
      setNodes([]);
      setEdges([]);
      setSelectedAll(false);
      return;
    }
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId));
      setSelectedNodeId(null);
      setNodePanel((prev) => ({ ...prev, visible: false, nodeId: null }));
    }
  }, [selectedAll, selectedNodeId]);

  const handleResetCamera = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  const handlePanelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      panelDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: nodePanel.position.x,
        origY: nodePanel.position.y,
      };
      setNodePanel((prev) => ({ ...prev, dragging: true }));
    },
    [nodePanel.position.x, nodePanel.position.y]
  );

  const selectedNode = nodes.find((n) => n.id === nodePanel.nodeId);

  return (
    <div style={styles.container}>
      <PipelineScene
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        selectedAll={selectedAll}
        onResetCamera={handleResetCamera}
        resetTrigger={resetTrigger}
      />

      <div style={styles.fpsCounter}>
        <div style={{ ...styles.fpsValue, color: fps >= 30 ? '#4ade80' : '#ef4444' }}>{fps} FPS</div>
        <div style={styles.nodeCount}>节点: {nodes.length}</div>
      </div>

      <div style={styles.controlPanel}>
        <div style={styles.panelTitle}>控制面板</div>
        <button
          style={{
            ...styles.panelButton,
            filter: selectedAll ? 'brightness(1.3)' : 'brightness(1)',
          }}
          onClick={handleSelectAll}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
          onMouseOut={(e) => (e.currentTarget.style.filter = selectedAll ? 'brightness(1.3)' : 'brightness(1)')}
        >
          {selectedAll ? '取消全选' : '全选节点'}
        </button>
        <button
          style={styles.panelButton}
          onClick={handleDeleteSelected}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
          onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          删除选中
        </button>
        <button
          style={styles.panelButton}
          onClick={handleResetCamera}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
          onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          重置视角
        </button>
      </div>

      {createMenu.visible && (
        <div
          style={{
            ...styles.createMenu,
            left: createMenu.position.x,
            top: createMenu.position.y,
          }}
        >
          <div style={styles.menuTitle}>选择节点类型</div>
          <button
            style={styles.menuButton}
            onClick={() => createNode('source')}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⬇ 数据源
          </button>
          <button
            style={styles.menuButton}
            onClick={() => createNode('processor')}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⚙ 处理器
          </button>
          <button
            style={styles.menuButton}
            onClick={() => createNode('sink')}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⬆ 汇聚
          </button>
        </div>
      )}

      {nodePanel.visible && selectedNode && (
        <div
          style={{
            ...styles.nodeDetailPanel,
            left: Math.min(nodePanel.position.x, window.innerWidth - 280),
            top: Math.min(nodePanel.position.y, window.innerHeight - 280),
          }}
          onMouseDown={handlePanelMouseDown}
        >
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderTitle}>节点详情</div>
            <button
              style={styles.closeButton}
              onClick={() => setNodePanel((prev) => ({ ...prev, visible: false, nodeId: null }))}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
              onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              ✕
            </button>
          </div>
          <div style={styles.panelBody}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>名称</label>
              <input
                style={styles.fieldInput}
                value={selectedNode.name}
                onChange={(e) => handleNodeNameChange(selectedNode.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>类型</label>
              <div style={styles.fieldValue}>
                {selectedNode.type === 'source' && '⬇ 数据源'}
                {selectedNode.type === 'processor' && '⚙ 处理器'}
                {selectedNode.type === 'sink' && '⬆ 汇聚'}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>负载</label>
              <div style={styles.loadBarContainer}>
                <div
                  style={{
                    ...styles.loadBar,
                    width: `${selectedNode.load}%`,
                    backgroundColor: getLoadColor(selectedNode.load),
                  }}
                />
                <span style={styles.loadText}>{selectedNode.load.toFixed(0)}%</span>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>吞吐量</label>
              <div style={styles.fieldValue}>{selectedNode.throughput} 粒子/秒</div>
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>延迟</label>
              <div style={styles.fieldValue}>{selectedNode.latency} ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  fpsCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: '10px 16px',
    backgroundColor: 'rgba(15, 12, 41, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    textAlign: 'right',
    zIndex: 10,
    userSelect: 'none',
  },
  fpsValue: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 1,
  },
  nodeCount: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  controlPanel: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 240,
    padding: 16,
    backgroundColor: 'rgba(15, 12, 41, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    zIndex: 10,
    userSelect: 'none',
  },
  panelTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    letterSpacing: 0.5,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  panelButton: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    marginBottom: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'filter 0.2s ease, transform 0.15s ease',
    textAlign: 'left',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  createMenu: {
    position: 'absolute',
    padding: 12,
    backgroundColor: 'rgba(15, 12, 41, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    zIndex: 20,
    minWidth: 160,
    transform: 'translate(-50%, -50%)',
    userSelect: 'none',
  },
  menuTitle: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuButton: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    marginBottom: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'filter 0.2s ease, transform 0.15s ease',
    textAlign: 'left',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  nodeDetailPanel: {
    position: 'absolute',
    width: 260,
    backgroundColor: 'rgba(15, 12, 41, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    zIndex: 15,
    color: '#fff',
    cursor: 'move',
    userSelect: 'none',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  panelHeaderTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#a5b4fc',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a5b4fc',
    fontSize: 14,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    transition: 'filter 0.2s ease',
  },
  panelBody: {
    padding: 14,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 500,
  },
  fieldInput: {
    width: '100%',
    padding: '6px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    cursor: 'text',
  },
  loadBarContainer: {
    position: 'relative',
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadBar: {
    height: '100%',
    borderRadius: 10,
    transition: 'width 0.5s ease, background-color 0.5s ease',
  },
  loadText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
};
