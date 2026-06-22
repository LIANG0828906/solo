import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3-selection';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import { useAppContext } from '../context/AppContext';
import type { GraphNode, Language } from '../types';

interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationEdge {
  source: SimulationNode | string;
  target: SimulationNode | string;
}

const languageColors: Record<Language, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  CSS: '#2965F1',
  HTML: '#E34F26',
};

const generateModuleColor = (moduleName: string): string => {
  let hash = 0;
  for (let i = 0; i < moduleName.length; i++) {
    hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 50%)`;
};

const getNodeRadius = (referenceCount: number): number => {
  const minRadius = 8;
  const maxRadius = 24;
  const scale = Math.min(referenceCount / 5, 1);
  return minRadius + (maxRadius - minRadius) * scale;
};

export const RelationGraph: React.FC = () => {
  const { relationGraph, setSelectedId } = useAppContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null);
  const nodesRef = useRef<SimulationNode[]>([]);
  const zoomRef = useRef({ scale: 1, translateX: 0, translateY: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });
  const dragNodeRef = useRef<SimulationNode | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getTransformedPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const { scale, translateX, translateY } = zoomRef.current;
      const x = (clientX - rect.left - translateX) / scale;
      const y = (clientY - rect.top - translateY) / scale;
      return { x, y };
    },
    []
  );

  useEffect(() => {
    if (!relationGraph || !svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const arrowMarker = defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');

    arrowMarker
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(100, 116, 139, 0.6)');

    const g = svg.append('g').attr('class', 'graph-container');

    const nodes: SimulationNode[] = relationGraph.nodes.map((n) => ({ ...n }));
    const edges: SimulationEdge[] = relationGraph.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    nodesRef.current = nodes;

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(100, 116, 139, 0.4)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    const nodeGroups = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    nodeGroups
      .append('circle')
      .attr('r', (d) => getNodeRadius(d.referenceCount))
      .attr('fill', (d) => generateModuleColor(d.module))
      .attr('stroke', (d) => languageColors[d.language])
      .attr('stroke-width', 2);

    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -getNodeRadius(d.referenceCount) - 6)
      .attr('fill', '#E2E8F0')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text((d) => d.filename.replace(/\.[^.]+$/, ''))
      .style('pointer-events', 'none')
      .style('opacity', 0.8);

    nodeGroups
      .transition()
      .duration(300)
      .delay((_, i) => i * 30)
      .ease((t) => 1 - Math.pow(1 - t, 3))
      .style('opacity', 1);

    const simulation = forceSimulation<SimulationNode>(nodes)
      .force(
        'link',
        forceLink<SimulationNode, SimulationEdge>(edges)
          .id((d) => d.id)
          .distance(120)
          .strength(0.6)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collision',
        forceCollide<SimulationNode>().radius((d) => getNodeRadius(d.referenceCount) + 20)
      );

    simulationRef.current = simulation;

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x!)
        .attr('y1', (d) => (d.source as SimulationNode).y!)
        .attr('x2', (d) => (d.target as SimulationNode).x!)
        .attr('y2', (d) => (d.target as SimulationNode).y!);

      nodeGroups.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });

    const updateTransform = () => {
      const { scale, translateX, translateY } = zoomRef.current;
      g.attr('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    };

    nodeGroups
      .on('mouseenter', function (_, d) {
        setHoveredNode(d as GraphNode);
        d3.select(this)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d.referenceCount) * 1.3);
      })
      .on('mousemove', function (event) {
        setMousePos({ x: event.clientX, y: event.clientY });
      })
      .on('mouseleave', function (_, d) {
        setHoveredNode(null);
        d3.select(this)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d.referenceCount));
      });

    const handleNodeMouseDown = (event: MouseEvent, d: SimulationNode) => {
      event.stopPropagation();
      isDraggingRef.current = false;
      dragNodeRef.current = d;
      d.fx = d.x;
      d.fy = d.y;
      simulation.alphaTarget(0.3).restart();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (dragNodeRef.current) {
        event.preventDefault();
        isDraggingRef.current = true;
        const point = getTransformedPoint(event.clientX, event.clientY);
        dragNodeRef.current.fx = point.x;
        dragNodeRef.current.fy = point.y;
      } else if (isPanningRef.current) {
        event.preventDefault();
        zoomRef.current.translateX =
          panStartRef.current.translateX + (event.clientX - panStartRef.current.x);
        zoomRef.current.translateY =
          panStartRef.current.translateY + (event.clientY - panStartRef.current.y);
        updateTransform();
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (dragNodeRef.current) {
        const d = dragNodeRef.current;
        if (!isDraggingRef.current) {
          setSelectedId(d.id);
        }
        d.fx = null;
        d.fy = null;
        simulation.alphaTarget(0);
        dragNodeRef.current = null;
      }
      if (isPanningRef.current) {
        isPanningRef.current = false;
        svg.style('cursor', 'default');
      }
    };

    const handleSvgMouseDown = (event: MouseEvent) => {
      if (
        event.target === svgRef.current ||
        (event.target as Element).classList.contains('graph-container') ||
        (event.target as Element).tagName === 'line'
      ) {
        isPanningRef.current = true;
        panStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          translateX: zoomRef.current.translateX,
          translateY: zoomRef.current.translateY,
        };
        svg.style('cursor', 'grabbing');
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const rect = svgRef.current!.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const { scale, translateX, translateY } = zoomRef.current;
      const newScale = Math.max(0.3, Math.min(3, scale * delta));
      const scaleRatio = newScale / scale;

      zoomRef.current.scale = newScale;
      zoomRef.current.translateX = mouseX - (mouseX - translateX) * scaleRatio;
      zoomRef.current.translateY = mouseY - (mouseY - translateY) * scaleRatio;

      updateTransform();
    };

    nodeGroups.each(function (_, i, arr) {
      const node = arr[i];
      node.addEventListener('mousedown', (e: Event) => {
        handleNodeMouseDown(e as MouseEvent, nodes[i]);
      });
    });

    svgRef.current.addEventListener('mousedown', handleSvgMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    svgRef.current.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      simulation.stop();
      svgRef.current?.removeEventListener('mousedown', handleSvgMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      svgRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [relationGraph, dimensions, setSelectedId, getTransformedPoint]);

  if (!relationGraph) {
    return (
      <div className="relation-graph empty">
        <div className="graph-empty">
          <p>点击「生成关系图」按钮</p>
          <p className="empty-hint">查看代码片段之间的引用关系</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relation-graph" ref={containerRef}>
      <div className="graph-header">
        <h3 className="graph-title">依赖关系图</h3>
        <div className="graph-legend">
          {Array.from(new Set(relationGraph.nodes.map((n) => n.module))).map((module) => (
            <span key={module} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: generateModuleColor(module) }}
              />
              {module}
            </span>
          ))}
        </div>
      </div>
      <div className="graph-container-wrapper">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height - 60} />
        {hoveredNode && (
          <div
            className="node-tooltip"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y + 10,
            }}
          >
            <div className="tooltip-filename">{hoveredNode.filename}</div>
            <div className="tooltip-module">模块：{hoveredNode.module}</div>
            <div className="tooltip-language">语言：{hoveredNode.language}</div>
            <div className="tooltip-refs">被引用：{hoveredNode.referenceCount} 次</div>
          </div>
        )}
      </div>
    </div>
  );
};
