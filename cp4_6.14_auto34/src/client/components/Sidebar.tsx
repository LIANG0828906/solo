import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import type { NodeType, Snapshot } from '../../types';
import { COLOR_PALETTE, NODE_DEFAULTS } from '../../types';
import { useFlowStore } from '../store/useFlowStore';
import { wsClient } from '../utils/websocket';
import { Square, Diamond, Circle, Type, Settings, History, Share2, Download, Trash2, Copy, Check, Clock, User } from 'lucide-react';

interface SidebarProps {
  roomId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

type TabType = 'tools' | 'properties' | 'history' | 'share';

const nodeTypes: { type: NodeType; name: string; icon: React.ReactNode }[] = [
  { type: 'rectangle', name: '矩形', icon: <Square size={24} /> },
  { type: 'diamond', name: '菱形', icon: <Diamond size={24} /> },
  { type: 'circle', name: '圆形', icon: <Circle size={24} /> },
  { type: 'text', name: '文本', icon: <Type size={24} /> },
];

const tabs: { id: TabType; name: string; icon: React.ReactNode }[] = [
  { id: 'tools', name: '工具', icon: <Square size={18} /> },
  { id: 'properties', name: '属性', icon: <Settings size={18} /> },
  { id: 'history', name: '历史', icon: <History size={18} /> },
  { id: 'share', name: '分享', icon: <Share2 size={18} /> },
];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const Sidebar: React.FC<SidebarProps> = ({ roomId, canvasRef }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    nodes,
    edges,
    users,
    selectedNodeId,
    selectedEdgeId,
    snapshots,
    isReadOnly,
    updateNode,
    updateEdge,
    deleteNode,
    setSnapshots,
    setNodes,
    setEdges,
    setIsRestoreAnimating,
  } = useFlowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (roomId && !isReadOnly) {
      axios.get(`/api/snapshots/${roomId}`).then((res) => {
        setSnapshots(res.data);
      }).catch(console.error);
    }
  }, [roomId, isReadOnly, setSnapshots]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleNodePropertyChange = (field: string, value: string) => {
    if (!selectedNodeId || isReadOnly) return;
    
    const updates: any = { [field]: value };
    updateNode(selectedNodeId, updates);
    
    if (wsClient.isConnected()) {
      wsClient.updateNode(selectedNodeId, updates);
    }
  };

  const handleEdgeLabelChange = (label: string) => {
    if (!selectedEdgeId || isReadOnly) return;
    
    updateEdge(selectedEdgeId, { label });
    
    if (wsClient.isConnected()) {
      wsClient.updateEdge(selectedEdgeId, { label });
    }
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId || isReadOnly) return;
    if (wsClient.isConnected()) {
      wsClient.deleteNode(selectedNodeId);
    }
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    progressIntervalRef.current = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#2a2a3e',
        scale: 2,
        useCORS: true,
      });
      
      setExportProgress(100);
      
      const link = document.createElement('a');
      link.download = `flowchart-${roomId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    }
  };

  const handleGenerateShareCode = async () => {
    if (isReadOnly) return;
    try {
      const res = await axios.post(`/api/share/${roomId}`);
      setShareCode(res.data.shareCode);
    } catch (error) {
      console.error('Failed to generate share code:', error);
    }
  };

  const handleCopyShareLink = () => {
    if (!shareCode) return;
    const link = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePreviewSnapshot = (snapshot: Snapshot) => {
    setPreviewSnapshot(snapshot);
    setIsRestoreAnimating(true);
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setTimeout(() => setIsRestoreAnimating(false), 300);
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (isReadOnly) return;
    try {
      await axios.post(`/api/snapshots/${roomId}/restore`, { snapshotId });
      setPreviewSnapshot(null);
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
    }
  };

  const handleClosePreview = () => {
    if (previewSnapshot && wsClient.isConnected()) {
      setIsRestoreAnimating(true);
      wsClient.send({ type: 'join', roomId, userId: uuidv4(), userName: 'reload' });
      setTimeout(() => setIsRestoreAnimating(false), 300);
    }
    setPreviewSnapshot(null);
  };

  const filteredNodeTypes = nodeTypes.filter((nt) =>
    nt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderToolsTab = () => (
    <div className="p-4 space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-tertiary text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {filteredNodeTypes.map((nt) => (
          <div
            key={nt.type}
            draggable={!isReadOnly}
            onDragStart={(e) => handleDragStart(e, nt.type)}
            className={`bg-bg-tertiary rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${
              isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-grab hover:bg-bg-tertiary/80 hover:scale-105 active:cursor-grabbing'
            }`}
          >
            <div className="text-white">{nt.icon}</div>
            <span className="text-white text-sm font-medium">{nt.name}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-white text-sm font-medium mb-3">16色调色板</h4>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded border-2 border-transparent hover:border-white transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-white text-sm font-medium mb-3">在线用户 ({users.length})</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 text-white text-sm">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPropertiesTab = () => (
    <div className="p-4 space-y-4">
      {selectedNode ? (
        <div className="space-y-4">
          <h3 className="text-white font-medium text-lg">节点属性</h3>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">类型</label>
            <input
              type="text"
              value={selectedNode.type}
              disabled
              className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">标题</label>
            <input
              type="text"
              value={selectedNode.title}
              onChange={(e) => handleNodePropertyChange('title', e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue disabled:opacity-50"
              placeholder="输入节点标题"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">描述</label>
            <textarea
              value={selectedNode.description}
              onChange={(e) => handleNodePropertyChange('description', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none disabled:opacity-50"
              placeholder="输入节点描述"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">颜色</label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleNodePropertyChange('color', color)}
                  disabled={isReadOnly}
                  className={`w-7 h-7 rounded border-2 transition-all ${
                    selectedNode.color === color ? 'border-white scale-110' : 'border-transparent hover:border-gray-400'
                  } disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">尺寸</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={selectedNode.width}
                  onChange={(e) => handleNodePropertyChange('width', Number(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue disabled:opacity-50"
                />
                <span className="text-gray-500 text-xs">宽度</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={selectedNode.height}
                  onChange={(e) => handleNodePropertyChange('height', Number(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue disabled:opacity-50"
                />
                <span className="text-gray-500 text-xs">高度</span>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <button
              onClick={handleDeleteNode}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={16} />
              删除节点
            </button>
          )}
        </div>
      ) : selectedEdge ? (
        <div className="space-y-4">
          <h3 className="text-white font-medium text-lg">连线属性</h3>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">标签</label>
            <input
              type="text"
              value={selectedEdge.label || ''}
              onChange={(e) => handleEdgeLabelChange(e.target.value)}
              disabled={isReadOnly}
              className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue disabled:opacity-50"
              placeholder="双击连线编辑标签"
            />
          </div>

          <div className="text-gray-400 text-sm space-y-1">
            <p>起点: {selectedEdge.sourceId.slice(0, 8)}...</p>
            <p>终点: {selectedEdge.targetId.slice(0, 8)}...</p>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-8">
          <Settings size={48} className="mx-auto mb-3 opacity-50" />
          <p>选择节点或连线查看属性</p>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="p-4">
      <h3 className="text-white font-medium text-lg mb-4">版本历史</h3>
      
      {previewSnapshot && (
        <div className="bg-accent-blue/20 border border-accent-blue rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">预览模式</span>
            <button
              onClick={handleClosePreview}
              className="text-white text-xs hover:underline"
            >
              关闭预览
            </button>
          </div>
          <button
            onClick={() => handleRestoreSnapshot(previewSnapshot.id)}
            disabled={isReadOnly}
            className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            恢复此版本
          </button>
        </div>
      )}

      {snapshots.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <Clock size={48} className="mx-auto mb-3 opacity-50" />
          <p>暂无版本记录</p>
          <p className="text-xs mt-1">停止编辑10秒后自动生成快照</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className={`bg-bg-tertiary rounded-lg p-3 cursor-pointer transition-all hover:bg-bg-tertiary/80 ${
                previewSnapshot?.id === snapshot.id ? 'ring-2 ring-accent-blue' : ''
              }`}
              onClick={() => handlePreviewSnapshot(snapshot)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-white text-sm">{snapshot.createdBy.slice(0, 8)}</span>
                </div>
                <span className="text-gray-400 text-xs">{formatTime(snapshot.createdAt)}</span>
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {snapshot.nodes.length} 个节点 · {snapshot.edges.length} 条连线
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderShareTab = () => (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-white font-medium text-lg mb-3">导出图片</h3>
        <button
          onClick={handleExportPNG}
          disabled={isExporting || isReadOnly}
          className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Download size={20} className="animate-spin" />
              导出中 {exportProgress}%
            </>
          ) : (
            <>
              <Download size={20} />
              导出为 PNG
            </>
          )}
        </button>
        
        {isExporting && (
          <div className="mt-3 bg-bg-tertiary rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent-blue h-full transition-all duration-200"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-white font-medium text-lg mb-3">分享流程图</h3>
        
        {!shareCode ? (
          <button
            onClick={handleGenerateShareCode}
            disabled={isReadOnly}
            className="w-full bg-accent-green hover:bg-accent-green/80 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={20} />
            生成分享链接
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">分享码</div>
              <div className="text-white font-mono text-lg tracking-wider">{shareCode}</div>
            </div>
            
            <button
              onClick={handleCopyShareLink}
              className="w-full bg-bg-tertiary hover:bg-bg-tertiary/80 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-accent-green" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={16} />
                  复制链接
                </>
              )}
            </button>
            
            <p className="text-gray-400 text-xs">
              其他用户访问 <span className="text-white">/share/{shareCode}</span> 或输入分享码即可查看
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tools':
        return renderToolsTab();
      case 'properties':
        return renderPropertiesTab();
      case 'history':
        return renderHistoryTab();
      case 'share':
        return renderShareTab();
      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-gray-700 flex justify-around py-2 z-40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileDrawerOpen(true);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === tab.id ? 'text-accent-blue' : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-xs">{tab.name}</span>
            </button>
          ))}
        </div>

        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-bg-primary rounded-t-2xl max-h-[70vh] overflow-hidden"
              style={{
                animation: 'slideUp 300ms ease',
              }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-medium">{tabs.find((t) => t.id === activeTab)?.name}</h3>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {renderTabContent()}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:flex flex-col h-full bg-bg-primary">
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id ? 'text-accent-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.name}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
              )}
            </button>
          ))}
        </div>
        
        <div
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{
            transform: `translateX(-${tabs.findIndex((t) => t.id === activeTab) * 100}%)`,
            opacity: 1,
          }}
        >
          <div
            className="w-full"
            style={{
              transform: `translateX(${tabs.findIndex((t) => t.id === activeTab) * 100}%)`,
            }}
          >
            {renderTabContent()}
          </div>
        </div>
      </div>

      <div className="w-[300px] hidden md:block">
        <div className="flex flex-col h-full bg-bg-primary">
          <div className="flex border-b border-gray-700">
            {tabs.slice(1).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.id ? 'text-accent-blue' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
                )}
              </button>
            ))}
          </div>
          
          <div
            className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
            style={{
              transform: `translateX(${activeTab === 'properties' ? '0' : activeTab === 'history' ? '-100%' : '-200%'})`,
            }}
          >
            <div
              className="w-full"
              style={{
                transform: `translateX(${activeTab === 'properties' ? '0' : activeTab === 'history' ? '100%' : '200%'})`,
              }}
            >
              {activeTab !== 'tools' && renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
