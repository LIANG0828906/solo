import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '@/store';
import { fetchGraphData } from '@/api';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type GraphNode, type GraphLink } from '@/types';
import '@/components/GraphView.css';

const CATEGORIES: (Category | 'all')[] = ['all', 'programming', 'history', 'life', 'other'];

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function GraphView() {
  const navigate = useNavigate();
  const { loadCards } = useStore();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const fgRef = useRef<any>(null);

  useEffect(() => {
    loadCards();
    loadGraphData();
  }, [loadCards]);

  const loadGraphData = async () => {
    try {
      const data = await fetchGraphData();
      const nodesWithCoords = data.nodes.map((n) => ({
        ...n,
        x: Math.random() * 600 - 300,
        y: Math.random() * 400 - 200,
      }));
      setGraphData({ nodes: nodesWithCoords, links: data.links });
    } catch {
      setGraphData({ nodes: [], links: [] });
    }
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(rect.height, 500) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const filteredData = useCallback(() => {
    if (selectedCategory === 'all') return graphData;
    const filteredNodes = graphData.nodes.filter((n) => n.category === selectedCategory);
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (l) => nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) &&
             nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as GraphNode).id)
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, selectedCategory]);

  const getNodeColor = (node: GraphNode) => CATEGORY_COLORS[node.category] || '#7f8c8d';

  const getNodeSize = (node: GraphNode) => Math.max(6, 4 + node.linkCount * 2);

  const getLinkStyle = (link: GraphLink) => {
    switch (link.type) {
      case 'same-category':
        return { width: 2, dash: false, color: '#555' };
      case 'cross-category':
        return { width: 1, dash: true, color: '#999' };
      case 'manual':
        return { width: 1.5, dash: false, color: '#3498db' };
      default:
        return { width: 1, dash: false, color: '#ccc' };
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    navigate(`/card/${node.id}`);
  };

  return (
    <div className="graph-view">
      <div className="graph-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>知识图谱</h2>
        <div className="filter-group">
          <Filter size={14} />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              style={
                selectedCategory === cat && cat !== 'all'
                  ? { backgroundColor: CATEGORY_COLORS[cat as Category], color: '#fff' }
                  : undefined
              }
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat as Category]}
            </button>
          ))}
        </div>
      </div>

      <div className="graph-container" ref={containerRef}>
        {graphData.nodes.length === 0 ? (
          <div className="graph-empty">
            <p>暂无关联数据</p>
            <p className="graph-empty-hint">创建卡片并添加关联后，图谱将自动生成</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData()}
            nodeId="id"
            nodeLabel="title"
            nodeColor={getNodeColor as any}
            nodeVal={(node: any) => node.linkCount + 1}
            nodeRelSize={4}
            linkColor={(link: any) => getLinkStyle(link).color}
            linkWidth={(link: any) => getLinkStyle(link).width}
            linkLineDash={(link: any) => (getLinkStyle(link).dash ? [4, 4] : undefined)}
            onNodeClick={handleNodeClick as any}
            onNodeHover={(node: any) => setHoverNode(node)}
            linkDirectionalArrowLength={0}
            cooldownTicks={100}
            enableNodeDrag={true}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            backgroundColor="#f5f5f5"
          />
        )}

        {hoverNode && (
          <div
            className="node-tooltip"
            style={{
              left: 16,
              bottom: 16,
              borderColor: CATEGORY_COLORS[hoverNode.category],
            }}
          >
            <span
              className="tooltip-dot"
              style={{ backgroundColor: CATEGORY_COLORS[hoverNode.category] }}
            />
            <span className="tooltip-title">{hoverNode.title}</span>
            <span className="tooltip-meta">
              {CATEGORY_LABELS[hoverNode.category]} · {hoverNode.linkCount} 个关联
            </span>
          </div>
        )}
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <svg width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="#555" strokeWidth="2" /></svg>
          <span>同主题关联</span>
        </div>
        <div className="legend-item">
          <svg width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="#999" strokeWidth="1" strokeDasharray="4,4" /></svg>
          <span>跨主题关联</span>
        </div>
        <div className="legend-item">
          <svg width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="#3498db" strokeWidth="1.5" /></svg>
          <span>手动关联</span>
        </div>
      </div>
    </div>
  );
}
