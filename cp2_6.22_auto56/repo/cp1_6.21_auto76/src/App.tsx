import React, { useState, useEffect, useRef, useCallback } from 'react';
import Whiteboard from './Whiteboard';
import Chat, { ChatMessage, AVATAR_COLORS } from './Chat';
import PdfUpload from './PdfUpload';
import { createCollaboration, getCollaboration } from './Collaboration';

type Role = 'teacher' | 'student';

interface Participant {
  id: string;
  name: string;
  role: Role;
  avatarColor: string;
}

interface DrawOperation {
  tool: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
  page: number;
  text?: string;
}

const USER_NAMES: Record<Role, string[]> = {
  teacher: ['王老师', '李老师', '张老师'],
  student: ['小明', '小红', '小华', '小丽', '小强', '小刚'],
};

function getRandomName(role: Role): string {
  const names = USER_NAMES[role];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export default function App() {
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [roomName, setRoomName] = useState('数学课堂');
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [userName, setUserName] = useState('');
  const [avatarColor] = useState(getRandomColor);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteOperations, setRemoteOperations] = useState<DrawOperation[]>([]);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [locked, setLocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const broadcastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOpsRef = useRef<DrawOperation[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (userName) return;
    setUserName(getRandomName(role));
  }, [role]);

  const handleJoin = () => {
    if (!roomName.trim()) return;
    setJoined(true);

    const collab = createCollaboration('', roomName, userId);
    collab.connect().then(() => {
      collab.send('join', { userName, role, avatarColor });
    });

    collab.on('join', (payload: any) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === payload.userId)) return prev;
        return [
          ...prev,
          {
            id: payload.userId,
            name: payload.userName,
            role: payload.role,
            avatarColor: payload.avatarColor,
          },
        ];
      });
    });

    collab.on('leave', (payload: any) => {
      setParticipants((prev) => prev.filter((p) => p.id !== payload.userId));
    });

    collab.on('draw', (payload: DrawOperation) => {
      setRemoteOperations((prev) => [...prev, payload]);
    });

    collab.on('chat', (payload: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId: payload.userId,
          userName: payload.userName,
          content: payload.content,
          timestamp: payload.timestamp || Date.now(),
          avatarColor: payload.avatarColor || '#3498DB',
        },
      ]);
    });

    collab.on('lock', (payload: any) => {
      setLocked(payload.locked);
    });

    collab.on('mute', (payload: any) => {
      setMuted(payload.muted);
    });

    collab.on('participants', (payload: any) => {
      if (Array.isArray(payload.list)) {
        setParticipants(payload.list);
      }
    });

    setParticipants([
      { id: userId, name: userName, role, avatarColor },
    ]);
  };

  const handleOperation = useCallback(
    (op: DrawOperation) => {
      pendingOpsRef.current.push(op);
    },
    []
  );

  useEffect(() => {
    if (!joined) return;
    broadcastTimerRef.current = setInterval(() => {
      if (pendingOpsRef.current.length > 0) {
        const collab = getCollaboration();
        if (collab) {
          pendingOpsRef.current.forEach((op) => {
            collab.send('draw', op);
          });
        }
        pendingOpsRef.current = [];
      }
    }, 200);
    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    };
  }, [joined]);

  const handleSendMessage = (msg: { userId: string; userName: string; content: string }) => {
    const collab = getCollaboration();
    if (collab) {
      collab.send('chat', { ...msg, avatarColor, timestamp: Date.now() });
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...msg,
        timestamp: Date.now(),
        avatarColor,
      },
    ]);
  };

  const handleLock = () => {
    const newVal = !locked;
    setLocked(newVal);
    const collab = getCollaboration();
    if (collab) collab.send('lock', { locked: newVal });
  };

  const handleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    const collab = getCollaboration();
    if (collab) collab.send('mute', { muted: newVal });
  };

  const handleDistributeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `白板截图_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleLeave = () => {
    const collab = getCollaboration();
    if (collab) {
      collab.send('leave', { userId });
      collab.disconnect();
    }
    setJoined(false);
    setParticipants([]);
    setMessages([]);
    setRemoteOperations([]);
    setPdfPages([]);
    setCurrentPage(0);
    setLocked(false);
    setMuted(false);
  };

  if (!joined) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EBF5FB 0%, #D4EFDF 100%)',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 40,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            width: 400,
            maxWidth: '90vw',
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              color: '#3498DB',
              fontSize: 28,
              fontWeight: 'bold',
              marginBottom: 32,
            }}
          >
            🎓 互动白板协作
          </h1>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#555', marginBottom: 6 }}>
              房间名称
            </label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="输入房间名称"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #DEE2E6',
                borderRadius: 8,
                fontSize: 15,
                outline: 'none',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3498DB')}
              onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#DEE2E6')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#555', marginBottom: 6 }}>
              你的昵称
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入昵称"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #DEE2E6',
                borderRadius: 8,
                fontSize: 15,
                outline: 'none',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3498DB')}
              onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#DEE2E6')}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#555', marginBottom: 6 }}>
              选择角色
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setRole('teacher')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: `2px solid ${role === 'teacher' ? '#3498DB' : '#DEE2E6'}`,
                  borderRadius: 8,
                  background: role === 'teacher' ? '#EBF5FB' : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: role === 'teacher' ? 'bold' : 'normal',
                  color: role === 'teacher' ? '#3498DB' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                👨‍🏫 教师
              </button>
              <button
                onClick={() => setRole('student')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: `2px solid ${role === 'student' ? '#2ECC71' : '#DEE2E6'}`,
                  borderRadius: 8,
                  background: role === 'student' ? '#EAFAF1' : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: role === 'student' ? 'bold' : 'normal',
                  color: role === 'student' ? '#2ECC71' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                👨‍🎓 学生
              </button>
            </div>
          </div>

          <button
            onClick={handleJoin}
            style={{
              width: '100%',
              padding: 14,
              border: 'none',
              borderRadius: 8,
              background: '#3498DB',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(52,152,219,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            进入房间
          </button>
        </div>
      </div>
    );
  }

  const rightPanel = (
    <div
      style={{
        width: isMobile ? 300 : '40%',
        height: isMobile ? '100%' : '100%',
        background: '#F8F9FA',
        borderLeft: '1px solid #DEE2E6',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #DEE2E6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            flex: 1,
          }}
        >
          {roomName}
        </span>
        <button
          onClick={handleLeave}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: 8,
            background: '#E74C3C',
            color: '#FFFFFF',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(231,76,60,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          退出
        </button>
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #DEE2E6',
          background: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6 }}>
          参与者 ({participants.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {participants.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: p.role === 'teacher' ? '#EBF5FB' : '#EAFAF1',
                borderRadius: 12,
                fontSize: 12,
                color: '#333',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: p.avatarColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              >
                {p.name.charAt(0)}
              </div>
              {p.name}
              {p.role === 'teacher' && ' 👨‍🏫'}
            </div>
          ))}
        </div>
      </div>

      {role === 'teacher' && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #DEE2E6',
            display: 'flex',
            gap: 6,
            background: '#FFFFFF',
          }}
        >
          <button
            onClick={handleLock}
            style={{
              flex: 1,
              padding: '6px 0',
              border: `1px solid ${locked ? '#E74C3C' : '#DEE2E6'}`,
              borderRadius: 6,
              background: locked ? '#FDEDEC' : '#FFFFFF',
              color: locked ? '#E74C3C' : '#666',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {locked ? '🔓 解锁板书' : '🔒 锁定板书'}
          </button>
          <button
            onClick={handleMute}
            style={{
              flex: 1,
              padding: '6px 0',
              border: `1px solid ${muted ? '#E74C3C' : '#DEE2E6'}`,
              borderRadius: 6,
              background: muted ? '#FDEDEC' : '#FFFFFF',
              color: muted ? '#E74C3C' : '#666',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {muted ? '🔊 解除禁言' : '🔇 全员禁言'}
          </button>
          <button
            onClick={handleDistributeScreenshot}
            style={{
              flex: 1,
              padding: '6px 0',
              border: '1px solid #DEE2E6',
              borderRadius: 6,
              background: '#FFFFFF',
              color: '#666',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📸 分发截图
          </button>
        </div>
      )}

      <PdfUpload
        onPagesLoaded={setPdfPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <Chat
        userId={userId}
        userName={userName}
        role={role}
        muted={muted && role === 'student'}
        onSendMessage={handleSendMessage}
        messages={messages}
      />
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Whiteboard
          role={role}
          roomName={roomName}
          onOperation={handleOperation}
          remoteOperations={remoteOperations}
          pdfPages={pdfPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          locked={locked}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      {!isMobile && rightPanel}

      {isMobile && (
        <>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              position: 'fixed',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 60,
              border: '1px solid #DEE2E6',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              background: '#FFFFFF',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: '-2px 0 6px rgba(0,0,0,0.1)',
            }}
          >
            {drawerOpen ? '▶' : '◀'}
          </button>

          <div
            style={{
              position: 'fixed',
              top: 0,
              right: drawerOpen ? 0 : -300,
              width: 300,
              height: '100%',
              zIndex: 999,
              transition: 'right 0.3s ease',
              boxShadow: drawerOpen ? '-4px 0 16px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {rightPanel}
          </div>

          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 300,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 998,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
