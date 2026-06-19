import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Route,
  Play,
  RefreshCw,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Sparkles,
  Target,
} from 'lucide-react';
import { useNodeStore } from '@/stores/NodeStore';
import { useLinkStore } from '@/stores/LinkStore';
import type { KnowledgeLink } from '@/types';

export function generateLearningPath(): string[] {
  const nodes = useNodeStore.getState().nodes;
  const links = useLinkStore.getState().links;
  if (nodes.length === 0) return [];
  const nodeIds = nodes.map((n) => n.id);
  const inDeg = new Map(nodeIds.map((id) => [id, 0]));
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const l of links) {
    if (l.type === 'prerequisite') {
      inDeg.set(l.targetId, (inDeg.get(l.targetId) || 0) + 1);
      adj.get(l.sourceId)?.push(l.targetId);
    } else if (l.type === 'subsequent') {
      inDeg.set(l.sourceId, (inDeg.get(l.sourceId) || 0) + 1);
      adj.get(l.targetId)?.push(l.sourceId);
    }
  }
  const queue: string[] = [];
  for (const [id, d] of inDeg.entries()) if (d === 0) queue.push(id);
  const topo: string[] = [];
  const inDegCopy = new Map(inDeg);
  while (queue.length) {
    const id = queue.shift()!;
    topo.push(id);
    for (const next of adj.get(id) || []) {
      inDegCopy.set(next, (inDegCopy.get(next) || 0) - 1);
      if ((inDegCopy.get(next) || 0) === 0) queue.push(next);
    }
  }
  if (topo.length < nodes.length) {
    const remain = nodeIds.filter((id) => !topo.includes(id));
    topo.push(...remain);
  }
  return topo;
}

