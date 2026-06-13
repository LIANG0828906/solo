import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Node, Edge, GraphData, ForceNode, ForceEdge } from './types';

interface GraphViewerProps {
  data: GraphData | null;
  searchQuery: string;
  onExport: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  person: '#FF6B6B',
  location: '#4ECDC4',
  event: '#45B7D1',
  concept: '#96CEB4'
};

const CATEGORY_LABELS: Record<string, string> = {
  person: '人物',
  location: '地点',
  event: '事件',
  concept: '概念'
};

export const GraphViewer: React.FC<GraphViewerProps> = ({ data, searchQuery, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  const [nodes, setNodes] = useState<ForceNode[]>([]);
  const [edges, setEdges] = useState<ForceEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<ForceNode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<ForceNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<ForceEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<ForceNode | null>(null);
  const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const calculateNodeRadius = useCallback((frequency: number) => {
    const minRadius = 20;
    const maxRadius = 40;
    const minFreq = 1;
    const maxFreq = 20;
    const normalizedFreq = Math.min(Math.max(frequency, minFreq), maxFreq);
    return minRadius + ((normalizedFreq - minFreq) / (maxFreq - minFreq)) * (maxRadius - minRadius);
  }, []);
  
  const calculateFontSize = useCallback((radius: number) => {
    const minSize = 10;
    const maxSize = 16;
    const minRadius = 20;
    const maxRadius = 40;
    return minSize + ((radius - minRadius) / (maxRadius - minRadius)) * (maxSize - minSize);
  }, []);
  
  useEffect(() => {
    if (!data) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    const forceNodes: ForceNode[] = data.nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / data.nodes.length;
      const radius = 150 + Math.random() * 100;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        radius: calculateNodeRadius(node.frequency)
      };
    });
    
    const nodeMap = new Map<string, ForceNode>();
    forceNodes.forEach(n => nodeMap.set(n.id, n));
    
    const forceEdges: ForceEdge[] = data.edges
      .map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return null;
        return {
          ...edge,
          sourceNode,
          targetNode
        };
      })
      .filter((e): e is ForceEdge => e !== null);
    
    setNodes(forceNodes);
    setEdges(forceEdges);
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
    setPinnedNodes(new Set());
  }, [data, canvasSize, calculateNodeRadius]);
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const simulate = () => {
      const alpha = 0.3;
      const alphaDecay = 0.02;
      let currentAlpha = alpha;
      
      const tick = () => {
        if (currentAlpha < 0.001) {
          animationRef.current = requestAnimationFrame(render);
          return;
        }
        
        currentAlpha -= alphaDecay;
        
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;
        
        nodes.forEach(node => {
          if (pinnedNodes.has(node.id)) return;
          
          node.vx += (centerX - node.x) * 0.01 * currentAlpha;
          node.vy += (centerY - node.y) * 0.01 * currentAlpha;
          
          nodes.forEach(other => {
            if (node.id === other.id) return;
            
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = node.radius + other.radius + 20;
            
            if (distance < minDist && distance > 0) {
              const force = (minDist - distance) / distance * currentAlpha;
              node.vx += dx * force * 0.5;
              node.vy += dy * force * 0.5;
            }
          });
        });
        
        edges.forEach(edge => {
          const source = edge.sourceNode;
          const target = edge.targetNode;
          
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const idealDist = source.radius + target.radius + 80;
          
          if (distance > 0) {
            const force = (distance - idealDist) * 0.003 * currentAlpha;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            if (!pinnedNodes.has(source.id)) {
              source.vx += fx;
              source.vy += fy;
            }
            if (!pinnedNodes.has(target.id)) {
              target.vx -= fx;
              target.vy -= fy;
            }
          }
        });
        
        nodes.forEach(node => {
          if (pinnedNodes.has(node.id)) return;
          
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;
          
          node.x = Math.max(node.radius, Math.min(canvasSize.width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(canvasSize.height - node.radius, node.y));
        });
        
        animationRef.current = requestAnimationFrame(tick);
      };
      
      tick();
    };
    
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      
      const matchingNodeIds = searchQuery
        ? nodes
            .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(n => n.id)
        : null;
      
      edges.forEach(edge => {
        const source = edge.sourceNode;
        const target = edge.targetNode;
        
        const isHighlighted = hoveredEdge === edge;
        const isFaded = matchingNodeIds && 
          !matchingNodeIds.includes(source.id) && 
          !matchingNodeIds.includes(target.id);
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        const targetX = target.x - Math.cos(angle) * target.radius;
        const targetY = target.y - Math.sin(angle) * target.radius;
        
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = isFaded ? 'rgba(150, 150, 150, 0.2)' : 'rgba(150, 150, 150, 0.6)';
        ctx.lineWidth = isHighlighted ? 3 : 1.5;
        ctx.stroke();
        
        const arrowLength = 10;
        const arrowX = targetX;
        const arrowY = targetY;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = isFaded ? 'rgba(150, 150, 150, 0.2)' : 'rgba(150, 150, 150, 0.6)';
        ctx.fill();
        
        if (!isFaded) {
          const midX = (source.x + targetX) / 2;
          const midY = (source.y + targetY) / 2;
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.label, midX, midY);
        }
      });
      
      nodes.forEach(node => {
        const isHovered = hoveredNode === node;
        const isSelected = selectedNode === node;
        const isMatching = matchingNodeIds?.includes(node.id);
        const isFaded = matchingNodeIds && !isMatching;
        
        const displayRadius = isHovered ? node.radius * 1.2 : node.radius;
        
        if (isHovered && !isFaded) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, displayRadius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = CATEGORY_COLORS[node.category];
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = isFaded 
          ? `rgba(${hexToRgb(CATEGORY_COLORS[node.category])}, 0.2)` 
          : CATEGORY_COLORS[node.category];
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        const fontSize = calculateFontSize(displayRadius);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = isFaded ? 'rgba(255, 255, 255, 0.5)' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const maxWidth = displayRadius * 1.6;
        const name = node.name;
        if (ctx.measureText(name).width > maxWidth) {
          const truncated = truncateText(ctx, name, maxWidth);
          ctx.fillText(truncated, node.x, node.y);
        } else {
          ctx.fillText(name, node.x, node.y);
        }
      });
      
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    simulate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, transform, hoveredNode, hoveredEdge, selectedNode, searchQuery, pinnedNodes, canvasSize, calculateFontSize]);
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  };
  
  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };
  
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - transform.x) / transform.scale,
      y: (e.clientY - rect.top - transform.y) / transform.scale
    };
  };
  
  const findNodeAtPosition = (x: number, y: number) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      const radius = hoveredNode === node ? node.radius * 1.2 : node.radius;
      if (dx * dx + dy * dy <= radius * radius) {
        return node;
      }
    }
    return null;
  };
  
  const findEdgeAtPosition = (x: number, y: number) => {
    for (const edge of edges) {
      const source = edge.sourceNode;
      const target = edge.targetNode;
      
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      const dx = x - midX;
      const dy = y - midY;
      if (dx * dx + dy * dy <= 225) {
        return edge;
      }
    }
    return null;
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const node = findNodeAtPosition(pos.x, pos.y);
    
    if (node) {
      setIsDragging(true);
      setDragNode(node);
      setDragStart({ x: pos.x - node.x, y: pos.y - node.y });
      setPinnedNodes(prev => new Set(prev).add(node.id));
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    if (isDragging && dragNode) {
      dragNode.x = pos.x - dragStart.x;
      dragNode.y = pos.y - dragStart.y;
      dragNode.vx = 0;
      dragNode.vy = 0;
    } else if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      const node = findNodeAtPosition(pos.x, pos.y);
      const edge = node ? null : findEdgeAtPosition(pos.x, pos.y);
      setHoveredNode(node);
      setHoveredEdge(edge);
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'default';
      }
    }
  };
  
  const handleMouseUp = () => {
    if (dragNode) {
      setTimeout(() => {
        setPinnedNodes(prev => {
          const next = new Set(prev);
          next.delete(dragNode.id);
          return next;
        });
      }, 5000);
    }
    setIsDragging(false);
    setDragNode(null);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (dragNode) return;
    
    const pos = getMousePos(e);
    const node = findNodeAtPosition(pos.x, pos.y);
    setSelectedNode(node);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * scaleFactor));
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      scale: newScale
    }));
  };
  
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.fillStyle = '#fff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    const link = document.createElement('a');
    link.download = 'knowledge-graph.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    
    onExport();
  };
  
  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      
      setTransform({
        x: centerX - node.x,
        y: centerY - node.y,
        scale: 1.5
      });
      
      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        blinkCount++;
        if (blinkCount >= 6) {
          clearInterval(blinkInterval);
          return;
        }
      }, 200);
    }
  };
  
  const relatedNodes = selectedNode
    ? edges
        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
        .map(e => {
          const relatedId = e.source === selectedNode.id ? e.target : e.source;
          return nodes.find(n => n.id === relatedId);
        })
        .filter((n): n is ForceNode => n !== undefined)
    : [];
  
  return (
    <div className="graph-viewer" ref={containerRef}>
      <div className="graph-toolbar">
        <div className="graph-info">
          {data && (
            <span>
              {nodes.length} 个概念 · {edges.length} 条关系
            </span>
          )}
        </div>
        <button className="btn btn-export" onClick={handleExport} disabled={!data}>
          导出图谱
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {!data && (
        <div className="graph-placeholder">
          <div className="placeholder-content">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="8" r="2" />
              <circle cx="20" cy="8" r="2" />
              <circle cx="4" cy="16" r="2" />
              <circle cx="20" cy="16" r="2" />
              <line x1="6" y1="8" x2="9" y2="10" />
              <line x1="18" y1="8" x2="15" y2="10" />
              <line x1="6" y1="16" x2="9" y2="14" />
              <line x1="18" y1="16" x2="15" y2="14" />
            </svg>
            <p>输入文本后点击"生成图谱"</p>
            <p className="placeholder-hint">知识图谱将在此处显示</p>
          </div>
        </div>
      )}
      
      {selectedNode && (
        <div className="info-card">
          <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
          <div className="info-card-header">
            <span 
              className="category-badge" 
              style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] }}
            >
              {CATEGORY_LABELS[selectedNode.category]}
            </span>
            <h3>{selectedNode.name}</h3>
          </div>
          
          <div className="info-card-section">
            <h4>上下文</h4>
            <p className="context-text">{selectedNode.context}</p>
          </div>
          
          <div className="info-card-section">
            <h4>出现频率</h4>
            <div className="frequency-bar">
              <div 
                className="frequency-fill" 
                style={{ 
                  width: `${Math.min(selectedNode.frequency * 5, 100)}%`,
                  backgroundColor: CATEGORY_COLORS[selectedNode.category]
                }}
              />
            </div>
            <span className="frequency-count">{selectedNode.frequency} 次</span>
          </div>
          
          {relatedNodes.length > 0 && (
            <div className="info-card-section">
              <h4>关联概念</h4>
              <ul className="related-list">
                {relatedNodes.map(node => (
                  <li key={node.id} onClick={() => handleNodeClick(node.id)}>
                    <span 
                      className="node-dot"
                      style={{ backgroundColor: CATEGORY_COLORS[node.category] }}
                    />
                    {node.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="legend">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div key={key} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{CATEGORY_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};