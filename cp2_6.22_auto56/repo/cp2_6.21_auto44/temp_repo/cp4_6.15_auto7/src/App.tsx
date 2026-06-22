import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { Network, Plus, Download, Upload, Layers, Brain } from 'lucide-react';
import { GraphCanvas } from './modules/graph/GraphCanvas';
import { NodeEditor } from './modules/graph/NodeEditor';
import { SearchFilter } from './modules/data/SearchFilter';
import {
  GraphNode,
  GraphEdge,
  LayoutType,
  dataManager,
  getRandomColor,
} from './modules/data/DataManager';
import './styles.css';

interface GraphContextType {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filteredNodeIds: Set<string>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  addNode: (position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  updateEdge: (id: string, updates: Partial<GraphEdge>) => void;
  deleteEdge: (id: string) => void;
  updateNodePositions: (nodes: GraphNode[]) => void;
  applyLayout: (layoutType: LayoutType) => void;
  exportGraph: () => void;
  importGraph: (file: File) => Promise<boolean>;
  setFilter: (searchQuery: string, selectedColors: string[]) => void;
}

const GraphContext = createContext<GraphContextType | null>(null);

export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within GraphProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('force');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = () => {
      const data = dataManager.getData();
      setNodes(data.nodes);
      setEdges(data.edges);
      setIsLoading(false);
    };

    loadData();

    const unsubscribe = dataManager.subscribe(() => {
      const data = dataManager.getData();
      setNodes(data.nodes);
      setEdges(data.edges);
    });

    return unsubscribe;
  }, []);

  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const hasFilter = searchQuery.trim() || selectedColors.length > 0;

    if (!hasFilter) {
      return ids;
    }

    const query = searchQuery.toLowerCase().trim();

    nodes.forEach((node) => {
      const matchesSearch = !query
        ? true
        : node.title.toLowerCase().includes(query) ||
          node.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesColor = selectedColors.length === 0 || selectedColors.includes(node.color);

      if (matchesSearch && matchesColor) {
        ids.add(node.id);
      }
    });

    return ids;
  }, [nodes, searchQuery, selectedColors]);

  const addNode = useCallback((position: { x: number; y: number }) => {
    const color = getRandomColor();
    dataManager.addNode({
      title: '新节点',
      content: '',
      color,
      tags: [],
      position,
    });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<GraphNode>) => {
    dataManager.updateNode(id, updates);
  }, []);

  const deleteNode = useCallback((id: string) => {
    dataManager.deleteNode(id);
  }, []);

  const addEdge = useCallback((source: string, target: string) => {
    if (source === target) return;
    dataManager.addEdge({
      source,
      target,
      label: '相关',
    });
  }, []);

  const updateEdge = useCallback((id: string, updates: Partial<GraphEdge>) => {
    dataManager.updateEdge(id, updates);
  }, []);

  const deleteEdge = useCallback((id: string) => {
    dataManager.deleteEdge(id);
  }, []);

  const updateNodePositions = useCallback((updatedNodes: GraphNode[]) => {
    updatedNodes.forEach((node) => {
      dataManager.updateNode(node.id, { position: node.position });
    });
  }, []);

  const applyLayout = useCallback((type: LayoutType) => {
    dataManager.applyLayout(type);
  }, []);

  const exportGraph = useCallback(() => {
    dataManager.downloadJSON();
  }, []);

  const importGraph = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = dataManager.importFromJSON(content);
        if (success) {
          setTimeout(() => {
            dataManager.applyLayout(layoutType);
          }, 100);
        }
        resolve(success);
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, [layoutType]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const success = await importGraph(file);
        if (!success) {
          alert('导入失败，请检查文件格式');
        }
      }
      e.target.value = '';
    },
    [importGraph]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    deleteNode(nodeId);
    setSelectedNodeId(null);
  }, [deleteNode]);

  const handleEdgeLabelEdit = useCallback(
    (edgeId: string, label: string) => {
      updateEdge(edgeId, { label });
    },
    [updateEdge]
  );

  const handleFilterChange = useCallback((query: string, colors: string[]) => {
    setSearchQuery(query);
    setSelectedColors(colors);
  }, []);

  const handleLayoutChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value as LayoutType;
      setLayoutType(type);
      applyLayout(type);
    },
    [applyLayout]
  );

  const contextValue = useMemo(
    () => ({
      nodes,
      edges,
      filteredNodeIds,
      selectedNodeId,
      setSelectedNodeId,
      addNode,
      updateNode,
      deleteNode,
      addEdge,
      updateEdge,
      deleteEdge,
      updateNodePositions,
      applyLayout,
      exportGraph,
      importGraph,
      setFilter: handleFilterChange,
    }),
    [
      nodes,
      edges,
      filteredNodeIds,
      selectedNodeId,
      addNode,
      updateNode,
      deleteNode,
      addEdge,
      updateEdge,
      deleteEdge,
      updateNodePositions,
      applyLayout,
      exportGraph,
      importGraph,
      handleFilterChange,
    ]
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Brain size={48} style={{ marginBottom: 16, color: 'var(--accent-blue)' }} />
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <GraphContext.Provider value={contextValue}>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Network size={24} style={{ color: 'var(--accent-blue)' }} />
            <span>知识图谱</span>
          </div>

          <SearchFilter onFilterChange={handleFilterChange} />

          <div className="sidebar-section">
            <div className="section-title">操作</div>
            <button className="btn" onClick={() => addNode({ x: 0, y: 0 })}>
              <Plus size={16} />
              <span className="btn-text">新建节点</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-title">布局</div>
            <select
              className="select-input"
              value={layoutType}
              onChange={handleLayoutChange}
            >
              <option value="force">力导向布局</option>
              <option value="hierarchical">分层布局</option>
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => applyLayout(layoutType)}
            >
              <Layers size={16} />
              <span className="btn-text">重新布局</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-title">数据</div>
            <button className="btn btn-secondary" onClick={exportGraph}>
              <Download size={16} />
              <span className="btn-text">导出图谱</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              id="import-file"
            />
            <label htmlFor="import-file" className="file-label">
              <Upload size={16} />
              <span className="btn-text">导入图谱</span>
            </label>
          </div>

          <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}
            >
              节点: {nodes.length} | 连线: {edges.length}
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, position: 'relative' }}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            filteredNodeIds={filteredNodeIds}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            onNodeDelete={handleNodeDelete}
            onEdgeDelete={deleteEdge}
            onEdgeLabelEdit={handleEdgeLabelEdit}
            onAddNode={addNode}
            onNodesChange={updateNodePositions}
            onAddEdge={addEdge}
          />

          {nodes.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Brain size={64} />
              </div>
              <div className="empty-state-text">开始构建你的知识图谱</div>
              <div className="empty-state-hint">双击画布空白处创建新节点</div>
            </div>
          )}
        </main>

        <NodeEditor
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          onDelete={handleNodeDelete}
        />
      </div>
    </GraphContext.Provider>
  );
};

export default App;