export default function LearningPathPanel() {
  const nodes = useNodeStore((s) => s.nodes);
  const links = useLinkStore((s) => s.links);
  const updateNode = useNodeStore((s) => s.updateNode);
  const setHighlightedPathIds = useLinkStore((s) => s.setHighlightedPathIds);
  const highlightedIds = useLinkStore((s) => s.highlightedPathIds);

  const [pathIds, setPathIds] = useState<string[]>(() => generateLearningPath());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPathIds(generateLearningPath());
  }, [nodes.length, links.length]);

  const linkMap = useMemo(() => {
    const m = new Map<string, KnowledgeLink>();
    for (const l of links) {
      m.set(`${l.sourceId}->${l.targetId}`, l);
      m.set(`${l.targetId}->${l.sourceId}`, l);
    }
    return m;
  }, [links]);

  useEffect(() => {
    const ids: string[] = [];
    for (let i = 0; i < pathIds.length - 1; i++) {
      const l = linkMap.get(`${pathIds[i]}->${pathIds[i + 1]}`);
      if (l) ids.push(l.id);
    }
    setHighlightedPathIds(ids);
  }, [pathIds, linkMap, setHighlightedPathIds]);

  const progress = useMemo(() => {
    if (pathIds.length === 0) return 0;
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    let total = 0;
    for (const id of pathIds) total += nodeById.get(id)?.progress ?? 0;
    return Math.round(total / pathIds.length);
  }, [pathIds, nodes]);

  const handleRegenerate = () => {
    setPathIds(generateLearningPath());
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null) return;
    const arr = [...pathIds];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, moved);
    setPathIds(arr);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const jumpToStep = (idx: number) => {
    const targetId = pathIds[idx];
    const n = nodes.find((nn) => nn.id === targetId);
    if (!n) return;
    // fire custom event for main app to center viewport
    window.dispatchEvent(
      new CustomEvent('centerOnNode', { detail: { x: n.x, y: n.y } }),
    );
  };

  const toggleProgressStep = (id: string, current: number) => {
    const next = current >= 100 ? 0 : 100;
    updateNode(id, { progress: next, status: next >= 100 ? 'completed' : next > 0 ? 'in-progress' : 'pending' });
  };

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="h-full flex flex-col" style={{ color: '#2c3e50' }}>
      <div className="p-4 border-b" style={{ borderColor: 'rgba(44,62,80,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Route size={16} style={{ color: '#ff6b6b' }} />
            学习路径
          </h3>
          <button
            onClick={handleRegenerate}
            className="p-1.5 rounded-lg transition-all hover:bg-slate-100 hover:rotate-180 active:scale-95"
            style={{ color: '#5a6c7d' }}
            title="重新生成推荐路径"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="p-3 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, #4a9eff22, #ff6b6b22)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles size={14} style={{ color: '#4a9eff' }} />
              综合学习进度
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff', color: '#2c3e50' }}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(44,62,80,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background:
                  progress >= 100
                    ? 'linear-gradient(90deg, #52c41a, #389e0d)'
                    : 'linear-gradient(90deg, #4a9eff, #ff6b6b)',
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: '#5a6c7d' }}>
            <span className="flex items-center gap-1">
              <Target size={11} /> {pathIds.length} 个知识节点
            </span>
            <span>
              {pathIds.filter((id) => (nodeById.get(id)?.progress ?? 0) >= 100).length} / {pathIds.length} 已完成
            </span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 relative"
        style={{ scrollbarWidth: 'thin' }}
      >
        {pathIds.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            <Route size={32} className="mx-auto mb-2 opacity-30" />
            暂无学习路径
            <div className="text-xs mt-1.5 leading-relaxed">
              创建节点并建立「前置/后续」关联
              <br />
              系统将自动生成推荐学习路径
            </div>
          </div>
        )}
        {pathIds.map((id, i) => {
          const n = nodeById.get(id);
          if (!n) return null;
          const nextLink = linkMap.get(`${id}->${pathIds[i + 1]}`);
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== i;
          const pct = n.progress;
          const done = pct >= 100;
          return (
            <div key={id}>
              <div
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-30 scale-95' : ''
                }`}
                style={{
                  background: isOver ? '#fffbe6' : n.color || '#f8f9fa',
                  borderColor: isOver
                    ? '#faad14'
                    : done
                      ? '#52c41a66'
                      : 'rgba(44,62,80,0.08)',
                  padding: '10px 10px 10px 8px',
                  boxShadow: isOver
                    ? '0 0 0 3px rgba(250,173,20,0.25)'
                    : done
                      ? '0 2px 8px rgba(82,196,26,0.15)'
                      : undefined,
                  animation: isOver ? undefined : undefined,
                }}
              >
                <div className="flex items-start gap-1.5">
                  <div
                    className="shrink-0 mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#95a5b4' }}
                  >
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: done ? 'rgba(82,196,26,0.2)' : 'rgba(74,158,255,0.2)',
                            color: done ? '#389e0d' : '#2c6bd9',
                          }}
                        >
                          #{i + 1}
                        </span>
                        <h4 className="text-sm font-semibold truncate">{n.title || '(无标题)'}</h4>
                      </div>
                      <button
                        onClick={() => toggleProgressStep(id, pct)}
                        className="shrink-0 transition-all hover:scale-110 active:scale-95"
                        style={{ color: done ? '#52c41a' : '#c0c9d3' }}
                        title={done ? '点击标记为未完成' : '点击标记为完成'}
                      >
                        <CheckCircle2 size={17} fill={done ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-[11px] mb-1.5 truncate" style={{ color: '#5a6c7d' }}>
                      {n.summary || '（暂无摘要）'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(44,62,80,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: done ? '#52c41a' : '#4a9eff',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: '#7b8a9a' }}>
                        {pct}%
                      </span>
                      <button
                        onClick={() => jumpToStep(i)}
                        className="shrink-0 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/70 hover:scale-110"
                        style={{ color: '#4a9eff' }}
                        title="在画布中定位"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {i < pathIds.length - 1 && (
                <div
                  className="flex items-center justify-center py-0.5 relative"
                  style={{ height: 20 }}
                >
                  <div
                    className="w-0.5 h-full"
                    style={{
                      background: nextLink
                        ? `linear-gradient(to bottom, ${nextLink.type === 'prerequisite' ? '#4a9eff' : nextLink.type === 'subsequent' ? '#52c41a' : '#faad14'}, ${nextLink.type === 'prerequisite' ? '#4a9eff88' : nextLink.type === 'subsequent' ? '#52c41a88' : '#faad1488'})`
                        : 'repeating-linear-gradient(to bottom, #c0c9d3 0, #c0c9d3 3px, transparent 3px, transparent 6px)',
                      opacity: nextLink ? 0.8 : 0.4,
                    }}
                  />
                  <div
                    className="absolute rounded-full p-0.5 shrink-0"
                    style={{
                      background: nextLink ? LINK_COLOR(nextLink.type) + '22' : '#fff',
                      border: nextLink ? `1.5px solid ${LINK_COLOR(nextLink.type)}` : '1px dashed #c0c9d3',
                    }}
                  >
                    <ChevronRight size={10} style={{ color: nextLink ? LINK_COLOR(nextLink.type) : '#95a5b4' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes pathSpringIn {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function LINK_COLOR(t: string) {
  if (t === 'prerequisite') return '#4a9eff';
  if (t === 'subsequent') return '#52c41a';
  return '#faad14';
}
