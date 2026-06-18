import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useStore } from '../store';
import type { CodeNode } from '../utils/parser';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  probability: number;
  color: string;
  radius: number;
  codeNode?: CodeNode;
}

interface EdgeDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
  type: string;
}

export default function ProbabilityCloud() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { quantumState, parseResult, selectedNodeId, selectNode, resetView } = useStore();

  const getConnectedNodes = useCallback((nodeId: string): Set<string> => {
    if (!quantumState) return new Set();
    const connected = new Set<string>();
    quantumState.edges.forEach(edge => {
      if (edge.source === nodeId) connected.add(edge.target);
      if (edge.target === nodeId) connected.add(edge.source);
    });
    return connected;
  }, [quantumState]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !quantumState || !parseResult) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'container');

    svg.attr('viewBox', [0, 0, width, height]);

    const defs = svg.append('defs');
    const gradient = defs.append('radialGradient')
      .attr('id', 'nodeGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255, 255, 255, 0.3)');
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255, 255, 255, 0)');

    const nodes: NodeDatum[] = quantumState.nodes.map(qn => {
      const codeNode = parseResult.nodes.find(cn => cn.id === qn.id);
      return {
        ...qn,
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
        codeNode,
      };
    });

    const edges: EdgeDatum[] = quantumState.edges.map(e => ({
      source: e.source,
      target: e.target,
      type: e.type,
    }));

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1.5);

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    node.append('circle')
      .attr('class', 'node')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', 'rgba(255, 255, 255, 0.5)')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 8px rgba(0, 191, 255, 0.3))');

    node.append('circle')
      .attr('class', 'node-glow')
      .attr('r', d => d.radius)
      .attr('fill', 'url(#nodeGradient)')
      .attr('pointer-events', 'none');

    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('font-family', '"Fira Code", monospace')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.8)')
      .text(d => d.codeNode?.name.substring(0, 8) || '');

    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, EdgeDatum>(edges)
        .id(d => d.id)
        .distance(120)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .velocityDecay(0.9);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x || 0)
        .attr('y1', d => (d.source as NodeDatum).y || 0)
        .attr('x2', d => (d.target as NodeDatum).x || 0)
        .attr('y2', d => (d.target as NodeDatum).y || 0);

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    const drag = d3.drag<SVGGElement, NodeDatum>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    node.on('click', (event, d) => {
      event.stopPropagation();
      const newSelectedId = selectedNodeId === d.id ? null : d.id;
      selectNode(newSelectedId);
    });

    svg.on('click', () => {
      selectNode(null);
    });

    return () => {
      simulation.stop();
    };
  }, [quantumState, parseResult]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const nodes = svg.selectAll('.node-group');
    const connectedNodes = selectedNodeId ? getConnectedNodes(selectedNodeId) : new Set<string>();

    nodes.each(function(d) {
      const nodeDatum = d as NodeDatum;
      const isSelected = nodeDatum.id === selectedNodeId;
      const isConnected = connectedNodes.has(nodeDatum.id);

      const selection = d3.select(this);
      const circle = selection.select('.node');

      if (selectedNodeId === null) {
        selection.style('opacity', 1);
        circle.attr('r', nodeDatum.radius);
        circle.style('transform', 'scale(1)');
      } else if (isSelected) {
        selection.style('opacity', 1);
        circle.style('transform', 'scale(1.5)');
        circle.style('transform-origin', 'center');
      } else if (isConnected) {
        selection.style('opacity', 1);
        circle.style('transform', 'scale(1)');
        circle.interrupt('pulse')
          .transition('pulse')
          .duration(500)
          .ease(d3.easeQuadInOut)
          .attrTween('r', function() {
            const r = nodeDatum.radius;
            return function(t) {
              const pulse = 1 + Math.sin(t * Math.PI * 6) * 0.1;
              return (r * pulse).toString();
            };
          });
      } else {
        selection.style('opacity', 0.2);
        circle.style('transform', 'scale(1)');
      }
    });

    if (selectedNodeId && parseResult && tooltipRef.current) {
      const codeNode = parseResult.nodes.find(n => n.id === selectedNodeId);
      const quantumNode = quantumState?.nodes.find(n => n.id === selectedNodeId);
      
      if (codeNode && quantumNode) {
        const nodeEl = svg.selectAll('.node-group')
          .filter((d: any) => d.id === selectedNodeId)
          .node() as SVGGElement;
        
        if (nodeEl) {
          const rect = nodeEl.getBoundingClientRect();
          const containerRect = containerRef.current!.getBoundingClientRect();
          
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = `${rect.right - containerRect.left + 10}px`;
          tooltipRef.current.style.top = `${rect.top - containerRect.top}px`;
          tooltipRef.current.innerHTML = `
            <div style="margin-bottom: 8px;"><strong>${codeNode.name}</strong> (${codeNode.type})</div>
            <div style="margin-bottom: 4px; opacity: 0.8;">${codeNode.codeSnippet}</div>
            <div style="color: #00BFFF;">概率: ${quantumNode.probability.toFixed(3)}</div>
          `;
        }
      }
    } else if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  }, [selectedNodeId, parseResult, quantumState, getConnectedNodes]);

  const handleReset = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
    resetView();
  }, [resetView]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: '400px',
        minHeight: '300px',
        backgroundColor: '#252526',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          display: 'none',
          backgroundColor: '#2D2D2D',
          color: '#FFFFFF',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          zIndex: 1000,
          maxWidth: '250px',
        }}
      />

      <button
        onClick={handleReset}
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: '#333333',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease',
          fontFamily: 'system-ui, sans-serif',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#555555';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#333333';
        }}
      >
        R
      </button>

      {(!quantumState || quantumState.nodes.length === 0) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#888888',
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          请在左侧输入代码以生成量子态概率云图
        </div>
      )}
    </div>
  );
}
