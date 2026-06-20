import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/client/lib/utils';
import { useGameStore } from '@/client/hooks/useGameStore';
import { useSocket } from '@/client/hooks/useSocket';
import CountdownRing from '@/client/components/CountdownRing';
import OptionCard from '@/client/components/OptionCard';
import StarryBackground from '@/client/components/StarryBackground';
import { playCorrectSound, playWrongSound, playClickSound } from '@/client/utils/audio';
import type { Team, RoundState, RoundResult, FinalResult } from '@/client/types';

/**
 * 游戏主页面组件
 * - 顶部：回合信息 + 环形倒计时
 * - 中间：题目关键词 + 选项卡片
 * - 底部：队伍状态面板 + 求援技能按钮
 */
export default function GamePage() {
  // Socket连接
  const { socket } = useSocket();

  // 从全局Store获取状态
  const {
    playerId,
    roomState,
    roundState,
    setRoundState,
    setRoundResult,
    setFinalResult,
    setPageState,
  } = useGameStore();

  // 本队选中的答案ID
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  // 本队答案是否正确
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  // 是否已提交答案（禁用所有选项）
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  // 倒计时秒数
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  // 求援弹窗显示状态
  const [showHelpRequested, setShowHelpRequested] = useState<boolean>(false);
  // 被求援时的提示信息
  const [helpHint, setHelpHint] = useState<string>('');
  // 求援目标队伍ID
  const [helpFromTeamId, setHelpFromTeamId] = useState<string>('');

  // 获取当前玩家所在队伍
  const currentTeam = roomState?.teams.find((team) =>
    roomState.players.some(
      (player) => player.id === playerId && player.teamId === team.id
    )
  );

  // 当前玩家是否为队长
  const isCaptain = roomState?.players.some(
    (player) => player.id === playerId && player.isCaptain
  );

  // 当前玩家所在队伍是否被求援（需要代为回答）
  const isBeingHelped =
    roundState?.helpActive?.toTeamId === currentTeam?.id &&
    roundState?.helpActive?.fromTeamId !== currentTeam?.id;

  // 当前发出求援的队伍
  const helpingFromTeam = roomState?.teams.find(
    (team) => team.id === roundState?.helpActive?.fromTeamId
  );

  /**
   * 处理选项点击
   * 仅队长可点击，点击后立即禁用所有选项
   */
  const handleOptionClick = useCallback(
    (answerId: number) => {
      if (!socket || hasAnswered) return;

      // 队长才能直接作答，或本队被求援时代为回答
      const canAnswer = isCaptain || isBeingHelped;
      if (!canAnswer) return;

      playClickSound();
      setSelectedAnswerId(answerId);
      setHasAnswered(true);

      if (isBeingHelped && roundState?.helpActive) {
        // 代为回答模式：发送 helpAnswer 事件
        socket.emit('game:helpAnswer', {
          answerId,
          targetTeamId: roundState.helpActive.fromTeamId,
        });
      } else {
        // 正常作答模式
        socket.emit('game:answer', { answerId });
      }
    },
    [socket, hasAnswered, isCaptain, isBeingHelped, roundState]
  );

  /**
   * 处理求援技能使用
   * 仅队长可点击，每队只有一次机会
   */
  const handleUseHelp = useCallback(() => {
    if (!socket || !currentTeam) return;
    if (!isCaptain) return;
    if (currentTeam.helpUsed) return;
    if (hasAnswered) return;

    playClickSound();
    socket.emit('game:useHelp');
  }, [socket, currentTeam, isCaptain, hasAnswered]);

  /**
   * 监听新回合事件
   * 重置本地状态，开始倒计时
   */
  useEffect(() => {
    if (!socket) return;

    const handleNewRound = (round: RoundState) => {
      setRoundState(round);
      setSelectedAnswerId(null);
      setIsAnswerCorrect(null);
      setHasAnswered(false);
      setTimeRemaining(round.timeRemaining);
      setShowHelpRequested(false);
      setHelpHint('');
      setHelpFromTeamId('');
    };

    socket.on('game:newRound', handleNewRound);

    return () => {
      socket.off('game:newRound', handleNewRound);
    };
  }, [socket, setRoundState]);

  /**
   * 监听答题结果事件
   * 更新答题状态，播放对应音效
   */
  useEffect(() => {
    if (!socket) return;

    const handleAnswerResult = (data: {
      teamId: string;
      correct: boolean;
      score: number;
    }) => {
      if (data.teamId === currentTeam?.id) {
        setIsAnswerCorrect(data.correct);
        if (data.correct) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }
    };

    socket.on('game:answerResult', handleAnswerResult);

    return () => {
      socket.off('game:answerResult', handleAnswerResult);
    };
  }, [socket, currentTeam]);

  /**
   * 监听求援请求事件
   * 显示求援弹窗或被求援界面
   */
  useEffect(() => {
    if (!socket) return;

    const handleHelpRequested = (data: {
      fromTeamId: string;
      toTeamId: string;
      hint: string;
    }) => {
      if (data.fromTeamId === currentTeam?.id) {
        // 本队发出的求援
        setShowHelpRequested(true);
      }
      if (data.toTeamId === currentTeam?.id) {
        // 本队被求援
        setHelpFromTeamId(data.fromTeamId);
        setHelpHint(data.hint);
      }
    };

    socket.on('game:helpRequested', handleHelpRequested);

    return () => {
      socket.off('game:helpRequested', handleHelpRequested);
    };
  }, [socket, currentTeam]);

  /**
   * 监听回合结束事件
   * 存储结果并跳转到回合结果页面
   */
  useEffect(() => {
    if (!socket) return;

    const handleRoundEnd = (data: RoundResult) => {
      setRoundResult(data);
    };

    socket.on('game:roundEnd', handleRoundEnd);

    return () => {
      socket.off('game:roundEnd', handleRoundEnd);
    };
  }, [socket, setRoundResult]);

  /**
   * 监听游戏结束事件
   * 存储最终结果并跳转到最终结果页面
   */
  useEffect(() => {
    if (!socket) return;

    const handleGameEnded = (data: FinalResult) => {
      setFinalResult(data);
    };

    socket.on('game:ended', handleGameEnded);

    return () => {
      socket.off('game:ended', handleGameEnded);
    };
  }, [socket, setFinalResult]);

  /**
   * 倒计时计时器
   * 每秒递减，确保UI显示与服务端同步
   */
  useEffect(() => {
    if (!roundState) return;

    setTimeRemaining(roundState.timeRemaining);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundState?.roundNumber, roundState?.timeRemaining]);

  /**
   * 渲染队伍卡片
   */
  const renderTeamCard = (team: Team) => {
    const isCurrentTeam = team.id === currentTeam?.id;
    const answered = team.hasAnswered;

    return (
      <div
        key={team.id}
        className={cn(
          'relative glass-card p-4 min-w-[140px] transition-all duration-300',
          isCurrentTeam && 'ring-2 ring-cyber-blue shadow-neon-blue scale-105'
        )}
      >
        {/* 队伍名称 */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team.color, boxShadow: `0 0 8px ${team.color}` }}
          />
          <span
            className={cn(
              'font-orbitron font-bold text-sm',
              isCurrentTeam ? 'text-cyber-blue' : 'text-white'
            )}
          >
            {team.name}
          </span>
        </div>

        {/* 队伍积分 */}
        <div className="text-2xl font-orbitron font-bold text-white mb-2">
          {team.score}
          <span className="text-sm font-normal text-white/50 ml-1">分</span>
        </div>

        {/* 答题状态 */}
        <div className="flex items-center gap-1 text-xs">
          {answered ? (
            <>
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-cyber-green">已答题</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-white/50">答题中...</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // 没有回合状态时显示加载
  if (!roundState || !roomState || !currentTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyber-blue font-orbitron text-2xl animate-pulse">
          加载中...
        </div>
      </div>
    );
  }

  const totalTime = roomState.config.timePerQuestion;

  return (
    <div className="relative min-h-screen w-full overflow-hidden page-enter">
      {/* 动态星空背景 */}
      <StarryBackground />

      {/* 主内容区域 */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 py-4 max-w-6xl mx-auto">
        {/* ===== 顶部区域：回合信息 + 倒计时 ===== */}
        <div className="flex items-center justify-between mb-4">
          {/* 左侧：回合信息 */}
          <div className="flex flex-col">
            <span className="text-white/50 text-sm font-rajdhani">当前回合</span>
            <div className="flex items-baseline gap-1">
              <span className="font-orbitron font-bold text-4xl text-cyber-blue">
                {roundState.roundNumber}
              </span>
              <span className="text-white/50 font-orbitron text-lg">
                / {roundState.totalRounds}
              </span>
            </div>
          </div>

          {/* 中间：环形倒计时 */}
          <CountdownRing
            timeRemaining={timeRemaining}
            totalTime={totalTime}
            className="mx-4"
          />

          {/* 右侧：占位保持对称 */}
          <div className="w-[100px]" />
        </div>

        {/* ===== 中间偏上：题目展示区 ===== */}
        <div className="flex flex-col items-center mb-6">
          {/* 大标题 */}
          <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white mb-6 text-center">
            猜一猜这是谁？
          </h1>

          {/* 四个关键词发光标签 */}
          <div className="flex flex-wrap justify-center gap-3">
            {roundState.question.keywords.map((keyword, index) => (
              <div
                key={index}
                className="group relative px-5 py-2 rounded-full
                           bg-space-dark/80 border border-cyber-blue/40
                           font-rajdhani font-semibold text-lg text-cyber-blue
                           transition-all duration-300 ease-out
                           hover:scale-110 hover:border-cyber-blue/80
                           hover:bg-cyber-blue/10
                           shadow-[0_0_10px_rgba(0,212,255,0.3)]
                           hover:shadow-[0_0_25px_rgba(0,212,255,0.6)]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="relative z-10">{keyword}</span>
                {/* 发光光晕效果 */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                               bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.15)_0%,transparent_70%)]" />
              </div>
            ))}
          </div>
        </div>

        {/* ===== 中间：选项卡片区域 ===== */}
        <div className="flex-1 flex flex-col justify-center mb-6">
          {/* 非队长且未被求援时显示提示 */}
          {!isCaptain && !isBeingHelped && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                              bg-cyber-yellow/10 border border-cyber-yellow/40
                              text-cyber-yellow font-rajdhani text-base">
                <span className="w-2 h-2 rounded-full bg-cyber-yellow animate-pulse" />
                等待队长作答...
              </span>
            </div>
          )}

          {/* 被求援时显示代为回答提示 */}
          {isBeingHelped && (
            <div className="text-center mb-4">
              <div className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-2xl
                             bg-cyber-purple/20 border-2 border-cyber-purple/50
                             shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <span className="font-orbitron font-bold text-lg text-cyber-purple">
                  🆘 代为回答
                </span>
                <span className="text-white/80 font-rajdhani">
                  {helpingFromTeam?.name} 向你队求援！
                </span>
                {helpHint && (
                  <span className="text-cyber-blue font-rajdhani text-sm">
                    💡 提示：{helpHint}
                  </span>
                )}
                <span className="text-cyber-yellow font-rajdhani text-sm">
                  请选择一个答案帮助他们
                </span>
              </div>
            </div>
          )}

          {/* 求援中提示 */}
          {showHelpRequested && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                              bg-cyber-purple/10 border border-cyber-purple/40
                              text-cyber-purple font-rajdhani text-base">
                <span className="w-2 h-2 rounded-full bg-cyber-purple animate-ping" />
                正在向其他队求援...
              </span>
            </div>
          )}

          {/* 答案结果显示 */}
          {isAnswerCorrect !== null && (
            <div className="text-center mb-4">
              <span
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-orbitron font-bold text-xl',
                  isAnswerCorrect
                    ? 'bg-cyber-green/20 border-2 border-cyber-green text-cyber-green shadow-neon-green'
                    : 'bg-cyber-red/20 border-2 border-cyber-red text-cyber-red shadow-neon-red'
                )}
              >
                {isAnswerCorrect ? (
                  <>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    回答正确！
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    回答错误
                  </>
                )}
              </span>
            </div>
          )}

          {/* 2x2 选项卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roundState.question.options.map((option, index) => {
              const isSelected = selectedAnswerId === index;
              const showCorrect = isAnswerCorrect !== null && index === roundState.question.correctAnswerId;
              const showWrong = isAnswerCorrect === false && isSelected;
              const isDisabled =
                hasAnswered ||
                (!isCaptain && !isBeingHelped) ||
                isAnswerCorrect !== null;

              return (
                <OptionCard
                  key={index}
                  id={index}
                  text={option}
                  isSelected={isSelected}
                  isCorrect={showCorrect}
                  isWrong={showWrong}
                  disabled={isDisabled}
                  onClick={handleOptionClick}
                />
              );
            })}
          </div>
        </div>

        {/* ===== 底部：队伍状态面板 + 求援技能按钮 ===== */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {/* 队伍状态面板 */}
          <div className="flex-1 glass-card p-4">
            <div className="text-white/60 text-sm font-rajdhani mb-3">队伍状态</div>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {roomState.teams.map(renderTeamCard)}
            </div>
          </div>

          {/* 求援技能按钮 */}
          <div className="flex flex-col items-center justify-center glass-card p-4 min-w-[180px]">
            <div className="text-white/60 text-sm font-rajdhani mb-3">求援技能</div>

            {currentTeam.helpUsed ? (
              // 已使用状态
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/20
                               flex items-center justify-center">
                  <span className="text-white/30 text-2xl">🔒</span>
                </div>
                <span className="text-white/40 font-rajdhani text-sm">已使用</span>
              </div>
            ) : isCaptain && !hasAnswered && isAnswerCorrect === null ? (
              // 队长可使用状态
              <button
                onClick={handleUseHelp}
                className="group relative flex flex-col items-center gap-2
                           px-6 py-3 rounded-2xl
                           bg-gradient-to-br from-cyber-purple/30 to-cyber-blue/20
                           border-2 border-cyber-purple/50
                           text-white font-rajdhani
                           transition-all duration-300 ease-out
                           hover:scale-105 hover:border-cyber-purple
                           hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]
                           active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-cyber-purple/30
                               flex items-center justify-center
                               group-hover:bg-cyber-purple/50 transition-colors duration-300
                               shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <span className="text-2xl">🆘</span>
                </div>
                <span className="font-orbitron font-bold text-cyber-purple">使用求援</span>
                <span className="text-white/50 text-xs">剩余 1 次</span>

                {/* 发光光环效果 */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                               pointer-events-none
                               bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)]" />
              </button>
            ) : (
              // 非队长不可使用状态
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/20
                               flex items-center justify-center">
                  <span className="text-white/40 text-2xl">🆘</span>
                </div>
                <span className="text-white/40 font-rajdhani text-sm">
                  {hasAnswered || isAnswerCorrect !== null ? '本轮已结束' : '仅队长可用'}
                </span>
                <span className="text-white/30 text-xs">剩余 1 次</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
