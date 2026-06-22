import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Editor } from '@/notepad/Editor';
import { AnnotationPanel } from '@/notepad/AnnotationPanel';
import { VersionHistory } from '@/notepad/VersionHistory';
import { KnowledgeGraph } from '@/knowledge/KnowledgeGraph';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { initDB, getNote, getAnnotations, getConcepts, getEdges, getVersions } from '@/utils/db';
import { FileText, Network, Users, Wifi, WifiOff, Settings, User } from 'lucide-react';
import type { User as UserType } from '@/types';

const mockUsers: UserType[] = [
  { id: 'user-1', name: '学生A', color: '#E74C3C', cursorPosition: null },
  { id: 'user-2', name: '学生B', color: '#3498DB', cursorPosition: null },
];

function Navigation() {
  const location = useLocation();
  const { wsConnected, currentUser, setCurrentUser, otherUsers } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserChange = (user: UserType) => {
    setCurrentUser(user);
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-[#0F3460] border-b border-[#16213E] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E94560] to-[#0F3460] flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">NoteSync</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notepad"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/notepad' || location.pathname === '/'
                  ? 'bg-[#E94560] text-white'
                  : 'text-[#E0E0E0]/70 hover:text-white hover:bg-[#16213E]'
              }`}
            >
              <FileText size={16} />
              笔记编辑
            </Link>
            <Link
              to="/knowledge"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/knowledge'
                  ? 'bg-[#E94560] text-white'
                  : 'text-[#E0E0E0]/70 hover:text-white hover:bg-[#16213E]'
              }`}
            >
              <Network size={16} />
              知识图谱
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-xs text-green-500">已连接</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-xs text-red-500">连接中...</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Users size={16} className="text-[#E0E0E0]/70" />
            <div className="flex -space-x-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-[#0F3460] flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentUser.color }}
                title={currentUser.name}
              >
                {currentUser.name.charAt(0)}
              </div>
              {otherUsers.map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full border-2 border-[#0F3460] flex items-center justify-center text-white text-xs font-bold animate-pulse"
                  style={{ backgroundColor: user.color }}
                  title={`${user.name} - 在线`}
                >
                  {user.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 text-[#E0E0E0]/70 hover:text-white hover:bg-[#16213E] rounded-lg transition-colors"
            >
              <Settings size={18} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#16213E] rounded-lg shadow-xl border border-[#0F3460] py-2 min-w-[180px] z-50">
                <div className="px-4 py-2 text-xs text-[#E0E0E0]/50 border-b border-[#0F3460]">
                  切换用户
                </div>
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserChange(user)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      currentUser.id === user.id
                        ? 'bg-[#0F3460] text-white'
                        : 'text-[#E0E0E0]/70 hover:bg-[#0F3460]/50 hover:text-white'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                    {currentUser.id === user.id && (
                      <span className="ml-auto text-xs text-[#3498DB]">当前</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NotepadView() {
  const { rightPanelMode } = useStore();

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row gap-4 p-4">
      <div className="flex-1 md:w-3/5 min-h-[400px]">
        <Editor />
      </div>
      <div className="flex-1 md:w-2/5 min-h-[400px]">
        {rightPanelMode === 'annotations' && <AnnotationPanel />}
        {rightPanelMode === 'knowledge' && <KnowledgeGraph />}
        {rightPanelMode === 'history' && <VersionHistory />}
      </div>
    </div>
  );
}

function KnowledgeView() {
  return (
    <div className="h-[calc(100vh-64px)] p-4">
      <KnowledgeGraph />
    </div>
  );
}

export default function App() {
  const { setNote, setAnnotations, setConceptsAndEdges, setVersionHistory, note, initAutoSave, cleanupAutoSave } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useWebSocket();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();

        const savedNote = await getNote(note.id);
        if (savedNote) {
          setNote(savedNote);
        }

        const savedAnnotations = await getAnnotations(note.id);
        setAnnotations(savedAnnotations);

        const savedConcepts = await getConcepts(note.id);
        const savedEdges = await getEdges(note.id);
        if (savedConcepts.length > 0) {
          setConceptsAndEdges(savedConcepts, savedEdges);
        }

        const savedVersions = await getVersions(note.id);
        setVersionHistory(savedVersions);

        initAutoSave();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      cleanupAutoSave();
    };
  }, [setNote, setAnnotations, setConceptsAndEdges, setVersionHistory, note.id, initAutoSave, cleanupAutoSave]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#1A1A2E]">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/notepad" replace />} />
          <Route path="/notepad" element={<NotepadView />} />
          <Route path="/knowledge" element={<KnowledgeView />} />
        </Routes>
      </div>
    </Router>
  );
}
