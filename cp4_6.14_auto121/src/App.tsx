import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useStore } from './store';
import type { ModuleType, ModuleInstance } from './types';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import SearchBar from './modules/SearchBar';
import UserCard from './modules/UserCard';
import DataTable from './modules/DataTable';

const MODULE_LIST: { type: ModuleType; label: string }[] = [
  { type: 'searchBar', label: '搜索栏' },
  { type: 'userCard', label: '用户卡片' },
  { type: 'dataTable', label: '数据表格' },
];

const MODULE_ICONS: Record<ModuleType, JSX.Element> = {
  searchBar: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  ),
  userCard: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  dataTable: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
      <path d="M3 9h18"></path>
      <path d="M3 15h18"></path>
      <path d="M9 3v18"></path>
      <path d="M15 3v18"></path>
    </svg>
  ),
};

function renderModule(module: ModuleInstance) {
  const props = module.props;
  switch (module.type) {
    case 'searchBar':
      return <SearchBar {...(props as any)} />;
    case 'userCard':
      return <UserCard {...(props as any)} />;
    case 'dataTable':
      return <DataTable {...(props as any)} />;
  }
}

export default function App() {
  const { modules, selectedId, zoom, addModule, selectModule, exportLayout, importLayout, setZoom } = useStore();
  const [activeType, setActiveType] = useState<ModuleType | null>(null);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (MODULE_LIST.some((m) => m.type === id)) {
      setActiveType(id as ModuleType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveType(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (MODULE_LIST.some((m) => m.type === activeId) && overId === 'canvas-dropzone') {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const x = ((event.activatorEvent as PointerEvent).clientX - canvasRect.left) / zoom;
        const y = ((event.activatorEvent as PointerEvent).clientY - canvasRect.top) / zoom;
        const snappedX = Math.round(x / 24) * 24;
        const snappedY = Math.round(y / 24) * 24;
        addModule(activeId as ModuleType, Math.max(0, snappedX), Math.max(0, snappedY));
      }
    }
  };

  const handleClickModule = (type: ModuleType) => {
    addModule(type, 24 + modules.length * 48, 24 + modules.length * 48);
  };

  const handleExport = useCallback(() => {
    const data = exportLayout();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [exportLayout]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importLayout(data);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch {
        alert('无效的JSON文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectModule(null);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>页面搭建工具</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
              <span>缩放:</span>
              <button
                onClick={() => setZoom(zoom - 0.1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                -
              </button>
              <span style={{ width: 48, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(zoom + 0.1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={handleImportClick}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background-color 0.2s ease-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
            >
              导入JSON
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background-color 0.2s ease-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              导出JSON
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 800 }}>
          <div
            style={{
              width: 180,
              borderRight: '1px solid #1e293b',
              padding: 16,
              overflowY: 'auto',
              backgroundColor: '#0f172a',
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              组件库
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {MODULE_LIST.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', item.type);
                  }}
                  onClick={() => handleClickModule(item.type)}
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#f1f5f9',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    transition: 'transform 0.2s ease-out, border 0.2s ease-out',
                    border: '1px solid transparent',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.border = '1px solid #3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '1px solid transparent';
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLDivElement).style.cursor = 'grab';
                  }}
                >
                  {MODULE_ICONS[item.type]}
                  <span style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={canvasRef}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'auto',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={handleCanvasClick}
          >
            <Canvas />
          </div>

          <div
            style={{
              width: 280,
              borderLeft: '1px solid #1e293b',
              backgroundColor: '#0f172a',
            }}
          >
            <PropertyPanel />
          </div>
        </div>

        <DragOverlay>
          {activeType ? (
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#f1f5f9',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
              }}
            >
              {MODULE_ICONS[activeType]}
            </div>
          ) : null}
        </DragOverlay>

        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

        {showToast && (
          <div
            style={{
              position: 'fixed',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              padding: '12px 24px',
              borderRadius: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              fontSize: 14,
              zIndex: 9999,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            操作成功
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </DndContext>
  );
}
