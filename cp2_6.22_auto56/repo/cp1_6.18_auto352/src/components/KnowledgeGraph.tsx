import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchGraphData, calculateNodeSize, getCategoryColor } from '@/modules/graphModule';

interface SimulationNode extends d3.SimulationNodeDatum {
  id: number;
  title: string;
  category: string;
  connections: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  value: number;
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isGraphOpen = useStore((state) => state.isGraphOpen);
  const setIsGraphOpen = useStore((state) => state.setIsGraphOpen);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isGraphOpen) return;

    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const width = container.clientWidth;
    const height = container.clientHeight - 60;

    const initGraph = async () => {
      try {
        const data = await fetchGraphData();

        d3.select(svg).selectAll('*').remove();

        const nodes: SimulationNode[] = data.nodes.map((node) => ({
          id: node.id,
          title: (node as unknown as { name: string }).name || (node as unknown as { title: string }).title,
          category: node.category,
          connections: node.connections,
          x: width / 2,
          y: height / 2,
        }));

        const edges = (data as unknown as { edges?: Array<{ source: number; target: number; weight: number }> }).edges;
        const dataLinks = edges || (data as unknown as { links: Array<{ source: number; target: number; value: number }> }).links;

        const links: SimulationLink[] = dataLinks.map((link) => ({
          source: link.source,
          target: link.target,
          value: (link as { weight?: number; value?: number }).weight ?? (link as { value: number }).value,
        }));

        const svgSelection = d3.select(svg).attr('width', width).attr('height', height);

        const g = svgSelection.append('g');

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svgSelection.call(zoom);

        const link = g
          .append('g')
          .selectAll('line')
          .data(links)
          .enter()
          .append('line')
          .attr('stroke', '#BCAAA4')
          .attr('stroke-opacity', 0.5)
          .attr('stroke-width', (d) => Math.sqrt(d.value) || 1);

        const node = g
          .append('g')
          .selectAll('circle')
          .data(nodes)
          .enter()
          .append('circle')
          .attr('r', (d) => calculateNodeSize(d.connections))
          .attr('fill', (d) => getCategoryColor(d.category))
          .attr('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
          .call(
            d3
              .drag<SVGCircleElement, SimulationNode>()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended)
          );

        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '14px')
          .style('pointer-events', 'none')
          .style('opacity', 0)
          .style('transition', 'opacity 0.2s')
          .style('z-index', 1000);

        node
          .on('mouseover', function (event, d) {
            tooltip.style('opacity', 1).text(d.title);
          })
          .on('mousemove', function (event) {
            tooltip
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');
          })
          .on('mouseout', function () {
            tooltip.style('opacity', 0);
          })
          .on('click', function (event, d) {
            navigate(`/card/${d.id}`);
            setIsGraphOpen(false);
          });

        const simulation = d3
          .forceSimulation(nodes)
          .force(
            'link',
            d3
              .forceLink(links)
              .id((d) => d.id)
              .distance(100)
          )
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('x', d3.forceX(width / 2).strength(0.1))
          .force('y', d3.forceY(height / 2).strength(0.1));

        simulationRef.current = simulation;

        let lastTime = 0;
        const targetFPS = 30;
        const frameInterval = 1000 / targetFPS;

        const ticked = (timestamp: number) => {
          if (!lastTime) lastTime = timestamp;
          const delta = timestamp - lastTime;

          if (delta >= frameInterval) {
            lastTime = timestamp;

            link
              .attr('x1', (d) => (d.source as SimulationNode).x!)
              .attr('y1', (d) => (d.source as SimulationNode).y!)
              .attr('x2', (d) => (d.target as SimulationNode).x!)
              .attr('y2', (d) => (d.target as SimulationNode).y!);

            node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
          }

          if (simulation.alpha() > 0.001) {
            animationFrameRef.current = requestAnimationFrame(ticked);
          }
        };

        simulation.on('tick', () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(ticked);
        });

        function dragstarted(
          event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
          d: SimulationNode
        ) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(
          event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
          d: SimulationNode
        ) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(
          event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>,
          d: SimulationNode
        ) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        const handleResize = () => {
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight - 60;

          svgSelection.attr('width', newWidth).attr('height', newHeight);

          simulation
            .force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
            .force('x', d3.forceX(newWidth / 2).strength(0.1))
            .force('y', d3.forceY(newHeight / 2).strength(0.1))
            .alpha(0.3)
            .restart();
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Failed to initialize graph:', error);
      }
    };

    const cleanup = initGraph();

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      d3.select('body').selectAll('div.tooltip').remove();
    };
  }, [isGraphOpen, navigate, setIsGraphOpen]);

  if (!isGraphOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '50%',
        height: '100vh',
        backgroundColor: 'rgba(239,235,233,0.95)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 50,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          height: 60,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#3E2723',
            margin: 0,
          }}
        >
          知识图谱
        </h2>
        <button
          onClick={() => setIsGraphOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5D4037',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={24} />
        </button>
      </div>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
