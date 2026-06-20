import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { NodeData, RelationData, TAG_COLORS, RELATION_STYLES, TAGS } from '../types';

interface NetworkGraphProps {
  nodes: NodeData[];
  relations: RelationData[];
  selectedNodeId: string | null;
  searchQuery: string;
  selectedTag: string;
  onSearchChange: (query: string) => void;
  onTagFilterChange: (tag: string) => void;
  onNodeClick: (nodeId: string) => void;
  onBackgroundDoubleClick: (x: number, y: number) => void;
  onCreateRelation: (sourceId: string, targetId: string) => void;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tags: string[];
  connectionCount: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  type: string;
  source: D3Node | string;
  target: D3Node | string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  relations,
  selectedNodeId,
  searchQuery,
  selectedTag,
  onSearchChange,
  onTagFilterChange,
  onNodeClick,
  onBackgroundDoubleClick,
  onCreateRelation
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);

  const getNodeColor = useCallback((node: D3Node): string => {
    if (node.tags.length > 0) {
      return TAG_COLORS[node.tags[0]] || '#6b7280';
    }
    return '#6b7280';
  }, []);

  const getNodeRadius = useCallback((node: D3Node): number => {
    return Math.max(20, Math.min(40, 20 + node.connectionCount * 2));
  }, []);

  const getNodeLabel = useCallback((title: string): string => {
    const cleaned = title.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
    return cleaned.slice(0, 2) || '记';
  }, []);

  const isNodeVisible = useCallback((node: D3Node): boolean => {
    if (selectedTag && !node.tags.includes(selectedTag)) {
      return false;
    }
    if (searchQuery && !node.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }, [searchQuery, selectedTag]);

  const isNodeHighlighted = useCallback((node: D3Node, selectedId: string | null): boolean => {
    if (!selectedId) return false;
    if (node.id === selectedId) return true;
    const relatedIds = linksRef.current
      .filter(l => (l.source as D3Node).id === selectedId || (l.target as D3Node).id === selectedId)
      .map(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return sourceId === selectedId ? targetId : sourceId;
      });
    return relatedIds.includes(node.id);
  }, []);

  const isLinkHighlighted = useCallback((link: D3Link, selectedId: string | null): boolean => {
    if (!selectedId) return false;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === selectedId || targetId === selectedId;
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    gRef.current = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    svg.on('dblclick.zoom', null);

    const defs = svg.append('defs');
    
    Object.entries(RELATION_STYLES).forEach(([type, style]) => {
      const marker = defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto');
      marker.append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', style.color);
    });

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const connectionCount = new Map<string, number>();
    nodes.forEach(n => connectionCount.set(n.id, 0));
    relations.forEach(r => {
      connectionCount.set(r.source, (connectionCount.get(r.source) || 0) + 1);
      connectionCount.set(r.target, (connectionCount.get(r.target) || 0) + 1);
    });

    const d3Nodes: D3Node[] = nodes.map(n => ({
      id: n.id,
      title: n.title,
      tags: n.tags,
      connectionCount: connectionCount.get(n.id) || 0,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 200
    }));

    const d3Links: D3Link[] = relations.map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      type: r.type
    }));

    nodesRef.current = d3Nodes;
    linksRef.current = d3Links;

    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 10));

    simulationRef.current = simulation;

    const updateGraph = () => {
      const linkSelection = linkGroup.selectAll('line')
        .data(d3Links, (d: any) => d.id)
        .join('line')
        .attr('stroke', d => RELATION_STYLES[d.type]?.color || '#6b7280')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', d => RELATION_STYLES[d.type]?.strokeDasharray || 'none')
        .attr('marker-end', d => `url(#arrow-${d.type})`)
        .style('cursor', 'pointer')
        .style('transition', 'opacity 300ms ease-out');

      const nodeSelection = nodeGroup.selectAll('g')
        .data(d3Nodes, (d: any) => d.id)
        .join('g')
        .attr('cursor', 'grab')
        .style('transition', 'opacity 300ms ease-out')
        .call(d3.drag<any, D3Node>()
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
          }) as any);

      nodeSelection.selectAll('circle').remove();
      nodeSelection.selectAll('text').remove();

      nodeSelection.append('circle')
        .attr('r', d => getNodeRadius(d))
        .attr('fill', d => getNodeColor(d))
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', 2)
        .style('transition', 'r 300ms ease-out, filter 300ms ease-out');

      nodeSelection.append('text')
        .text(d => getNodeLabel(d.title))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('user-select', 'none');

      nodeSelection.on('click', (event, d) => {
        event.stopPropagation();
        if (connectingFrom) {
          if (connectingFrom !== d.id) {
            onCreateRelation(connectingFrom, d.id);
          }
          setConnectingFrom(null);
        } else {
          onNodeClick(d.id);
        }
      });

      nodeSelection.on('mouseenter', function(event, d) {
        d3.select(this).select('circle')
          .style('filter', 'drop-shadow(0 0 8px #7c3aed)');
      });

      nodeSelection.on('mouseleave', function() {
        d3.select(this).select('circle')
          .style('filter', 'none');
      });

      const updatePositions = () => {
        linkSelection
          .attr('x1', d => (d.source as D3Node).x || 0)
          .attr('y1', d => (d.source as D3Node).y || 0)
          .attr('x2', d => (d.target as D3Node).x || 0)
          .attr('y2', d => (d.target as D3Node).y || 0);

        nodeSelection.attr('transform', d => `translate(${d.x},${d.y})`);
      };

      simulation.on('tick', updatePositions);
      updatePositions();
      updateStyles();
    };

    const updateStyles = () => {
      nodeGroup.selectAll('g')
        .style('opacity', (d: any) => {
          if (!isNodeVisible(d)) return 0;
          if (selectedNodeId && !isNodeHighlighted(d, selectedNodeId)) return 0.2;
          return 1;
        });

      nodeGroup.selectAll('circle')
        .attr('r', (d: any) => {
          const baseRadius = getNodeRadius(d);
          if (selectedNodeId && d.id === selectedNodeId) return baseRadius * 1.3;
          if (searchQuery && isNodeVisible(d)) return baseRadius * 1.1;
          return baseRadius;
        });

      linkGroup.selectAll('line')
        .style('opacity', (d: any) => {
          const sourceVisible = isNodeVisible(d.source as D3Node);
          const targetVisible = isNodeVisible(d.target as D3Node);
          if (!sourceVisible || !targetVisible) return 0;
          if (selectedNodeId && !isLinkHighlighted(d, selectedNodeId)) return 0.2;
          return 1;
        });
    };

    updateGraph();

    svg.on('dblclick', (event) => {
      const coords = d3.pointer(event);
      const transform = d3.zoomTransform(svg.node() as SVGSVGElement);
      const x = (coords[0] - transform.x) / transform.k;
      const y = (coords[1] - transform.y) / transform.k;
      onBackgroundDoubleClick(x, y);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, relations, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!gRef.current) return;

    const g = gRef.current;
    const nodeGroup = g.select('.nodes');
    const linkGroup = g.select('.links');

    nodeGroup.selectAll('g')
      .style('opacity', function(d: any) {
        if (!isNodeVisible(d)) return 0;
        if (selectedNodeId && !isNodeHighlighted(d, selectedNodeId)) return 0.2;
        return 1;
      });

    nodeGroup.selectAll('circle')
      .attr('r', function(d: any) {
        const baseRadius = getNodeRadius(d);
        if (selectedNodeId && d.id === selectedNodeId) return baseRadius * 1.3;
        if (searchQuery && isNodeVisible(d)) return baseRadius * 1.1;
        return baseRadius;
      });

    linkGroup.selectAll('line')
      .style('opacity', function(d: any) {
        const sourceD = d.source as D3Node;
        const targetD = d.target as D3Node;
        if (!sourceD || !targetD) return 0;
        const sourceVisible = isNodeVisible(sourceD);
        const targetVisible = isNodeVisible(targetD);
        if (!sourceVisible || !targetVisible) return 0;
        if (selectedNodeId && !isLinkHighlighted(d, selectedNodeId)) return 0.2;
        return 1;
      });
  }, [selectedNodeId, searchQuery, selectedTag]);

  const zoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const zoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const resetLayout = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const setConnectingMode = (nodeId: string) => {
    setConnectingFrom(nodeId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={selectedTag}
            onChange={(e) => onTagFilterChange(e.target.value)}
            style={styles.tagFilter}
          >
            <option value="">所有标签</option>
            {TAGS.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div style={styles.toolbarRight}>
          <button onClick={zoomOut} style={styles.zoomBtn}>−</button>
          <button onClick={zoomIn} style={styles.zoomBtn}>+</button>
          <button onClick={resetLayout} style={styles.resetBtn}>重置布局</button>
        </div>
      </div>
      <div ref={containerRef} style={styles.graphArea}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={styles.svg}
          onClick={(e) => {
            if (connectingFrom && e.target === svgRef.current) {
              setConnectingFrom(null);
            }
          }}
        />
        {connectingFrom && (
          <div style={styles.connectingHint}>
            点击另一个节点创建关系，或点击空白处取消
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#2a2a3e',
    borderBottom: '1px solid #3a3a4e',
    zIndex: 10
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  searchInput: {
    flex: 1,
    maxWidth: 260,
    padding: '8px 12px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 300ms ease-out'
  },
  tagFilter: {
    padding: '8px 12px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 300ms ease-out'
  },
  toolbarRight: {
    display: 'flex',
    gap: 8
  },
  zoomBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a4e',
    color: '#d4d4dc',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 18,
    transition: 'background-color 300ms ease-out'
  },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background-color 300ms ease-out'
  },
  graphArea: {
    flex: 1,
    position: 'relative',
    backgroundImage: 'radial-gradient(circle, #2a2a3e 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    overflow: 'hidden'
  },
  svg: {
    display: 'block'
  },
  connectingHint: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    color: 'white',
    borderRadius: 6,
    fontSize: 14,
    pointerEvents: 'none',
    animation: 'pulse 2s infinite'
  }
};

export default NetworkGraph;
