import { useMemo } from 'react';
import { Plus, Trash2, Edit3, Search } from 'lucide-react';
import { useState } from 'react';
import { useNodeStore } from '@/stores/NodeStore';
import { useLinkStore } from '@/stores/LinkStore';

interface Props {
  onNewNode: () => void;
  onEditNode: (id: string) => void;
}

export default function NodePanel({ onNewNode, onEditNode }: Props) {
  const nodes = useNodeStore((s) => s.nodes);
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const selectNode = useNodeStore((s) => s.selectNode);
  const deleteNodes = useNodeStore((s) => s.deleteNodes);
  const deleteLinksByNode = useLinkStore((s) => s.deleteLinksByNode);
  const togglePanel = useNodeStore((s) => s.togglePanel);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return nodes;
    return nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(kw) ||
        n.summary.toLowerCase().includes(kw) ||
        n.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }, [nodes, q]);

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确认删除选中的 ${selectedIds.length} 个节点及其关联？`)) return;
    selectedIds.forEach(deleteLinksByNode);
    deleteNodes(selectedIds);
  };

  const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div
      className="h-full flex flex-col"
      style={{ color: '#2c3e50' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(44,62,80,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">知识节点</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,158,255,0.15)', color: '#2c6bd9' }}>
            {nodes.length}
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={onNewNode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: '#4a9eff', color: '#fff', boxShadow: '0 4px 12px rgba(74,158,255,0.35)' }}
          >
            <Plus size={15} /> 新建节点
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: '#e74c3c', border: '1px solid rgba(231,76,60,0.25)' }}
            title="删除选中"
          >
            <Trash2 size={15} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题 / 摘要 / 标签..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-all focus:scale-[1.005]"
            style={{
              borderColor: 'rgba(44,62,80,0.12)',
              background: '#fafbfc',
              boxShadow: q ? '0 0 0 3px rgba(74,158,255,0.18)' : undefined,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
        {sorted.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            {nodes.length === 0 ? '暂无节点，点击「新建节点」开始' : '无匹配的节点'}
          </div>
        )}
        {sorted.map((n) => {
          const selected = selectedIds.includes(n.id);
          return (
            <div
              key={n.id}
              onClick={() => selectNode(n.id)}
              className="relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: n.color || '#f8f9fa',
                borderColor: selected ? '#4a9eff' : 'rgba(44,62,80,0.08)',
                boxShadow: selected ? '0 0 0 3px rgba(74,158,255,0.2)' : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-semibold truncate flex-1" style={{ color: '#2c3e50' }}>
                  {n.title || '(无标题)'}
                </h4>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNode(n.id);
                    }}
                    className="p-1 rounded-md transition hover:bg-white/70"
                    style={{ color: '#2c6bd9' }}
                    title="编辑"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('删除该节点及其关联？')) {
                        deleteLinksByNode(n.id);
                        deleteNodes([n.id]);
                      }
                    }}
                    className="p-1 rounded-md transition hover:bg-white/70"
                    style={{ color: '#e74c3c' }}
                    title="删除"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs mb-2 line-clamp-2 leading-relaxed" style={{ color: '#5a6c7d' }}>
                {n.summary || '(暂无摘要)'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {n.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(74,158,255,0.2)', color: '#2c6bd9' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: n.progress >= 100 ? 'rgba(82,196,26,0.2)' : 'rgba(74,158,255,0.2)',
                    color: n.progress >= 100 ? '#389e0d' : '#2c6bd9',
                  }}
                >
                  {n.progress}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
