import React, { useEffect, useCallback, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import PropertyPanel from './components/PropertyPanel';
import { generatePrototypeHTML, previewInNewWindow, downloadHTML } from './utils/generatePrototype';
import type {
  CanvasComponent,
  Connection,
  ComponentType,
  HistoryState,
  Project
} from './types';
import { DEFAULT_STYLES, DEFAULT_SIZES } from './types';
import {
  Undo2,
  Redo2,
  Play,
  Download,
  Save,
  LayoutGrid,
  ChevronUp,
  X
} from 'lucide-react';

const MAX_HISTORY = 50;

type Selection =
  | { kind: 'component'; id: string }
  | { kind: 'connection'; id: string }
  | null;

const App: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('未命名项目');
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const pastRef = useRef<HistoryState[]>([]);
  const futureRef = useRef<HistoryState[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pushHistory = useCallback(() => {
    pastRef.current.push({
      components: JSON.parse(JSON.stringify(components)),
      connections: JSON.parse(JSON.stringify(connections))
    });
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
  }, [components, connections]);

  const commitChange = useCallback(
    (newComponents: CanvasComponent[], newConnections: Connection[]) => {
      pastRef.current.push({
        components: JSON.parse(JSON.stringify(components)),
        connections: JSON.parse(JSON.stringify(connections))
      });
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current.shift();
      }
      futureRef.current = [];
      setComponents(newComponents);
      setConnections(newConnections);
    },
    [components, connections]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.push({
      components: JSON.parse(JSON.stringify(components)),
      connections: JSON.parse(JSON.stringify(connections))
    });
    setComponents(prev.components);
    setConnections(prev.connections);
    setSelection(null);
    showToast('已撤销');
  }, [components, connections]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push({
      components: JSON.parse(JSON.stringify(components)),
      connections: JSON.parse(JSON.stringify(connections))
    });
    setComponents(next.components);
    setConnections(next.connections);
    setSelection(null);
    showToast('已重做');
  }, [components, connections]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
      const isRedo =
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' ||
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y';
      if (isUndo) {
        e.preventDefault();
        undo();
      } else if (isRedo) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        if (selection) {
          e.preventDefault();
          deleteSelection();
        }
      } else if (e.key === 'Escape') {
        setSelection(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, selection]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/project/default');
        const data = res.data as Project;
        setProjectId(data.id);
        setProjectName(data.name);
        setComponents(data.components);
        setConnections(data.connections);
        pastRef.current = [];
        futureRef.current = [];
      } catch (err) {
        console.error('加载项目失败:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onUpdateConns = (e: any) => {
      const conns: Connection[] = e.detail?.conns || [];
      commitChange(components, conns);
    };
    const onDeleteConn = (e: any) => {
      const id: string = e.detail?.id;
      if (!id) return;
      const conns = connections.filter(c => c.id !== id);
      commitChange(components, conns);
      if (selection?.kind === 'connection' && selection.id === id) setSelection(null);
      showToast('已删除连线');
    };
    const onSelectComp = (e: any) => {
      const id: string = e.detail?.id;
      if (!id) return;
      setSelection({ kind: 'component', id });
    };
    window.addEventListener('__update_connections__', onUpdateConns as any);
    window.addEventListener('__delete_connection__', onDeleteConn as any);
    window.addEventListener('__select_component__', onSelectComp as any);
    return () => {
      window.removeEventListener('__update_connections__', onUpdateConns as any);
      window.removeEventListener('__delete_connection__', onDeleteConn as any);
      window.removeEventListener('__select_component__', onSelectComp as any);
    };
  }, [components, connections, selection, commitChange]);

  const addComponent = (type: ComponentType) => {
    const id = uuidv4();
    const size = DEFAULT_SIZES[type];
    const newComp: CanvasComponent = {
      id,
      type,
      x: 400 + Math.random() * 80,
      y: 300 + Math.random() * 80,
      width: size.width,
      height: size.height,
      rotation: 0,
      style: { ...DEFAULT_STYLES[type] },
      content: type === 'text' ? '文本内容' : '',
      zIndex: (components.length > 0 ? Math.max(...components.map(c => c.zIndex)) : 0) + 1,
      name: `${type}-${String(components.length + 1).padStart(2, '0')}`
    };
    commitChange([...components, newComp], connections);
    setSelection({ kind: 'component', id });
  };

  const updateComponents = (newComponents: CanvasComponent[]) => {
    commitChange(newComponents, connections);
  };

  const updateComponent = (id: string, patch: Partial<CanvasComponent>) => {
    const newComponents = components.map(c => (c.id === id ? { ...c, ...patch } : c));
    commitChange(newComponents, connections);
  };

  const updateConnections = (newConnections: Connection[]) => {
    commitChange(components, newConnections);
  };

  const addConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const exists = connections.find(
      c => c.fromComponentId === fromId && c.toComponentId === toId
    );
    if (exists) return;
    const conn: Connection = {
      id: uuidv4(),
      fromComponentId: fromId,
      toComponentId: toId,
      label: '跳转'
    };
    commitChange(components, [...connections, conn]);
    setSelection({ kind: 'connection', id: conn.id });
  };

  const updateConnection = (id: string, patch: Partial<Connection>) => {
    const newConnections = connections.map(c => (c.id === id ? { ...c, ...patch } : c));
    commitChange(components, newConnections);
  };

  const deleteSelection = () => {
    if (!selection) return;
    pushHistory();
    if (selection.kind === 'component') {
      const newComps = components.filter(c => c.id !== selection.id);
      const newConns = connections.filter(
        c => c.fromComponentId !== selection.id && c.toComponentId !== selection.id
      );
      setComponents(newComps);
      setConnections(newConns);
      showToast('已删除组件');
    } else {
      const newConns = connections.filter(c => c.id !== selection.id);
      setConnections(newConns);
      showToast('已删除连线');
    }
    setSelection(null);
  };

  const generatePrototype = () => {
    const html = generatePrototypeHTML({
      projectName,
      components,
      connections,
      editorUrl: 'http://localhost:5173'
    });
    previewInNewWindow(html);
    showToast('原型已在新窗口打开');
  };

  const handleDownload = () => {
    const html = generatePrototypeHTML({
      projectName,
      components,
      connections,
      editorUrl: 'http://localhost:5173'
    });
    downloadHTML(html, `${projectName || 'prototype'}.html`);
    showToast('已下载HTML文件');
  };

  const handleSave = async () => {
    try {
      showToast('保存中...');
      if (projectId) {
        await axios.put(`/api/projects/${projectId}`, {
          name: projectName,
          components,
          connections
        });
      } else {
        const res = await axios.post('/api/projects', {
          name: projectName,
          components,
          connections
        });
        setProjectId(res.data.id);
      }
      showToast('项目已保存');
    } catch (err) {
      showToast('保存失败');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', color: '#6b7280' }}>
        <LayoutGrid style={{ marginRight: 8 }} /> ProtoFlow 正在加载...
      </div>
    );
  }

  const selectedComponent =
    selection?.kind === 'component'
      ? components.find(c => c.id === selection.id) || null
      : null;
  const selectedConnection =
    selection?.kind === 'connection'
      ? connections.find(c => c.id === selection.id) || null
      : null;

  const hasUndo = pastRef.current.length > 0;
  const hasRedo = futureRef.current.length > 0;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          height: 56,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          flexShrink: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LayoutGrid size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', letterSpacing: 0.2 }}>
            ProtoFlow
          </div>
          <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 8px' }} />
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid transparent',
              borderRadius: 6,
              background: 'transparent',
              fontSize: 14,
              fontWeight: 500,
              color: '#1f2937',
              outline: 'none',
              width: 200,
              transition: 'all 0.2s'
            }}
            onFocus={e => (e.target.style.background = '#f3f4f6')}
            onBlur={e => (e.target.style.background = 'transparent')}
            onMouseEnter={e => (e.target.style.background = '#f9fafb')}
            onMouseLeave={e => (e.target.style.background = e.target === document.activeElement ? '#f3f4f6' : 'transparent')}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ToolbarButton title={hasUndo ? `撤销 (Ctrl+Z)  ${pastRef.current.length}步可撤销` : '撤销'} onClick={undo} disabled={!hasUndo}>
            <Undo2 size={17} />
          </ToolbarButton>
          <ToolbarButton title={hasRedo ? `重做 (Ctrl+Shift+Z)  ${futureRef.current.length}步可重做` : '重做'} onClick={redo} disabled={!hasRedo}>
            <Redo2 size={17} />
          </ToolbarButton>
          <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 6px' }} />
          <ToolbarButton title="保存项目到后端" onClick={handleSave} color="#10b981">
            <Save size={17} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>保存</span>
          </ToolbarButton>
          <ToolbarButton title="下载HTML原型文件" onClick={handleDownload}>
            <Download size={17} />
          </ToolbarButton>
          <div
            onClick={generatePrototype}
            title="点击在新窗口预览可交互原型"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#f97316',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(249,115,22,0.25)'
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#ea580c')}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = '#f97316')}
            onMouseDown={e => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(0.98)')}
            onMouseUp={e => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1)')}
          >
            <Play size={16} fill="#fff" />
            <span>生成原型</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left toolbar */}
        {!isMobile && (
          <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#ffffff', overflow: 'auto' }}>
            <Toolbar onAdd={addComponent} />
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          <Canvas
            components={components}
            connections={connections}
            selection={selection}
            onSelect={setSelection}
            onUpdateComponents={updateComponents}
            onAddConnection={addConnection}
          />

          {/* Mobile bottom toolbar */}
          {isMobile && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 10,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                zIndex: 50
              }}
            >
              {(['rectangle', 'circle', 'text', 'image'] as ComponentType[]).map(t => (
                <div
                  key={t}
                  onClick={() => addComponent(t)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#f3f4f6',
                    color: '#1f2937',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
                >
                  {t === 'rectangle' ? '矩形' : t === 'circle' ? '圆形' : t === 'text' ? '文本' : '图片'}
                </div>
              ))}
            </div>
          )}

          {/* Property panel drawer trigger (mobile) */}
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              title="属性面板"
              style={{
                position: 'absolute',
                right: 12,
                bottom: isMobile ? 70 : 12,
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e5e7eb',
                zIndex: 60
              }}
            >
              <ChevronUp size={20} color="#6b7280" />
            </button>
          )}
        </div>

        {/* Right property panel */}
        {!isMobile && (
          <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #e5e7eb', background: '#ffffff', overflow: 'auto' }}>
            <PropertyPanel
              component={selectedComponent}
              connection={selectedConnection}
              components={components}
              connections={connections}
              onUpdateComponent={(id, patch) => updateComponent(id, patch)}
              onUpdateConnection={(id, patch) => updateConnection(id, patch)}
              onDelete={deleteSelection}
              onClearSelection={() => setSelection(null)}
            />
          </div>
        )}

        {/* Mobile drawer */}
        {isMobile && drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 200
              }}
            />
            <div
              className="animate-slide-up"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '75vh',
                background: '#ffffff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                zIndex: 300,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15 }}>属性</div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f3f4f6',
                    color: '#6b7280'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <PropertyPanel
                  component={selectedComponent}
                  connection={selectedConnection}
                  components={components}
                  connections={connections}
                  onUpdateComponent={(id, patch) => updateComponent(id, patch)}
                  onUpdateConnection={(id, patch) => updateConnection(id, patch)}
                  onDelete={deleteSelection}
                  onClearSelection={() => setSelection(null)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="animate-fade-in-scale"
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(31,41,55,0.92)',
            color: 'white',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  color?: string;
}
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ children, onClick, title, disabled, color }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 12px',
    borderRadius: 8,
    background: disabled ? '#f3f4f6' : color ? `${color}15` : '#f3f4f6',
    color: disabled ? '#9ca3af' : color || '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    border: `1px solid ${disabled ? 'transparent' : 'transparent'}`,
    userSelect: 'none',
    fontSize: 13
  };
  return (
    <div
      title={title}
      style={baseStyle}
      onClick={() => !disabled && onClick()}
      onMouseEnter={e => {
        if (disabled) return;
        (e.currentTarget as HTMLDivElement).style.background = color ? `${color}25` : '#e5e7eb';
      }}
      onMouseLeave={e => {
        if (disabled) return;
        (e.currentTarget as HTMLDivElement).style.background = color ? `${color}15` : '#f3f4f6';
      }}
      onMouseDown={e => {
        if (disabled) return;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.97)';
      }}
      onMouseUp={e => {
        if (disabled) return;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
      }}
    >
      {children}
    </div>
  );
};

export default App;
