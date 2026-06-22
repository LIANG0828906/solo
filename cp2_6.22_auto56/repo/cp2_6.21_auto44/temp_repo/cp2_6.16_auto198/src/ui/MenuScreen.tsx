import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Users, Play, LogIn, Copy, Check, Loader2 } from 'lucide-react';

function MenuScreen() {
  const {
    playerName,
    setPlayerName,
    createRoom,
    joinRoom,
    roomCode,
    gamePhase,
    opponentName,
  } = useGameStore();

  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState('');
  const [joinError, setJoinError] = useState('');

  const validateName = (name: string): boolean => {
    if (name.length < 2) {
      setNameError('昵称至少需要2个字符');
      return false;
    }
    if (name.length > 12) {
      setNameError('昵称最多12个字符');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPlayerName(name);
    validateName(name);
  };

  const handleCreateRoom = () => {
    if (validateName(playerName)) {
      createRoom();
    }
  };

  const handleJoinRoom = () => {
    if (!validateName(playerName)) return;
    if (joinCode.length !== 6) {
      setJoinError('请输入6位房间码');
      return;
    }
    setJoinError('');
    joinRoom(joinCode.toUpperCase());
  };

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (gamePhase === 'waiting') {
    return (
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-electric-blue to-deep-blue flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-orbitron text-electric-blue mb-2">
              等待对手
            </h1>
            <p className="text-gray-400">房间已创建，请邀请对手加入</p>
          </div>

          <div className="bg-deep-space/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">房间码</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-bold font-orbitron text-electric-blue tracking-wider">
                {roomCode}
              </span>
              <button
                onClick={handleCopyRoomCode}
                className="p-2 rounded-lg bg-deep-blue hover:bg-deep-blue/80 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-success-green" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 text-electric-blue animate-spin" />
            <span className="text-gray-300">
              {opponentName ? `${opponentName} 已加入，准备开始...` : '等待对手加入...'}
            </span>
          </div>

          <button
            onClick={() => useGameStore.getState().leaveRoom()}
            className="btn-secondary w-full"
          >
            取消等待
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-cyan-300 mb-3">
            EchoBattleship
          </h1>
          <p className="text-gray-400 font-orbitron text-sm tracking-wider">
            声纳海战 · 多人对战
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              玩家昵称
            </label>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              placeholder="输入你的昵称（2-12字符）"
              className="input-field"
              maxLength={12}
            />
            {nameError && (
              <p className="mt-2 text-sm text-danger-red">{nameError}</p>
            )}
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={!playerName || playerName.length < 2 || playerName.length > 12}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            创建房间
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-grid-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-gray-500 bg-card-dark">或</span>
            </div>
          </div>

          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              加入房间
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                placeholder="输入6位房间码"
                className="input-field text-center font-orbitron text-xl tracking-widest"
                maxLength={6}
              />
              {joinError && (
                <p className="text-sm text-danger-red">{joinError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinInput(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 6 || !playerName || playerName.length < 2}
                  className="btn-primary flex-1"
                >
                  加入
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-grid-line">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">游戏说明</h3>
          <ul className="text-sm text-gray-500 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-electric-blue">•</span>
              点击敌方海域发射声纳脉冲探测船只位置
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning-orange">•</span>
              根据回声强度（HIT/CLOSE/WARM/COLD）推断位置
            </li>
            <li className="flex items-start gap-2">
              <span className="text-danger-red">•</span>
              击沉对方所有船只即可获胜
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MenuScreen;
