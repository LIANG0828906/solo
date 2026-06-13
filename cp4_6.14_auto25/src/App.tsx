import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Whiteboard from './Whiteboard';
import { Pen, ArrowRight, Sparkles } from 'lucide-react';

function HomePage() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRandom = () => {
    const id = uuidv4().slice(0, 8);
    navigate(`/room/${id}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomId.trim();
    if (trimmed) navigate(`/room/${trimmed}`);
  };

  return (
    <div className="home-root">
      <div className="home-bg-decoration" />
      <div className="home-card">
        <div className="home-header">
          <div className="home-logo">
            <Pen size={28} strokeWidth={2} />
          </div>
          <h1 className="home-title">实时协作白板</h1>
          <p className="home-subtitle">与团队一起，随时随地绘画创作</p>
        </div>

        <form className="home-form" onSubmit={join}>
          <label className="home-label">
            <span>房间 ID</span>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="输入已有房间 ID"
              className="home-input"
            />
          </label>

          <button type="submit" className="home-btn home-btn-primary" disabled={!roomId.trim()}>
            加入房间
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </form>

        <div className="home-divider">
          <span>或</span>
        </div>

        <button
          type="button"
          className="home-btn home-btn-secondary"
          onClick={createRandom}
        >
          <Sparkles size={18} strokeWidth={2} />
          创建新房间
        </button>

        <div className="home-features">
          <div className="home-feature">
            <div className="home-feature-dot" style={{ background: '#3b82f6' }} />
            <span>多人实时协作</span>
          </div>
          <div className="home-feature">
            <div className="home-feature-dot" style={{ background: '#22c55e' }} />
            <span>画笔/矩形/圆形/文本</span>
          </div>
          <div className="home-feature">
            <div className="home-feature-dot" style={{ background: '#f59e0b' }} />
            <span>撤销与重做历史</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  if (!roomId) return <Navigate to="/" replace />;
  return <Whiteboard roomId={roomId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
