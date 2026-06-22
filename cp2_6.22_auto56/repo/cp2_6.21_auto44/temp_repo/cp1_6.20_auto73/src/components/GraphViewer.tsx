import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Card, Connection, CardTag, ConnectionType } from '../types';
import { getTagColor, getConnectionColor } from '../utils';
import { CONNECTION_TYPES } from '../types';
import styles from './GraphViewer.module.css';

interface GraphViewerProps {
  cards: Card[];
  connections: Connection[];
  onHighlightCard: (cardId: string) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tags: CardTag[];
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: ConnectionType;
}

const GraphViewer: React.FC<GraphViewerProps> = ({
  cards,
  connections,
  onHighlightCard,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<ConnectionType | 'all'>('all');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const filteredConnections = connections.filter(
    conn => selectedType === 'all' || conn.type === selectedType
  );

  const renderGraph = useCallback(() => {
    if (!svgRef.current || cards.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const nodes: GraphNode[] = cards.map(card => ({
      id: card.id,
      title: card.title,
      tags: card.tags,
      x: width / 2,
      y: height / 2,
    }));

    const links: GraphLink[] = filteredConnections.map(conn => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: conn.type,
    }));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d: GraphNode) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(50));

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const link = linkGroup.selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: GraphLink) => getConnectionColor(d.type))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (_: MouseEvent, d: GraphNode) => onHighlightCard(d.id));

    node.append('circle')
      .attr('r', 25)
      .attr('fill', (d: GraphNode) => getTagColor(d.tags))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d: GraphNode) => d.title.substring(0, 6))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none');

    node.append('text')
      .text((d: GraphNode) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', -35)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '11px')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: GraphLink) => (d.source as GraphNode).x || 0)
        .attr('y1', (d: GraphLink) => (d.source as GraphNode).y || 0)
        .attr('x2', (d: GraphLink) => (d.target as GraphNode).x || 0)
        .attr('y2', (d: GraphLink) => (d.target as GraphNode).y || 0);

      node.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [cards, filteredConnections, dimensions, onHighlightCard]);

  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  return (
    <div className="graph-viewer" ref={containerRef}>
      <div className="graph-toolbar">
        <label>连接类型筛选：</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ConnectionType | 'all')}
        >
          <option value="all">全部</option>
          {CONNECTION_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="type-legend">
          {CONNECTION_TYPES.map(type => (
            <span key={type} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: getConnectionColor(type) }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height - 60} />
    </div>
  );
};

export default GraphViewer;
