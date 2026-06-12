import { useState, useEffect, useCallback, useRef } from 'react';
import type { GraphNode, GraphLink, NodeType, LinkType, FilterState } from './types';
import { NODE_TYPE_CONFIG, LINK_TYPE_CONFIG } from './types';
import { dataStore } from './dataStore';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import { Plus, Search, RotateCcw, ChevronDown, Filter, Moon, Sun } from 'lucide-react';

export default function App() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    searchKeyword: '',
    nodeTypes: ['concept', 'article', 'question', 'person'],
    linkTypes: ['contains', 'references', 'contradicts', 'inspired_by'],
  });
  const [showNodeTypeMenu, setShowNodeTypeMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const graphCanvasRef = useRef<{ resetLayout: () => void; focusOnNode: (id: string) => void } | null>(null);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const data = await dataStore.getGraph();
      setNodes(data.nodes);
      setLinks(data.links);
    } catch (error) {
      console.error('Failed to load graph:', error);
    }
  };

  const handleNodeSelect = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setIsDetailPanelOpen(true);
    setFocusNodeId(node.id);
  }, []);

  const handleNodeUpdate = useCallback(async (updates: Partial<GraphNode>) => {
    if (!selectedNode) return;
    try {
      const updated = await dataStore.updateNode(selectedNode.id, updates);
      setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNode(updated);
    } catch (error) {
      console.error('Failed to update node:', error);
    }
  }, [selectedNode]);

  const handleNodeDelete = useCallback(async (nodeId: string) => {
    try {
      await dataStore.deleteNode(nodeId);
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        setIsDetailPanelOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  }, [selectedNode]);

  const handleAddNode = useCallback(async (type: NodeType) => {
    try {
      const newNode = await dataStore.createNode({
        type,
        title: `新${NODE_TYPE_CONFIG[type].label}`,
        content: '',
      });
      setNodes(prev => [...prev, newNode]);
      setShowNodeTypeMenu(false);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  }, []);

  const handleAddLink = useCallback(async (source: string, target: string, type: LinkType) => {
    try {
      const newLink = await dataStore.createLink({ source, target, type });
      setLinks(prev => [...prev, newLink]);
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    graphCanvasRef.current?.resetLayout();
  }, []);

  const handleSidebarNodeSelect = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      graphCanvasRef.current?.focusOnNode(nodeId);
      setSelectedNode(node);
      setIsDetailPanelOpen(true);
      setFocusNodeId(nodeId);
    }
  }, [nodes]);

  const toggleNodeTypeFilter = (type: NodeType) => {
    setFilter(prev => ({
      ...prev,
      nodeTypes: prev.nodeTypes.includes(type)
        ? prev.nodeTypes.filter(t => t !== type)
        : [...prev.nodeTypes, type],
    }));
  };

  const toggleLinkTypeFilter = (type: LinkType) => {
    setFilter(prev => ({
      ...prev,
      linkTypes: prev.linkTypes.includes(type)
        ? prev.linkTypes.filter(t => t !== type)
        : [...prev.linkTypes, type],
    }));
  };

  const themeStyles = isDarkTheme
    ? {
        bg: '#1a1a2e',
        panelBg: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
        text: '#e7e7e7',
        border: 'rgba(231, 231, 231, 0.1)',
      }
    : {
        bg: '#f5f5f5',
        panelBg: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
        text: '#1a1a2e',
        border: 'rgba(26, 26, 46, 0.1)',
      };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: themeStyles.bg }}>
      <GraphCanvas
        ref={graphCanvasRef}
        nodes={nodes}
        links={links}
        filter={filter}
        selectedNodeId={selectedNode?.id || null}
        focusNodeId={focusNodeId}
        onNodeSelect={handleNodeSelect}
        onLinkCreate={handleAddLink}
        onNodePositionUpdate={(id, x, y) => {
          setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
        }}
        theme={isDarkTheme ? 'dark' : 'light'}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: isSidebarOpen ? '280px' : '50px',
          background: themeStyles.panelBg,
          borderRight: `1px solid ${themeStyles.border}`,
          transition: 'width 0.3s ease',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Sidebar
          nodes={nodes}
          links={links}
          filter={filter}
          selectedNodeId={selectedNode?.id || null}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onNodeSelect={handleSidebarNodeSelect}
          theme={isDarkTheme ? 'dark' : 'light'}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 20,
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNodeTypeMenu(!showNodeTypeMenu); setShowFilterMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: themeStyles.panelBg,
              color: themeStyles.text,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(74, 144, 217, 0.4)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <Plus size={18} />
            <span>添加节点</span>
            <ChevronDown size={16} style={{ transform: showNodeTypeMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showNodeTypeMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: themeStyles.panelBg,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              minWidth: '150px',
            }}>
              {(['concept', 'article', 'question', 'person'] as NodeType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleAddNode(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: themeStyles.text,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${NODE_TYPE_CONFIG[type].color}20`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: NODE_TYPE_CONFIG[type].shape === 'circle' ? '50%' : '2px',
                    backgroundColor: NODE_TYPE_CONFIG[type].color,
                  }} />
                  <span>{NODE_TYPE_CONFIG[type].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: themeStyles.panelBg,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}>
            <Search size={18} color={themeStyles.text} style={{ opacity: 0.6 }} />
            <input
              type="text"
              placeholder="搜索节点..."
              value={filter.searchKeyword}
              onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: themeStyles.text,
                width: '150px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowFilterMenu(!showFilterMenu); setShowNodeTypeMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: themeStyles.panelBg,
              color: themeStyles.text,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(74, 144, 217, 0.4)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <Filter size={18} />
          </button>
          {showFilterMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: themeStyles.panelBg,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              minWidth: '200px',
              padding: '10px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', color: themeStyles.text }}>节点类型</div>
                {(['concept', 'article', 'question', 'person'] as NodeType[]).map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: themeStyles.text, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filter.nodeTypes.includes(type)}
                      onChange={() => toggleNodeTypeFilter(type)}
                    />
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: NODE_TYPE_CONFIG[type].shape === 'circle' ? '50%' : '2px',
                      backgroundColor: NODE_TYPE_CONFIG[type].color,
                    }} />
                    <span style={{ fontSize: '13px' }}>{NODE_TYPE_CONFIG[type].label}</span>
                  </label>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', color: themeStyles.text }}>关联类型</div>
                {(['contains', 'references', 'contradicts', 'inspired_by'] as LinkType[]).map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: themeStyles.text, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filter.linkTypes.includes(type)}
                      onChange={() => toggleLinkTypeFilter(type)}
                    />
                    <div style={{
                      width: '20px',
                      height: '2px',
                      backgroundColor: LINK_TYPE_CONFIG[type].color,
                    }} />
                    <span style={{ fontSize: '13px' }}>{LINK_TYPE_CONFIG[type].label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleResetLayout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: themeStyles.panelBg,
            color: themeStyles.text,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(74, 144, 217, 0.4)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: themeStyles.panelBg,
            color: themeStyles.text,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(74, 144, 217, 0.4)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {isDetailPanelOpen && selectedNode && (
        <DetailPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={() => handleNodeDelete(selectedNode.id)}
          onClose={() => {
            setIsDetailPanelOpen(false);
            setSelectedNode(null);
            setFocusNodeId(null);
          }}
          theme={isDarkTheme ? 'dark' : 'light'}
        />
      )}

      {showNodeTypeMenu || showFilterMenu ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
          onClick={() => {
            setShowNodeTypeMenu(false);
            setShowFilterMenu(false);
          }}
        />
      ) : null}
    </div>
  );
}
