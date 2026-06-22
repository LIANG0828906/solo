import { useState, useEffect } from 'react';
import type { ParsedDoc, ViewType, ApiPath } from './types';
import FileUploader from './FileUploader';
import DocViewer from './DocViewer';
import MockTester from './MockTester';
import './App.css';

export default function App() {
  const [doc, setDoc] = useState<ParsedDoc | null>(null);
  const [view, setView] = useState<ViewType>('welcome');
  const [selectedApi, setSelectedApi] = useState<ApiPath | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUploadSuccess = (parsedDoc: ParsedDoc) => {
    setDoc(parsedDoc);
    setView('doc');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSelectApi = (api: ApiPath) => {
    setSelectedApi(api);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSwitchToMock = (api?: ApiPath) => {
    if (api) {
      setSelectedApi(api);
    }
    setView('mock');
  };

  const handleRefresh = () => {
    setDoc(null);
    setView('welcome');
    setSelectedApi(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      {isMobile && (
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="logo-text">API Doc</span>
          </div>
          {isMobile && (
            <button className="close-sidebar-btn" onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="sidebar-actions">
          <FileUploader onSuccess={handleUploadSuccess} />
          {doc && (
            <button className="btn-refresh" onClick={handleRefresh} title="刷新">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}
        </div>

        {doc && (
          <div className="view-tabs">
            <button 
              className={`view-tab ${view === 'doc' ? 'active' : ''}`}
              onClick={() => setView('doc')}
            >
              文档
            </button>
            <button 
              className={`view-tab ${view === 'mock' ? 'active' : ''}`}
              onClick={() => setView('mock')}
            >
              Mock测试
            </button>
          </div>
        )}

        {doc && (
          <div className="sidebar-content">
            {doc.tags.map(tag => (
              <SidebarTagGroup 
                key={tag.name} 
                tag={tag} 
                paths={doc.paths.filter(p => p.tags.includes(tag.name))}
                selectedApi={selectedApi}
                onSelect={handleSelectApi}
              />
            ))}
          </div>
        )}
      </aside>

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

      <main className="main-content">
        {view === 'welcome' && (
          <div className="welcome-page">
            <div className="welcome-content">
              <div className="welcome-logo">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h1 className="welcome-title">API Doc Mock</h1>
              <p className="welcome-desc">
                上传 OpenAPI v3 规范文件，自动生成可交互的API文档与Mock数据
              </p>
              <div className="welcome-features">
                <div className="feature-item">
                  <div className="feature-icon">📄</div>
                  <div className="feature-text">
                    <h3>智能解析</h3>
                    <p>支持 OpenAPI v3 JSON/YAML 格式</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🎯</div>
                  <div className="feature-text">
                    <h3>Mock数据</h3>
                    <p>根据接口定义自动生成模拟数据</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">
                    <h3>在线测试</h3>
                    <p>一键发送请求，实时查看响应</p>
                  </div>
                </div>
              </div>
              <FileUploader onSuccess={handleUploadSuccess} variant="large" />
            </div>
          </div>
        )}

        {view === 'doc' && doc && (
          <DocViewer 
            doc={doc} 
            selectedApi={selectedApi}
            onSelectApi={handleSelectApi}
            onSwitchToMock={handleSwitchToMock}
          />
        )}

        {view === 'mock' && doc && (
          <MockTester 
            doc={doc} 
            selectedApi={selectedApi}
            onSelectApi={handleSelectApi}
          />
        )}
      </main>
    </div>
  );
}

function SidebarTagGroup({ 
  tag, 
  paths, 
  selectedApi, 
  onSelect 
}: { 
  tag: { name: string; description: string };
  paths: ApiPath[];
  selectedApi: ApiPath | null;
  onSelect: (api: ApiPath) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const methodColors: Record<string, string> = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
    PATCH: '#8B5CF6',
    OPTIONS: '#64748B',
    HEAD: '#64748B'
  };

  return (
    <div className="tag-group">
      <button 
        className="tag-header"
        onClick={() => setExpanded(!expanded)}
      >
        <svg 
          className={`tag-arrow ${expanded ? 'expanded' : ''}`}
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="tag-name">{tag.name}</span>
        <span className="tag-count">{paths.length}</span>
      </button>
      {expanded && (
        <div className="tag-paths">
          {paths.map(api => (
            <button
              key={`${api.method}-${api.path}`}
              className={`path-item ${selectedApi?.path === api.path && selectedApi?.method === api.method ? 'active' : ''}`}
              onClick={() => onSelect(api)}
              title={api.summary || api.path}
            >
              <span 
                className="method-badge"
                style={{ backgroundColor: methodColors[api.method] || '#64748B' }}
              >
                {api.method}
              </span>
              <span className="path-summary">
                {api.summary || api.path}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
