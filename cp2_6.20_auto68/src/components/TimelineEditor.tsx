import { useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineNode } from './TimelineNode';
import { ConnectionLine } from './ConnectionLine';
import type { ConnectionType } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';
import { Plus } from 'lucide-react';
import '@/styles/Editor.css';

export const TimelineEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    connections,
    currentTheme,
    selectedNodeId,
    addNode,
    addConnection,
    selectNode,
  } = useTimelineStore();

  const [draggingConnection, setDraggingConnection] = useState<{
    fromId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [showConnectionMenu, setShowConnectionMenu] = useState<{
    x: number;
    y: number;
    fromId: string;
    toId: string;
  } | null>(null);

  const handleAddNode = useCallback(() => {
    addNode({ x: 50, y: 50 });
  }, [addNode]);

  const handleEditorClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleStartDragConnection = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      if (!editorRef.current) return;
      const rect = editorRef.current.getBoundingClientRect();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setDraggingConnection({
        fromId: nodeId,
        startX: node.x,
        startY: node.y,
        currentX: ((e.clientX - rect.left) / rect.width) * 100,
        currentY: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingConnection || !editorRef.current) return;
      const rect = editorRef.current.getBoundingClientRect();
      setDraggingConnection({
        ...draggingConnection,
        currentX: ((e.clientX - rect.left) / rect.width) * 100,
        currentY: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [draggingConnection]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingConnection || !editorRef.current) {
        setDraggingConnection(null);
        return;
      }

      const target = e.target as HTMLElement;
      const nodeDot = target.closest('[data-node-id]');
      if (nodeDot) {
        const toId = nodeDot.getAttribute('data-node-id');
        if (toId && toId !== draggingConnection.fromId) {
          const rect = editorRef.current.getBoundingClientRect();
          setShowConnectionMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            fromId: draggingConnection.fromId,
            toId,
          });
        }
      }
      setDraggingConnection(null);
    },
    [draggingConnection]
  );

  const handleSelectConnectionType = useCallback(
    (type: ConnectionType) => {
      if (showConnectionMenu) {
        addConnection(showConnectionMenu.fromId, showConnectionMenu.toId, type);
        setShowConnectionMenu(null);
      }
    },
    [showConnectionMenu, addConnection]
  );

  const simplifiedNodes = useMemo(
    () => nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
    [nodes]
  );

  return (
    <motion.div
      className={`timeline-editor theme-${currentTheme}`}
      ref={editorRef}
      onClick={handleEditorClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="timeline-axis" />

      <svg className="connections-svg">
        <AnimatePresence mode="popLayout">
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              nodes={simplifiedNodes}
              theme={currentTheme}
            />
          ))}
        </AnimatePresence>

        {draggingConnection && (
          <line
            x1={`${draggingConnection.startX}%`}
            y1={`${draggingConnection.startY}%`}
            x2={`${draggingConnection.currentX}%`}
            y2={`${draggingConnection.currentY}%`}
            stroke="var(--node-color, #4a90d9)"
            strokeWidth="2"
            strokeDasharray="6 4"
            pointerEvents="none"
          />
        )}
      </svg>

      {nodes.map((node) => (
        <TimelineNode
          key={node.id}
          node={node}
          theme={currentTheme}
          editorRef={editorRef}
          onStartDragConnection={handleStartDragConnection}
        />
      ))}

      <motion.button
        className="add-node-button"
        onClick={(e) => {
          e.stopPropagation();
          handleAddNode();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={18} />
        <span>添加事件</span>
      </motion.button>

      <div className="event-counter">事件数：{nodes.length}</div>

      <AnimatePresence>
        {showConnectionMenu && (
          <motion.div
            className="connection-menu"
            style={{
              left: showConnectionMenu.x,
              top: showConnectionMenu.y,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => handleSelectConnectionType('causal')}>
              因果关系
            </button>
            <button onClick={() => handleSelectConnectionType('parallel')}>
              平行关系
            </button>
            <button
              className="cancel-btn"
              onClick={() => setShowConnectionMenu(null)}
            >
              取消
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
