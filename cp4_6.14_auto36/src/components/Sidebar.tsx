import { useAppStore } from '@/store/useAppStore';
import { MessageSquare, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const nodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectNode = useAppStore((s) => s.selectNode);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCardClick = (id: string) => {
    selectNode(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
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

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
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
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const commentCount = node.comments.length;

            return (
              <div
                key={node.id}
                className={`
                  relative group rounded-xl p-2.5 cursor-pointer
                  border-2 transition-all duration-250 ease-out
                  ${isSelected
                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                    : 'border-transparent bg-gray-50/80 hover:border-blue-300 hover:bg-white hover:-translate-y-1 hover:shadow-md'
                  }
                `}
                style={{ transitionTimingFunction: 'ease-out' }}
                onClick={() => handleCardClick(node.id)}
              >
                <div className="flex gap-2.5">
                  <div
                    className="flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                    style={{ width: 80, height: 50 }}
                  >
                    <img
                      src={node.thumbnail}
                      alt={node.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium text-gray-800 truncate"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                    >
                      {node.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-gray-400">
                      <Clock size={10} />
                      <span className="text-[10px]">{node.createdAt}</span>
                    </div>
                  </div>
                </div>

                {commentCount > 0 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 badge-pop"
                    style={{
                      width: commentCount > 9 ? 22 : 18,
                      height: 18,
                      borderRadius: 9,
                      background: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="text-white text-[10px] font-bold">{commentCount}</span>
                  </div>
                )}

                {commentCount === 0 && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
                    <MessageSquare size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
