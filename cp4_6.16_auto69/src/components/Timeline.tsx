import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useTimelineStore } from '../hooks/useTimelineStore';
import { EVENT_COLORS, EVENT_LABELS, ARTICLE_LABEL_COLORS } from '../types';
import type { EventNode } from '../types';
import { Calendar, Tag } from 'lucide-react';

const NODE_SPACING = 180;
const NODE_RADIUS = 14;
const AXIS_Y = 220;
const CARD_WIDTH = 150;

export const Timeline: React.FC = () => {
  const {
    eventNodes,
    selectedNodeId,
    setSelectedNode,
    activeArticleFilter,
    articles,
  } = useTimelineStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, offset: 0 });
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const filteredNodes = useMemo(() => {
    if (activeArticleFilter === 'all') return eventNodes;
    return eventNodes.filter((n) => n.articleId === activeArticleFilter);
  }, [eventNodes, activeArticleFilter]);

  const nodePositions = useMemo(() => {
    const positions = new Map<string, number>();
    filteredNodes.forEach((node, i) => {
      positions.set(node.id, i * NODE_SPACING + 100);
    });
    return positions;
  }, [filteredNodes]);

  const articleColorMap = useMemo(() => {
    const map = new Map<string, string>();
    articles.forEach((a, i) => {
      map.set(a.id, ARTICLE_LABEL_COLORS[i % ARTICLE_LABEL_COLORS.length]);
    });
    return map;
  }, [articles]);

  const timelineWidth = filteredNodes.length * NODE_SPACING + 200;

  const clampOffset = useCallback(
    (offset: number) => {
      if (!canvasRef.current) return offset;
      const canvasWidth = canvasRef.current.clientWidth;
      const maxOffset = 0;
      const minOffset = Math.min(0, canvasWidth - timelineWidth);
      return Math.max(minOffset, Math.min(maxOffset, offset));
    },
    [timelineWidth]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, offset: scrollOffset };
      velocityRef.current = 0;
      lastXRef.current = e.clientX;
      lastTimeRef.current = Date.now();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    },
    [scrollOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current =
          (e.clientX - lastXRef.current) / dt;
      }
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;
      const delta = e.clientX - dragStartRef.current.x;
      const newOffset = clampOffset(dragStartRef.current.offset + delta);
      setScrollOffset(newOffset);
    },
    [isDragging, clampOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    const momentum = velocityRef.current * 150;
    if (Math.abs(momentum) > 5) {
      const target = clampOffset(scrollOffset + momentum);
      setScrollOffset(target);
    }
  }, [scrollOffset, clampOffset]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        const momentum = velocityRef.current * 150;
        if (Math.abs(momentum) > 5) {
          setScrollOffset((prev) => clampOffset(prev + momentum));
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, clampOffset]);

  const handleNodeClick = useCallback(
    (node: EventNode, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedNode(selectedNodeId === node.id ? null : node.id);
    },
    [selectedNodeId, setSelectedNode]
  );

  const arcPaths = useMemo(() => {
    const paths: {
      key: string;
      d: string;
      fromX: number;
      toX: number;
    }[] = [];
    for (const node of filteredNodes) {
      const toX = nodePositions.get(node.id);
      if (!toX) continue;
      for (const refId of node.references) {
        const fromX = nodePositions.get(refId);
        if (fromX === undefined) continue;
        const midX = (fromX + toX) / 2;
        const curveHeight = Math.abs(toX - fromX) * 0.25 + 30;
        paths.push({
          key: `${refId}-${node.id}`,
          d: `M ${fromX} ${AXIS_Y} Q ${midX} ${AXIS_Y - curveHeight} ${toX} ${AXIS_Y}`,
          fromX,
          toX,
        });
      }
    }
    return paths;
  }, [filteredNodes, nodePositions]);

  const selectedNode = useMemo(
    () => eventNodes.find((n) => n.id === selectedNodeId),
    [eventNodes, selectedNodeId]
  );

  return (
    <div className="timeline-canvas" ref={canvasRef}>
      {filteredNodes.length === 0 ? (
        <div className="timeline-empty">
          <div className="timeline-empty-icon">
            <Calendar size={48} strokeWidth={1} />
          </div>
          <p className="timeline-empty-title">暂无时间线数据</p>
          <p className="timeline-empty-sub">
            导入Markdown文章后，事件节点将在此处展示
          </p>
        </div>
      ) : (
        <div
          className="timeline-scroll-area"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={isDragging ? handleMouseUp : undefined}
        >
          <div
            className="timeline-track"
            style={{
              width: timelineWidth,
              transform: `translateX(${scrollOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <div className="timeline-axis" style={{ top: AXIS_Y }} />

            <svg
              className="timeline-arcs"
              width={timelineWidth}
              height={AXIS_Y * 2}
              style={{ top: 0 }}
            >
              {arcPaths.map((arc) => (
                <path
                  key={arc.key}
                  d={arc.d}
                  fill="none"
                  stroke="rgba(74, 144, 217, 0.25)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
              ))}
            </svg>

            {filteredNodes.map((node, i) => {
              const x = nodePositions.get(node.id) || 0;
              const isAbove = i % 2 === 0;
              const isSelected = node.id === selectedNodeId;
              const eventColor = EVENT_COLORS[node.eventType];
              const articleColor =
                articleColorMap.get(node.articleId) || '#999';

              return (
                <div
                  key={node.id}
                  className="timeline-node-wrapper"
                  style={{
                    left: x - CARD_WIDTH / 2,
                    top: isAbove ? AXIS_Y - 160 : AXIS_Y + 40,
                  }}
                >
                  <div
                    className={`timeline-node-card ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => handleNodeClick(node, e)}
                    style={{
                      borderColor: isSelected ? '#FF6B6B' : 'transparent',
                    }}
                  >
                    <div
                      className="article-label"
                      style={{ backgroundColor: articleColor }}
                      title={
                        articles.find((a) => a.id === node.articleId)?.title ||
                        ''
                      }
                    />
                    <div className="node-card-content">
                      <span className="node-card-title">{node.title}</span>
                      <span className="node-card-date">{node.date}</span>
                      <span className="node-card-summary">{node.summary}</span>
                    </div>
                    <div
                      className="node-type-badge"
                      style={{ backgroundColor: eventColor }}
                      title={EVENT_LABELS[node.eventType]}
                    >
                      <Tag size={10} />
                    </div>
                  </div>

                  <div
                    className={`timeline-connector ${isAbove ? 'above' : 'below'}`}
                  />

                  <div
                    className={`timeline-badge ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: CARD_WIDTH / 2 - NODE_RADIUS,
                      top: isAbove ? 160 - NODE_RADIUS : -NODE_RADIUS - 40 + 40,
                      backgroundColor: eventColor,
                      boxShadow: isSelected
                        ? `0 0 0 4px rgba(255,107,107,0.3), 0 2px 8px ${eventColor}40`
                        : `0 2px 8px ${eventColor}40`,
                    }}
                    onClick={(e) => handleNodeClick(node, e)}
                  >
                    <span className="badge-dot" />
                  </div>
                </div>
              );
            })}

            {filteredNodes.map((node) => {
              const x = nodePositions.get(node.id) || 0;
              return (
                <div
                  key={`date-${node.id}`}
                  className="timeline-date-label"
                  style={{ left: x - 30, top: AXIS_Y + 22 }}
                >
                  {node.date.slice(5)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
