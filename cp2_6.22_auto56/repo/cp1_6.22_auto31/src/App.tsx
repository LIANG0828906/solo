import { useState, useEffect } from 'react';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import { WebSocketClient } from './utils/websocket';

type Role = 'teacher' | 'student' | null;
type View = 'home' | 'teacher' | 'student';

interface RoomInfo {
  id: string;
  code: string;
  students: any[];
  questions: any[];
  activeQuestionId: string | null;
  ended: boolean;
  totalCorrect: number;
  totalAnswers: number;
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [role, setRole] = useState<Role>(null);
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [showError, setShowError] = useState('');
  const [showSuccessBubble, setShowSuccessBubble] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [ws, setWs] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    return () => {
      ws?.close();
    };
  }, [ws]);

  useEffect(() => {
    if (showError) {
      const t = setTimeout(() => setShowError(''), 3000);
      return () => clearTimeout(t);
    }
  }, [showError]);

  useEffect(() => {
    if (showSuccessBubble) {
      const t = setTimeout(() => setShowSuccessBubble(false), 1600);
      return () => clearTimeout(t);
    }
  }, [showSuccessBubble]);

  const createRoom = async () => {
    if (!teacherName.trim()) {
      setShowError('请输入您的姓名');
      return;
    }
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teacherName.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setShowError(data.error);
        return;
      }
      setRoomInfo(data.room);
      setShowSuccessBubble(true);
      const newWs = new WebSocketClient(
        window.location.protocol === 'https:'
          ? `wss://${window.location.host}/ws`
          : `ws://${window.location.host}/ws`
      );
      newWs.connect(() => {
        setTimeout(() => {
          newWs.send('register', { role: 'teacher', roomId: data.room.id });
        }, 50);
      });
      setWs(newWs);
      setTimeout(() => setView('teacher'), 1500);
    } catch (e) {
      setShowError('创建房间失败');
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim() || roomCode.length !== 6) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setShowError('请输入6位房间号');
      return;
    }
    if (!studentName.trim()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setShowError('请输入您的昵称');
      return;
    }
    try {
      const res = await fetch(`/api/rooms/${roomCode.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setShowError(data.error || '加入房间失败');
        return;
      }
      const data = await res.json();
      setRoomInfo(data.room);
      setStudentId(data.studentId);
      const newWs = new WebSocketClient(
        window.location.protocol === 'https:'
          ? `wss://${window.location.host}/ws`
          : `ws://${window.location.host}/ws`
      );
      newWs.connect(() => {
        setTimeout(() => {
          newWs.send('register', {
            role: 'student',
            code: roomCode.trim(),
            studentId: data.studentId,
          });
        }, 50);
      });
      setWs(newWs);
      setTimeout(() => setView('student'), 200);
    } catch (e) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setShowError('加入房间失败，请检查网络');
    }
  };

  const goHome = () => {
    ws?.close();
    setWs(null);
    setView('home');
    setRole(null);
    setRoomInfo(null);
    setStudentId(null);
    setRoomCode('');
  };

  if (view === 'teacher' && roomInfo && ws) {
    return (
      <>
        <button className="back-btn" onClick={goHome}>← 返回</button>
        <TeacherPage
          roomInfo={roomInfo}
          setRoomInfo={setRoomInfo}
          ws={ws}
          teacherName={teacherName}
          onEnd={goHome}
        />
      </>
    );
  }

  if (view === 'student' && roomInfo && ws && studentId) {
    return (
      <>
        <button className="back-btn" onClick={goHome}>← 退出</button>
        <StudentPage
          roomInfo={roomInfo}
          setRoomInfo={setRoomInfo}
          ws={ws}
          studentId={studentId}
          studentName={studentName}
        />
      </>
    );
  }

  return (
    <div className="app">
      {showError && <div className="error-toast">{showError}</div>}
      {showSuccessBubble && <div className="success-bubble">✓ 房间创建成功！</div>}

      <div className="home-page">
        <div style={{ marginTop: 40 }}>
          <div className="home-title">📚 课堂互动问答</div>
          <div className="home-subtitle">让课堂更有趣，让学习更高效</div>
        </div>

        <div className="role-select">
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            <span className="role-icon">👨‍🏫</span>
            <span>教师端</span>
          </button>
          <button
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            <span className="role-icon">🎓</span>
            <span>学生端</span>
          </button>
        </div>

        {role === 'teacher' && (
          <div className="form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
            <label className="form-label">您的姓名</label>
            <input
              className="form-input"
              placeholder="请输入姓名"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />
            <button className="primary-btn" onClick={createRoom} style={{ marginTop: 8 }}>
              创建课堂
            </button>
          </div>
        )}

        {role === 'student' && (
          <div
            className={`form-group ${shaking ? 'shake' : ''}`}
            style={{ animation: 'fadeIn 0.3s ease', gap: 16 }}
          >
            <div className="form-group">
              <label className="form-label">6位房间号</label>
              <input
                className="form-input"
                placeholder="例如：123456"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ fontSize: 22, letterSpacing: 12, textAlign: 'center', fontFamily: 'Courier New' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">您的昵称</label>
              <input
                className="form-input"
                placeholder="请输入昵称"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <button className="primary-btn" onClick={joinRoom}>
              加入课堂
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
