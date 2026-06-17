import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { TimelineRenderer } from '@/timeline/renderer';
import { getLayout } from '@/timeline/layout';
import { hitTest } from '@/timeline/layout';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import { AddNodeMenu, NodeDetailPanel, EndDateDisplay } from '@/components/NodeMenus';
import type { NodeLayout } from '@/shared/types';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TimelineRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addMenuState, setAddMenuState] = useState<{
    x: number;
    y: number;
    dayOffset: number;
    parentId: string | null;
  } | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);

  const nodes = useStore((s) => s.nodes);
  const branches = useStore((s) => s.branches);
  const filter = useStore((s) => s.filter);
  const timeConfig = useStore((s) => s.timeConfig);
  const updateNodeStatus = useStore((s) => s.updateNodeStatus);

  const selectedNodeId = useStore((s) => s.selectedNodeId);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new TimelineRenderer(canvasRef.current);
    rendererRef.current = renderer;

    renderer.setInteractionCallback((type, x, y, dayOffset, nodeLayout) => {
      if (type === 'dblclick') {
        if (nodeLayout && !nodeLayout.filtered) {
          setAddMenuState({
            x,
            y,
            dayOffset: nodeLayout.node.dayOffset,
            parentId: nodeLayout.node.id,
          });
        } else {
          setAddMenuState({ x, y, dayOffset, parentId: null });
        }
      }
    });

    renderer.start();
    renderer.resize();

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', handleResize);
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [selectedNodeId]);

  const handleCanvasClick = useCallback((e: MouseEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const state = useStore.getState();
    const canvasWidth = rect.width;
    const layout = getLayout(
      state.nodes, state.branches, state.filter,
      state.timeConfig.startDate, state.timeConfig.zoomLevel,
      canvasWidth, state.timeConfig.offsetX
    );

    const hit = hitTest(layout, px, py);
    if (hit && !hit.filtered) {
      setDetailNodeId(hit.id);
    } else {
      setDetailNodeId(null);
    }
  }, []);

  const endDate = (() => {
    if (nodes.length === 0) return null;
    const maxEndDay = nodes.reduce((max, n) => Math.max(max, n.dayOffset + n.estimatedDays), 0);
    return new Date(timeConfig.startDate + maxEndDay * 86400000);
  })();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: '#1A1A2E' }}>
      <Toolbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden md:block shrink-0" style={{ width: 240, padding: '8px 0 8px 8px' }}>
          <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
        </div>

        {sidebarOpen && (
          <div className="md:hidden shrink-0">
            <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        <main className="flex-1 relative overflow-hidden" ref={containerRef}>
          <EndDateDisplay endDate={endDate} />

          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ cursor: 'grab' }}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(45,45,68,0.8)', backdropFilter: 'blur(8px)' }}>
            <span className="text-xs text-white/40">缩放</span>
            <span className="text-xs text-white/70 font-medium">{Math.round(timeConfig.zoomLevel * 100)}%</span>
            <span className="text-xs text-white/20 mx-1">|</span>
            <span className="text-xs text-white/40">节点</span>
            <span className="text-xs text-white/70 font-medium">{nodes.length}</span>
            <span className="text-xs text-white/20 mx-1">|</span>
            <span className="text-xs text-white/40">双击时间轴添加节点</span>
          </div>

          {addMenuState && (
            <AddNodeMenu
              x={addMenuState.x}
              y={addMenuState.y}
              dayOffset={addMenuState.dayOffset}
              parentId={addMenuState.parentId}
              onClose={() => setAddMenuState(null)}
            />
          )}

          {detailNodeId && (
            <NodeDetailPanel
              nodeId={detailNodeId}
              onClose={() => setDetailNodeId(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
