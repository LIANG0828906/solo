import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PlusCircle,
  Trash2,
  Network,
  Download,
  List,
  GitBranch,
  Route,
  Menu,
  X,
  Maximize2,
  Lightbulb,
  FileText,
} from 'lucide-react';
import Canvas from './modules/canvas/components/Canvas';
import type { GraphEngine } from './modules/canvas/core/GraphEngine';
import NodePanel from './modules/nodes/components/NodePanel';
import NodeModal from './modules/nodes/components/NodeModal';
import LinkPanel from './modules/links/components/LinkPanel';
import LearningPathPanel from './modules/path/components/LearningPathPanel';
import { useNodeStore } from './stores/NodeStore';
import { useLinkStore } from './stores/LinkStore';
import type { PanelKey } from './types';

export default function App() {
  const engineRef = useRef<GraphEngine | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewportNarrow, setViewportNarrow] = useState(false);
  const activePanel = useNodeStore((s) => s.activePanel);
  const togglePanel = useNodeStore((s) => s.togglePanel);
  const openNodeModal = useNodeStore((s) => s.openNodeModal);
  const editingNode = useNodeStore((s) => s.editingNode);
  const setForceLayoutRunning = useNodeStore((s) => s.setForceLayoutRunning);
  const nodes = useNodeStore((s) => s.nodes);
  const links = useLinkStore((s) => s.links);
  const selectedIds = useNodeStore((s) => s.selectedIds);
  const deleteNodes = useNodeStore((s) => s.deleteNodes);
  const deleteLinksByNode = useLinkStore((s) => s.deleteLinksByNode);
  const getNode = useNodeStore((s) => s.getNode);

  useEffect(() => {
    const check = () => setViewportNarrow(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onCenter = (e: Event) => {
      const ev = e as CustomEvent<{ x: number; y: number }>;
      const eng = engineRef.current;
      if (!eng) return;
      const canvas = (eng as any).canvas as HTMLCanvasElement;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const vp = eng.getViewport();
      const targetX = ev.detail.x + 110;
      const targetY = ev.detail.y + 70;
      const newOffsetX = w / 2 - targetX * vp.scale;
      const newOffsetY = h / 2 - targetY * vp.scale;
      animateViewport(eng, vp, { offsetX: newOffsetX, offsetY: newOffsetY, scale: vp.scale });
    };
    window.addEventListener('centerOnNode', onCenter);
    return () => window.removeEventListener('centerOnNode', onCenter);
  }, []);

  const animateViewport = (
    eng: GraphEngine,
    from: { offsetX: number; offsetY: number; scale: number },
    to: { offsetX: number; offsetY: number; scale: number },
  ) => {
    const start = performance.now();
    const dur = 420;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      eng.setViewport({
        offsetX: from.offsetX + (to.offsetX - from.offsetX) * ease,
        offsetY: from.offsetY + (to.offsetY - from.offsetY) * ease,
        scale: from.scale + (to.scale - from.scale) * ease,
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const handleNewNode = useCallback(() => {
    openNodeModal(null);
  }, [openNodeModal]);

  const handleEditNode = useCallback(
    (id: string) => {
      const n = getNode(id);
      if (n) openNodeModal(n);
    },
    [getNode, openNodeModal],
  );

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`删除选中的 ${selectedIds.length} 个节点及其关联？`)) return;
    selectedIds.forEach(deleteLinksByNode);
    deleteNodes(selectedIds);
  };

  const handleAutoLayout = () => {
    setForceLayoutRunning(true);
  };

  const handleFitView = () => {
    engineRef.current?.fitView(nodes);
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(
        ({ id, title, summary, tags, content, x, y, progress, status, color, createdAt, updatedAt }) => ({
          id,
          title,
          summary,
          tags,
          content,
          x,
          y,
          progress,
          status,
          color,
          createdAt,
          updatedAt,
        }),
      ),
      links: links.map(({ id, sourceId, targetId, type, label, createdAt }) => ({
        id,
        sourceId,
        targetId,
        type,
        label,
        createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `知识卡片导出_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const panelItems: { key: PanelKey; label: string; icon: any; count?: number }[] = [
    { key: 'nodes', label: '节点列表', icon: List, count: nodes.length },
    { key: 'links', label: '关联管理', icon: GitBranch, count: links.length },
    { key: 'path', label: '学习路径', icon: Route },
  ];

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    label,
    danger,
    disabled,
    accent,
  }: {
    onClick: () => void;
    icon: any;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    accent?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tool-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none"
      style={{
        color: danger ? '#e74c3c' : accent ? '#fff' : '#2c3e50',
        background: accent ? '#4a9eff' : 'transparent',
        boxShadow: accent ? '0 4px 14px rgba(74,158,255,0.35)' : undefined,
      }}
      title={label}
    >
      <Icon size={16} />
      {!viewportNarrow && <span>{label}</span>}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#f5f6fa' }}>
      <header
        className="flex items-center gap-2 px-4 py-3 border-b z-20"
        style={{
          borderColor: 'rgba(44,62,80,0.08)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fdfdfe 100%)',
        }}
      >
        <div
          className="flex items-center gap-2 mr-2 pr-4 border-r shrink-0"
          style={{ borderColor: 'rgba(44,62,80,0.08)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4a9eff 0%, #ff6b6b 100%)',
              boxShadow: '0 4px 12px rgba(74,158,255,0.35)',
            }}
          >
            <Network size={18} style={{ color: '#fff' }} />
          </div>
          <div className="shrink-0" style={{ display: viewportNarrow ? 'none' : 'block' }}>
            <h1 className="text-base font-bold leading-tight" style={{ color: '#2c3e50' }}>
              知识卡片 · 学习路径
            </h1>
            <p className="text-[11px] leading-tight" style={{ color: '#7b8a9a' }}>
              构建结构化知识网络 · 可视化学习路径
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-1 flex-wrap">
          <ToolbarButton onClick={handleNewNode} icon={PlusCircle} label="新建节点" accent />
          <ToolbarButton
            onClick={handleDeleteSelected}
            icon={Trash2}
            label={`删除选中${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
            danger
            disabled={selectedIds.length === 0}
          />
          <ToolbarButton onClick={handleAutoLayout} icon={Network} label="自动布局" />
          <ToolbarButton onClick={handleFitView} icon={Maximize2} label="适应画布" />
          <ToolbarButton onClick={handleExport} icon={Download} label="导出卡片" />
        </div>

        <div
          className="h-7 w-px mx-2 shrink-0"
          style={{ background: 'rgba(44,62,80,0.1)', display: viewportNarrow ? 'none' : 'block' }}
        />

        <div className="flex items-center gap-1 shrink-0">
          {panelItems.map(({ key, label, icon: Icon, count }) => {
            const active = activePanel === key;
            return (
              <button
                key={key}
                onClick={() => togglePanel(key)}
                className="tool-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative"
                style={{
                  color: active ? '#4a9eff' : '#5a6c7d',
                  background: active ? 'rgba(74,158,255,0.12)' : 'transparent',
                }}
                title={label}
              >
                <Icon size={16} />
                {!viewportNarrow && <span>{label}</span>}
                {typeof count === 'number' && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? '#4a9eff' : 'rgba(44,62,80,0.08)',
                      color: active ? '#fff' : '#5a6c7d',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {viewportNarrow && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl transition-all hover:bg-slate-100"
              style={{ color: '#2c3e50' }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 relative">
          <Canvas
            onOpenNodeModal={(id) => (id ? handleEditNode(id) : handleNewNode())}
            engineRef={engineRef}
          />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="text-center p-8 rounded-3xl max-w-md"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(44,62,80,0.08)',
                  boxShadow: '0 16px 60px rgba(44,62,80,0.08)',
                }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #4a9eff22, #ff6b6b22)',
                  }}
                >
                  <Lightbulb size={32} style={{ color: '#4a9eff' }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#2c3e50' }}>
                  开始构建你的知识网络
                </h2>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: '#5a6c7d' }}>
                  把散落在笔记、论坛、网页的学习碎片整理成结构化知识卡片。
                  <br />
                  建立节点间关联，自动生成最优学习路径。
                </p>
                <button
                  onClick={handleNewNode}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 pointer-events-auto"
                  style={{
                    background: 'linear-gradient(135deg, #4a9eff, #2c6bd9)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(74,158,255,0.4)',
                  }}
                >
                  <PlusCircle size={16} />
                  创建第一个知识卡片
                </button>
                <div className="mt-5 grid grid-cols-3 gap-3 text-[11px]" style={{ color: '#7b8a9a' }}>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(74,158,255,0.08)' }}>
                    <FileText size={16} className="mx-auto mb-1" style={{ color: '#4a9eff' }} />
                    整理笔记碎片
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(82,196,26,0.08)' }}>
                    <GitBranch size={16} className="mx-auto mb-1" style={{ color: '#52c41a' }} />
                    建立知识关联
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,107,107,0.08)' }}>
                    <Route size={16} className="mx-auto mb-1" style={{ color: '#ff6b6b' }} />
                    生成学习路径
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {(activePanel || menuOpen) && (
          <aside
            className="border-l shrink-0 flex flex-col bg-white z-10"
            style={{
              width: viewportNarrow ? '100%' : 340,
              borderColor: 'rgba(44,62,80,0.08)',
              boxShadow: viewportNarrow ? 'none' : '-8px 0 40px rgba(44,62,80,0.06)',
              animation: 'slide-right-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              position: viewportNarrow ? 'absolute' : 'relative',
              top: 0,
              right: 0,
              height: '100%',
            }}
          >
            {viewportNarrow && panelItems.length > 0 && (
              <div className="flex border-b" style={{ borderColor: 'rgba(44,62,80,0.08)' }}>
                {panelItems.map(({ key, label, icon: Icon, count }) => {
                  const active = activePanel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => togglePanel(key)}
                      className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium relative transition-all"
                      style={{
                        color: active ? '#4a9eff' : '#5a6c7d',
                      }}
                    >
                      <Icon size={14} />
                      {label}
                      {typeof count === 'number' && (
                        <span
                          className="text-[10px] font-bold px-1 py-0 rounded-full ml-0.5"
                          style={{
                            background: active ? '#4a9eff' : 'rgba(44,62,80,0.08)',
                            color: active ? '#fff' : '#5a6c7d',
                            minWidth: 16,
                          }}
                        >
                          {count}
                        </span>
                      )}
                      {active && (
                        <span
                          className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                          style={{ background: '#4a9eff' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'nodes' && <NodePanel onNewNode={handleNewNode} onEditNode={handleEditNode} />}
              {activePanel === 'links' && <LinkPanel />}
              {activePanel === 'path' && <LearningPathPanel />}
              {!activePanel && (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 p-8 text-center">
                  请选择一个面板
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <NodeModal />

      <style>{`
        @keyframes slide-right-in {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .tool-btn:hover {
          background: ${(p: any) => ''} !important;
        }
        button.tool-btn:hover:not(:disabled) {
          background: ${({ accent }: any) => ''};
          background-color: rgba(74, 158, 255, 0.12) !important;
        }
        button.tool-btn[style*="#4a9eff"]:hover {
          background-color: #3d8ce6 !important;
        }
        button.tool-btn:not([style*="background: #4a9eff"]):not(:disabled):hover {
          background-color: rgba(74, 158, 255, 0.1) !important;
          transform: translateY(-1px);
        }
        button.tool-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }
        button.tool-btn[style*="#e74c3c"]:not(:disabled):hover {
          background-color: rgba(231, 76, 60, 0.1) !important;
        }
        button.tool-btn[style*="#fff"]:not(:disabled):hover {
          background-color: #3d8ce6 !important;
        }
      `}</style>
    </div>
  );
}
