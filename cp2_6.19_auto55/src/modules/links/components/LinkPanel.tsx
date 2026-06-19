import { Trash2, Edit3, ArrowRight, GitBranch, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useLinkStore } from '@/stores/LinkStore';
import { useNodeStore } from '@/stores/NodeStore';
import { useUIPanelStore } from '@/stores/UIPanelStore';
import type { LinkType, KnowledgeLink } from '@/types';
import { LINK_TYPE_LABELS, LINK_TYPE_COLORS } from '@/types';

export default function LinkPanel() {
  const links = useLinkStore((s) => s.links);
  const deleteLink = useLinkStore((s) => s.deleteLink);
  const updateLink = useLinkStore((s) => s.updateLink);
  const nodes = useNodeStore((s) => s.nodes);
  const editingLink = useUIPanelStore((s) => s.editingLink);
  const openLinkEditor = useUIPanelStore((s) => s.openLinkEditor);
  const closeLinkEditor = useUIPanelStore((s) => s.closeLinkEditor);
  const setHighlightedPathIds = useLinkStore((s) => s.setHighlightedPathIds);

  const [filterType, setFilterType] = useState<LinkType | 'all'>('all');

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const filtered = links.filter((l) => (filterType === 'all' ? true : l.type === filterType));
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  const stats = {
    total: links.length,
    prerequisite: links.filter((l) => l.type === 'prerequisite').length,
    subsequent: links.filter((l) => l.type === 'subsequent').length,
    related: links.filter((l) => l.type === 'related').length,
  };

  const handleHighlightPath = (l: KnowledgeLink) => {
    setHighlightedPathIds([l.id]);
    setTimeout(() => setHighlightedPathIds([]), 2200);
  };

  return (
    <div className="h-full flex flex-col" style={{ color: '#2c3e50' }}>
      <div className="p-4 border-b" style={{ borderColor: 'rgba(44,62,80,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <GitBranch size={16} style={{ color: '#4a9eff' }} />
            关联关系
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,158,255,0.15)', color: '#2c6bd9' }}
          >
            {links.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px] mb-1">
          <div
            className="p-2 rounded-lg text-center cursor-pointer transition-all"
            style={{
              background: filterType === 'all' ? 'rgba(44,62,80,0.08)' : 'transparent',
              color: filterType === 'all' ? '#2c3e50' : '#7b8a9a',
              fontWeight: filterType === 'all' ? 600 : 400,
            }}
            onClick={() => setFilterType('all')}
          >
            <div className="text-base font-bold">{stats.total}</div>
            <div>全部</div>
          </div>
          <div
            className="p-2 rounded-lg text-center cursor-pointer transition-all"
            style={{
              background: filterType === 'prerequisite' ? 'rgba(74,158,255,0.15)' : 'transparent',
              color: filterType === 'prerequisite' ? '#2c6bd9' : '#7b8a9a',
              fontWeight: filterType === 'prerequisite' ? 600 : 400,
            }}
            onClick={() => setFilterType('prerequisite')}
          >
            <div className="text-base font-bold">{stats.prerequisite}</div>
            <div>前置</div>
          </div>
          <div
            className="p-2 rounded-lg text-center cursor-pointer transition-all"
            style={{
              background: filterType === 'subsequent' ? 'rgba(82,196,26,0.15)' : 'transparent',
              color: filterType === 'subsequent' ? '#389e0d' : '#7b8a9a',
              fontWeight: filterType === 'subsequent' ? 600 : 400,
            }}
            onClick={() => setFilterType('subsequent')}
          >
            <div className="text-base font-bold">{stats.subsequent}</div>
            <div>后续</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            暂无关联关系
            <div className="text-xs mt-1.5 text-slate-400/80 leading-relaxed">
              在主画布拖拽节点边角的连接点
              <br />
              即可创建关联关系
            </div>
          </div>
        )}
        {sorted.map((l) => {
          const src = nodeMap.get(l.sourceId);
          const tgt = nodeMap.get(l.targetId);
          const color = LINK_TYPE_COLORS[l.type];
          return (
            <div
              key={l.id}
              className="p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: '#fff',
                borderColor: 'rgba(44,62,80,0.08)',
                borderLeft: `3px solid ${color}`,
              }}
              onClick={() => handleHighlightPath(l)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: color + '22', color }}
                >
                  {LINK_TYPE_LABELS[l.type]}
                </span>
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLinkEditor(l);
                    }}
                    className="p-1 rounded-md transition hover:bg-slate-100"
                    style={{ color: '#2c6bd9' }}
                    title="编辑类型"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('删除该关联？')) deleteLink(l.id);
                    }}
                    className="p-1 rounded-md transition hover:bg-red-50"
                    style={{ color: '#e74c3c' }}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div
                  className="flex-1 truncate px-2 py-1 rounded-md font-medium"
                  style={{ background: src?.color || '#f8f9fa', color: '#2c3e50' }}
                  title={src?.title || '(已删除)'}
                >
                  {src?.title || '(已删除)'}
                </div>
                <ArrowRight size={14} style={{ color }} />
                <div
                  className="flex-1 truncate px-2 py-1 rounded-md font-medium"
                  style={{ background: tgt?.color || '#f8f9fa', color: '#2c3e50' }}
                  title={tgt?.title || '(已删除)'}
                >
                  {tgt?.title || '(已删除)'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(44,62,80,0.25)' }}
          onClick={closeLinkEditor}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-96"
            style={{ animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2c3e50' }}>
              编辑关联类型
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['prerequisite', 'subsequent', 'related'] as LinkType[]).map((t) => {
                const active = editingLink.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      updateLink(editingLink.id, { type: t });
                      closeLinkEditor();
                    }}
                    className="py-3 px-2 rounded-xl border transition-all hover:scale-105 hover:-translate-y-0.5"
                    style={{
                      borderColor: LINK_TYPE_COLORS[t],
                      color: LINK_TYPE_COLORS[t],
                      background: active ? LINK_TYPE_COLORS[t] + '25' : LINK_TYPE_COLORS[t] + '10',
                      fontWeight: active ? 700 : 600,
                      boxShadow: active ? `0 0 0 2px ${LINK_TYPE_COLORS[t]}55` : undefined,
                    }}
                  >
                    {LINK_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={closeLinkEditor}
              className="mt-5 w-full py-2 rounded-lg text-sm hover:bg-slate-100 transition"
              style={{ color: '#5a6c7d' }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalPop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
