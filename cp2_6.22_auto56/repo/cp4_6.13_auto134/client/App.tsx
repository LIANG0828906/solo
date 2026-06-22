import React, { useEffect, useRef, useState } from 'react';
import QuizRoom from './QuizRoom';
import { ToastProvider, useToast } from './Toast';

type ViewMode = 'welcome' | 'room';

const WS_URL = () => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  return `${proto}//${host}:3001`;
};

const WelcomeScreen: React.FC<{
  onEnterRoom: (ws: WebSocket, role: 'teacher' | 'student', nickname: string, code: string, roomId: string) => void;
}> = ({ onEnterRoom }) => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'teacher' | 'student'>('teacher');
  const [teacherNick, setTeacherNick] = useState('');
  const [studentNick, setStudentNick] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleCreate = () => {
    if (!teacherNick.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }
    setLoading(true);
    try {
      const ws = new WebSocket(WS_URL());
      wsRef.current = ws;

      const onOpen = () => {
        ws.send(JSON.stringify({ type: 'create_room', nickname: teacherNick.trim() }));
      };

      const onMessage = (evt: MessageEvent) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'room_created') {
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('error', onError);
            setLoading(false);
            onEnterRoom(ws, 'teacher', teacherNick.trim(), msg.code, msg.roomId);
          } else if (msg.type === 'error') {
            showToast(msg.message || '创建房间失败', 'error');
            setLoading(false);
            ws.close();
          }
        } catch (e) {
          setLoading(false);
        }
      };

      const onError = () => {
        showToast('连接服务器失败', 'error');
        setLoading(false);
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('message', onMessage);
      ws.addEventListener('error', onError);
    } catch (e) {
      showToast('连接服务器失败', 'error');
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!studentNick.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      showToast('请输入6位房间码', 'error');
      return;
    }
    setLoading(true);
    try {
      const ws = new WebSocket(WS_URL());
      wsRef.current = ws;

      const onOpen = () => {
        ws.send(JSON.stringify({
          type: 'join_room',
          nickname: studentNick.trim(),
          code: roomCode.trim().toUpperCase(),
        }));
      };

      const onMessage = (evt: MessageEvent) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'room_joined') {
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('error', onError);
            setLoading(false);
            onEnterRoom(ws, 'student', studentNick.trim(), msg.code, msg.roomId);
          } else if (msg.type === 'error') {
            showToast(msg.message || '加入房间失败', 'error');
            setLoading(false);
            ws.close();
          }
        } catch (e) {
          setLoading(false);
        }
      };

      const onError = () => {
        showToast('连接服务器失败', 'error');
        setLoading(false);
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('message', onMessage);
      ws.addEventListener('error', onError);
    } catch (e) {
      showToast('连接服务器失败', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="welcome-card">
        <div className="welcome-title">LiveQuiz</div>
        <div className="welcome-subtitle">实时课堂互动测验系统</div>

        <div className="tab-switch">
          <button
            className={`tab-btn ${tab === 'teacher' ? 'active' : ''}`}
            onClick={() => setTab('teacher')}
          >
            👨‍🏫 教师端
          </button>
          <button
            className={`tab-btn ${tab === 'student' ? 'active' : ''}`}
            onClick={() => setTab('student')}
          >
            🧑‍🎓 学生端
          </button>
        </div>

        {tab === 'teacher' ? (
          <>
            <div className="form-group">
              <label className="form-label">教师昵称</label>
              <input
                type="text"
                className="form-input"
                value={teacherNick}
                onChange={e => setTeacherNick(e.target.value)}
                placeholder="请输入您的昵称"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? '创建中...' : '创建房间'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">学生昵称</label>
              <input
                type="text"
                className="form-input"
                value={studentNick}
                onChange={e => setStudentNick(e.target.value)}
                placeholder="请输入您的昵称"
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">房间码</label>
              <input
                type="text"
                className="form-input upper"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="输入6位房间码"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button className="btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? '加入中...' : '加入房间'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AppInner: React.FC = () => {
  const [view, setView] = useState<ViewMode>('welcome');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleEnter = (newWs: WebSocket, r: 'teacher' | 'student', n: string, c: string, rid: string) => {
    setWs(newWs);
    setRole(r);
    setNickname(n);
    setCode(c);
    setRoomId(rid);
    setView('room');
  };

  if (view === 'room' && ws) {
    return (
      <QuizRoom
        ws={ws}
        role={role}
        nickname={nickname}
        roomCode={code}
        roomId={roomId}
      />
    );
  }

  return <WelcomeScreen onEnterRoom={handleEnter} />;
};

const App: React.FC = () => (
  <ToastProvider>
    <AppInner />
  </ToastProvider>
);

export default App;
