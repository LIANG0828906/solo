import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Plus, LogIn, Sparkles } from 'lucide-react';
import type { RoomListItem, UserInfo } from '../types';
import { getRooms, createRoom, joinRoom } from '../utils/api';
import { useLocalStorage, useUserId, useUsername } from '../hooks/useLocalStorage';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';

export default function RoomList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const { userId, setUserId } = useUserId();
  const { username, setUsername } = useUsername();
  const [nameInput, setNameInput] = useLocalStorage<string>('username_input', '');

  const fetchRooms = useCallback(async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const ensureUser = useCallback((): UserInfo | null => {
    if (userId && username) return { id: userId, name: username };

    const name = nameInput.trim();
    if (!name) return null;

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setUserId(id);
    setUsername(name);
    return { id, name };
  }, [userId, username, nameInput, setUserId, setUsername]);

  const handleCreateRoom = useCallback(
    async (data: { name: string; description: string; tags: string[] }) => {
      const user = ensureUser();
      if (!user) return;

      try {
        const result = await createRoom({
          name: data.name,
          description: data.description,
          tags: data.tags,
          hostId: user.id,
          hostName: user.name,
        });

        navigate(`/room/${result.roomId}`);
      } catch (err) {
        console.error('Failed to create room:', err);
      }
    },
    [ensureUser, navigate]
  );

  const handleJoinRoom = useCallback(async () => {
    if (!joinCode.trim()) return;

    const user = ensureUser();
    if (!user) return;

    setJoinError('');

    try {
      const targetRoom = rooms.find((r) => r.inviteCode === joinCode.trim().toUpperCase());
      if (!targetRoom) {
        setJoinError('邀请码无效，未找到对应房间');
        return;
      }

      await joinRoom(targetRoom.id, user.id, user.name);
      navigate(`/room/${targetRoom.id}`);
    } catch (err) {
      console.error('Failed to join room:', err);
      setJoinError('加入房间失败');
    }
  }, [joinCode, rooms, ensureUser, navigate]);

  const handleRoomClick = useCallback(
    (roomId: string) => {
      const user = ensureUser();
      if (!user) return;
      navigate(`/room/${roomId}`);
    },
    [ensureUser, navigate]
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-[#16213e]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffd700]/20 flex items-center justify-center">
              <Brain size={22} className="text-[#ffd700]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e0e0e0]">BrainStorm</h1>
              <p className="text-xs text-[#9ca3af]">创意头脑风暴 & 灵感投票</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!userId && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="输入你的昵称"
                  className="w-32 text-sm py-1.5 px-3"
                  maxLength={20}
                />
              </div>
            )}
            {userId && username && (
              <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
                <div className="w-7 h-7 rounded-full bg-[#ffd700]/20 flex items-center justify-center">
                  <span className="text-[#ffd700] font-bold text-xs">{username[0]}</span>
                </div>
                <span>{username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700] text-sm mb-4">
            <Sparkles size={14} />
            实时协作 · 手绘草图 · 灵感投票
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#e0e0e0] mb-3">
            让创意<span className="text-[#ffd700]">自由碰撞</span>
          </h2>
          <p className="text-[#9ca3af] max-w-lg mx-auto">
            创建头脑风暴房间，邀请你的团队一起贡献点子、绘制草图、投票选出最佳方案
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
          >
            <Plus size={18} />
            创建房间
          </button>

          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                placeholder="输入6位邀请码加入房间"
                className="w-full mono tracking-widest text-center uppercase"
                maxLength={6}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={joinCode.length < 6}
              className="btn-secondary flex items-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn size={16} />
              加入
            </button>
          </div>
        </div>

        {joinError && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/20 text-[#ff4757] text-sm">
            {joinError}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#e0e0e0]">活跃房间</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-[#1f3460] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[#1f3460] rounded w-full mb-2" />
                <div className="h-4 bg-[#1f3460] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-[#9ca3af]">
            <div className="text-5xl mb-4">🧠</div>
            <p className="text-lg font-medium mb-1">还没有活跃的房间</p>
            <p className="text-sm">创建一个房间开始你的头脑风暴吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleRoomClick(room.id)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateRoom}
      />
    </div>
  );
}
