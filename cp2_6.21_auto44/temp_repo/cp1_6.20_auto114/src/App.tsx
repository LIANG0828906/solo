import React, { useState, useEffect, useCallback, useRef } from 'react';
import NetworkGraph from './components/NetworkGraph';
import NoteEditor from './components/NoteEditor';
import CreateNodeModal from './components/CreateNodeModal';
import { NodeData, RelationData, TAGS, TAG_COLORS, RELATION_TYPES } from './types';
import {
  fetchNodes,
  fetchRelations,
  createNode,
  updateNode,
  deleteNode,
  createRelation,
  deleteRelation
} from './utils/dataManager';
import './styles/global.css';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [relations, setRelations] = useState<RelationData[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isInitialized = useRef(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const loadData = useCallback(async () => {
    try {
      const [nodesData, relationsData] = await Promise.all([
        fetchNodes(),
        fetchRelations()
      ]);
      setNodes(nodesData);
      setRelations(relationsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      loadData();
      isInitialized.current = true;
    }
  }, [loadData]);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsEditing(false);
  }, []);

  const handleBackgroundDoubleClick = useCallback((x: number, y: number) => {
    setNewNodePosition({ x, y });
    setShowCreateModal(true);
  }, []);

  const handleCreateNode = useCallback(async (title: string, tags: string[]) => {
    try {
      const newNode = await createNode({ title, tags, content: '' });
      setNodes(prev => [...prev, newNode]);
      setShowCreateModal(false);
      setSelectedNodeId(newNode.id);
      setIsEditing(true);
      showNotification('笔记已创建，点击其他节点可建立关联');
    } catch (error) {
      console.error('创建节点失败:', error);
      showNotification('创建失败');
    }
  }, [showNotification]);

  const handleSaveNode = useCallback(async (data: Partial<NodeData>) => {
    if (!selectedNodeId) return;
    try {
      const updated = await updateNode(selectedNodeId, data);
      setNodes(prev => prev.map(n => n.id === selectedNodeId ? updated : n));
      setIsEditing(false);
      showNotification('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      showNotification('保存失败');
    }
  }, [selectedNodeId, showNotification]);

  const handleDeleteNode = useCallback(async () => {
    if (!selectedNodeId) return;
    if (!window.confirm('确定要删除这个笔记吗？')) return;
    try {
      await deleteNode(selectedNodeId);
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      setRelations(prev => prev.filter(r => r.source !== selectedNodeId && r.target !== selectedNodeId));
      setSelectedNodeId(null);
      showNotification('已删除');
    } catch (error) {
      console.error('删除失败:', error);
      showNotification('删除失败');
    }
  }, [selectedNodeId, showNotification]);

  const handleAddRelation = useCallback(async (targetId: string, type: string) => {
    if (!selectedNodeId) return;
    try {
      const newRelation = await createRelation({
        source: selectedNodeId,
        target: targetId,
        type
      });
      setRelations(prev => [...prev, newRelation]);
      showNotification('关系已添加');
    } catch (error: any) {
      console.error('添加关系失败:', error);
      showNotification(error?.error || '添加失败');
    }
  }, [selectedNodeId, showNotification]);

  const handleDeleteRelation = useCallback(async (relationId: string) => {
    try {
      await deleteRelation(relationId);
      setRelations(prev => prev.filter(r => r.id !== relationId));
      showNotification('关系已删除');
    } catch (error) {
      console.error('删除关系失败:', error);
      showNotification('删除失败');
    }
  }, [showNotification]);

  const handleCreateRelationFromGraph = useCallback(async (sourceId: string, targetId: string) => {
    const type = RELATION_TYPES[0];
    try {
      const exists = relations.some(
        r => (r.source === sourceId && r.target === targetId) ||
             (r.source === targetId && r.target === sourceId)
      );
      if (exists) {
        showNotification('关系已存在');
        return;
      }
      const newRelation = await createRelation({ source: sourceId, target: targetId, type });
      setRelations(prev => [...prev, newRelation]);
      showNotification('关系已创建');
    } catch (error: any) {
      console.error('创建关系失败:', error);
      showNotification(error?.error || '创建失败');
    }
  }, [relations, showNotification]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🧠</span>
          <span style={styles.logoText}>知识图谱笔记</span>
        </div>
        <div style={styles.stats}>
          <span style={styles.statItem}>📊 {nodes.length} 节点</span>
          <span style={styles.statItem}>🔗 {relations.length} 关系</span>
        </div>
      </div>

      <div style={{
        ...styles.mainContent,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{
          ...styles.graphContainer,
          height: isMobile ? '50%' : '100%',
          width: isMobile ? '100%' : 'auto'
        }}>
          <NetworkGraph
            nodes={nodes}
            relations={relations}
            selectedNodeId={selectedNodeId}
            searchQuery={searchQuery}
            selectedTag={selectedTag}
            onSearchChange={setSearchQuery}
            onTagFilterChange={setSelectedTag}
            onNodeClick={handleNodeClick}
            onBackgroundDoubleClick={handleBackgroundDoubleClick}
            onCreateRelation={handleCreateRelationFromGraph}
          />
        </div>
        <div style={{
          ...styles.editorContainer,
          width: isMobile ? '100%' : 420,
          height: isMobile ? '50%' : '100%',
          flexShrink: 0
        }}>
          <NoteEditor
            node={selectedNode}
            relations={relations}
            allNodes={nodes}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            onSave={handleSaveNode}
            onDelete={handleDeleteNode}
            onNodeSelect={handleNodeClick}
            onAddRelation={handleAddRelation}
            onDeleteRelation={handleDeleteRelation}
          />
        </div>
      </div>

      <CreateNodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateNode}
        tags={TAGS}
        tagColors={TAG_COLORS}
      />

      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1e1e2e',
    maxWidth: 1600,
    margin: '0 auto',
    position: 'relative'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#2a2a3e',
    borderBottom: '1px solid #3a3a4e',
    gap: 20,
    flexShrink: 0
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0
  },
  logoIcon: {
    fontSize: 24
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#d4d4dc'
  },
  stats: {
    display: 'flex',
    gap: 16,
    flexShrink: 0
  },
  statItem: {
    fontSize: 13,
    color: '#888'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  graphContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  editorContainer: {
    width: 420,
    flexShrink: 0,
    overflow: 'hidden'
  },
  notification: {
    position: 'fixed',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    backgroundColor: 'rgba(124, 58, 237, 0.95)',
    color: 'white',
    borderRadius: 8,
    fontSize: 14,
    zIndex: 2000,
    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
    animation: 'slideDown 300ms ease-out'
  }
};

export default App;
