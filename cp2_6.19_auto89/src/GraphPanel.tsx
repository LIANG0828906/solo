import { useEffect, useRef, useState, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { Highlight, Note, Link, GraphNode, GraphLink } from './types';

interface Props {
  highlights: Highlight[];
  notes: Note[];
  links: Link[];
  onJumpToHighlight: (highlightId: string) => void;
  flashNodeId: string | null;
}

interface SimNode extends GraphNode, SimulationNodeDatum {
  color: string;
  size: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

function generateColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 60%)`;
}

function truncate(text: string, len: number): string {
  return text.length > len ? text.slice(0, len) + '...' : text;
}

export default function GraphPanel({
  highlights,
  notes,
  links,
  onJumpToHighlight,
  flashNodeId,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const [, forceRender] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const connectionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      counts[l.sourceId] = (counts[l.sourceId] || 0) + 1;
      counts[l.targetId] = (counts[l.targetId] || 0) + 1;
    });
    return counts;
  }, [links]);

  useEffect(() => {
    const newNodes: SimNode[] = [];
    highlights.forEach((h) => {
      const connections = connectionCount[h.id] || 0;
      newNodes.push({
        id: h.id,
        type: 'highlight',
        label: truncate(h.text, 20),
        highlightId: h.id,
        color: generateColor(h.id),
        size: Math.min(30, Math.max(5, 8 + connections * 3)),
      });
    });
    notes.forEach((n) => {
      const connections = connectionCount[n.id] || 0;
      newNodes.push({
        id: n.id,
        type: 'note',
        label: truncate(n.content, 20),
        highlightId: n.highlightId,
        color: generateColor(n.id),
        size: Math.min(30, Math.max(5, 8 + connections * 3)),
      });
    });

    const nodeMap = new Map(newNodes.map((n) => [n.id, n]));
    const newLinks: SimLink[] = links
      .filter((l) => nodeMap.has(l.sourceId) && nodeMap.has(l.targetId))
      .map((l) => ({
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
      }));

    const existingPositions = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy }]));
    newNodes.forEach((n) => {
      const existing = existingPositions.get(n.id);
      if (existing) {
        n.x = existing.x;
        n.y = existing.y;
        n.fx = existing.fx;
        n.fy = existing.fy;
      }
    });

    nodesRef.current = newNodes;
    linksRef.current = newLinks;

    if (dimensions.width === 0 || dimensions.height === 0) return;

    if (!simRef.current) {
      const sim = forceSimulation<SimNode, SimLink>(newNodes)
        .force(
          'link',
          forceLink<SimNode, SimLink>(newLinks)
            .id((d) => d.id)
            .distance(60),
        )
        .force('charge', forceManyBody().strength(-80))
        .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force('collide', forceCollide<SimNode>().radius((d) => d.size + 4))
        .alphaDecay(0.05)
        .on('tick', () => forceRender((v) => v + 1));
      simRef.current = sim;
    } else {
      simRef.current.nodes(newNodes);
      const linkForce = simRef.current.force(
        'link',
      ) as ReturnType<typeof forceLink<SimNode, SimLink>>;
      if (linkForce) {
        linkForce.links(newLinks).id((d) => d.id);
      }
      simRef.current.force(
        'center',
        forceCenter(dimensions.width / 2, dimensions.height / 2),
      );
      simRef.current.alpha(0.3).restart();
    }

    return () => {
      // keep simulation for reuse
    };
  }, [highlights, notes, links, dimensions, connectionCount]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const dragStart = (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node || !simRef.current) return;
      node.fx = node.x;
      node.fy = node.y;
      simRef.current.alphaTarget(0.3).restart();

      const onMouseMove = (e: MouseEvent) => {
        const rect = svg.getBoundingClientRect();
        node.fx = e.clientX - rect.left;
        node.fy = e.clientY - rect.top;
      };

      const onMouseUp = () => {
        if (simRef.current) {
          simRef.current.alphaTarget(0);
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const handleNodeClick = (e: React.MouseEvent, node: SimNode) => {
      const target = e.currentTarget as SVGElement;
      const startX = e.clientX;
      const startY = e.clientY;
      const checkDrag = () => {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < 3 && dy < 3) {
          // This was a click, not a drag
          void target;
        }
      };
      setTimeout(checkDrag, 0);
    };

    const handleNodeDoubleClick = (node: SimNode) => {
      if (node.highlightId) {
        onJumpToHighlight(node.highlightId);
      }
    };

    const applyDrag = (elem: Element | null, node: SimNode) => {
      if (!elem) return;
      elem.addEventListener('mousedown', (ev) => {
        dragStart(ev as unknown as React.MouseEvent, node.id);
      });
      elem.addEventListener('dblclick', () => {
        handleNodeDoubleClick(node);
      });
      elem.addEventListener('click', (ev) => {
        handleNodeClick(ev as unknown as React.MouseEvent, node);
      });
    };

    const nodeElements = svg.querySelectorAll('.graph-node');
    nodesRef.current.forEach((node, idx) => {
      applyDrag(nodeElements[idx], node);
    });
  });

  const renderArrow = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="4"
        orient="auto"
      >
        <polygon points="0 0, 8 4, 0 8" className="graph-link-arrow" />
      </marker>
    </defs>
  );

  return (
    <div className="graph-panel" ref={containerRef}>
      <div className="graph-header">
        <span className="graph-title">知识图谱</span>
        <span className="graph-hint">拖拽节点 · 双击跳转</span>
      </div>
      <svg ref={svgRef} className="graph-svg">
        {renderArrow()}
        {linksRef.current.map((l) => {
          const source = typeof l.source === 'object' ? l.source : null;
          const target = typeof l.target === 'object' ? l.target : null;
          if (
            !source ||
            !target ||
            source.x === undefined ||
            source.y === undefined ||
            target.x === undefined ||
            target.y === undefined
          ) {
            return null;
          }
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const offset = (target as SimNode).size;
          const endX = target.x - (dx / dist) * offset;
          const endY = target.y - (dy / dist) * offset;
          const dotX = target.x - (dx / dist) * (offset - 3);
          const dotY = target.y - (dy / dist) * (offset - 3);
          return (
            <g key={l.id}>
              <line
                className="graph-link"
                x1={source.x}
                y1={source.y}
                x2={endX}
                y2={endY}
                markerEnd="url(#arrowhead)"
              />
              <circle className="graph-link-dot" cx={dotX} cy={dotY} r={2.5} />
            </g>
          );
        })}
        {nodesRef.current.map((node) => {
          if (node.x === undefined || node.y === undefined) return null;
          const isFlashing = flashNodeId === node.id;
          return (
            <g
              key={node.id}
              className={`graph-node ${isFlashing ? 'highlight-flash-node' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
            >
              <circle
                className="graph-node-circle"
                r={node.size}
                fill={node.color}
              />
              <text
                className="graph-node-label"
                y={node.size + 12}
                dy="0"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
