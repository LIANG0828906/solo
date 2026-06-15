import { useAppStore } from '@/store/useAppStore';
import { MessageSquare, Clock } from 'lucide-react';
import { useState, useMemo, memo } from 'react';

interface SidebarCardProps {
  nodeId: string;
  title: string;
  thumbnail: string;
  createdAt: string;
  commentCount: number;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const SidebarCard = memo(function SidebarCard({
  nodeId,
  title,
  thumbnail,
  createdAt,
  commentCount,
  isSelected,
  onClick,
}: SidebarCardProps) {
  return (
    <div
      className={`
        relative group rounded-xl p-2.5 cursor-pointer
        border-2 transition-all duration-250 ease-out
        ${isSelected
          ? 'border-amber-400 bg-amber-50/50 shadow-sm'
          : 'border-transparent bg-gray-50/80 hover:border-blue-300 hover:bg-white hover:-translate-y-1 hover:shadow-md'
        }
      `}
      style={{ transitionTimingFunction: 'ease-out' }}
      onClick={() => onClick(nodeId)}
    >
      <div className="flex gap-2.5">
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
          style={{ width: 128, height: 80 }}
        >
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3
            className="text-sm font-medium text-gray-800 truncate"
            style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {title}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 text-gray-400">
            <Clock size={10} />
            <span className="text-[10px]">{createdAt}</span>
          </div>
        </div>
      </div>

      <div
        key={`badge-${commentCount}`}
        className={`absolute -top-1.5 -right-1.5 ${commentCount > 0 ? 'badge-pop' : ''}`}
        style={{
          width: commentCount > 9 ? 22 : 18,
          height: 18,
          borderRadius: 9,
          background: '#EF4444',
          display: commentCount > 0 ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
          transformOrigin: 'center center',
        }}
      >
        <span
          className="text-white font-bold"
          style={{ fontSize: commentCount > 9 ? 9 : 10 }}
        >
          {commentCount}
        </span>
      </div>

      {commentCount === 0 && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
          <MessageSquare size={14} className="text-gray-400" />
        </div>
      )}
    </div>
  );
});

export default function Sidebar() {
  const nodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectNode = useAppStore((s) => s.selectNode);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const cardList = useMemo(() => {
    return nodes.map((node) => (
      <SidebarCard
        key={node.id}
        nodeId={node.id}
        title={node.title}
        thumbnail={node.thumbnail}
        createdAt={node.createdAt}
        commentCount={node.comments.length}
        isSelected={selectedNodeId === node.id}
        onClick={(id) => {
          selectNode(id);
          setIsMobileOpen(false);
        }}
      />
    ));
  }, [nodes, selectedNodeId, selectNode]);

  return (
    <>
      <button
        className="fixed bottom-4 left-4 z-40 md:hidden bg-white rounded-xl shadow-lg p-3 border border-gray-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="3" width="16" height="2" rx="1" fill="#3B82F6" />
          <rect x="2" y="9" width="16" height="2" rx="1" fill="#3B82F6" />
          <rect x="2" y="15" width="16" height="2" rx="1" fill="#3B82F6" />
        </svg>
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-30
          bg-white border-r border-gray-100
          flex flex-col overflow-hidden
          transition-transform duration-300 ease-out
          ${isMobileOpen
            ? 'bottom-0 left-0 right-0 h-1/2 rounded-t-2xl shadow-2xl'
            : 'fixed -bottom-full md:bottom-auto md:left-0 md:top-0 md:h-full'
          }
          md:w-[280px] md:min-w-[280px] md:h-full md:translate-y-0 md:shadow-none
        `}
        style={{
          boxShadow: '1px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h2
            className="text-base font-semibold text-gray-800"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Wireframe Pages
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{nodes.length} 个页面</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cardList}
        </div>
      </aside>
    </>
  );
}
