import { useEffect, useRef, useState, useCallback } from 'react';
import { GraphEngine, type PendingLinkDrag } from '../core/GraphEngine';
import { useNodeStore } from '@/stores/NodeStore';
import { useLinkStore } from '@/stores/LinkStore';
import type { LinkType, KnowledgeLink } from '@/types';
import { NODE_WIDTH, NODE_HEIGHT } from '@/types';

type Mode = 'idle' | 'pan' | 'node-drag' | 'link-drag' | 'minimap';

interface Props {
  onOpenNodeModal: (nodeId?: string | null) => void;
  engineRef?: React.MutableRefObject<GraphEngine | null>;
}

export default function Canvas({ onOpenNodeModal, engineRef: extRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineLocalRef = useRef<GraphEngine | null>(null);
  const modeRef = useRef<Mode>('idle');
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0, nodeId: '' as string | null });
  const [miniHover, setMiniHover] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const nodes = useNodeStore((s) => s.nodes);
  const links = useLinkStore((s) => s.links);
  const highlightedIds = useLinkStore((s) => s.highlightedPathIds);
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const setNodePosition = useNodeStore((s) => s.setNodePosition);
  const selectNode = useNodeStore((s) => s.selectNode);
  const clearSelection = useNodeStore((s) => s.clearSelection);
  const setBatchPositions = useNodeStore((s) => s.setBatchPositions);
  const addLink = useLinkStore((s) => s.addLink);
  const openLinkTypeModal = useLinkStore((s) => s.openLinkTypeModal);
  const openLinkEditor = useLinkStore((s) => s.openLinkEditor);
  const pendingLink = useLinkStore((s) => s.pendingLink);
  const closeLinkTypeModal = useLinkStore((s) => s.closeLinkTypeModal);
  const linkTypeModalOpen = useLinkStore((s) => s.linkTypeModalOpen);
  const setForceLayoutRunning = useNodeStore((s) => s.setForceLayoutRunning);
  const forceLayoutRunning = useNodeStore((s) => s.forceLayoutRunning);

  const getNodes = useCallback(() => useNodeStore.getState().nodes, []);
  const getLinks = useCallback(() => useLinkStore.getState().links, []);
  const getHighlights = useCallback(() => useLinkStore.getState().highlightedPathIds, []);

  const onBatchUpdate = useCallback(
    (updates: { id: string; x: number; y: number }[]) => {
      setBatchPositions(updates);
    },
    [setBatchPositions],
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GraphEngine(canvasRef.current, {
      getNodes,
      getLinks,
      getHighlightedPathIds: getHighlights,
      onBatchUpdate,
    });
    engineLocalRef.current = engine;
    if (extRef) extRef.current = engine;
    const doResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
    };
    doResize();
    window.addEventListener('resize', doResize);
    engine.start();
    return () => {
      window.removeEventListener('resize', doResize);
      engine.stop();
    };
  }, [getNodes, getLinks, getHighlights, onBatchUpdate, extRef]);

  useEffect(() => {
    if (engineLocalRef.current && miniCanvasRef.current) {
      engineLocalRef.current.setMiniMap(miniCanvasRef.current);
      const rect = miniCanvasRef.current.getBoundingClientRect();
      if (engineLocalRef.current) {
        engineLocalRef.current.resize(
          containerRef.current?.clientWidth || 0,
          containerRef.current?.clientHeight || 0,
        );
      }
    }
  }, []);

  useEffect(() => {
    if (engineLocalRef.current) {
      engineLocalRef.current.setForceLayoutEnabled(forceLayoutRunning);
      if (forceLayoutRunning) {
        const t = setTimeout(() => setForceLayoutRunning(false), 4500);
        return () => clearTimeout(t);
      }
    }
  }, [forceLayoutRunning, setForceLayoutRunning]);

  const wheelHandler = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const engine = engineLocalRef.current;
    if (!engine) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const vp = engine.getViewport();
    const worldP = {
      x: (mx - vp.offsetX) / vp.scale,
      y: (my - vp.offsetY) / vp.scale,
    };
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    let newScale = vp.scale * factor;
    newScale = Math.max(0.3, Math.min(3, newScale));
    const newOffsetX = mx - worldP.x * newScale;
    const newOffsetY = my - worldP.y * newScale;
    engine.setViewport({ offsetX: newOffsetX, offsetY: newOffsetY, scale: newScale });
  }, []);

  const getLocalPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const engine = engineLocalRef.current;
    if (!engine) return;
    const pos = getLocalPos(e);
    if (e.button === 2 || e.button === 1 || e.shiftKey || e.altKey) {
      modeRef.current = 'pan';
      const vp = engine.getViewport();
      dragStartRef.current = {
        x: pos.x,
        y: pos.y,
        offsetX: vp.offsetX,
        offsetY: vp.offsetY,
        nodeId: null,
      };
      return;
    }

    const corner = engine.hitTestCorner(pos.x, pos.y);
    if (corner) {
      modeRef.current = 'link-drag';
      const p: PendingLinkDrag = {
        sourceId: corner.nodeId,
        startX: corner.x,
        startY: corner.y,
        mouseX: pos.x,
        mouseY: pos.y,
      };
      engine.setPendingLinkDrag(p);
      return;
    }

    const node = engine.hitTestNode(pos.x, pos.y);
    if (node) {
      if (e.detail >= 2) {
        onOpenNodeModal(node.id);
        return;
      }
      modeRef.current = 'node-drag';
      selectNode(node.id, e.ctrlKey || e.metaKey);
      dragStartRef.current = { x: pos.x, y: pos.y, offsetX: node.x, offsetY: node.y, nodeId: node.id };
      engine.setDraggingNodeId(node.id);
      return;
    }
    clearSelection();
    modeRef.current = 'pan';
    const vp = engine.getViewport();
    dragStartRef.current = { x: pos.x, y: pos.y, offsetX: vp.offsetX, offsetY: vp.offsetY, nodeId: null };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const engine = engineLocalRef.current;
    if (!engine) return;
    const pos = getLocalPos(e);

    if (modeRef.current === 'pan') {
      const s = dragStartRef.current;
      engine.setViewport({
        ...engine.getViewport(),
        offsetX: s.offsetX + (pos.x - s.x),
        offsetY: s.offsetY + (pos.y - s.y),
      });
      return;
    }

    if (modeRef.current === 'node-drag' && dragStartRef.current.nodeId) {
      const s = dragStartRef.current;
      const vp = engine.getViewport();
      const dx = (pos.x - s.x) / vp.scale;
      const dy = (pos.y - s.y) / vp.scale;
      setNodePosition(s.nodeId!, s.offsetX + dx, s.offsetY + dy);
      return;
    }

    if (modeRef.current === 'link-drag') {
      const p = engine['pendingLinkDrag'];
      if (p) {
        engine.setPendingLinkDrag({ ...p, mouseX: pos.x, mouseY: pos.y });
      }
      return;
    }

    const hL = engine.hitTestLink(pos.x, pos.y);
    engine.setHoveredLinkId(hL ? hL.id : null);
    const hN = engine.hitTestNode(pos.x, pos.y);
    engine.setHoveredNodeId(hN ? hN.id : null);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    const engine = engineLocalRef.current;
    if (!engine) return;
    const pos = getLocalPos(e);

    if (modeRef.current === 'link-drag') {
      const corner = engine.hitTestCorner(pos.x, pos.y);
      const src = engine['pendingLinkDrag']?.sourceId;
      engine.setPendingLinkDrag(null);
      if (corner && src && src !== corner.nodeId) {
        openLinkTypeModal(src, corner.nodeId);
      }
    }

    if (modeRef.current === 'node-drag' && dragStartRef.current.nodeId) {
      engine.setDraggingNodeId(null);
      engine.kickSimulation();
    }

    modeRef.current = 'idle';
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const engine = engineLocalRef.current;
    if (!engine) return;
    const pos = getLocalPos(e);
    const link = engine.hitTestLink(pos.x, pos.y);
    if (link) {
      openLinkEditor(link);
      return;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          useNodeStore.getState().deleteNodes(selectedIds);
          selectedIds.forEach((id) => useLinkStore.getState().deleteLinksByNode(id));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds]);

  useEffect(() => {
    if (pendingLink && linkTypeModalOpen) return;
  }, [pendingLink, linkTypeModalOpen]);

  const onConfirmLinkType = (type: LinkType) => {
    if (pendingLink) {
      addLink({ sourceId: pendingLink.sourceId, targetId: pendingLink.targetId, type });
      engineLocalRef.current?.kickSimulation();
    }
    closeLinkTypeModal();
  };

  const minimapDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    modeRef.current = 'minimap';
    minimapMove(e);
  };
  const minimapMove = (e: React.MouseEvent) => {
    const engine = engineLocalRef.current;
    const mini = miniCanvasRef.current;
    if (!engine || !mini) return;
    const rect = mini.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const mw = rect.width;
    const mh = rect.height;
    const nodes = getNodes();
    if (nodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT);
    }
    const pad = 60;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const gw = maxX - minX;
    const gh = maxY - minY;
    const scale = Math.min(mw / gw, mh / gh);
    const offX = (mw - gw * scale) / 2 - minX * scale;
    const offY = (mh - gh * scale) / 2 - minY * scale;
    const canvasW = containerRef.current!.clientWidth;
    const canvasH = containerRef.current!.clientHeight;
    const worldX = (mx - offX) / scale;
    const worldY = (my - offY) / scale;
    const vp = engine.getViewport();
    const newOffsetX = -worldX * vp.scale + canvasW / 2;
    const newOffsetY = -worldY * vp.scale + canvasH / 2;
    engine.setViewport({ ...vp, offsetX: newOffsetX, offsetY: newOffsetY });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: '#f5f6fa',
        maskImage:
          'radial-gradient(circle at 50% 50%, black 68%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(circle at 50% 50%, black 68%, transparent 100%)',
      }}
      onWheel={wheelHandler}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-grab active:cursor-grabbing" />

      <div
        className="absolute right-5 bottom-5 rounded-xl shadow-lg overflow-hidden border transition-opacity duration-200"
        style={{
          width: '220px',
          height: '160px',
          opacity: miniHover ? 0.6 : 0.15,
          borderColor: 'rgba(44,62,80,0.12)',
          background: '#ffffff',
        }}
        onMouseEnter={() => setMiniHover(true)}
        onMouseLeave={() => setMiniHover(false)}
      >
        <canvas
          ref={miniCanvasRef}
          style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          onMouseDown={minimapDown}
          onMouseMove={(e) => {
            if (modeRef.current === 'minimap') minimapMove(e);
          }}
          onMouseUp={() => (modeRef.current = 'idle')}
          onMouseLeave={() => (modeRef.current = 'idle')}
        />
        <div className="absolute top-1 left-2 text-[10px] text-slate-500 pointer-events-none font-medium">
          全局视图
        </div>
      </div>

      {linkTypeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(44,62,80,0.25)' }}
          onClick={closeLinkTypeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-96"
            style={{
              animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2c3e50' }}>
              选择关联类型
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['prerequisite', 'subsequent', 'related'] as LinkType[]).map((t) => {
                const labels = { prerequisite: '前置知识', subsequent: '后续知识', related: '相关概念' } as const;
                const colors = { prerequisite: '#4a9eff', subsequent: '#52c41a', related: '#faad14' } as const;
                return (
                  <button
                    key={t}
                    onClick={() => onConfirmLinkType(t)}
                    className="py-3 px-2 rounded-xl border transition-all hover:scale-105 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      borderColor: colors[t],
                      color: colors[t],
                      background: colors[t] + '15',
                      fontWeight: 600,
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={closeLinkTypeModal}
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
