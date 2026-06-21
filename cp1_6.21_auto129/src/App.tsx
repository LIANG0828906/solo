import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { User, EditEvent, CursorPosition, EditorHandle } from './types';
import EditorContainer from './EditorContainer';
import TimelinePanel from './TimelinePanel';
import UserManager from './UserManager';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<EditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [content, setContent] = useState('');
  const [cursors, setCursors] = useState<Map<string, number>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
    const s = io({ transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('init', (data: { content: string; users: User[] }) => {
      setContent(data.content);
      setUsers(data.users.filter((u: User) => u.online));
    });

    s.on('user:added', (user: User) => {
      setUsers(prev => [...prev, user]);
    });

    s.on('user:removed', (userId: string) => {
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, online: false } : u)));
    });

    s.on('edit:event', (event: EditEvent) => {
      setEvents(prev => [...prev, event]);
    });

    s.on('cursor:update', (data: CursorPosition) => {
      setCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, data.position);
        return next;
      });
    });

    s.on('simulation:started', () => setIsSimulating(true));
    s.on('simulation:stopped', () => setIsSimulating(false));
    s.on('timeline:cleared', () => setEvents([]));

    return () => {
      s.disconnect();
    };
  }, []);

  const handleAddUser = useCallback(async () => {
    try {
      await axios.post('/api/add-user');
    } catch (e) {
      console.error('Failed to add user:', e);
    }
  }, []);

  const handleRandomEdit = useCallback(async () => {
    if (isSimulating) {
      try {
        await axios.post('/api/stop-simulation');
      } catch (e) {
        console.error('Failed to stop simulation:', e);
      }
    } else {
      try {
        await axios.post('/api/start-simulation');
      } catch (e) {
        console.error('Failed to start simulation:', e);
      }
    }
  }, [isSimulating]);

  const handleClearTimeline = useCallback(() => {
    setEvents([]);
    socket?.emit('clearTimeline');
  }, [socket]);

  const handleExportReport = useCallback(() => {
    const report = events.map(e => {
      const user = users.find(u => u.id === e.userId);
      const time = new Date(e.timestamp);
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      const ss = String(time.getSeconds()).padStart(2, '0');
      return `[${hh}:${mm}:${ss}] ${user?.name || '未知'} ${e.type === 'insert' ? '插入' : '删除'} "${e.text.slice(0, 20)}${e.text.length > 20 ? '...' : ''}"`;
    }).join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `协作轨迹报告_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events, users]);

  const handleCardClick = useCallback((event: EditEvent) => {
    const len = event.text?.length || 0;
    editorRef.current?.scrollToPosition(event.position, len);
  }, []);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-title">协作轨迹可视化</div>
        <div className="toolbar-actions">
          <button
            className="toolbar-btn"
            style={{ backgroundColor: '#3B82F6' }}
            onClick={handleAddUser}
            disabled={users.filter(u => u.online).length >= 4}
          >
            添加用户
          </button>
          <button
            className="toolbar-btn"
            style={{ backgroundColor: '#8B5CF6' }}
            onClick={handleRandomEdit}
          >
            {isSimulating ? '停止编辑' : '随机编辑'}
          </button>
          <button
            className="toolbar-btn"
            style={{ backgroundColor: '#EF4444' }}
            onClick={handleClearTimeline}
          >
            清空轨迹
          </button>
          <button
            className="toolbar-btn"
            style={{ backgroundColor: '#10B981' }}
            onClick={handleExportReport}
          >
            导出轨迹报告
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="editor-area">
          <UserManager users={users} />
          <EditorContainer
            ref={editorRef}
            content={content}
            events={events}
            users={users}
            cursors={cursors}
          />
        </div>

        <div className="sidebar">
          <TimelinePanel
            events={events}
            users={users}
            onCardClick={handleCardClick}
          />
        </div>

        <button className="sidebar-fab" onClick={() => setSidebarOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="2" rx="1" fill="white" />
            <rect x="2" y="9" width="16" height="2" rx="1" fill="white" />
            <rect x="2" y="14" width="16" height="2" rx="1" fill="white" />
          </svg>
        </button>

        {sidebarOpen && (
          <>
            <div
              className="sidebar-overlay active"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="sidebar-mobile-panel active">
              <TimelinePanel
                events={events}
                users={users}
                onCardClick={(e) => {
                  handleCardClick(e);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default App;
