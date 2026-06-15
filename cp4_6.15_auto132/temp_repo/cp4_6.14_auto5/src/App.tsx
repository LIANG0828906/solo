import { useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import EditorPanel, { type EditorPanelHandle } from "@/components/EditorPanel";
import TimelinePanel from "@/components/TimelinePanel";
import Toolbar from "@/components/Toolbar";
import { ChevronUp, X } from "lucide-react";

export default function App() {
  const editorRef = useRef<EditorPanelHandle>(null);
  const activeNodeId = useAppStore((s) => s.activeNodeId);
  const nodes = useAppStore((s) => s.nodes);
  const setActiveNodeId = useAppStore((s) => s.setActiveNodeId);
  const timelineOpen = useAppStore((s) => s.timelineOpen);
  const setTimelineOpen = useAppStore((s) => s.setTimelineOpen);
  const searchKeyword = useAppStore((s) => s.searchKeyword);

  useEffect(() => {
    if (!activeNodeId) return;
    const node = nodes.find((n) => n.id === activeNodeId);
    if (node && editorRef.current) {
      editorRef.current.scrollToAndHighlight(node.id, node.htmlContent);
    }
  }, [activeNodeId, nodes]);

  const handleSearchHighlight = useCallback(
    (keyword: string) => {
      if (!editorRef.current) return;
      if (!keyword.trim()) {
        editorRef.current.clearHighlights();
        return;
      }
      editorRef.current.highlightSearchKeyword(keyword);
    },
    []
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-dark">
      <Toolbar
        editorRef={editorRef as React.RefObject<HTMLDivElement | null>}
        onSearchHighlight={handleSearchHighlight}
      />

      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        <div className="flex-[6] min-w-0 overflow-hidden rounded-xl shadow-sm border border-gray-200/20">
          <EditorPanel ref={editorRef} />
        </div>

        <div className="hidden md:flex flex-[3.5] min-w-0 overflow-hidden">
          <div className="w-full">
            <TimelinePanel />
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="absolute -top-12 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: "#4a6fa5" }}
        >
          <ChevronUp
            size={20}
            className={`text-white transition-transform duration-300 ${timelineOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className="transition-transform duration-300 ease-in-out"
          style={{
            transform: timelineOpen ? "translateY(0)" : "translateY(100%)",
            maxHeight: "60vh",
          }}
        >
          <div className="relative" style={{ maxHeight: "60vh" }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "#2c2c2c" }}>
              <span className="text-sm text-gray-300 font-semibold">思维时间线</span>
              <button
                onClick={() => setTimelineOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ maxHeight: "calc(60vh - 40px)", backgroundColor: "#2c2c2c" }}>
              <TimelinePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
