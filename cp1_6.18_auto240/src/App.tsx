import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import CanvasPanel from './components/CanvasPanel';
import NodeEditor from './components/NodeEditor';
import { useIdeaStore } from './stores/ideaStore';
import { IdeaNode, NODE_COLORS } from './types';
import './styles.css';

let userId = 'user_' + Math.random().toString(36).substr(2, 9);

function App() {
  const socketRef = useRef<Socket | null>(null);
  const {
    nodes,
    setNodes,
    addNode,
    updateNode,
    deleteNode,
    connectNodes,
    setEditingNode,
    searchQuery,
    setSearchQuery
  } = useIdeaStore();

  const [showEditor, setShowEditor] = useState(false);
  const [editingNode, setEditingNodeData] = useState<IdeaNode | null>(null);
  const [searchResults, setSearchResults] = useState<IdeaNode[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<IdeaNode[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('node:created', (node: IdeaNode) => {
      addNode(node);
    });

    socket.on('node:updated', (id: string, updates: Partial<IdeaNode>) => {
      useIdeaStore.getState().updateNode(id, updates);
    });

    socket.on('node:deleted', (id: string) => {
      useIdeaStore.getState().deleteNode(id);
    });

    socket.on('nodes:connected', (sourceId: string, targetId: string) => {
      useIdeaStore.getState().connectNodes(sourceId, targetId);
    });

    socket.on('node:editing', (nodeId: string | null, remoteUserId: string) => {
      if (remoteUserId !== userId) {
        setEditingNode(nodeId, remoteUserId);
      }
    });

    socket.on('nodes:imported', (importedNodes: IdeaNode[]) => {
      setNodes(importedNodes);
    });

    axios.get('/api/ideas').then((res) => {
      setNodes(res.data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.tags.some((t) => t.toLowerCase().includes(query))
    );
    setSearchResults(results);
  }, [searchQuery, nodes]);

  const handleCreateNode = useCallback(() => {
    const { canvas, getRandomColor } = useIdeaStore.getState();
    const centerX = (window.innerWidth / 2 - canvas.offsetX) / canvas.scale;
    const centerY = (window.innerHeight / 2 - 60 - canvas.offsetY) / canvas.scale;

    const newNode: IdeaNode = {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: '新灵感',
      description: '',
      color: getRandomColor(),
      tags: [],
      x: centerX,
      y: centerY,
      connectedIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    axios.post('/api/ideas', newNode).then((res) => {
      socketRef.current?.emit('node:create', res.data);
      setEditingNodeData(res.data);
      setShowEditor(true);
    });
  }, []);

  const handleNodeDoubleClick = useCallback((node: IdeaNode) => {
    setEditingNodeData(node);
    setShowEditor(true);
    socketRef.current?.emit('node:editing', node.id, userId);
  }, []);

  const handleSaveNode = useCallback(
    (nodeData: Partial<IdeaNode>) => {
      if (!editingNode) return;
      const updated = { ...editingNode, ...nodeData };
      axios.put(`/api/ideas/${editingNode.id}`, nodeData).then(() => {
        socketRef.current?.emit('node:update', editingNode.id, nodeData);
      });
      setEditingNodeData(updated);
    },
    [editingNode]
  );

  const handleCloseEditor = useCallback(() => {
    if (editingNode) {
      socketRef.current?.emit('node:editing', null, userId);
    }
    setShowEditor(false);
    setEditingNodeData(null);
  }, [editingNode]);

  const handleDeleteNode = useCallback(() => {
    if (!editingNode) return;
    axios.delete(`/api/ideas/${editingNode.id}`).then(() => {
      socketRef.current?.emit('node:delete', editingNode.id);
    });
    handleCloseEditor();
  }, [editingNode, handleCloseEditor]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(nodes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspiration-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (Array.isArray(data)) {
            setImportData(data);
            setShowImportConfirm(true);
          }
        } catch (err) {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    []
  );

  const confirmImport = useCallback(() => {
    if (!importData) return;
    axios.post('/api/ideas/batch', importData).then(() => {
      socketRef.current?.emit('nodes:import', importData);
    });
    setShowImportConfirm(false);
    setImportData(null);
  }, [importData]);

  const handleSearchResultClick = useCallback((node: IdeaNode) => {
    const { canvas, setCanvas } = useIdeaStore.getState();
    const targetX = window.innerWidth / 2 - node.x * canvas.scale;
    const targetY = (window.innerHeight - 60) / 2 - node.y * canvas.scale;
    setCanvas({ offsetX: targetX, offsetY: targetY });
    setSearchQuery('');
  }, []);

  return (
    <div className="app">
      <div className="header">
        <div className="app-title">灵感速写</div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="搜索灵感标题或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(node)}
                >
                  <div
                    className="search-result-dot"
                    style={{ backgroundColor: node.color }}
                  />
                  <div className="search-result-content">
                    <div className="search-result-title">{node.title}</div>
                    <div className="search-result-tags">
                      {node.tags.map((tag, idx) => (
                        <span key={idx} className="search-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="导入" onClick={handleImportClick}>
            ↑
          </button>
          <button className="icon-btn" title="导出" onClick={handleExport}>
            ↓
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <CanvasPanel
        onNodeDoubleClick={handleNodeDoubleClick}
        userId={userId}
        socketRef={socketRef}
      />

      <button className="floating-btn" onClick={handleCreateNode}>
        +
      </button>

      {showEditor && editingNode && (
        <NodeEditor
          node={editingNode}
          onSave={handleSaveNode}
          onClose={handleCloseEditor}
          onDelete={handleDeleteNode}
        />
      )}

      {showImportConfirm && (
        <div className="modal-overlay" onClick={() => setShowImportConfirm(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认导入</div>
            <div className="modal-content">
              导入将覆盖当前画布内容，是否继续？
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowImportConfirm(false)}
              >
                取消
              </button>
              <button className="modal-btn confirm" onClick={confirmImport}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
