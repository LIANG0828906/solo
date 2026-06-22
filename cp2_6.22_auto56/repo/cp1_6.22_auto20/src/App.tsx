import { useState, useRef, useCallback, useEffect } from 'react';
import { GraphEngine } from './GraphEngine';
import DocumentManager from './DocumentManager';
import GraphViewer from './GraphViewer';

interface Document {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: number;
}

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelWidth, setPanelWidth] = useState(320);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const engineRef = useRef(new GraphEngine());
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const isDraggingDivider = useRef(false);

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then((docs: Document[]) => {
        setDocuments(docs);
        const engine = engineRef.current;
        const container = document.getElementById('graph-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          engine.setDimensions(rect.width, rect.height);
        }
        docs.forEach(doc => engine.addNode(doc));
      })
      .catch(() => {});
  }, []);

  const handleAddDocument = useCallback(async (title: string, summary: string, keywords: string[]) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, keywords }),
    });
    if (!res.ok) return;
    const doc = await res.json();
    setDocuments(prev => [...prev, doc]);
    engineRef.current.addNode(doc);
  }, []);

  const handleDeleteDocument = useCallback(async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== id));
    engineRef.current.removeNode(id);
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [selectedNodeId]);

  const handleSelectDocument = useCallback((id: string) => {
    setSelectedNodeId(prev => {
      const newId = prev === id ? null : id;
      if (newId) setFocusNodeId(newId);
      return newId;
    });
  }, []);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
    setFocusNodeId(id);
  }, []);

  const handleCreateEdge = useCallback((source: string, target: string) => {
    engineRef.current.addCustomEdge(source, target);
  }, []);

  const handleFocusComplete = useCallback(() => {
    setFocusNodeId(null);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingDivider.current) return;
      const newWidth = Math.max(280, Math.min(500, e.clientX));
      setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDraggingDivider.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}>
      <div style={{
        height: 52,
        background: '#fff',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#4A90D9', marginRight: 8, letterSpacing: 1 }}>
          知识图谱
        </span>
        <div style={{ width: 1, height: 24, background: '#E0E0E0' }} />
        <input
          type="text"
          className="search-input"
          placeholder="搜索标题或关键词..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 420,
            height: 34,
            border: '1px solid #E0E0E0',
            borderRadius: 17,
            padding: '0 16px',
            fontSize: 13,
            outline: 'none',
            background: '#F8F8F8',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#aaa' }}>
          {documents.length} 个文档 · {engineRef.current.edges.length} 条关联
        </span>
        <button
          onClick={() => setPanelCollapsed(prev => !prev)}
          style={{
            background: 'none',
            border: '1px solid #E0E0E0',
            borderRadius: 6,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 12,
            color: '#888',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#4A90D9';
            (e.currentTarget as HTMLElement).style.color = '#4A90D9';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#E0E0E0';
            (e.currentTarget as HTMLElement).style.color = '#888';
          }}
        >
          {panelCollapsed ? '▸ 展开面板' : '◂ 折叠面板'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!panelCollapsed && (
          <div style={{
            width: panelWidth,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <DocumentManager
              documents={documents}
              selectedNodeId={selectedNodeId}
              onAdd={handleAddDocument}
              onDelete={handleDeleteDocument}
              onSelect={handleSelectDocument}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {!panelCollapsed && (
          <div
            onMouseDown={() => { isDraggingDivider.current = true; }}
            style={{
              width: 5,
              cursor: 'col-resize',
              background: '#E8E8E8',
              flexShrink: 0,
              zIndex: 5,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4A90D9'; }}
            onMouseLeave={e => {
              if (!isDraggingDivider.current) (e.currentTarget as HTMLElement).style.background = '#E8E8E8';
            }}
          />
        )}

        <div id="graph-container" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <GraphViewer
            engine={engineRef.current}
            selectedNodeId={selectedNodeId}
            searchQuery={searchQuery}
            focusNodeId={focusNodeId}
            onCreateEdge={handleCreateEdge}
            onNodeClick={handleNodeClick}
            onFocusComplete={handleFocusComplete}
          />
        </div>
      </div>
    </div>
  );
}
