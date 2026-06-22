import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy,
  LogOut,
  Play,
  CheckCircle,
  Circle,
  X,
  Users,
  Clock,
  Target,
  Users2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import StarryBackground from '../components/StarryBackground';
import PlayerAvatar from '../components/PlayerAvatar';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../hooks/useGameStore';
import { cn } from '../lib/utils';
import type { RoomConfig, RoomState, Player } from '../types';

// Tab类型
type TabType = 'create' | 'join';

// Toast提示类型
interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

/**
 * 大厅页面组件
 * - 包含创建房间和加入房间两个Tab
 * - 进入房间后显示房间等待区
 * - 使用玻璃态卡片样式
 * - 输入聚焦时主题色#00d4ff高亮
 * - 悬浮按钮发光效果
 */
export default function LobbyPage() {
  // ==================== 状态管理 ====================
  // 当前激活的Tab
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // 创建房间表单状态
  const [createNickname, setCreateNickname] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [teamCount, setTeamCount] = useState(2);
  const [createdRoomCode, setCreatedRoomCode] = useState('');

  // 加入房间表单状态
  const [joinNickname, setJoinNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Toast提示列表
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 复制成功状态
  const [copied, setCopied] = useState(false);

  // 表单验证错误
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});

  // ==================== Hooks ====================
  const { socket, isConnected } = useSocket();
  const {
    playerId,
    roomState,
    setPlayerInfo,
    setRoomState,
    setPageState,
    resetGame,
  } = useGameStore();

  // ==================== Toast方法 ====================
  /**
   * 显示Toast提示
   * @param message 提示信息
   * @param type 提示类型
   */
  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  /**
   * 移除Toast提示
   * @param id Toast ID
   */
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ==================== 复制功能 ====================
  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  }, [showToast]);

  // ==================== 表单验证 ====================
  /**
   * 验证创建房间表单
   * @returns 是否通过验证
   */
  const validateCreateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!createNickname.trim()) {
      errors.nickname = '请输入昵称';
    } else if (createNickname.length < 2 || createNickname.length > 12) {
      errors.nickname = '昵称长度需为2-12个字符';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }, [createNickname]);

  /**
   * 验证加入房间表单
   * @returns 是否通过验证
   */
  const validateJoinForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!joinNickname.trim()) {
      errors.nickname = '请输入昵称';
    } else if (joinNickname.length < 2 || joinNickname.length > 12) {
      errors.nickname = '昵称长度需为2-12个字符';
    }

    if (!roomCodeInput.trim()) {
      errors.roomCode = '请输入房间码';
    } else if (roomCodeInput.length !== 6) {
      errors.roomCode = '房间码必须为6位';
    }

    setJoinErrors(errors);
    return Object.keys(errors).length === 0;
  }, [joinNickname, roomCodeInput]);

  // ==================== Socket事件处理 ====================
  useEffect(() => {
    if (!socket) return;

    /**
     * 处理房间创建成功事件
     */
    const handleRoomCreated = (data: { roomCode: string; playerId: string }) => {
      console.log('[Lobby] 房间创建成功:', data);
      setPlayerInfo(data.playerId, createNickname || joinNickname, data.roomCode);
      setCreatedRoomCode(data.roomCode);
      showToast('房间创建成功！', 'success');
    };

    /**
     * 处理加入房间成功事件
     */
    const handleRoomJoined = (data: { room: RoomState; playerId: string }) => {
      console.log('[Lobby] 加入房间成功:', data);
      setPlayerInfo(data.playerId, joinNickname || createNickname, data.room.code);
      setRoomState(data.room);
      showToast('已加入房间', 'success');
    };

    /**
     * 处理房间错误事件
     */
    const handleRoomError = (message: string) => {
      console.error('[Lobby] 房间错误:', message);
      showToast(message, 'error');
    };

    /**
     * 处理房间状态更新事件
     */
    const handleRoomUpdate = (room: typeof roomState) => {
      console.log('[Lobby] 房间状态更新:', room);
      if (room) {
        setRoomState(room);
        if (!createdRoomCode && room.code) {
          setCreatedRoomCode(room.code);
        }
      }
    };

    /**
     * 处理游戏开始事件
     */
    const handleGameStarted = (state: typeof roomState) => {
      console.log('[Lobby] 游戏开始:', state);
      if (state) {
        setRoomState(state);
      }
      setPageState('game');
    };

    // 注册事件监听
    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:error', handleRoomError);
    socket.on('room:update', handleRoomUpdate);
    socket.on('game:started', handleGameStarted);

    // 清理事件监听
    return () => {
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:error', handleRoomError);
      socket.off('room:update', handleRoomUpdate);
      socket.off('game:started', handleGameStarted);
    };
  }, [
    socket,
    createNickname,
    joinNickname,
    createdRoomCode,
    setPlayerInfo,
    setRoomState,
    setPageState,
    showToast,
  ]);

  // ==================== 事件处理函数 ====================
  /**
   * 处理创建房间
   */
  const handleCreateRoom = useCallback(() => {
    if (!validateCreateForm()) return;
    if (!socket || !isConnected) {
      showToast('网络连接异常，请稍后重试', 'error');
      return;
    }

    const config: RoomConfig = {
      totalRounds,
      timePerQuestion,
      teamCount,
    };

    console.log('[Lobby] 创建房间:', { nickname: createNickname, config });
    socket.emit('room:create', { nickname: createNickname.trim(), config });
  }, [validateCreateForm, socket, isConnected, totalRounds, timePerQuestion, teamCount, createNickname, showToast]);

  /**
   * 处理加入房间
   */
  const handleJoinRoom = useCallback(() => {
    if (!validateJoinForm()) return;
    if (!socket || !isConnected) {
      showToast('网络连接异常，请稍后重试', 'error');
      return;
    }

    console.log('[Lobby] 加入房间:', { nickname: joinNickname, roomCode: roomCodeInput });
    socket.emit('room:join', {
      nickname: joinNickname.trim(),
      roomCode: roomCodeInput.toUpperCase(),
    });
  }, [validateJoinForm, socket, isConnected, joinNickname, roomCodeInput, showToast]);

  /**
   * 处理就绪状态切换
   */
  const handleToggleReady = useCallback(() => {
    if (!socket || !roomState) return;
    const currentPlayer = roomState.players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    console.log('[Lobby] 切换就绪状态:', !currentPlayer.isReady);
    socket.emit('player:ready', !currentPlayer.isReady);
  }, [socket, roomState, playerId]);

  /**
   * 处理开始游戏
   */
  const handleStartGame = useCallback(() => {
    if (!socket || !roomState) return;
    if (!roomState.allReady) {
      showToast('请等待所有玩家就绪', 'error');
      return;
    }

    console.log('[Lobby] 开始游戏');
    socket.emit('game:start');
  }, [socket, roomState, showToast]);

  /**
   * 处理离开房间
   */
  const handleLeaveRoom = useCallback(() => {
    if (!socket) return;

    console.log('[Lobby] 离开房间');
    socket.emit('room:leave');
    resetGame();
    setCreatedRoomCode('');
    setRoomCodeInput('');
    showToast('已离开房间', 'info');
  }, [socket, resetGame, showToast]);

  /**
   * 处理房间码输入（自动转大写）
   */
  const handleRoomCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCodeInput(value.slice(0, 6));
  }, []);

  // ==================== 计算属性 ====================
  // 当前玩家信息
  const currentPlayer = useMemo(() => {
    if (!roomState || !playerId) return null;
    return roomState.players.find((p) => p.id === playerId) || null;
  }, [roomState, playerId]);

  // 是否为房主
  const isHost = useMemo(() => currentPlayer?.isHost ?? false, [currentPlayer]);

  // 当前玩家是否就绪
  const isReady = useMemo(() => currentPlayer?.isReady ?? false, [currentPlayer]);

  // 按队伍分组的玩家列表
  const playersByTeam = useMemo(() => {
    if (!roomState) return new Map<string, typeof roomState.players>();
    const map = new Map<string, typeof roomState.players>();
    for (const team of roomState.teams) {
      map.set(team.id, []);
    }
    for (const player of roomState.players) {
      const list = map.get(player.teamId) || [];
      list.push(player);
      map.set(player.teamId, list);
    }
    return map;
  }, [roomState]);

  // 是否处于房间等待区
  const inRoom = useMemo(() => !!roomState, [roomState]);

  // ==================== 渲染 ====================
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 星空背景 */}
      <StarryBackground />

      {/* Toast提示容器 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg backdrop-blur-md border',
              'shadow-lg animate-[slideIn_0.3s_ease-out]',
              {
                'bg-cyber-red/20 border-cyber-red/50 text-cyber-red': toast.type === 'error',
                'bg-cyber-green/20 border-cyber-green/50 text-cyber-green': toast.type === 'success',
                'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue': toast.type === 'info',
              }
            )}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-rajdhani text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {!inRoom ? (
          // ==================== 大厅区域（创建/加入房间） ====================
          <div className="w-full max-w-md page-enter">
            {/* 标题 */}
            <div className="text-center mb-8">
              <h1 className="font-orbitron text-4xl font-bold text-white mb-2">
                <span className="text-cyber-blue">QUIZ</span>
                <span className="text-cyber-purple"> ARENA</span>
              </h1>
              <p className="font-rajdhani text-white/60 text-lg">
                多人知识竞答对战平台
              </p>
            </div>

            {/* 玻璃态卡片容器 */}
            <div className="glass-card p-6">
              {/* Tab切换 */}
              <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg font-orbitron text-sm font-semibold',
                    'transition-all duration-300 flex items-center justify-center gap-2',
                    {
                      'bg-gradient-to-r from-cyber-purple/40 to-cyber-blue/40 text-white shadow-neon-blue':
                        activeTab === 'create',
                      'text-white/50 hover:text-white/80': activeTab !== 'create',
                    }
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  创建房间
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg font-orbitron text-sm font-semibold',
                    'transition-all duration-300 flex items-center justify-center gap-2',
                    {
                      'bg-gradient-to-r from-cyber-purple/40 to-cyber-blue/40 text-white shadow-neon-blue':
                        activeTab === 'join',
                      'text-white/50 hover:text-white/80': activeTab !== 'join',
                    }
                  )}
                >
                  <Users className="w-4 h-4" />
                  加入房间
                </button>
              </div>

              {/* 创建房间Tab */}
              {activeTab === 'create' && (
                <div className="space-y-5">
                  {!createdRoomCode ? (
                    <>
                      {/* 昵称输入 */}
                      <div>
                        <label className="block font-rajdhani text-white/80 text-sm mb-2">
                          昵称 <span className="text-cyber-red">*</span>
                          <span className="text-white/40 ml-2">(2-12字符)</span>
                        </label>
                        <input
                          type="text"
                          value={createNickname}
                          onChange={(e) => setCreateNickname(e.target.value)}
                          placeholder="请输入你的昵称"
                          maxLength={12}
                          className={cn(
                            'w-full px-4 py-3 bg-white/5 border rounded-lg',
                            'font-rajdhani text-white text-base placeholder-white/30',
                            'transition-all duration-300 outline-none',
                            'focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]',
                            createErrors.nickname
                              ? 'border-cyber-red focus:shadow-[0_0_15px_rgba(255,107,107,0.3)]'
                              : 'border-white/20'
                          )}
                        />
                        {createErrors.nickname && (
                          <p className="mt-1 text-cyber-red text-sm font-rajdhani">
                            {createErrors.nickname}
                          </p>
                        )}
                      </div>

                      {/* 回合数选择 */}
                      <div>
                        <label className="block font-rajdhani text-white/80 text-sm mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-cyber-blue" />
                          回合数
                          <span className="ml-auto text-cyber-blue font-bold text-lg">{totalRounds}</span>
                        </label>
                        <input
                          type="range"
                          min={3}
                          max={10}
                          step={1}
                          value={totalRounds}
                          onChange={(e) => setTotalRounds(Number(e.target.value))}
                          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-cyber-blue
                            [&::-webkit-slider-thumb]:shadow-neon-blue
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform
                            [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        <div className="flex justify-between text-white/40 text-xs font-rajdhani mt-1">
                          <span>3</span>
                          <span>10</span>
                        </div>
                      </div>

                      {/* 每题限时选择 */}
                      <div>
                        <label className="block font-rajdhani text-white/80 text-sm mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyber-blue" />
                          每题限时
                          <span className="ml-auto text-cyber-blue font-bold text-lg">{timePerQuestion}秒</span>
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={60}
                          step={5}
                          value={timePerQuestion}
                          onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-cyber-blue
                            [&::-webkit-slider-thumb]:shadow-neon-blue
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform
                            [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        <div className="flex justify-between text-white/40 text-xs font-rajdhani mt-1">
                          <span>10秒</span>
                          <span>60秒</span>
                        </div>
                      </div>

                      {/* 队伍数选择 */}
                      <div>
                        <label className="block font-rajdhani text-white/80 text-sm mb-2 flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-cyber-blue" />
                          队伍数
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[2, 3, 4].map((count) => (
                            <button
                              key={count}
                              onClick={() => setTeamCount(count)}
                              className={cn(
                                'py-3 rounded-lg font-orbitron font-semibold transition-all duration-300',
                                'border-2',
                                teamCount === count
                                  ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue shadow-neon-blue'
                                  : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40 hover:text-white/80'
                              )}
                            >
                              {count}队
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 创建房间按钮 */}
                      <button
                        onClick={handleCreateRoom}
                        disabled={!isConnected}
                        className={cn(
                          'neon-button w-full py-4',
                          !isConnected && 'opacity-50 cursor-not-allowed hover:transform-none'
                        )}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        创建房间
                      </button>
                    </>
                  ) : (
                    // 创建成功显示房间码
                    <div className="text-center py-4">
                      <p className="font-rajdhani text-white/60 mb-4">房间创建成功！分享房间码给好友</p>
                      <div
                        className="relative inline-block mb-6 cursor-pointer group"
                        onClick={() => copyToClipboard(createdRoomCode)}
                      >
                        <div className="font-orbitron text-6xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-blue animate-glow">
                          {createdRoomCode}
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-cyber-blue/20 via-cyber-purple/20 to-cyber-blue/20 rounded-2xl blur-xl -z-10 opacity-50 group-hover:opacity-80 transition-opacity" />
                      </div>
                      <button
                        onClick={() => copyToClipboard(createdRoomCode)}
                        className="neon-button w-full py-3 mb-3"
                      >
                        <Copy className="w-5 h-5 mr-2" />
                        {copied ? '已复制！' : '复制房间码'}
                      </button>
                      <p className="font-rajdhani text-white/40 text-sm">
                        等待玩家加入...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 加入房间Tab */}
              {activeTab === 'join' && (
                <div className="space-y-5">
                  {/* 昵称输入 */}
                  <div>
                    <label className="block font-rajdhani text-white/80 text-sm mb-2">
                      昵称 <span className="text-cyber-red">*</span>
                      <span className="text-white/40 ml-2">(2-12字符)</span>
                    </label>
                    <input
                      type="text"
                      value={joinNickname}
                      onChange={(e) => setJoinNickname(e.target.value)}
                      placeholder="请输入你的昵称"
                      maxLength={12}
                      className={cn(
                        'w-full px-4 py-3 bg-white/5 border rounded-lg',
                        'font-rajdhani text-white text-base placeholder-white/30',
                        'transition-all duration-300 outline-none',
                        'focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]',
                        joinErrors.nickname
                          ? 'border-cyber-red focus:shadow-[0_0_15px_rgba(255,107,107,0.3)]'
                          : 'border-white/20'
                      )}
                    />
                    {joinErrors.nickname && (
                      <p className="mt-1 text-cyber-red text-sm font-rajdhani">
                        {joinErrors.nickname}
                      </p>
                    )}
                  </div>

                  {/* 房间码输入 */}
                  <div>
                    <label className="block font-rajdhani text-white/80 text-sm mb-2">
                      房间码 <span className="text-cyber-red">*</span>
                      <span className="text-white/40 ml-2">(6位)</span>
                    </label>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={handleRoomCodeChange}
                      placeholder="请输入6位房间码"
                      maxLength={6}
                      className={cn(
                        'w-full px-4 py-3 bg-white/5 border rounded-lg',
                        'font-orbitron text-white text-2xl text-center tracking-[0.3em] placeholder-white/30 uppercase',
                        'transition-all duration-300 outline-none',
                        'focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]',
                        joinErrors.roomCode
                          ? 'border-cyber-red focus:shadow-[0_0_15px_rgba(255,107,107,0.3)]'
                          : 'border-white/20'
                      )}
                    />
                    {joinErrors.roomCode && (
                      <p className="mt-1 text-cyber-red text-sm font-rajdhani text-center">
                        {joinErrors.roomCode}
                      </p>
                    )}
                  </div>

                  {/* 加入房间按钮 */}
                  <button
                    onClick={handleJoinRoom}
                    disabled={!isConnected}
                    className={cn(
                      'neon-button w-full py-4',
                      !isConnected && 'opacity-50 cursor-not-allowed hover:transform-none'
                    )}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    加入房间
                  </button>
                </div>
              )}
            </div>

            {/* 连接状态指示 */}
            <div className="mt-4 text-center">
              <span
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-rajdhani',
                  isConnected
                    ? 'bg-cyber-green/20 text-cyber-green'
                    : 'bg-cyber-red/20 text-cyber-red'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red')} />
                {isConnected ? '已连接' : '连接中...'}
              </span>
            </div>
          </div>
        ) : (
          // ==================== 房间等待区 ====================
          <div className="w-full max-w-4xl page-enter">
            {/* 顶部房间信息栏 */}
            <div className="glass-card p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-rajdhani text-white/50 text-sm">房间码</p>
                  <div className="flex items-center gap-3">
                    <span className="font-orbitron text-3xl font-bold text-cyber-blue tracking-wider">
                      {roomState?.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(roomState?.code || '')}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-300',
                        'bg-white/5 hover:bg-cyber-blue/20 border border-white/10 hover:border-cyber-blue/50',
                        copied && 'bg-cyber-green/20 border-cyber-green/50'
                      )}
                      title="复制房间码"
                    >
                      <Copy className={cn('w-5 h-5', copied ? 'text-cyber-green' : 'text-white/70')} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 房间参数 */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white/70">
                  <Target className="w-4 h-4 text-cyber-blue" />
                  <span className="font-rajdhani">{roomState?.config.totalRounds}回合</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4 text-cyber-blue" />
                  <span className="font-rajdhani">{roomState?.config.timePerQuestion}秒/题</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Users2 className="w-4 h-4 text-cyber-blue" />
                  <span className="font-rajdhani">{roomState?.config.teamCount}队</span>
                </div>
              </div>

              {/* 离开房间按钮 */}
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-cyber-red/10 border border-cyber-red/30 text-cyber-red
                  hover:bg-cyber-red/20 hover:border-cyber-red/50 hover:shadow-[0_0_15px_rgba(255,107,107,0.3)]
                  transition-all duration-300 font-rajdhani font-semibold"
              >
                <LogOut className="w-4 h-4" />
                离开房间
              </button>
            </div>

            {/* 队伍成员列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {roomState?.teams.map((team) => {
                const teamPlayers = playersByTeam.get(team.id) || [];
                return (
                  <div key={team.id} className="glass-card p-5">
                    {/* 队伍标题 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color, boxShadow: `0 0 10px ${team.color}` }}
                        />
                        <h3 className="font-orbitron text-lg font-bold text-white">
                          {team.name}
                        </h3>
                      </div>
                      <span className="font-rajdhani text-white/50 text-sm">
                        {teamPlayers.length} 人
                      </span>
                    </div>

                    {/* 队伍成员 */}
                    <div className="space-y-3">
                      {teamPlayers.length === 0 ? (
                        <div className="py-8 text-center text-white/30 font-rajdhani">
                          等待玩家加入...
                        </div>
                      ) : (
                        teamPlayers.map((player) => (
                          <div
                            key={player.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl transition-all duration-300',
                              player.id === playerId
                                ? 'bg-cyber-blue/10 border border-cyber-blue/30'
                                : 'bg-white/5 border border-white/10'
                            )}
                          >
                            <PlayerAvatar
                              nickname={player.nickname}
                              gradient={player.avatarGradient}
                              isReady={player.isReady}
                              isCaptain={player.isCaptain}
                              isHost={player.isHost}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-rajdhani text-white font-semibold truncate">
                                  {player.nickname}
                                </span>
                                {player.id === playerId && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-blue/30 text-cyber-blue font-rajdhani">
                                    我
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {player.isReady ? (
                                  <span className="flex items-center gap-1 text-cyber-green text-sm font-rajdhani">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    已就绪
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-white/40 text-sm font-rajdhani">
                                    <Circle className="w-3.5 h-3.5" />
                                    未就绪
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部操作按钮 */}
            <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="font-rajdhani text-white/60">
                {isHost ? (
                  <span>
                    作为房主，等待所有玩家就绪后开始游戏
                    <span className="ml-2">
                      （{roomState?.players.filter((p) => p.isReady).length}/{roomState?.players.length} 已就绪）
                    </span>
                  </span>
                ) : (
                  <span>点击按钮切换就绪状态</span>
                )}
              </div>

              {isHost ? (
                // 房主：开始游戏按钮
                <button
                  onClick={handleStartGame}
                  disabled={!roomState?.allReady}
                  className={cn(
                    'neon-button py-3 px-8',
                    !roomState?.allReady && 'opacity-40 cursor-not-allowed hover:transform-none'
                  )}
                >
                  <Play className="w-5 h-5 mr-2" />
                  开始游戏
                </button>
              ) : (
                // 非房主：就绪/取消就绪按钮
                <button
                  onClick={handleToggleReady}
                  className={cn(
                    'neon-button py-3 px-8',
                    isReady && 'bg-gradient-to-r from-cyber-green/40 to-cyber-blue/40'
                  )}
                >
                  {isReady ? (
                    <>
                      <Circle className="w-5 h-5 mr-2" />
                      取消就绪
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      准备就绪
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
