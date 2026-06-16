import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { Info } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { buildGraphData, getNodeRadius } from '@/utils/graphData';
import { CATEGORY_COLORS } from '@/constants/tags';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: string;
  value: number;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  value: number;
}

export function EmotionMap() {
  const navigate = useNavigate();
  const works = useStore((state) => state.works);
  const setSelectedTag = useStore((state) => state.setSelectedTag);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(500, window.innerHeight - 200),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedTag(nodeId);
    navigate(`/emotion/filter/${encodeURIComponent(nodeId)}`);
  }, [navigate, setSelectedTag]);

  useEffect(() => {
    if (!svgRef.current || works.length === 0) return;

    const { width, height } = dimensions;
    const { nodes: rawNodes, links: rawLinks } = buildGraphData(works);

    if (rawNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes: D3Node[] = rawNodes.map((n) => ({ ...n }));
    const links: D3Link[] = rawLinks.map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
    }));

    const defs = svg.append('defs');
    
    const gradient = defs
      .append('radialGradient')
      .attr('id', 'bg-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#2D2D44').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#1A1A2E').attr('stop-opacity', 0);

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#bg-gradient)');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance((d) => 80 + (1 - (d.value || 1) / 10) * 60)
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius((d) => getNodeRadius(d.value) + 10));

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const labelGroup = g.append('g').attr('class', 'labels');

    const linkElements = linkGroup
      .selectAll<SVGLineElement, D3Link>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0)
      .attr('stroke-width', (d) => Math.max(1, d.value * 1.5))
      .style('pointer-events', 'none');

    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => getNodeRadius(d.value))
      .attr('fill', (d) => CATEGORY_COLORS[d.category] || '#9370DB')
      .attr('fill-opacity', 0)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.2)
      .style('cursor', 'pointer');

    const drag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
      });

    nodeElements.call(drag);

    nodeElements
      .on('mouseenter', function (_event, d) {
        setHoveredNode(d.id);
        d3.select(this).attr('stroke-opacity', 0.6).attr('stroke-width', 3);
        
        linkElements
          .filter((l) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return sourceId === d.id || targetId === d.id;
          })
          .attr('stroke-opacity', 0.6);
      })
      .on('mouseleave', function () {
        setHoveredNode(null);
        d3.select(this).attr('stroke-opacity', 0.2).attr('stroke-width', 2);
        linkElements.attr('stroke-opacity', 0.15);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d.id);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        d.fx = null;
        d.fy = null;
        simulation.alpha(0.3).restart();
      });

    const labelElements = labelGroup
      .selectAll<SVGTextElement, D3Node>('text')
      .data(nodes)
      .join('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -getNodeRadius(d.value) - 6)
      .attr('fill', '#E0E0E0')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('opacity', 0)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 4px rgba(0,0,0,0.8)');

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => (typeof d.source === 'object' ? d.source.x || 0 : 0))
        .attr('y1', (d) => (typeof d.source === 'object' ? d.source.y || 0 : 0))
        .attr('x2', (d) => (typeof d.target === 'object' ? d.target.x || 0 : 0))
        .attr('y2', (d) => (typeof d.target === 'object' ? d.target.y || 0 : 0));

      nodeElements.attr('cx', (d) => d.x || 0).attr('cy', (d) => d.y || 0);

      labelElements.attr('x', (d) => d.x || 0).attr('y', (d) => d.y || 0);
    });

    setTimeout(() => {
      linkElements
        .transition()
        .duration(500)
        .attr('stroke-opacity', 0.15);

      nodeElements
        .transition()
        .duration(500)
        .attr('fill-opacity', 0.9);

      labelElements
        .transition()
        .duration(500)
        .delay(200)
        .attr('opacity', 1);
    }, 100);

    return () => {
      simulation.stop();
    };
  }, [works, dimensions, handleNodeClick]);

  const hoveredNodeData = (() => {
    if (!hoveredNode) return null;
    const { nodes } = buildGraphData(works);
    return nodes.find((n) => n.id === hoveredNode) || null;
  })();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">情绪关联网络</h1>
            <p className="mt-1 text-sm text-gray-400">
              点击标签节点筛选相关作品，拖动节点调整位置，双击释放
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF8C00]"></span>
              <span className="text-xs text-gray-400">温暖类</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#4682B4]"></span>
              <span className="text-xs text-gray-400">冷峻类</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#9370DB]"></span>
              <span className="text-xs text-gray-400">神秘类</span>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#16162a]"
        >
          {works.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D2D44]">
                <Info className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">暂无数据</h3>
              <p className="text-sm text-gray-400">
                添加作品后，这里将显示情绪标签的关联网络
              </p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="block"
            />
          )}

          {hoveredNodeData && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-[#2D2D44]/90 px-4 py-3 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[hoveredNodeData.category] }}
                />
                <span className="font-medium text-white">{hoveredNodeData.name}</span>
              </div>
              <p className="text-xs text-gray-400">
                出现 {hoveredNodeData.value} 次
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
