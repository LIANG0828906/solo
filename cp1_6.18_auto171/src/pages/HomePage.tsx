import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const [roomIdInput, setRoomInput] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    const newRoomId = uuidv4().slice(0, 8);
    navigate(`/board/${newRoomId}`);
  };

  const handleJoin = () => {
    if (roomIdInput.trim()) {
      navigate(`/board/${roomIdInput.trim()}`);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">灵感黑板</h1>
          <p className="text-gray-500">在线协作白板，实时创作灵感</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleCreate}
            className="w-full py-3 bg-[#1976D2] text-white rounded-lg font-medium text-lg hover:bg-[#1565C0] transition-colors"
          >
            创建新白板
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="输入房间ID..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
