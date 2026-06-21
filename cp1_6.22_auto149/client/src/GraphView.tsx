import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

export interface NoteSummary {
  id: string;
  fileName: string;
  title: string;
  tags: string[];
}

export interface TagFrequency {
  tag: string;
  count: number;
}

interface GraphViewProps {
  notes: NoteSummary[];
  tags: TagFrequency[];
  selectedTag: string | null;
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'note' | 'tag';
  label: string;
  color: string;
  radius: number;
  noteData?: NoteSummary;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const NOTE_COLORS = ['#6366F1', '#EC4899', '#F59E0B'];
const TAG_COLOR = '#10B981';

const GraphView: React.FC<GraphViewProps> = ({ notes, tags, selectedTag }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const highlightSetRef = useRef<Set<string> | null>(null);

  const [hoveredNote, setHoveredNote] = useState<{
    note: NoteSummary;
    x: number;
    y: number;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const highlightLinkedNodes = useCallback((selectedTag: string | null) => {
    if (!selectedTag) {
      highlightSetRef.current = null;
    } else {
      const highlighted = new Set<string>();
      highlighted.add(`tag:${selectedTag}`);
      for (const note of notes) {
        if (note.tags.includes(selectedTag)) {
          highlighted.add(`note:${note.id}`);
        }
      }
      highlightSetRef.current = highlighted;
    }
    updateVisualOpacity();
  }, [notes]);

  const updateVisualOpacity = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const highlightSet = highlightSetRef.current;
    const nodeSel = d3.select(svg).selectAll<SVGGElement, GraphNode>('g.node');
    const linkSel = d3.select(svg).selectAll<SVGLineElement, GraphLink>('line.link');

    if (!highlightSet) {
      nodeSel.style('opacity', 1);
      linkSel.style('opacity', 0.4);
    } else {
      nodeSel.style('opacity', (d) => {
        const key = `${d.type}:${d.id}`;
        return highlightSet.has(key) ? 1 : 0.1;
      });
      linkSel.style('opacity', (d) => {
        const srcKey = typeof d.source === 'object' ? `${d.source.type}:${d.source.id}` : '';
        const tgtKey = typeof d.target === 'object' ? `${d.target.type}:${d.target.id}` : '';
        return highlightSet.has(srcKey) && highlightSet.has(tgtKey) ? 0.8 : 0.05;
      });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    highlightLinkedNodes(selectedTag);
  }, [selectedTag, highlightLinkedNodes]);

  useEffect(() => {
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    const tagNodes: GraphNode[] = tags.map((t) => ({
      id: t.tag,
      type: 'tag',
      label: t.tag,
      color: TAG_COLOR,
      radius: Math.min(14 + t.count * 1.5, 28),
    }));

    const noteNodes: GraphNode[] = notes.map((n, i) => ({
      id: n.id,
      type: 'note',
      label: n.title,
      color: NOTE_COLORS[i % NOTE_COLORS.length],
      radius: 10,
      noteData: n,
    }));

    const allNodes: GraphNode[] = [...tagNodes, ...noteNodes];

    const allLinks: GraphLink[] = [];
    for (const note of notes) {
      for (const tag of note.tags) {
        allLinks.push({ source: note.id, target: tag });
      }
    }

    nodesRef.current = allNodes;
    linksRef.current = allLinks;

    const svg = svgRef.current;
    if (!svg) return;

    d3.select(svg).selectAll('*').remove();

    const rootG = d3
      .select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('class', 'root');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        rootG.attr('transform', event.transform);
      });

    d3.select(svg).call(zoom as any);

    const linkG = rootG.append('g').attr('class', 'links');
    const nodeG = rootG.append('g').attr('class', 'nodes');

    const linkSel = linkG
      .selectAll<SVGLineElement, GraphLink>('line.link')
      .data(allLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1.2)
      .style('opacity', 0.4);

    const nodeSel = nodeG
      .selectAll<SVGGElement, GraphNode>('g.node')
      .data(allNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'grab');

    nodeSel
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))');

    nodeSel
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -d.radius - 6)
      .attr('font-size', 11)
      .attr('fill', '#475569')
      .attr('pointer-events', 'none')
      .each(function (d) {
        if (d.label.length > 14) {
          d3.select(this).text(d.label.slice(0, 13) + '…');
        }
      });

    const simulation = d3
      .forceSimulation<GraphNode>(allNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(allLinks)
          .id((d) => d.id)
          .distance(80)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 6));

    simulationRef.current = simulation;

    let tickCount = 0;
    simulation.on('tick', () => {
      tickCount++;
      if (tickCount % 2 !== 0) return;

      linkSel
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(event.sourceEvent.target).style('cursor', 'grabbing');
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d3.select(event.sourceEvent.target).style('cursor', 'grab');
      });

    nodeSel.call(drag);

    nodeSel
      .on('mouseenter', function (event, d) {
        if (d.type === 'note' && d.noteData) {
          const svgRect = svg.getBoundingClientRect();
          const currentZoom = d3.zoomTransform(svg as any);
          const screenX = currentZoom.applyX(d.x ?? 0) + svgRect.left;
          const screenY = currentZoom.applyY(d.y ?? 0) + svgRect.top;
          setHoveredNote({
            note: d.noteData,
            x: screenX,
            y: screenY,
          });
        }
      })
      .on('mouseleave', function () {
        setHoveredNote(null);
      });

    updateVisualOpacity();

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [notes, tags, dimensions, updateVisualOpacity]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#FFFFFF',
        }}
      />
      {notes.length === 0 && tags.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: 14,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div>请选择包含 Markdown 文件的文件夹</div>
        </div>
      )}
      {hoveredNote && (
        <HoverCard note={hoveredNote.note} x={hoveredNote.x} y={hoveredNote.y} />
      )}
    </div>
  );
};

interface HoverCardProps {
  note: NoteSummary;
  x: number;
  y: number;
}

const HoverCard: React.FC<HoverCardProps> = ({ note, x, y }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedY, setAdjustedY] = useState(y);
  const [adjustedX, setAdjustedX] = useState(x);

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      let newY = y - rect.height - 16;
      let newX = x - rect.width / 2;

      if (newY < 8) newY = y + 20;
      if (newX < 8) newX = 8;
      if (newX + rect.width > window.innerWidth - 8) {
        newX = window.innerWidth - rect.width - 8;
      }
      if (newY + rect.height > window.innerHeight - 8) {
        newY = window.innerHeight - rect.height - 8;
      }
      setAdjustedY(newY);
      setAdjustedX(newX);
    }
  }, [x, y]);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: adjustedY,
          left: adjustedX,
          zIndex: 9999,
          padding: '12px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
          minWidth: 220,
          maxWidth: 320,
          animation: 'fadeInUp 0.2s ease-out',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1E293B',
            marginBottom: 4,
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {note.title}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>{note.fileName}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {note.tags.length === 0 && (
            <span style={{ fontSize: 12, color: '#94A3B8' }}>暂无标签</span>
          )}
          {note.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 6,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default GraphView;
