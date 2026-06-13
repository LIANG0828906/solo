import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { useFlowStore } from './store/useFlowStore';
import { wsClient } from './utils/websocket';
import { Users, ArrowLeft } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    if (!roomName.trim() || !userName.trim()) return;
    const roomId = roomName.trim().replace(/\s+/g, '-').toLowerCase();
    localStorage.setItem('userName', userName.trim());
    navigate(`/room/${roomId}`);
  };

  const handleJoinShare = async () => {
    if (!shareCode.trim() || !userName.trim()) return;
    setIsJoining(true);
    try {
      const res = await axios.get(`/api/share/${shareCode.trim().toUpperCase()}`);
      localStorage.setItem('userName', userName.trim());
      navigate(`/share/${shareCode.trim().toUpperCase()}`);
    } catch (e) {
      alert('分享码无效');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FlowCollab</h1>
          <p className="text-gray-400">实时协作流程图编辑器</p>
        </div>

        <div className="bg-bg-secondary rounded-2xl p-6 space-y-6">
          <div>
            <label className="text-gray-400 text-sm block mb-2">您的昵称</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入您的昵称"
              className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-3">创建或加入房间</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="输入房间名称"
                className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || !userName.trim()}
                className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建 / 加入房间
              </button>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-3">使用分享码查看</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="输入8位分享码"
                maxLength={8}
                className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-accent-blue"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinShare()}
              />
              <button
                onClick={handleJoinShare}
                disabled={!shareCode.trim() || !userName.trim() || isJoining}
                className="w-full bg-accent-green hover:bg-accent-green/80 text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? '加入中...' : '查看分享'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>支持多用户实时协作 · 自动版本快照 · PNG导出</p>
        </div>
      </div>
    </div>
  );
};

const EditorPage: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const params = useParams<{ roomId: string; shareCode?: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [userId] = useState(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('userId', id);
    }
    return id;
  });
  const [userName] = useState(() => localStorage.getItem('userName') || '用户');
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);

  const { users, setIsReadOnly, reset } = useFlowStore();

  useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly, setIsReadOnly]);

  useEffect(() => {
    const initRoom = async () => {
      let roomId = params.roomId;
      
      if (params.shareCode) {
        try {
          const res = await axios.get(`/api/share/${params.shareCode}`);
          roomId = res.data.roomId;
        } catch (e) {
          navigate('/');
          return;
        }
      }

      if (!roomId) {
        navigate('/');
        return;
      }

      setActualRoomId(roomId);
      wsClient.connect(roomId, userId, userName);

      return () => {
        wsClient.disconnect();
        reset();
      };
    };

    initRoom();
  }, [params.roomId, params.shareCode, userId, userName, navigate, reset]);

  const handleBack = () => {
    navigate('/');
  };

  if (!actualRoomId) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="bg-bg-primary border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">
              {readOnly ? '查看流程图' : 'FlowCollab'}
            </h1>
            <p className="text-gray-400 text-xs">房间: {actualRoomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Users size={16} />
            <span className="text-sm">{users.length} 在线</span>
          </div>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-bg-primary"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold border-2 border-bg-primary">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!readOnly && (
          <div className="w-[240px] flex-shrink-0 border-r border-gray-700 hidden md:block">
            <Sidebar roomId={actualRoomId} canvasRef={canvasRef} />
          </div>
        )}
        
        <main className="flex-1 relative" ref={canvasRef}>
          <Canvas readOnly={readOnly} />
        </main>
        
        <div className="flex-shrink-0 border-l border-gray-700">
          <Sidebar roomId={actualRoomId} canvasRef={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<EditorPage />} />
        <Route path="/share/:shareCode" element={<EditorPage readOnly />} />
      </Routes>
    </BrowserRouter>
  );
};
