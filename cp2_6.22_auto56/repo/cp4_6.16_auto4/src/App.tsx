import { useState, useEffect, useCallback, useRef } from 'react';
import { useDocStore } from './store/useDocStore';
import { useSocket } from './hooks/useSocket';
import Editor, { EditorHandle } from './Editor';
import Sidebar from './components/Sidebar';
import OnlineUsers from './components/OnlineUsers';
import VersionHistory from './components/VersionHistory';
import ConnectionToast from './components/ConnectionToast';
import JoinModal from './components/JoinModal';
import { Download, Maximize2, Minimize2, History } from 'lucide-react';
import { exportDeltaToMarkdown } from './utils/exportMarkdown';

export default function App() {
  const [joined, setJoined] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  const documents = useDocStore((s) => s.documents);
  const activeDocId = useDocStore((s) => s.activeDocId);
  const isConnected = useDocStore((s) => s.isConnected);
  const isFullscreen = useDocStore((s) => s.isFullscreen);
  const showVersionHistory = useDocStore((s) => s.showVersionHistory);
  const setFullscreen = useDocStore((s) => s.setFullscreen);
  const setShowVersionHistory = useDocStore((s) => s.setShowVersionHistory);
  const setCurrentUser = useDocStore((s) => s.setCurrentUser);
  const setActiveDocId = useDocStore((s) => s.setActiveDocId);
  const { getSocket } = useSocket();

  const activeDoc = documents.find((d) => d.id === activeDocId);

  const handleJoin = useCallback(
    (nickname: string) => {
      const socket = getSocket();
      if (socket) {
        socket.emit('set-nickname', { nickname });
        setCurrentUser({
          userId: socket.id || '',
          nickname,
          color: '',
        });
        setJoined(true);

        setTimeout(() => {
          const docs = useDocStore.getState().documents;
          if (docs.length > 0 && !useDocStore.getState().activeDocId) {
            setActiveDocId(docs[0].id);
            socket.emit('join-document', { docId: docs[0].id });
          }
        }, 500);
      }
    },
    [getSocket, setCurrentUser, setActiveDocId]
  );

  const handleExport = useCallback(() => {
    if (!editorRef.current || !activeDocId) return;
    const content = editorRef.current.getContent();
    const title = editorRef.current.getTitle();
    exportDeltaToMarkdown(content, title);
  }, [activeDocId]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen(!isFullscreen);
  }, [isFullscreen, setFullscreen]);

  const toggleVersionHistory = useCallback(() => {
    setShowVersionHistory(!showVersionHistory);
  }, [showVersionHistory, setShowVersionHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setFullscreen]);

  useEffect(() => {
    if (!joined || !activeDocId || !isConnected) return;

    const socket = getSocket();
    if (!socket) return;

    const interval = setInterval(() => {
      socket.emit('save-version', { docId: activeDocId });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [joined, activeDocId, isConnected, getSocket]);

  if (!joined) {
    return <JoinModal onJoin={handleJoin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      {!isFullscreen && (
        <div className="h-11 bg-white border-b border-navy-50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-navy rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">Q</span>
              </div>
              <span className="text-sm font-bold text-navy tracking-tight">QuickDoc</span>
            </div>
            {activeDoc && (
              <div className="flex items-center gap-2 text-sm text-navy-400">
                <span>/</span>
                <span className="text-navy font-medium">{activeDoc.title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleVersionHistory}
              className={`p-2 rounded-lg transition-colors ${
                showVersionHistory
                  ? 'bg-navy-50 text-navy'
                  : 'text-navy-300 hover:bg-navy-50 hover:text-navy'
              }`}
              title="版本历史"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={!activeDoc}
              className="p-2 rounded-lg text-navy-300 hover:bg-navy-50 hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="导出 Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-navy-300 hover:bg-navy-50 hover:text-navy transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏编辑'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isFullscreen && <Sidebar />}

        <div className="flex-1 relative flex">
          <Editor ref={editorRef} />
          <OnlineUsers />
          <VersionHistory />
        </div>
      </div>

      <ConnectionToast />
    </div>
  );
}
