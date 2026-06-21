import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogIn, Sparkles, Users, Brain } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      alert('请输入用户名');
      return;
    }
    const roomId = generateRoomId();
    navigate(`/room/${roomId}?userName=${encodeURIComponent(userName.trim())}`);
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      alert('请输入用户名');
      return;
    }
    if (!joinRoomId.trim()) {
      alert('请输入房间号');
      return;
    }
    navigate(`/room/${joinRoomId.trim()}?userName=${encodeURIComponent(userName.trim())}`);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto77</h1>
          <p className="text-gray-500">实时协作思维导图</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              用户名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入你的名字"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateRoom}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              创建新房间
            </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-400">或者</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 inline mr-2" />
              加入房间
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="输入房间号"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition-all"
              />
              <button
                onClick={handleJoinRoom}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <LogIn className="w-5 h-5" />
                加入
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            极简白 · 实时协作 · 语义分组
          </p>
        </div>
      </div>
    </div>
  );
}
