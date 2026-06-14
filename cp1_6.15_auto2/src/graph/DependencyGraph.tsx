import { useEffect, useRef, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { Plus, Trash2, X } from 'lucide-react';
import { useStore } from '@/shared/store';
import { emitDepAdd, emitDepRemove } from '@/shared/socketClient';
import type { Task, Dependency } from '@/shared/types';

interface SimNode {
  id: string;
  title: string;
  type: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: SimNode | string;
  target: SimNode | string;
  id: string;
}

export default function DependencyGraph() {
  const tasks = useStore((s) => s.tasks);
  const dependencies = useStore((s) => s.dependencies);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [fromTask, setFromTask] = useState('');
  const [toTask, setToTask] = useState('');
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  const getConnectedIds = useCallback((nodeId: string) => {
    const ids = new Set<string>();
    ids.add(nodeId);
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dep of dependencies) {
        if (dep.fromTaskId === current && !ids.has(dep.toTaskId)) {
          ids.add(dep.toTaskId);
          queue.push(dep.toTaskId);
        }
        if (dep.toTaskId === current && !ids.has(dep.fromTaskId)) {
          ids.add(dep.fromTaskId);
          queue.push(dep.fromTaskId);
        }
      }
    }
    return ids;
  }, [dependencies]);

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (container) {
      const obs = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ w: width, h: Math.max(height, 400) });
      });
      obs.observe(container);
      return () => obs.disconnect();
    }
  }, []);

  useEffect(() => {
    const nodes: SimNode[] = tasks.map((t, i) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      x: dimensions.w / 2 + (Math.cos((i / tasks.length) * Math.PI * 2) * dimensions.w) / 3,
      y: dimensions.h / 2 + (Math.sin((i / tasks.length) * Math.PI * 2) * dimensions.h) / 3,
    }));

    const existingPositions = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y }]));
    nodes.forEach((n) => {
      const pos = existingPositions.get(n.id);
      if (pos) { n.x = pos.x; n.y = pos.y; }
    });

    const links: SimLink[] = dependencies.map((d) => ({
      source: d.fromTaskId,
      target: d.toTaskId,
      id: d.id,
    }));

    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(120))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(dimensions.w / 2, dimensions.h / 2))
      .force('collide', forceCollide(40))
      .alpha(0.3)
      .on('tick', () => {
        const svg = svgRef.current;
        if (!svg) return;
        const linkEls = svg.querySelectorAll<SVGLineElement>('.dep-link');
        const arrowEls = svg.querySelectorAll<SVGPolygonElement>('.dep-arrow');
        const nodeEls = svg.querySelectorAll<SVGGElement>('.dep-node');

        links.forEach((link, i) => {
          const src = typeof link.source === 'object' ? link.source : nodes.find((n) => n.id === link.source);
          const tgt = typeof link.target === 'object' ? link.target : nodes.find((n) => n.id === link.target);
          if (src && tgt && linkEls[i]) {
            linkEls[i].setAttribute('x1', String(src.x));
            linkEls[i].setAttribute('y1', String(src.y));
            linkEls[i].setAttribute('x2', String(tgt.x));
            linkEls[i].setAttribute('y2', String(tgt.y));
          }
          if (src && tgt && arrowEls[i]) {
            const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
            const dist = 28;
            const ax = tgt.x - Math.cos(angle) * dist;
            const ay = tgt.y - Math.sin(angle) * dist;
            const size = 6;
            const p1 = `${ax},${ay}`;
            const p2 = `${ax - size * Math.cos(angle - 0.4)},${ay - size * Math.sin(angle - 0.4)}`;
            const p3 = `${ax - size * Math.cos(angle + 0.4)},${ay - size * Math.sin(angle + 0.4)}`;
            arrowEls[i].setAttribute('points', `${p1} ${p2} ${p3}`);
          }
        });

        nodes.forEach((node, i) => {
          if (nodeEls[i]) {
            nodeEls[i].setAttribute('transform', `translate(${node.x},${node.y})`);
          }
        });
      });

    simRef.current = sim;
    nodesRef.current = nodes;
    linksRef.current = links;

    return () => { sim.stop(); };
  }, [tasks, dependencies, dimensions]);

  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragNode(nodeId);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      dragOffsetRef.current = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y };
    }
  }, []);

  useEffect(() => {
    if (!dragNode) return;
    const svg = svgRef.current;
    if (!svg) return;

    const handleMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffsetRef.current.x;
      const y = e.clientY - rect.top - dragOffsetRef.current.y;
      const node = nodesRef.current.find((n) => n.id === dragNode);
      if (node && simRef.current) {
        node.fx = x;
        node.fy = y;
        simRef.current.alpha(0.1).restart();
      }
    };

    const handleUp = () => {
      const node = nodesRef.current.find((n) => n.id === dragNode);
      if (node) { node.fx = null; node.fy = null; }
      setDragNode(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragNode]);

  const connectedIds = hoveredNode ? getConnectedIds(hoveredNode) : null;

  const handleAddDep = () => {
    if (fromTask && toTask && fromTask !== toTask) {
      emitDepAdd(fromTask, toTask);
      setFromTask('');
      setToTask('');
      setShowAddForm(false);
    }
  };

  const nodeRadius = 22;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-macaron-dark text-sm">任务依赖关系图谱</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-macaron-purple/30 text-macaron-dark rounded-lg hover:bg-macaron-purple/50 transition-colors"
        >
          <Plus size={12} /> 添加依赖
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-glass rounded-card p-3 mb-3 shadow-card animate-scale-in flex items-center gap-2 flex-wrap">
          <select value={fromTask} onChange={(e) => setFromTask(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-macaron-mint flex-1 min-w-[140px]">
            <option value="">阻塞方（A）</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <span className="text-xs text-gray-400">→</span>
          <select value={toTask} onChange={(e) => setToTask(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-macaron-mint flex-1 min-w-[140px]">
            <option value="">被阻塞方（B）</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <button onClick={handleAddDep} className="px-3 py-1.5 text-xs font-semibold bg-macaron-mint text-macaron-dark rounded-lg hover:opacity-80">确认</button>
          <button onClick={() => setShowAddForm(false)} className="p-1.5 text-gray-400 hover:text-macaron-dark"><X size={14} /></button>
        </div>
      )}

      <div className="flex-1 relative rounded-card bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <svg ref={svgRef} width={dimensions.w} height={dimensions.h} className="w-full h-full">
          <defs>
            <linearGradient id="grad-task" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B5EAD7" />
              <stop offset="100%" stopColor="#7BC8A4" />
            </linearGradient>
            <linearGradient id="grad-milestone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB5C2" />
              <stop offset="100%" stopColor="#FF8FA3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {linksRef.current.map((link, i) => {
            const src = typeof link.source === 'object' ? link.source : null;
            const tgt = typeof link.target === 'object' ? link.target : null;
            const isHighlighted = hoveredNode && connectedIds?.has((src as SimNode)?.id || '') && connectedIds?.has((tgt as SimNode)?.id || '');
            return (
              <g key={link.id}>
                <line
                  className="dep-link"
                  stroke={isHighlighted ? '#FFD1DC' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray="6 4"
                  style={{ animation: isHighlighted ? 'dashFlow 0.8s linear infinite' : 'dashFlow 2s linear infinite' }}
                />
                <polygon
                  className="dep-arrow"
                  fill={isHighlighted ? '#FFD1DC' : 'rgba(255,255,255,0.25)'}
                />
              </g>
            );
          })}

          {nodesRef.current.map((node) => {
            const task = tasks.find((t) => t.id === node.id);
            const isHovered = hoveredNode === node.id;
            const isConnected = connectedIds?.has(node.id);
            const isDimmed = hoveredNode && !isConnected;
            const isMilestone = task?.type === 'milestone';

            return (
              <g
                key={node.id}
                className="dep-node"
                style={{ cursor: 'grab', opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.3s' }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                filter={isHovered ? 'url(#glow)' : undefined}
              >
                <circle
                  r={nodeRadius + 4}
                  fill="none"
                  stroke={isMilestone ? 'url(#grad-milestone)' : 'url(#grad-task)'}
                  strokeWidth={3}
                  opacity={0.6}
                />
                <circle
                  r={nodeRadius}
                  fill={isMilestone ? 'rgba(255,181,194,0.15)' : 'rgba(181,234,215,0.15)'}
                  stroke={isMilestone ? '#FFB5C2' : '#B5EAD7'}
                  strokeWidth={1.5}
                />
                {isMilestone && (
                  <polygon
                    points="0,-10 8.66,5 -8.66,5"
                    fill="url(#grad-milestone)"
                    opacity={0.8}
                  />
                )}
                {!isMilestone && (
                  <rect x="-7" y="-7" width="14" height="14" rx="3" fill="url(#grad-task)" opacity={0.8} />
                )}
                <text
                  y={nodeRadius + 16}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize={10}
                  fontFamily="Nunito"
                  fontWeight={600}
                >
                  {node.title.length > 8 ? node.title.slice(0, 8) + '…' : node.title}
                </text>
                {isHovered && task && (
                  <g>
                    <text y={-nodeRadius - 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={9} fontFamily="Source Sans 3">
                      {task.lane === 'todo' ? '待办' : task.lane === 'inProgress' ? '进行中' : '完成'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-macaron-mint to-green-400 inline-block" /> 任务
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-macaron-pink to-pink-400 inline-block" /> 里程碑
          </span>
        </div>
      </div>

      {dependencies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dependencies.map((dep) => {
            const from = tasks.find((t) => t.id === dep.fromTaskId);
            const to = tasks.find((t) => t.id === dep.toTaskId);
            return (
              <span
                key={dep.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/80 rounded-full shadow-sm group"
              >
                <span className="text-macaron-dark">{from?.title?.slice(0, 6) || '...'}</span>
                <span className="text-gray-400">→</span>
                <span className="text-macaron-dark">{to?.title?.slice(0, 6) || '...'}</span>
                <button
                  onClick={() => emitDepRemove(dep.id)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500"
                >
                  <Trash2 size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
