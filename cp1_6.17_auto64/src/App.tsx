import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SchemaTree } from '@/components/SchemaTree';
import { SchemaDiff } from '@/components/SchemaDiff';
import { useSchemaStore } from '@/store/useSchemaStore';
import { loadSchemaFromFile } from '@/utils/schemaLoader';

const App: React.FC = () => {
  const {
    schemas,
    selectedOldId,
    selectedNewId,
    selectedFieldPath,
    showOnlyDiff,
    diffResults,
    addSchema,
    selectOldSchema,
    selectNewSchema,
    selectField,
    toggleShowOnlyDiff,
    loadMockSchemas,
  } = useSchemaStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [topHeight, setTopHeight] = useState(300);
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);

  useEffect(() => {
    loadMockSchemas();
  }, [loadMockSchemas]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 200;
      const maxWidth = containerRect.width - 300;
      setLeftWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVerticalResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      const minHeight = 150;
      const maxHeight = containerRect.height - 200;
      setTopHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleMouseUp = () => setIsVerticalResizing(false);

    if (isVerticalResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isVerticalResizing]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const schema = await loadSchemaFromFile(file);
          addSchema(file.name, schema);
        } catch (err) {
          console.error(`Failed to load ${file.name}:`, err);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addSchema],
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const oldSchema = schemas.find((s) => s.id === selectedOldId);
  const newSchema = schemas.find((s) => s.id === selectedNewId);

  const handleSchemaSelect = useCallback(
    (id: string) => {
      if (id === selectedOldId) return;
      selectNewSchema(id);
      selectOldSchema(selectedNewId || id);
    },
    [selectedOldId, selectedNewId, selectOldSchema, selectNewSchema],
  );

  return (
    <div className="app-container" ref={containerRef}>
      <header className="app-header">
        <div className="app-title">
          <span className="app-icon">📋</span>
          <span>JSON Schema 浏览与差异对比</span>
        </div>
        <div className="header-actions">
          <button
            className={`toggle-btn ${showOnlyDiff ? 'active' : ''}`}
            onClick={toggleShowOnlyDiff}
          >
            仅显示差异
          </button>
        </div>
      </header>

      <div className={`app-body ${isMobile ? 'mobile' : 'desktop'}`}>
        {!isMobile && (
          <>
            <aside
              className="sidebar left-sidebar"
              style={{ width: `${leftWidth}px` }}
            >
              <div className="sidebar-header">
                <span className="sidebar-title">Schema 浏览</span>
                <button className="upload-btn" onClick={handleUploadClick}>
                  + 上传
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              <div className="schema-list">
                {schemas.map((s) => (
                  <div
                    key={s.id}
                    className={`schema-item ${s.id === selectedOldId || s.id === selectedNewId ? 'in-compare' : ''} ${s.id === selectedOldId ? 'is-old' : ''} ${s.id === selectedNewId ? 'is-new' : ''}`}
                    onClick={() => handleSchemaSelect(s.id)}
                  >
                    <span className="schema-item-name">{s.name}</span>
                    {s.id === selectedOldId && (
                      <span className="schema-badge old-badge">旧</span>
                    )}
                    {s.id === selectedNewId && (
                      <span className="schema-badge new-badge">新</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="sidebar-divider" />

              <div className="tree-container">
                {oldSchema ? (
                  <SchemaTree
                    schema={oldSchema.schema}
                    selectedPath={selectedFieldPath}
                    onSelect={selectField}
                  />
                ) : (
                  <div className="empty-state">
                    <p>请选择一个 Schema 文件</p>
                  </div>
                )}
              </div>
            </aside>

            <div
              className="resize-handle horizontal"
              onMouseDown={() => setIsResizing(true)}
            />
          </>
        )}

        {isMobile && (
          <div
            className="sidebar left-sidebar mobile-top"
            style={{ height: `${topHeight}px` }}
          >
            <div className="sidebar-header">
              <span className="sidebar-title">Schema 浏览</span>
              <button className="upload-btn" onClick={handleUploadClick}>
                + 上传
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            <div className="schema-list">
              {schemas.map((s) => (
                <div
                  key={s.id}
                  className={`schema-item ${s.id === selectedOldId || s.id === selectedNewId ? 'in-compare' : ''} ${s.id === selectedOldId ? 'is-old' : ''} ${s.id === selectedNewId ? 'is-new' : ''}`}
                  onClick={() => handleSchemaSelect(s.id)}
                >
                  <span className="schema-item-name">{s.name}</span>
                  {s.id === selectedOldId && (
                    <span className="schema-badge old-badge">旧</span>
                  )}
                  {s.id === selectedNewId && (
                    <span className="schema-badge new-badge">新</span>
                  )}
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="tree-container">
              {oldSchema ? (
                <SchemaTree
                  schema={oldSchema.schema}
                  selectedPath={selectedFieldPath}
                  onSelect={selectField}
                />
              ) : (
                <div className="empty-state">
                  <p>请选择一个 Schema 文件</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isMobile && (
          <div
            className="resize-handle vertical"
            onMouseDown={() => setIsVerticalResizing(true)}
          >
            <span className="resize-icon">⋯</span>
          </div>
        )}

        <main className="main-content">
          <SchemaDiff
            oldSchema={oldSchema?.schema || null}
            newSchema={newSchema?.schema || null}
            diffResults={diffResults}
            showOnlyDiff={showOnlyDiff}
          />
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          height: 100%;
          overflow: hidden;
        }

        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Noto Sans', sans-serif;
          background-color: #1e1e2e;
          color: #e2e8f0;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #181825;
          border-bottom: 1px solid #313244;
          flex-shrink: 0;
        }

        .app-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .app-icon {
          font-size: 20px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .toggle-btn {
          padding: 6px 14px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #3a3a55;
          background: #2a2a40;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn:hover {
          background: #3a3a55;
          color: #e2e8f0;
        }

        .toggle-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .app-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .app-body.desktop {
          flex-direction: row;
        }

        .app-body.mobile {
          flex-direction: column;
        }

        .sidebar {
          background: #181825;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .left-sidebar {
          border-right: 1px solid #313244;
        }

        .sidebar.mobile-top {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #313244;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid #313244;
          flex-shrink: 0;
        }

        .sidebar-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .upload-btn {
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 5px;
          border: 1px solid #3b82f6;
          background: #3b82f6;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .upload-btn:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .schema-list {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
          max-height: 200px;
          overflow-y: auto;
        }

        .schema-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 13px;
          color: #cbd5e1;
          border: 1px solid transparent;
        }

        .schema-item:hover {
          background: #2a2a40;
        }

        .schema-item.in-compare {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .schema-item.is-old {
          border-left: 3px solid #ef4444;
        }

        .schema-item.is-new {
          border-left: 3px solid #10b981;
        }

        .schema-item-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .schema-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .old-badge {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .new-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .sidebar-divider {
          height: 1px;
          background: #313244;
          margin: 0 12px;
          flex-shrink: 0;
        }

        .tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          font-size: 13px;
        }

        .resize-handle {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #313244;
          transition: background 0.2s ease;
          cursor: col-resize;
        }

        .resize-handle:hover {
          background: #3b82f6;
        }

        .resize-handle.horizontal {
          width: 4px;
        }

        .resize-handle.vertical {
          height: 8px;
          cursor: row-resize;
        }

        .resize-icon {
          color: #64748b;
          font-size: 18px;
          letter-spacing: 2px;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          padding: 12px;
          overflow: hidden;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 10px 14px;
          }

          .app-title {
            font-size: 14px;
          }

          .main-content {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
