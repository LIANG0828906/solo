import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useTimelineStore } from '../hooks/useTimelineStore';
import { EVENT_COLORS, EVENT_LABELS, ARTICLE_LABEL_COLORS } from '../types';
import type { EventNode, Article } from '../types';
import { Calendar, Tag } from 'lucide-react';

const NODE_SPACING = 180;
const NODE_RADIUS = 14;
const AXIS_Y = 220;
const CARD_WIDTH = 150;
const ANIMATION_DURATION = 300;

export const Timeline: React.FC = () => {
  const {
    eventNodes,
    selectedNodeId,
    setSelectedNode,
    activeArticleFilter,
    articles,
  } = useTimelineStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, offset: 0 });
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [frameTimes, setFrameTimes] = useState<number[]>([]);
  const [fps, setFps] = useState(0);
  const animatingRef = useRef(false);
  const targetOffsetRef = useRef(0);
  const rafIdRef = useRef<number>(0);

  const [previousNodes, setPreviousNodes] = useState<EventNode[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionStartRef = useRef(0);

  const filteredNodes = useMemo(() => {
    if (activeArticleFilter === 'all') return eventNodes;
    return eventNodes.filter((n) => n.articleId === activeArticleFilter);
  }, [eventNodes, activeArticleFilter]);

  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    filteredNodes.forEach((node, i) => {
      const x = i * NODE_SPACING + 100;
      const y = i % 2 === 0 ? AXIS_Y - 160 : AXIS_Y + 40;
      positions.set(node.id, { x, y });
    });
    return positions;
  }, [filteredNodes]);

  const articleColorMap = useMemo(() => {
    const map = new Map<string, { color: string; article: Article | undefined }>();
    articles.forEach((a, i) => {
      map.set(a.id, {
        color: ARTICLE_LABEL_COLORS[i % ARTICLE_LABEL_COLORS.length],
        article: a,
      });
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

  const animateToOffset = useCallback(
    (target: number, duration = 200) => {
      const start = scrollOffset;
      const end = clampOffset(target);
      const startTime = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);
        const current = start + (end - start) * eased;
        setScrollOffset(current);

        if (t < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        }
      };

      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(step);
    },
    [scrollOffset, clampOffset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, offset: scrollOffset };
      velocityRef.current = 0;
      lastXRef.current = e.clientX;
      lastTimeRef.current = Date.now();
      cancelAnimationFrame(rafIdRef.current);
    },
    [scrollOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = (e.clientX - lastXRef.current) / dt;
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
    if (!isDragging) return;
    setIsDragging(false);

    const momentum = velocityRef.current * 200;
    if (Math.abs(momentum) > 10) {
      animateToOffset(scrollOffset + momentum, 400);
    }
  }, [isDragging, scrollOffset, animateToOffset]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isDragging, handleMouseUp]);

  useEffect(() => {
    if (previousNodes.length > 0 && filteredNodes !== previousNodes) {
      const hasChanged =
        previousNodes.length !== filteredNodes.length ||
        previousNodes.some(
          (n, i) =>
            !filteredNodes[i] ||
            n.id !== filteredNodes[i].id
        );

      if (hasChanged) {
        setIsTransitioning(true);
        transitionStartRef.current = performance.now();

        const timer = setTimeout(() => {
          setIsTransitioning(false);
          const endTime = performance.now();
          console.debug(
            `[Timeline] Transition completed in ${(endTime - transitionStartRef.current).toFixed(
              1
            )}ms`
          );
        }, ANIMATION_DURATION);

        return () => clearTimeout(timer);
      }
    }
    setPreviousNodes(filteredNodes);
  }, [filteredNodes, previousNodes]);

  useEffect(() => {
    if (!isTransitioning) return;

    let frameCount = 0;
    let lastFrameTime = performance.now();
    const fpsValues: number[] = [];

    const measure = (now: number) => {
      frameCount++;
      const delta = now - lastFrameTime;
      if (delta > 0) {
        fpsValues.push(1000 / delta);
      }
      lastFrameTime = now;

      if (fpsValues.length > 0) {
        const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        setFps(Math.round(avgFps));
      }

      if (frameCount < 60 && isTransitioning) {
        requestAnimationFrame(measure);
      }
    };

    requestAnimationFrame(measure);
  }, [isTransitioning]);

  const handleNodeClick = useCallback(
    (node: EventNode, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedNode(selectedNodeId === node.id ? null : node.id);
    },
    [selectedNodeId, setSelectedNode]
  );

  const arcPaths = useMemo(() => {
    const paths: { key: string; d: string; fromX: number; toX: number }[] = [];
    for (const node of filteredNodes) {
      const toPos = nodePositions.get(node.id);
      if (!toPos) continue;
      for (const refId of node.references) {
        const fromPos = nodePositions.get(refId);
        if (!fromPos) continue;
        const fromX = fromPos.x + CARD_WIDTH / 2;
        const toX = toPos.x + CARD_WIDTH / 2;
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

  return (
    <div className="timeline-canvas" ref={canvasRef}>
      <div className="timeline-fps-monitor" title={`FPS: ${fps}`}>
        {fps > 0 && `FPS: ${fps}`}
      </div>

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
          <div className="timeline-labels-row">
            {articles.map((article, i) => {
              const color = ARTICLE_LABEL_COLORS[i % ARTICLE_LABEL_COLORS.length];
              return (
                <div key={article.id} className="article-label-chip" style={{
                  left: 20 + i * 120,
                  backgroundColor: color,
                }} title={article.title}>
                  <span className="label-tooltip">{article.title}</span>
                </div>
              );
            })}
          </div>

          <div
            ref={trackRef}
            className="timeline-track"
            style={{
              width: timelineWidth,
              transform: `translateX(${scrollOffset}px)`,
              transition: isDragging
                ? 'none'
                : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
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
                  className="timeline-arc-path"
                />
              ))}
            </svg>

            {filteredNodes.map((node, i) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const isAbove = i % 2 === 0;
              const isSelected = node.id === selectedNodeId;
              const eventColor = EVENT_COLORS[node.eventType];
              const articleInfo = articleColorMap.get(node.articleId);
              const articleColor = articleInfo?.color || '#999';
              const articleTitle = articleInfo?.article?.title || '';

              return (
                <div
                  key={node.id}
                  className={`timeline-node-wrapper ${
                    isTransitioning ? 'transitioning' : ''
                  }`}
                  style={{
                    left: pos.x - CARD_WIDTH / 2,
                    top: isAbove ? AXIS_Y - 160 : AXIS_Y + 40,
                    transition: isTransitioning
                      ? `left ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
                         top ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                      : 'none',
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
                      title={articleTitle}
                    >
                      <span className="label-tooltip-top">{articleTitle}</span>
                    </div>
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
                    className={`timeline-badge ${isSelected ? 'selected' : ''} ${
                      isDragging ? 'bouncy' : ''
                    }`}
                    style={{
                      left: CARD_WIDTH / 2 - NODE_RADIUS,
                      top: isAbove ? 160 - NODE_RADIUS : -NODE_RADIUS - 40 + 40,
                      backgroundColor: eventColor,
                      boxShadow: isSelected
                        ? `0 0 0 4px rgba(255,107,107,0.3), 0 2px 8px ${eventColor}40`
                        : `0 2px 8px ${eventColor}40`,
                      transition: isDragging
                        ? 'none'
                        : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
                    }}
                    onClick={(e) => handleNodeClick(node, e)}
                  >
                    <span className="badge-dot" />
                  </div>
                </div>
              );
            })}

            {filteredNodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;
              return (
                <div
                  key={`date-${node.id}`}
                  className="timeline-date-label"
                  style={{
                    left: pos.x + CARD_WIDTH / 2 - 30,
                    top: AXIS_Y + 22,
                    transition: isTransitioning
                      ? `left ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                      : 'none',
                  }}
                >
                  {node.date.slice(5)}
                </div>
              );
            })}
          </div>

          <div className="timeline-scroll-hint">
            <span>← 拖拽滚动时间线 →</span>
          </div>
        </div>
      )}
    </div>
  );
};
