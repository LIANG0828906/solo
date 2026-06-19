import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3-force';
import { useGameStore } from '../store/gameStore';
import EventNode from './EventNode';

interface SimNode {
  id: string;
  eventId: string;
  title: string;
  type: 'major' | 'minor' | 'turning';
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  deliveredYear: number;
  index?: number;
  vy?: number;
  vx?: number;
}

interface SimLink {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  isCorrect: boolean;
}

const CausalGraph: React.FC = () => {
  const {
    graphNodes,
    graphEdges,
    isCausallyClosed,
    setNodeFixed,
    updateGraphLayout,
    deliveries,
    events,
  } = useGameStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 400, h: 500 });
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const nodeMapRef = useRef<Map<string, SimNode>>(new Map());
  const draggingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        size.current = {
          w: Math.floor(e.contentRect.width),
          h: Math.floor(e.contentRect.height),
        };
        if (simRef.current) {
          simRef.current.force(
            'center',
            d3.forceCenter(size.current.w / 2, size.current.h / 2)
          );
          simRef.current.alpha(0.2).restart();
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const correctCount = graphEdges.filter((e) => e.isCorrect).length;
  const paradoxCount = graphEdges.length - correctCount;

  useEffect(() => {
    const existingMap = nodeMapRef.current;
    const newNodes: SimNode[] = graphNodes.map((n) => {
      const prev = existingMap.get(n.id);
      return {
        id: n.id,
        eventId: n.eventId,
        title: n.title,
        type: n.type,
        deliveredYear: n.deliveredYear,
        x: prev?.x ?? n.x + size.current.w / 2,
        y: prev?.y ?? n.y + size.current.h / 2,
        fx: n.fx,
        fy: n.fy,
      };
    });

    const byId = new Map(newNodes.map((n) => [n.id, n]));
    nodeMapRef.current = byId;
    simNodesRef.current = newNodes;

    simLinksRef.current = graphEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      isCorrect: e.isCorrect,
    }));

    const simulation = d3
      .forceSimulation<SimNode>(newNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinksRef.current)
          .id((d) => (d as SimNode).id)
          .distance(100)
          .strength(0.45)
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(size.current.w / 2, size.current.h / 2))
      .force(
        'collide',
        d3.forceCollide<SimNode>().radius(() => 48)
      )
      .force(
        'x',
        d3.forceX<SimNode>((d) => {
          const ev = events.find((e) => e.id === d.eventId);
          if (!ev) return size.current.w / 2;
          const t = (ev.year - 1900) / 200;
          return 70 + t * (size.current.w - 140);
        }).strength(0.12)
      )
      .force(
        'y',
        d3.forceY(size.current.h / 2).strength(0.08)
      )
      .alphaDecay(0.028)
      .on('tick', () => {
        const updates = simNodesRef.current.map((n) => ({
          id: n.id,
          x: n.x,
          y: n.y,
        }));
        updateGraphLayout(updates);
      });

    simRef.current = simulation;
    simulation.alpha(0.9).restart();

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphNodes.length, graphEdges.length, events]);

  const linkData = useMemo(() => {
    return graphEdges.map((e) => {
      const s = nodeMapRef.current.get(
        deliveries.find((d) => d.eventId === e.source)?.eventId
          ? (graphNodes.find((n) => n.eventId === e.source)?.id || '')
          : ''
      );
      const sourceNode =
        nodeMapRef.current.get(graphNodes.find((n) => n.eventId === e.source)?.id || '') ||
        { x: 0, y: 0 };
      const targetNode =
        nodeMapRef.current.get(graphNodes.find((n) => n.eventId === e.target)?.id || '') ||
        { x: 0, y: 0 };
      void s;
      return { ...e, sx: sourceNode.x, sy: sourceNode.y, tx: targetNode.x, ty: targetNode.y };
    });
  }, [graphEdges, graphNodes, deliveries]);

  const handleNodePointerDown = (id: string, ev: React.PointerEvent) => {
    ev.stopPropagation();
    draggingIdRef.current = id;
    const node = simNodesRef.current.find((n) => n.id === id);
    if (!node) return;
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const startX = ev.clientX - rect.left;
    const startY = ev.clientY - rect.top;
    const offsetX = startX - node.x;
    const offsetY = startY - node.y;
    setNodeFixed(id, node.x, node.y);
    if (simRef.current) simRef.current.alphaTarget(0.3).restart();

    const onMove = (mv: PointerEvent) => {
      const x = mv.clientX - rect.left - offsetX;
      const y = mv.clientY - rect.top - offsetY;
      setNodeFixed(id, x, y);
      const n = simNodesRef.current.find((nn) => nn.id === id);
      if (n) {
        n.fx = x;
        n.fy = y;
      }
    };
    const onUp = () => {
      draggingIdRef.current = null;
      setNodeFixed(id, null, null);
      const n = simNodesRef.current.find((nn) => nn.id === id);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
      if (simRef.current) simRef.current.alphaTarget(0);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const visibleNodes = graphNodes;

  return (
    <>
      <div
        className="panel-header"
        style={{ background: 'rgba(15,52,96,0.55)', backdropFilter: 'blur(4px)' }}
      >
        <div>
          <div className="panel-title">
            <span className="dot right" />
            因果网络图
          </div>
          <div className="panel-subtitle">
            {graphNodes.length} 节点 · {graphEdges.length} 因果链
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 10, color: '#00B894' }}>
            ✓ 正确 {correctCount}
          </span>
          {paradoxCount > 0 && (
            <span style={{ fontSize: 10, color: '#FF6B6B' }}>
              ⚠ 悖论 {paradoxCount}
            </span>
          )}
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="causal-svg"
          style={{ display: 'block' }}
        >
          <defs>
            <marker
              id="arrow-gray"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#B2BEC3" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#00B894" />
            </marker>
            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g>
            {linkData.map((e) => {
              const midX = (e.sx + e.tx) / 2;
              const midY = (e.sy + e.ty) / 2;
              const dx = e.tx - e.sx;
              const dy = e.ty - e.sy;
              const cx = midX - dy * 0.18;
              const cy = midY + dx * 0.18;
              const d = `M ${e.sx} ${e.sy} Q ${cx} ${cy} ${e.tx} ${e.ty}`;
              const color = e.isCorrect ? '#00B894' : '#B2BEC3';
              return (
                <motion.path
                  key={e.id}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={e.isCorrect ? 2.6 : 1.6}
                  strokeLinecap="round"
                  markerEnd={e.isCorrect ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
                  filter={e.isCorrect ? 'url(#pulseGlow)' : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: e.isCorrect && isCausallyClosed ? [0.8, 1, 0.8] : 0.9,
                    stroke: e.isCorrect && isCausallyClosed
                      ? ['#00B894', '#55EFC4', '#00B894']
                      : color,
                  }}
                  transition={{
                    pathLength: { duration: 0.7, ease: 'easeOut' },
                    opacity: e.isCorrect && isCausallyClosed
                      ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.4 },
                    stroke: e.isCorrect && isCausallyClosed
                      ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.3 },
                  }}
                />
              );
            })}
          </g>

          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {visibleNodes.map((n) => (
              <EventNode
                key={n.id}
                id={n.id}
                x={n.x}
                y={n.y}
                title={n.title}
                type={n.type}
                deliveredYear={n.deliveredYear}
                onPointerDown={handleNodePointerDown}
              />
            ))}
          </motion.g>

          {visibleNodes.length === 0 && (
            <g>
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize={13}
              >
                投递信标以构建因果网络…
              </text>
              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                fill="rgba(255,255,255,0.18)"
                fontSize={11}
              >
                每一个选择都在重新编织历史
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="status-footer">
        <span
          className={`status-pill ${isCausallyClosed ? 'status-closed' : 'status-open'}`}
        >
          <span className="pulse" />
          {isCausallyClosed ? '因果闭合 · 无悖论' : '因果开放 · 仍需投递'}
        </span>
        <span className="closure-count">
          闭合度 {graphEdges.length === 0 ? 0 : Math.round((correctCount / graphEdges.length) * 100)}%
        </span>
      </div>
    </>
  );
};

export default CausalGraph;
