import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useDreamStore, type Dream, type SortType } from '../stores/dreamStore';
import { generateMapData, type MapNode, type MapData } from '../renderer/mapRenderer';

interface TooltipInfo {
  dream: Dream;
  x: number;
  y: number;
}

function filterAndSortDreams(
  dreams: Dream[],
  activeTags: string[],
  sortType: SortType
): Dream[] {
  let result = [...dreams];

  if (activeTags.length > 0) {
    result = result.filter(dream =>
      dream.tags.some(tag => activeTags.includes(tag.id))
    );
  }

  switch (sortType) {
    case 'date-desc':
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date-asc':
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'emotion-desc':
      result.sort((a, b) => b.emotionRating - a.emotionRating);
      break;
    case 'emotion-asc':
      result.sort((a, b) => a.emotionRating - b.emotionRating);
      break;
  }

  return result;
}

export default function DreamMap() {
  const dreams = useDreamStore(state => state.dreams);
  const activeTags = useDreamStore(state => state.activeTags);
  const sortType = useDreamStore(state => state.sortType);
  const allTags = useDreamStore(state => state.allTags);
  const toggleTagFilter = useDreamStore(state => state.toggleTagFilter);
  const setSelectedDream = useDreamStore(state => state.setSelectedDream);
  const setExpandedDream = useDreamStore(state => state.setExpandedDream);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightPulse, setHighlightPulse] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastMapDataRef = useRef<MapData | null>(null);
  const dreamsRef = useRef<Dream[]>([]);

  const filteredAndSortedDreams = useMemo(() => {
    return filterAndSortDreams(dreams, activeTags, sortType);
  }, [dreams, activeTags, sortType]);

  useEffect(() => {
    dreamsRef.current = filteredAndSortedDreams;
  }, [filteredAndSortedDreams]);

  const dreamMap = useMemo(() => {
    return filteredAndSortedDreams.reduce((acc, dream) => {
      acc[dream.id] = dream;
      return acc;
    }, {} as Record<string, Dream>);
  }, [filteredAndSortedDreams]);

  const calculateMapData = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const currentDreams = dreamsRef.current;

    if (width > 0 && height > 0 && currentDreams.length > 0) {
      const newMapData = generateMapData(currentDreams, width, height);
      lastMapDataRef.current = newMapData;
    } else {
      lastMapDataRef.current = null;
    }
  }, []);

  useEffect(() => {
    calculateMapData();

    const handleResize = () => {
      calculateMapData();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateMapData, filteredAndSortedDreams]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const currentMapData = lastMapDataRef.current;
    const currentDreamMap = dreamsRef.current.reduce((acc, dream) => {
      acc[dream.id] = dream;
      return acc;
    }, {} as Record<string, Dream>);

    if (!canvas || !ctx || !currentMapData) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const { nodes, links } = currentMapData;

    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, MapNode>);

    links.forEach(link => {
      const sourceNode = nodeMap[link.source];
      const targetNode = nodeMap[link.target];
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = `rgba(108, 92, 231, ${0.2 + link.strength * 0.2})`;
        ctx.lineWidth = 1 + link.strength;
        ctx.stroke();
      }
    });

    nodes.forEach(node => {
      const isHighlighted = highlightedNodeId === node.dreamId;

      if (isHighlighted) {
        ctx.save();
        const glowIntensity = highlightPulse ? 1 : 0.5;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 8 * glowIntensity;
      }

      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.radius
      );
      gradient.addColorStop(0, node.color);
      gradient.addColorStop(1, adjustColorBrightness(node.color, -0.2));

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const dream = currentDreamMap[node.dreamId];
      if (dream) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxTextWidth = node.radius * 1.6;
        let displayText = dream.title;
        if (ctx.measureText(displayText).width > maxTextWidth) {
          while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 1) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }
        ctx.fillText(displayText, node.x, node.y);
      }

      if (isHighlighted) {
        ctx.restore();
      }
    });
  }, [highlightedNodeId, highlightPulse]);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime >= 33) {
        draw();
        lastTime = time;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    if (highlightedNodeId) {
      const pulseInterval = setInterval(() => {
        setHighlightPulse(prev => !prev);
      }, 150);

      const timeout = setTimeout(() => {
        setHighlightedNodeId(null);
        clearInterval(pulseInterval);
      }, 300);

      return () => {
        clearTimeout(timeout);
        clearInterval(pulseInterval);
      };
    }
  }, [highlightedNodeId]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findNodeAtPosition = (x: number, y: number): MapNode | null => {
    const currentMapData = lastMapDataRef.current;
    if (!currentMapData) return null;

    for (let i = currentMapData.nodes.length - 1; i >= 0; i--) {
      const node = currentMapData.nodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        return node;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = findNodeAtPosition(pos.x, pos.y);

    if (node) {
      const dream = dreamMap[node.dreamId];
      if (dream) {
        setTooltip({
          dream,
          x: e.clientX,
          y: e.clientY
        });
        canvasRef.current!.style.cursor = 'pointer';
        return;
      }
    }

    setTooltip(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = findNodeAtPosition(pos.x, pos.y);

    if (node) {
      setHighlightedNodeId(node.dreamId);
      setSelectedDream(node.dreamId);
      setExpandedDream(node.dreamId);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="map-container">
      <div className="tag-filter-bar">
        {allTags.length === 0 ? (
          <div style={{ color: '#555577', fontSize: '13px', padding: '8px 0' }}>
            记录梦境后会自动生成标签
          </div>
        ) : (
          allTags.map(tag => (
            <button
              key={tag.id}
              className={`tag-filter-btn ${activeTags.includes(tag.id) ? 'active' : ''}`}
              onClick={() => toggleTagFilter(tag.id)}
            >
              {tag.name}
            </button>
          ))
        )}
      </div>

      <div className="map-canvas-container" ref={containerRef}>
        {filteredAndSortedDreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-text">
              梦境地图将在这里生成<br />
              记录更多梦境来探索你的潜意识
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="map-canvas"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
          />
        )}

        {tooltip && (
          <div
            className="tooltip"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y - 10
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{tooltip.dream.title}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              情绪：{'★'.repeat(tooltip.dream.emotionRating)}{'☆'.repeat(5 - tooltip.dream.emotionRating)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function adjustColorBrightness(rgb: string, amount: number): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;

  const r = Math.max(0, Math.min(255, parseInt(match[1]) + Math.round(255 * amount)));
  const g = Math.max(0, Math.min(255, parseInt(match[2]) + Math.round(255 * amount)));
  const b = Math.max(0, Math.min(255, parseInt(match[3]) + Math.round(255 * amount)));

  return `rgb(${r}, ${g}, ${b})`;
}
