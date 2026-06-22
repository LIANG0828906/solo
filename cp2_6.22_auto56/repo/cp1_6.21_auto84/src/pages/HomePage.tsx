import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, Plus, ArrowRight, Gamepad2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../utils/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setRoomId, setPlayerId, setPlayerName, setRoom, addToast } = useGameStore();

  const [playerName, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [initialHealth, setInitialHealth] = useState(280);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      addToast({
        message: '请输入您的昵称',
        type: 'warning',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.createRoom(
        maxPlayers,
        initialHealth,
        playerName.trim()
      );
      setRoomId(response.roomId);
      setPlayerId(response.playerId);
      setPlayerName(playerName.trim());
      setRoom(response.room);
      addToast({
        message: `房间创建成功！房间号：${response.roomId}`,
        type: 'success',
      });
      navigate(`/room/${response.roomId}/config`);
    } catch (error) {
      addToast({
        message: '创建房间失败，请重试',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      addToast({
        message: '请输入您的昵称',
        type: 'warning',
      });
      return;
    }

    if (!joinRoomId.trim() || joinRoomId.length !== 6) {
      addToast({
        message: '请输入有效的6位房间号',
        type: 'warning',
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await api.joinRoom(joinRoomId.trim(), playerName.trim());
      setRoomId(joinRoomId.trim());
      setPlayerId(response.playerId);
      setPlayerName(playerName.trim());
      setRoom(response.room);
      addToast({
        message: '加入房间成功！',
        type: 'success',
      });
      navigate(`/room/${joinRoomId.trim()}/config`);
    } catch (error) {
      addToast({
        message: '加入房间失败，请检查房间号是否正确',
        type: 'error',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-stagger">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-2xl">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            回合制