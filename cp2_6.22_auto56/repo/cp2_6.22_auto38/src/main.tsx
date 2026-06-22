import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import type { Annotation, User } from './utils/annotationStore';
import { store } from './utils/annotationStore';
import { DocumentViewer } from './components/DocumentViewer';
import { AnnotationSidebar } from './components/AnnotationSidebar';

const IconPanelOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);

const IconPanelClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
  </svg>
);

const IconUpload = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

function App() {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => store.getAnnotations());
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = store.on('annotation:updated', payload => {
      setAnnotations(payload as Annotation[]);
    });
    const unsub2 = store.on('cursor:moved', payload => {
      setUsers(payload as User[]);
    });
    const unsub3 = store.on('sidebar:scrollTo', payload => {
      const { line, annotationId } = payload as { line: number; annotationId: string };
      setHighlightLine(line);
      setActiveAnnotationId(annotationId);
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const handleSelectAnnotation = (line: number, annotationId: string) => {
    store.scrollToLine(line, annotationId);
  };

  const handleToggleSidebar = () => setSidebarCollapsed(c => !c);

  const handleUploadDemo = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.md,.txt,.markdown,text/plain,text/markdown';
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      file.text().then(() => {
        alert('（演示功能）在实际应用中会在此处替换文档内容。当前使用预设示例文档体验批注功能。');
      }).catch(() => undefined);
    };
    fileInput.click();
  };

  return (
    <div className="app-root">
      <div className="app-topbar">
        <div className="topbar-title">
          <span className="topbar-title-badge" />
          协作文档批注 · PRD v2.3
        </div>
        <div className="topbar-tools">
          <button
            className="icon-btn"
            title="上传 Markdown / 纯文本"
            onClick={handleUploadDemo}
          >
            <IconUpload />
          </button>
          <div className="avatars-stack" title="当前在线协作者">
            {users.map(u => (
              <div
                key={u.id}
                className="avatar-chip"
                style={{ background: u.avatarColor }}
                title={u.name}
              >
                {u.name.slice(0, 1)}
                <span className="avatar-tooltip">{u.name} · 行 {u.cursorLine}</span>
              </div>
            ))}
          </div>
          <button
            className="icon-btn"
            title={sidebarCollapsed ? '展开批注面板' : '收起批注面板'}
            onClick={handleToggleSidebar}
          >
            {sidebarCollapsed ? <IconPanelOpen /> : <IconPanelClose />}
          </button>
        </div>
      </div>

      <div className="app-body">
        <div className={`doc-wrapper ${sidebarCollapsed ? 'fullwidth' : ''}`}>
          <DocumentViewer
            annotations={annotations}
            users={users}
            highlightLine={highlightLine}
            highlightAnnotationId={activeAnnotationId}
          />
        </div>
        <aside className={`sidebar-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <AnnotationSidebar
            annotations={annotations}
            users={users}
            activeAnnotationId={activeAnnotationId}
            onSelectAnnotation={handleSelectAnnotation}
          />
        </aside>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
