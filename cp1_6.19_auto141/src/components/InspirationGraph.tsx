import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  forceLayoutStep,
  render,
  findNodeAt,
} from '../utils/inspirationGraph';
import type { GraphNode } from '../utils/types';

const InspirationGraph = memo(function InspirationGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const { graphNodes, graphEdges, updateNodePosition, setNodeDragging } = useStore();

  const nodesRef = useRef(graphNodes);
  const edgesRef = useRef(graphEdges);

  useEffect(() => {
    nodesRef.current = graphNodes;
    edgesRef.current = graphEdges;
  }, [graphNodes, graphEdges]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const node = findNodeAt(nodesRef.current, x, y);
    if (node) {
      setIsDragging(true);
      setSelectedNodeId(node.id);
      setNodeDragging(node.id, true);
      dragOffsetRef.current = {
        x: x - node.x,
        y: y - node.y,
      };
    }
  }, [getCanvasCoords, setNodeDragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (isDragging && selectedNodeId) {
      const newX = x - dragOffsetRef.current.x;
      const newY = y - dragOffsetRef.current.y;
      updateNodePosition(selectedNodeId, newX, newY);
    } else {
      const node = findNodeAt(nodesRef.current, x, y);
      setHoveredNodeId(node?.id || null);
      if (containerRef.current) {
        containerRef.current.style.cursor = node ? 'grab' : 'default';
      }
    }
  }, [isDragging, selectedNodeId, getCanvasCoords, updateNodePosition]);

  const handleMouseUp = useCallback(() => {
    if (selectedNodeId) {
      setNodeDragging(selectedNodeId, false);
    }
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'default';
    }
  }, [selectedNodeId, setNodeDragging]);

  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    if (isDragging && selectedNodeId) {
      setNodeDragging(selectedNodeId, false);
    }
    setIsDragging(false);
  }, [isDragging, selectedNodeId, setNodeDragging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      frameCountRef.current++;

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      if (nodes.length > 0) {
        const dt = Math.min((time - lastTimeRef.current) / 16.67, 2);
        lastTimeRef.current = time;

        if (nodes.length <= 30) {
          forceLayoutStep(nodes, edges, canvas.width, canvas.height);
        }

        render(ctx, nodes, edges, canvas.width, canvas.height, selectedNodeId, hoveredNodeId, time);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedNodeId, hoveredNodeId]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 400,
        height: 500,
        background: '#2D3436',
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#ECF0F1',
          }}
        >
          灵感关系网
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#636E72',
            marginTop: 2,
          }}
        >
          {graphNodes.length} 个节点 · {graphEdges.length} 条连接
        </div>
      </div>

      {graphNodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#636E72',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          拆解盲盒作品
          <br />
          生成你的灵感网络
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : hoveredNodeId ? 'grab' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: '#636E72',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#6C5CE7',
            }}
          />
          可拖拽
        </div>
      </div>
    </div>
  );
});

export default InspirationGraph;
