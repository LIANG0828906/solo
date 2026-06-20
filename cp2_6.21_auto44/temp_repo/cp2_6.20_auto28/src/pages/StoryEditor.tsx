import React, { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store';
import { useParams } from 'react-router-dom';
import EditorCanvas from '@/modules/editor/EditorCanvas';
import CharacterGraph from '@/modules/graph/CharacterGraph';
import { SimulatorPanel, VersionsPanel } from '@/modules/simulator/SimulatorPanel';
import wsService from '@/services/websocket';
import {
  Save, Undo, Redo, Play, Users, Link2, Clock, ChevronLeft,
  Wifi, WifiOff, FileText, Plus, Trash2, Pencil
} from 'lucide-react';
import type { RightPanelTab } from '@/types';

const TAB_CONFIG: { key: RightPanelTab; icon: typeof Link2; label: string; color: string }[] = [
  { key: 'graph', icon: Link2, label: '角色图谱', color: 'text-[#e94560]' },
  { key: 'simulator', icon: Play, label: '剧情模拟', color: 'text-[#f5c16c]' },
  { key: 'versions', icon: Clock, label: '版本历史', color: 'text-[#60a5fa]' },
];

export const StoryEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const store = useEditorStore();
  const [rightPanelCollapsed, setRightPanelCollapsed] = React.useState(false);
  const [showNodeEditor, setShowNodeEditor] = React.useState(false);

  useEffect(() => {
    if (id) {
      wsService.connect(id, (connected) => store.setWsConnected(connected));
      return () => wsService.disconnect();
    }
  }, [id, store]);

  useEffect(() => {
    const unsub = wsService.subscribe((msg) => {
      switch (msg.type) {
        case 'node:update':
          store.updateNode(msg.payload.id, msg.payload);
          break;
        case 'node:create':
          if (!store.nodes.some((n) => n.id === msg.payload.id)) {
            store.updateNode(msg.payload.id, msg.payload);
          }
          break;
        case 'node:delete':
          store.deleteNode(msg.payload.id);
          break;
        case 'edge:create':
          store.addEdge(msg.payload.sourceId, msg.payload.targetId, msg.payload.condition);
          break;
        case 'edge:update':
          store.updateEdge(msg.payload.id, msg.payload);
          break;
        case 'edge:delete':
          store.deleteEdge(msg.payload.id);
          break;
        case 'cursor:move':
          store.updateCollaborator(msg.payload);
          break;
        case 'character:update':
          store.updateCharacter(msg.payload.id, msg.payload);
          break;
        case 'character:create':
          store.updateCharacter(msg.payload.id, msg.payload);
          break;
        case 'relation:create':
          store.addRelation(msg.payload.sourceId, msg.payload.targetId, msg.payload.type);
          break;
        case 'relation:update':
          store.updateRelation(msg.payload.id, msg.payload.type);
          break;
      }
    });
    return unsub;
  }, [store]);

  const handleNodeClick = useCallback((nodeId: string) => {
    store.setSelectedNode(nodeId);
    setShowNodeEditor(true);
  }, [store]);

  const selectedNode = store.selectedNodeId
    ? store.nodes.find((n) => n.id === store.selectedNodeId)
    : null;

  const handleSave = () => {
    store.saveVersion();
  };

  const handleUndo = () => store.undo();
  const handleRedo = () => store.redo();

  const handleSimulate = () => {
    store.setRightPanelTab('simulator');
    if (store.simulationPath.length > 0) {
      store.resetSimulation();
    }
  };

  const ActivePanel = () => {
    switch (store.rightPanelTab) {
      case 'graph':
        return <CharacterGraph characters={store.characters} relations={store.relations} />;
      case 'simulator':
        return <SimulatorPanel />;
      case 'versions':
        return <VersionsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#16213e]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#e94560]" />
            <div>
              <h1 className="font-display text-base font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {store.storyTitle}
              </h1>
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                {store.wsConnected ? (
                  <>
                    <Wifi size={9} className="text-green-400" />
                    <span className="text-green-400">已连接</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={9} className="text-red-400" />
                    <span className="text-red-400">离线</span>
                  </>
                )}
                <span className="text-slate-700">|</span>
                <Users size={9} />
                <span>{store.collaborators.length + 1} 人协作中</span>
              </div>
            </div>
          </div>

          <div className="ml-4 flex items-center -space-x-1">
            <img
              src={store.currentUser.avatar}
              alt={store.currentUser.name}
              className="w-6 h-6 rounded-full border-2 z-20"
              style={{ borderColor: store.currentUser.color }}
              title={`${store.currentUser.name} (我)`}
            />
            {store.collaborators.slice(0, 2).map((c) => (
              <div
                key={c.userId}
                className="w-6 h-6 rounded-full border-2 z-10 animate-pulse"
                style={{
                  backgroundColor: c.color,
                  borderColor: '#16213e',
                }}
                title={c.userName}
              />
            ))}
            {store.collaborators.length > 2 && (
              <div className="w-6 h-6 rounded-full bg-[#0f3460] border-2 border-[#16213e] flex items-center justify-center text-[9px] text-slate-400 z-0">
                +{store.collaborators.length - 2}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={store.historyIndex <= 0}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="撤销 (Ctrl+Z)"
          >
            <Undo size={14} />
            <span className="hidden sm:inline">撤销</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={store.historyIndex >= store.history.length - 1}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="重做 (Ctrl+Y)"
          >
            <Redo size={14} />
            <span className="hidden sm:inline">重做</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={handleSimulate}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-[#f5c16c] to-[#e94560] text-white hover:shadow-lg hover:shadow-[#e94560]/20 transition-all"
          >
            <Play size={13} />
            <span className="hidden sm:inline">模拟剧情</span>
          </button>

          <button
            onClick={handleSave}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium btn-gradient text-white"
          >
            <Save size={13} />
            <span className="hidden sm:inline">保存版本</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute top-3 left-3 z-40 flex gap-1.5">
            <button
              onClick={() => store.addNode()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] bg-[#16213e]/90 border border-white/10 text-slate-300 hover:text-white hover:border-[#e94560]/50 backdrop-blur-sm transition-all"
            >
              <Plus size={12} />
              添加节点
            </button>
            <div className="px-2.5 py-1.5 rounded-lg text-[10px] bg-[#16213e]/90 border border-white/10 text-slate-500 backdrop-blur-sm">
              {store.nodes.length} 节点 · {store.edges.length} 连线
            </div>
          </div>

          <EditorCanvas
            wsConnected={store.wsConnected}
            onNodeClick={handleNodeClick}
          />
        </div>

        <div
          className={`flex-col border-l border-white/5 bg-[#16213e]/30 transition-all duration-300 hidden md:flex ${rightPanelCollapsed ? 'w-10' : 'w-[360px] xl:w-[380px]'}`}
        >
          {rightPanelCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-2 h-full">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setRightPanelCollapsed(false);
                    store.setRightPanelTab(tab.key);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${store.rightPanelTab === tab.key ? 'bg-white/10 ' + tab.color : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title={tab.label}
                >
                  <tab.icon size={16} />
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setRightPanelCollapsed(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex border-b border-white/5">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => store.setRightPanelTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition-all relative ${store.rightPanelTab === tab.key
                      ? tab.color + ' bg-white/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon size={12} />
                    <span className="hidden lg:inline">{tab.label}</span>
                    {store.rightPanelTab === tab.key && (
                      <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{
                        backgroundColor: tab.key === 'graph' ? '#e94560' : tab.key === 'simulator' ? '#f5c16c' : '#60a5fa',
                      }} />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setRightPanelCollapsed(true)}
                  className="px-2 text-slate-500 hover:text-white hover:bg-white/5 transition-all border-l border-white/5"
                  title="折叠面板"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {ActivePanel()}
              </div>
            </>
          )}
        </div>
      </div>

      {showNodeEditor && selectedNode && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowNodeEditor(false)}
        >
          <div
            className="bg-[#16213e] rounded-xl w-full max-w-lg card-shadow animate-float-up border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#0f3460]/50 to-transparent">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-[#e94560]" />
                <h3 className="font-display font-semibold text-white text-sm">编辑剧情节点</h3>
              </div>
              <button
                onClick={() => setShowNodeEditor(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[65vh] overflow-auto">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">节点标题</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => store.updateNode(selectedNode.id, { title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none transition-colors font-display"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">场景描述</label>
                <textarea
                  value={selectedNode.description}
                  onChange={(e) => store.updateNode(selectedNode.id, { description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-slate-400">角色对话 ({selectedNode.dialogues.length})</label>
                  <button
                    onClick={() => {
                      const firstChar = store.characters[0];
                      if (firstChar) {
                        store.addDialogue(selectedNode.id, firstChar.id, '');
                      }
                    }}
                    disabled={store.characters.length === 0}
                    className="flex items-center gap-1 text-[10px] text-[#e94560] hover:text-[#ff6b8a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={11} />
                    添加对话
                  </button>
                </div>
                {selectedNode.dialogues.length === 0 ? (
                  <div className="text-center py-4 text-[11px] text-slate-600 bg-[#1a1a2e]/50 rounded-lg border border-dashed border-white/5">
                    {store.characters.length === 0 ? '请先在角色图谱中添加角色' : '暂无对话，点击上方按钮添加'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedNode.dialogues.map((d, di) => (
                      <div key={d.id} className="flex gap-2 items-start">
                        <select
                          value={d.characterId}
                          onChange={(e) => {
                            const updated = [...selectedNode.dialogues];
                            updated[di] = { ...d, characterId: e.target.value };
                            store.updateNode(selectedNode.id, { dialogues: updated });
                          }}
                          className="shrink-0 w-24 px-2 py-1.5 text-[10px] rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none"
                        >
                          {store.characters.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <textarea
                          value={d.text}
                          onChange={(e) => {
                            const updated = [...selectedNode.dialogues];
                            updated[di] = { ...d, text: e.target.value };
                            store.updateNode(selectedNode.id, { dialogues: updated });
                          }}
                          rows={2}
                          placeholder="输入台词..."
                          className="flex-1 px-2.5 py-1.5 text-[11px] rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none resize-none leading-relaxed"
                        />
                        <button
                          onClick={() => {
                            const updated = selectedNode.dialogues.filter((_, i) => i !== di);
                            store.updateNode(selectedNode.id, { dialogues: updated });
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">分支条件设置</label>
                <div className="space-y-1.5">
                  {store.edges.filter(e => e.sourceId === selectedNode.id).map((edge) => {
                    const target = store.nodes.find(n => n.id === edge.targetId);
                    return (
                      <div key={edge.id} className="flex items-center gap-2 p-2 rounded bg-[#1a1a2e] border border-white/5">
                        <ChevronLeft size={12} className="text-[#e94560] rotate-180 shrink-0" />
                        <span className="text-[11px] text-white truncate flex-1 min-w-0">{target?.title}</span>
                        <select
                          value={edge.condition.type}
                          onChange={(e) => {
                            const newCond = e.target.value as 'read_node' | 'has_item';
                            store.updateEdge(edge.id, {
                              condition: { ...edge.condition, type: newCond }
                            });
                          }}
                          className="shrink-0 px-2 py-1 text-[10px] rounded bg-[#0f3460] border border-white/10 text-slate-300 outline-none"
                        >
                          <option value="read_node">阅读前置</option>
                          <option value="has_item">持有道具</option>
                        </select>
                        {edge.condition.type === 'has_item' && (
                          <input
                            type="text"
                            value={edge.condition.itemName || ''}
                            onChange={(e) => {
                              store.updateEdge(edge.id, {
                                condition: { ...edge.condition, itemName: e.target.value }
                              });
                            }}
                            placeholder="道具名"
                            className="shrink-0 w-20 px-2 py-1 text-[10px] rounded bg-[#0f3460] border border-white/10 text-white outline-none"
                          />
                        )}
                        <button
                          onClick={() => store.deleteEdge(edge.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                  {store.edges.filter(e => e.sourceId === selectedNode.id).length === 0 && (
                    <div className="text-center py-3 text-[10px] text-slate-600 bg-[#1a1a2e]/30 rounded border border-dashed border-white/5">
                      拖拽节点右侧圆点到其他节点创建分支
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/5 bg-[#1a1a2e]/50">
              <button
                onClick={() => {
                  store.deleteNode(selectedNode.id);
                  setShowNodeEditor(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={12} />
                删除节点
              </button>
              <button
                onClick={() => setShowNodeEditor(false)}
                className="px-4 py-1.5 rounded-lg text-[11px] btn-gradient text-white font-medium"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
