import React, { useState, useMemo } from 'react';
import { useEditorStore } from '@/store';
import type { StoryNode } from '@/types';
import { Play, RefreshCw, Shuffle, ChevronRight, FileText, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const SimulatorPanel: React.FC = () => {
  const store = useEditorStore();
  const [startNodeId, setStartNodeId] = useState<string>('');

  const currentNode: StoryNode | null = useMemo(() => {
    if (!store.simulationCurrentNodeId) return null;
    return store.nodes.find(n => n.id === store.simulationCurrentNodeId) || null;
  }, [store.simulationCurrentNodeId, store.nodes]);

  const outgoingChoices = useMemo(() => {
    if (!store.simulationCurrentNodeId) return [];
    return store.edges.filter(e => e.sourceId === store.simulationCurrentNodeId);
  }, [store.simulationCurrentNodeId, store.edges]);

  const handleStart = () => {
    const nodeId = startNodeId || store.nodes[0]?.id;
    if (!nodeId) return;
    store.startSimulation(nodeId);
  };

  const handleAutoSimulate = () => {
    const nodeId = startNodeId || store.nodes[0]?.id;
    if (!nodeId) return;
    store.autoSimulate(nodeId);
  };

  const pathNodes = useMemo(() => {
    return store.simulationPath
      .map(id => store.nodes.find(n => n.id === id))
      .filter(Boolean) as StoryNode[];
  }, [store.simulationPath, store.nodes]);

  const startNodes = useMemo(() => {
    const hasIncoming = new Set(store.edges.map(e => e.targetId));
    return store.nodes.filter(n => !hasIncoming.has(n.id));
  }, [store.nodes, store.edges]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-[#f5c16c]" />
          <h3 className="font-display text-sm font-semibold text-white">剧情模拟器</h3>
        </div>
        {store.simulationResult && (
          <button
            onClick={store.resetSimulation}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={11} />
            重置
          </button>
        )}
      </div>

      {!store.simulationRunning && !store.simulationResult && (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block">
              选择起始节点
            </label>
            <select
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none transition-colors"
            >
              {startNodes.length > 0 && (
                <option value="" disabled>-- 建议起始节点 --</option>
              )}
              {startNodes.map((n) => (
                <option key={`start-${n.id}`} value={n.id}>⭐ {n.title}</option>
              ))}
              <option value="" disabled>-- 全部节点 --</option>
              {store.nodes.map((n) => (
                <option key={`all-${n.id}`} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={store.nodes.length === 0}
              className="w-full py-2.5 text-xs rounded btn-gradient text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={14} />
              手动模拟（逐步选择）
            </button>
            <button
              onClick={handleAutoSimulate}
              disabled={store.nodes.length === 0}
              className="w-full py-2.5 text-xs rounded bg-gradient-to-r from-[#f5c16c] to-[#e94560] text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#e94560]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle size={14} />
              自动模拟（随机分支）
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <h4 className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles size={11} />
              模拟器使用说明
            </h4>
            <ul className="text-[10px] text-slate-500 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#e94560] shrink-0">•</span>
                <span>选择起始节点后，点击开始模拟剧情走向</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#f5c16c] shrink-0">•</span>
                <span>手动模式：每到达一个节点，手动选择分支推进</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#4ade80] shrink-0">•</span>
                <span>自动模式：系统随机选择分支直到剧情结束</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400 shrink-0">•</span>
                <span>模拟完成后，画布上会高亮显示走过的路径</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {store.simulationRunning && currentNode && (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
          <div className="p-3 rounded-lg border-2 bg-[#16213e]/50 animate-pulse-gold border-[#f5c16c]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#f5c16c]" />
              <span className="text-[11px] text-[#f5c16c] font-medium">当前节点</span>
            </div>
            <h4 className="font-display font-semibold text-white mb-2">{currentNode.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{currentNode.description}</p>
          </div>

          {currentNode.dialogues.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <FileText size={11} />
                场景对话
              </h5>
              {currentNode.dialogues.map((d, i) => {
                const char = store.characters.find(c => c.id === d.characterId);
                return (
                  <div key={d.id} className="p-2.5 rounded bg-[#1a1a2e] border border-white/5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <img src={char?.avatar} alt="" className="w-5 h-5 rounded-full border" style={{ borderColor: char?.color }} />
                      <span className="text-[10px] font-medium" style={{ color: char?.color || '#e2e8f0' }}>
                        {char?.name || '未知角色'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-6.5 ml-6">{d.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto space-y-2">
            <h5 className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ChevronRight size={11} />
              选择下一个分支
            </h5>
            {outgoingChoices.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 bg-[#1a1a2e]/50 rounded border border-white/5">
                🏁 本节点没有后续分支，剧情结束
              </div>
            ) : (
              <div className="space-y-2">
                {outgoingChoices.map((edge) => {
                  const targetNode = store.nodes.find(n => n.id === edge.targetId);
                  const condText = edge.condition.type === 'has_item'
                    ? edge.condition.itemName || '特殊道具'
                    : '阅读前置';
                  return (
                    <button
                      key={edge.id}
                      onClick={() => store.advanceSimulation(edge.id)}
                      className="w-full p-3 text-left rounded bg-[#1a1a2e] border border-white/10 hover:border-[#e94560]/50 hover:bg-[#0f3460]/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-[#e94560] group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-xs font-medium text-white">{targetNode?.title || '未知节点'}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0f3460] text-slate-400">
                          {condText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <Clock size={11} />
              已推进 {store.simulationPath.length} 个节点
            </div>
          </div>
        </div>
      )}

      {store.simulationResult && (
        <div className="flex-1 flex flex-col overflow-auto">
          {pathNodes.length > 0 && (
            <div className="px-4 pt-4">
              <div className="rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/5 overflow-hidden">
                <div className="px-3 py-2 border-b border-[#4ade80]/20 flex items-center gap-2 bg-[#4ade80]/5">
                  <CheckCircle2 size={14} className="text-[#4ade80]" />
                  <span className="text-[11px] font-medium text-[#4ade80]">模拟完成</span>
                </div>
                <div className="p-3 space-y-2 max-h-40 overflow-auto">
                  {pathNodes.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#4ade80] flex items-center justify-center text-[9px] font-bold text-[#1a1a2e] shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 text-[11px] text-slate-300 truncate">{node.title}</div>
                      {i < pathNodes.length - 1 && (
                        <ChevronRight size={12} className="text-[#4ade80]/50 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-4 flex flex-col space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#0f3460]/30 to-[#16213e] border border-white/5 animate-float-up card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#f5c16c]" />
                <h4 className="font-display text-sm font-semibold text-white">剧情摘要</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {store.simulationResult.summary}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">经过节点</div>
                  <div className="text-xl font-display font-bold text-white">{store.simulationResult.path.length}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">关键选择</div>
                  <div className="text-xl font-display font-bold text-[#f5c16c]">{store.simulationResult.choices.length}</div>
                </div>
              </div>
            </div>

            {store.simulationResult.choices.length > 0 && (
              <div>
                <h5 className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText size={11} />
                  关键选择记录
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-auto">
                  {store.simulationResult.choices.map((c, i) => {
                    const node = store.nodes.find(n => n.id === c.nodeId);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1a1a2e] border border-white/5 animate-fade-in"
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className="w-4 h-4 rounded bg-[#e94560]/20 flex items-center justify-center text-[9px] text-[#e94560] font-bold shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">{node?.title}</span>
                        <ChevronRight size={10} className="text-slate-600 shrink-0" />
                        <span className="text-[10px] text-white flex-1 truncate">{c.choice}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {store.versions.length > 0 && store.rightPanelTab === 'versions' && null}
    </div>
  );
};

export const VersionsPanel: React.FC = () => {
  const store = useEditorStore();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const handleVersionClick = (versionId: string) => {
    const newSelected = selectedVersion === versionId ? null : versionId;
    setSelectedVersion(newSelected);
    store.setComparingVersion(newSelected);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#60a5fa]" />
          <h3 className="font-display text-sm font-semibold text-white">版本历史</h3>
        </div>
        <button
          onClick={store.saveVersion}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] btn-gradient text-white"
        >
          <FileText size={11} />
          保存快照
        </button>
      </div>

      {store.comparingVersionId && (
        <div className="px-3 py-2 bg-[#60a5fa]/10 border-b border-[#60a5fa]/20 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#60a5fa]">
              📊 正在对比版本 V{store.versions.find(v => v.id === store.comparingVersionId)?.version}
            </span>
            <button
              onClick={() => {
                store.setComparingVersion(null);
                setSelectedVersion(null);
              }}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              取消对比
            </button>
          </div>
          {store.versionDiff && (
            <div className="flex gap-3 mt-2 text-[9px]">
              <span className="text-green-400">+{store.versionDiff.addedNodes.length} 新增</span>
              <span className="text-red-400">-{store.versionDiff.removedNodes.length} 删除</span>
              <span className="text-yellow-400">~{store.versionDiff.modifiedNodes.length} 修改</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {[...store.versions].reverse().map((version, index, arr) => {
          const isCurrent = index === 0;
          const isSelected = selectedVersion === version.id;

          return (
            <div key={version.id} className="relative pl-6">
              {index < arr.length - 1 && (
                <div
                  className="absolute left-2 top-10 bottom-[-12px] w-px bg-gradient-to-b from-[#60a5fa]/50 to-transparent"
                />
              )}

              <div
                className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 bg-[#1a1a2e] flex items-center justify-center z-10 ${isCurrent ? 'border-[#60a5fa]' : 'border-white/20'}`}
              >
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />}
              </div>

              <div
                onClick={() => !isCurrent && handleVersionClick(version.id)}
                className={`rounded-lg p-3 transition-all cursor-pointer border ${isSelected
                  ? 'bg-[#60a5fa]/10 border-[#60a5fa]/40'
                  : isCurrent
                    ? 'bg-[#16213e] border-white/10'
                    : 'bg-[#1a1a2e]/50 border-white/5 hover:bg-[#16213e] hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-display font-bold text-sm ${isCurrent ? 'text-[#60a5fa]' : 'text-white'}`}>
                      V{version.version}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#60a5fa]/20 text-[#60a5fa] font-medium shrink-0">
                        当前
                      </span>
                    )}
                  </div>
                  <img
                    src={version.creator.avatar}
                    alt={version.creator.name}
                    className="w-5 h-5 rounded-full border shrink-0"
                    style={{ borderColor: version.creator.color }}
                    title={version.creator.name}
                  />
                </div>

                <div className="text-[10px] text-slate-500 mb-2">
                  {formatDistance(version.createdAt, Date.now(), { locale: zhCN, addSuffix: true })}
                </div>

                <div className="flex gap-2 text-[9px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <FileText size={9} />
                    {version.nodes.length} 节点
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ChevronRight size={9} />
                    {version.edges.length} 连线
                  </span>
                  <span className="flex items-center gap-0.5">
                    <UserPlus size={9} />
                    {version.characters.length} 角色
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {store.versions.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p>暂无版本历史</p>
            <p className="mt-1 text-[10px]">保存或模拟后自动生成快照</p>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-dashed border-green-400" />
            <span className="text-slate-500">新增</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-dashed border-red-400 opacity-50" />
            <span className="text-slate-500">删除</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded animate-blink-yellow border border-yellow-400/30" />
            <span className="text-slate-500">修改</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorPanel;
