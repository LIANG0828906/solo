import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { api } from '../utils/api';

export const ExitButton: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { playerId, reset, addToast } = useGameStore();

  const handleExit = async () => {
    if (!roomId || !playerId) {
      reset();
      navigate('/');
      return;
    }

    try {
      await api.leaveRoom(roomId, playerId);
      addToast({
        message: '已离开房间',
        type: 'info',
      });
    } catch (error) {
      // Silent fail
    } finally {
      reset();
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-40 p-3 glass-card hover:bg-red-500/30 transition-all duration-200 group"
      title="退出房间"
    >
      <LogOut className="w-5 h-5 text-white/70 group-hover:text-red-400 transition-colors" />
    </button>
  );
};
