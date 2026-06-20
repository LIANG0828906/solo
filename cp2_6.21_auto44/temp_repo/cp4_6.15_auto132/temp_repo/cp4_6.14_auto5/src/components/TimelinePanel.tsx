import { useCallback, useRef, useEffect } from "react";
import { Star, Clock } from "lucide-react";
import { useAppStore } from "@/store";
import type { TimelineNode as TimelineNodeType } from "@/types";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function NodeCard({
  node,
  isActive,
  searchKeyword,
  onClick,
  onToggleMark,
}: {
  node: TimelineNodeType;
  isActive: boolean;
  searchKeyword: string;
  onClick: () => void;
  onToggleMark: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isActive]);

  const highlightText = useCallback(
    (text: string) => {
      if (!searchKeyword.trim()) return text;
      const idx = text.toLowerCase().indexOf(searchKeyword.toLowerCase());
      if (idx === -1) return text;
      return (
        <>
          {text.slice(0, idx)}
          <span className="search-highlight-inline">{text.slice(idx, idx + searchKeyword.length)}</span>
          {text.slice(idx + searchKeyword.length)}
        </>
      );
    },
    [searchKeyword]
  );

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-xl p-3 mb-2 transition-all duration-300 ease-in-out
        hover:scale-[1.05] hover:shadow-lg
        ${isActive ? "ring-2 ring-blue-accent shadow-lg" : ""}
        ${node.marked ? "border-l-4 border-l-accent-yellow" : "border-l-4 border-l-transparent"}
      `}
      style={{
        backgroundColor: isActive ? "rgba(74,111,165,0.25)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-blue-accent opacity-60 flex-shrink-0" />
            <span className="text-xs text-gray-400 font-mono">{formatTime(node.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-200 leading-snug line-clamp-3 break-words">
            {highlightText(node.content)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMark();
          }}
          className={`
            flex-shrink-0 p-1 rounded-md transition-all duration-200
            ${node.marked ? "text-accent-yellow" : "text-gray-500 opacity-0 group-hover:opacity-100"}
            hover:bg-white/10
          `}
          title={node.marked ? "取消标记" : "标记为关键节点"}
        >
          <Star size={14} fill={node.marked ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}

export default function TimelinePanel() {
  const nodes = useAppStore((s) => s.nodes);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const activeNodeId = useAppStore((s) => s.activeNodeId);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);
  const setActiveNodeId = useAppStore((s) => s.setActiveNodeId);
  const toggleMark = useAppStore((s) => s.toggleMark);

  const filteredNodes = searchKeyword.trim()
    ? nodes.filter((n) => n.content.toLowerCase().includes(searchKeyword.toLowerCase()))
    : nodes;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#2c2c2c", borderRadius: 12 }}>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
          思维时间线
        </h2>
        <div className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索节点..."
            className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-accent/50 focus:ring-1 focus:ring-blue-accent/30 transition-all duration-200"
          />
          {searchKeyword && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {filteredNodes.length} / {nodes.length}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            {searchKeyword ? "未找到匹配节点" : "开始编辑以生成时间线节点"}
          </div>
        ) : (
          filteredNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isActive={activeNodeId === node.id}
              searchKeyword={searchKeyword}
              onClick={() => setActiveNodeId(node.id)}
              onToggleMark={() => toggleMark(node.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
