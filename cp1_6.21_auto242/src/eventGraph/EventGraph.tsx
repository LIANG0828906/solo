import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { getEventsByCivilization, CIVILIZATIONS } from '../data/events';
import { useAppContext } from '../AppContext';
import { GraphNode, GraphLink, Event, Civilization } from '../types';

const EventGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    selectedCivilizationId,
    selectedEventId,
    highlightedEventId,
    selectEvent,
  } = useAppContext();

  const civilization = useMemo<Civilization | undefined>(() => {
    return CIVILIZATIONS.find((c) => c.id === selectedCivilizationId);
  }, [selectedCivilizationId]);

  const { nodes: rawNodes, links: rawLinks } = useMemo(() => {
    if (!selectedCivilizationId || !civilization) {
      return { nodes: [], links: [] };
    }

    const events = getEventsByCivilization(selectedCivilizationId)
      .sort((a, b) => b.influenceWeight - a.influenceWeight)
      .slice(0, 50);

    const eventIdSet = new Set(events.map((e) => e.id));

    const graphNodes: GraphNode[] = events.map((event: Event) => {
      const radius = 12 + event.influenceWeight * 16;
      return {
        id: event.id,
        name: event.name,
        year: event.year,
        civilizationId: event.civilizationId,
        region: event.region,
        influenceWeight: event.influenceWeight,
        color: civilization.color,
        radius,
      };
    });

    const graphLinks: GraphLink[] = [];
    events.forEach((event) => {
      event.relatedEventIds.forEach((targetId) => {
        if (eventIdSet.has(targetId)) {
          graphLinks.push({
            source: event.id,
            target: targetId,
          });
        }
      });
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [selectedCivilizationId, civilization]);

  useEffect(() => {
    nodesRef.current = rawNodes;
    linksRef.current = rawLinks;
  }, [rawNodes, rawLinks]);

  const truncateText = (text: string, maxLength: number = 15): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  useEffect(() => {
    if (!selectedCivilizationId || !civilization || !svgRef.current || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', [0, 0, width, height]);

    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('markerUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#4B5563');

    const nodes: GraphNode[] = nodesRef.current.map((d) => ({ ...d }));
    const links: GraphLink[] = linksRef.current.map((d) => ({ ...d }));

    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#4B5563')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active && simulationRef.current) {
              simulationRef.current.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && simulationRef.current) {
              simulationRef.current.alphaTarget(0);
            }

            d3.select(event.sourceEvent.target)
              .transition()
              .duration(300)
              .ease(d3.easeElasticOut.amplitude(1).period(0.3));

            if (restartTimerRef.current) {
              clearTimeout(restartTimerRef.current);
            }
            restartTimerRef.current = setTimeout(() => {
              d.fx = null;
              d.fy = null;
              if (simulationRef.current) {
                simulationRef.current.alpha(0.3).restart();
              }
            }, 500);
          })
      );

    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => (d.id === selectedEventId ? '#64B5F6' : 'none'))
      .attr('stroke-width', (d) => (d.id === selectedEventId ? 3 : 0))
      .style(
        'filter',
        (d) =>
          d.id === highlightedEventId
            ? 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.8)) drop-shadow(0 0 16px rgba(100, 181, 246, 0.5))'
            : 'none'
      );

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 16)
      .attr('font-size', '12px')
      .attr('fill', '#1F2937')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text((d) => truncateText(d.name));

    node.on('click', (event, d) => {
      event.stopPropagation();
      selectEvent(d.id);
    });

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: d3.SimulationNodeDatum) => (d as GraphNode).id)
          .distance(150)
          .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 5)
      )
      .on('tick', () => {
        link
          .attr('x1', (d) => (d.source as GraphNode).x || 0)
          .attr('y1', (d) => (d.source as GraphNode).y || 0)
          .attr('x2', (d) => (d.target as GraphNode).x || 0)
          .attr('y2', (d) => (d.target as GraphNode).y || 0);

        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        svg.attr('viewBox', [0, 0, width, height]);
        if (simulationRef.current) {
          simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2));
          simulationRef.current.alpha(0.3).restart();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, [selectedCivilizationId, civilization]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg
      .selectAll('.nodes g circle')
      .attr('stroke', (d: unknown) =>
        (d as GraphNode).id === selectedEventId ? '#64B5F6' : 'none'
      )
      .attr('stroke-width', (d: unknown) =>
        (d as GraphNode).id === selectedEventId ? 3 : 0
      )
      .style('filter', (d: unknown) =>
        (d as GraphNode).id === highlightedEventId
          ? 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.8)) drop-shadow(0 0 16px rgba(100, 181, 246, 0.5))'
          : 'none'
      );
  }, [selectedEventId, highlightedEventId]);

  if (!selectedCivilizationId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-base text-center px-8">
          点击上方时间轴中的文明区块，查看历史事件关系网络
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default EventGraph;
