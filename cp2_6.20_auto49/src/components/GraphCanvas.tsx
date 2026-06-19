import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3-force';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';
import { select } from 'd3-selection';
import type { GraphData } from '@/types';
import { useNoteStore } from '@/store/noteStore';

interface GraphCanvasProps {
  data: GraphData;
  onNodeDoubleClick: (id: string) => void;
}

const nodeColorMap: Record<string, string> = {
  tech: '#2a9d8f',
  life: '#e9c46a',
  study: '#b5838d',
};

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tags: { category: string }[];
  radius: number;
}

interface SimulationEdge extends d3.SimulationLinkDatum<SimulationNode> {
  type: 'reference' | 'tag';
}

export default function GraphCanvas({ data, onNodeDoubleClick }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<SVGGElement>(null);
  const { updateGraphNodePosition } = useNoteStore();
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; title: string; tags: string[] }>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    tags: [],
  });

  const handleDragEnd = useCallback((nodeId: string, x: number, y: number) => {
    updateGraphNodePosition(nodeId, x, y);
  }, [updateGraphNodePosition]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const nodes: SimulationNode[] = data.nodes.map((n) => ({
      ...n,
      x: n.fx ?? width / 2 + (Math.random() - 0.5) * 100,
      y: n.fy ?? height / 2 + (Math.random() - 0.5) * 100,
      fx: n.fx ?? null,
      fy: n.fy ?? null,
    }));

    const edges: SimulationEdge[] = data.edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    const svg = select(svgRef.current);
    const container = select(containerRef.current);

    container.selectAll('*').remove();

    const defs = container.append('defs');

    nodes.forEach((node) => {
      const category = node.tags[0]?.category || 'default';
      const color = nodeColorMap[category] || '#666';
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${node.id}`)
        .attr('cx', '30%')
        .attr('cy', '30%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 1);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.7);
    });

    const link = container.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => d.type === 'tag' ? '4,4' : 'none');

    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => `url(#gradient-${d.id})`)
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('cursor', 'grab')
      .attr('class', 'animate-glow')
      .on('mouseenter', function (event, d) {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          title: d.title,
          tags: d.tags.map((t) => t.name),
        });
      })
      .on('mousemove', function (event) {
        setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY }));
      })
      .on('mouseleave', function () {
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('dblclick', function (event, d) {
        onNodeDoubleClick(d.id);
      });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationEdge>(edges).id((d) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (d as SimulationNode).radius + 10));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x!)
        .attr('y1', (d) => (d.source as SimulationNode).y!)
        .attr('x2', (d) => (d.target as SimulationNode).x!)
        .attr('y2', (d) => (d.target as SimulationNode).y!);

      node
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);
    });

    const dragBehavior = drag<SVGCircleElement, SimulationNode>()
      .on('start', function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        handleDragEnd(d.id, d.x!, d.y!);
      });

    node.call(dragBehavior);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', function (event) {
        container.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    return () => {
      simulation.stop();
    };
  }, [data, onNodeDoubleClick]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ background: '#1e1e24' }}
      >
        <g ref={containerRef} />
      </svg>
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none bg-garden-dark/90 text-white px-3 py-2 rounded-lg text-sm z-50 backdrop-blur-sm"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15,
          }}
        >
          <div className="font-medium">{tooltip.title}</div>
          <div className="flex gap-1 mt-1">
            {tooltip.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${nodeColorMap[tag] || '#666'}40` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
