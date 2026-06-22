import { useEffect, useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useSocket } from '@/hooks/useSocket';
import { Team } from '@/types';
import { cn } from '@/lib/utils';
import CelebrationEffect from '@/components/CelebrationEffect';
import ScoreBarChart from '@/components/ScoreBarChart';

/**
 * 结果页面组件
 * - 支持回合结果模式和最终胜利模式两种显示
 * - 根据store中的状态自动切换模式
 * - 监听socket事件进行页面跳转
 */
export default function ResultPage() {
  const { socket } = useSocket();
  const {
    roundResult,
    finalResult,
    roomState,
    playerId,
    setPageState,
    setRoundState,
  } = useGameStore();

  // 当前显示模式：'round' 为回合结果，'final' 为最终胜利
  const [displayMode, setDisplayMode] = useState<'round' | 'final'>('round');
  // 内容切换动画状态
  const [animateIn, setAnimateIn] = useState(true);

  // 判断当前玩家是否为房主
  const isHost = roomState?.players.find((p) => p.id === playerId)?.isHost ?? false;

  // 监听game:newRound事件，切换回游戏页面
  useEffect(() => {
    if (!socket) return;

    const handleNewRound = (round: Parameters<typeof setRoundState>[0]) => {
      setAnimateIn(false);
      setTimeout(() => {
        setRoundState(round);
        setPageState('game');
      }, 300);
    };

    socket.on('game:newRound', handleNewRound);
    return () => {
      socket.off('game:newRound', handleNewRound);
    };
  }, [socket, setRoundState, setPageState]);

  // 根据store状态更新显示模式
  useEffect(() => {
    if (finalResult) {
      setAnimateIn(false);
      setTimeout(() => {
        setDisplayMode('final');
        setAnimateIn(true);
      }, 300);
    } else if (roundResult) {
      setDisplayMode('round');
      setAnimateIn(true);
    }
  }, [finalResult, roundResult]);

  // 触发内容进入动画
  useEffect(() => {
    setAnimateIn(true);
  }, [displayMode]);

  // 处理下一回合按钮点击
  const handleNextRound = () => {
    if (!socket) return;
    socket.emit('game:nextRound');
  };

  // 处理返回大厅按钮点击
  const handleBackToLobby = () => {
    setPageState('lobby');
  };

  // 获取队伍信息通过teamId
  const getTeamById = (teamId: string): Team | undefined => {
    return roomState?.teams.find((t) => t.id === teamId);
  };

  // 渲染回合结果模式
  const renderRoundResult = () => {
    if (!roundResult || !roomState) return null;

    const { question, roundNumber, teamAnswers, teamScores } = roundResult;
    const correctAnswerText = question.options[question.correctAnswerId];

    // 构建用于柱状图的队伍数据（包含最新积分）
    const teamsWithScores: Team[] = roomState.teams.map((team) => {
      const scoreEntry = teamScores.find((s) => s.teamId === team.id);
      return {
        ...team,
        score: scoreEntry?.score ?? team.score,
      };
    });

    return (
      <div
        className={cn(
          'w-full max-w-4xl mx-auto px-4 py-8 transition-all duration-500 ease-out',
          animateIn
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* 顶部标题 */}
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-4xl font-bold text-cyber-blue mb-2 animate-glow">
            第 {roundNumber} 回合结果
          </h1>
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-cyber-blue to-transparent" />
        </div>

        {/* 题目与关键词区域 */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-orbitron text-lg font-bold text-cyber-yellow mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyber-yellow rounded-full" />
            本题关键词
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {question.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-cyber-purple/20 border border-cyber-purple/50 rounded-lg font-rajdhani text-white text-lg"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'pageEnter 0.5s ease-out forwards',
                  opacity: 0,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* 选项列表 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {question.options.map((option, index) => {
              const isCorrect = index === question.correctAnswerId;
              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-300',
                    isCorrect
                      ? 'bg-cyber-green/20 border-cyber-green shadow-neon-green'
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center font-orbitron font-bold text-sm',
                        isCorrect
                          ? 'bg-cyber-green text-space-dark'
                          : 'bg-white/10 text-white/60'
                      )}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span
                      className={cn(
                        'font-rajdhani text-lg',
                        isCorrect ? 'text-cyber-green font-bold' : 'text-white/80'
                      )}
                    >
                      {option}
                    </span>
                    {isCorrect && (
                      <span className="ml-auto text-cyber-green text-xl">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 正确答案与解析 */}
          <div className="p-5 bg-cyber-green/10 border border-cyber-green/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-cyber-green text-space-dark rounded-md font-orbitron text-sm font-bold">
                正确答案
              </span>
              <span className="font-rajdhani text-cyber-green text-xl font-bold">
                {correctAnswerText}
              </span>
            </div>
            <p className="font-rajdhani text-white/80 leading-relaxed">
              <span className="text-cyber-yellow font-semibold">解析：</span>
              {question.explanation}
            </p>
          </div>
        </div>

        {/* 各队作答情况表格 */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-orbitron text-lg font-bold text-cyber-blue mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyber-blue rounded-full" />
            各队作答情况
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-orbitron text-sm text-cyber-blue font-semibold">
                    队伍
                  </th>
                  <th className="text-left py-3 px-4 font-orbitron text-sm text-cyber-blue font-semibold">
                    答案
                  </th>
                  <th className="text-center py-3 px-4 font-orbitron text-sm text-cyber-blue font-semibold">
                    是否正确
                  </th>
                  <th className="text-right py-3 px-4 font-orbitron text-sm text-cyber-blue font-semibold">
                    得分
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamAnswers.map((answer, index) => {
                  const team = getTeamById(answer.teamId);
                  const answerText = question.options[answer.answerId];
                  return (
                    <tr
                      key={answer.teamId}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        animation: 'pageEnter 0.4s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team?.color ?? '#ffffff' }}
                          />
                          <span className="font-rajdhani font-semibold text-white">
                            {team?.name ?? '未知队伍'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-rajdhani text-white/80">
                        {answerText}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {answer.correct ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyber-green/20 text-cyber-green text-lg">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyber-red/20 text-cyber-red text-lg">
                            ✗
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right font-orbitron text-xl font-bold"
                        style={{
                          color: answer.correct ? '#00ff88' : '#ff6b6b',
                          textShadow: answer.correct
                            ? '0 0 10px #00ff8880'
                            : '0 0 10px #ff6b6b80',
                        }}
                      >
                        {answer.score > 0 ? `+${answer.score}` : answer.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 积分排名柱状图 */}
        <ScoreBarChart teams={teamsWithScores} className="mb-8" />

        {/* 操作区域 */}
        <div className="flex justify-center">
          {isHost ? (
            <button
              onClick={handleNextRound}
              className="neon-button px-10 py-4 text-lg"
            >
              下一回合
            </button>
          ) : (
            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl">
              <span className="font-orbitron text-white/70 tracking-wider">
                等待房主开始下一回合...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染最终胜利模式
  const renderFinalResult = () => {
    if (!finalResult) return null;

    const { winnerTeam, allTeams, totalRounds } = finalResult;

    // 按积分从高到低排序
    const sortedTeams = [...allTeams].sort((a, b) => b.score - a.score);

    return (
      <>
        {/* 全屏庆祝效果 */}
        <CelebrationEffect winnerTeamName={winnerTeam.name} />

        <div
          className={cn(
            'relative z-10 w-full max-w-2xl mx-auto px-4 py-8 transition-all duration-700',
            animateIn
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-90'
          )}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* 顶部占位，为冠军名称留出空间（由CelebrationEffect显示） */}
          <div className="h-80" />

          {/* 比赛总结信息 */}
          <div className="text-center mb-8">
            <p className="font-orbitron text-lg text-white/70">
              共进行 <span className="text-cyber-yellow font-bold">{totalRounds}</span> 回合比拼
            </p>
          </div>

          {/* 最终排名列表 */}
          <div className="glass-card p-6 mb-8">
            <h2 className="font-orbitron text-xl font-bold text-cyber-yellow mb-6 flex items-center gap-2 justify-center">
              <span className="w-1 h-6 bg-cyber-yellow rounded-full" />
              最终排名
              <span className="w-1 h-6 bg-cyber-yellow rounded-full" />
            </h2>

            <div className="space-y-3">
              {sortedTeams.map((team, index) => {
                const rank = index + 1;
                const isChampion = rank === 1;
                const isRunnerUp = rank === 2;
                const isThird = rank === 3;

                return (
                  <div
                    key={team.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                      isChampion
                        ? 'bg-cyber-yellow/15 border-2 border-cyber-yellow/50 shadow-neon-green'
                        : isRunnerUp
                        ? 'bg-gray-400/10 border border-gray-400/30'
                        : isThird
                        ? 'bg-orange-600/10 border border-orange-600/30'
                        : 'bg-white/5 border border-white/10'
                    )}
                    style={{
                      animationDelay: `${index * 100 + 300}ms`,
                      animation: 'pageEnter 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    {/* 排名 */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center font-orbitron text-2xl font-black shrink-0',
                        isChampion
                          ? 'bg-cyber-yellow text-space-dark'
                          : isRunnerUp
                          ? 'bg-gray-400 text-space-dark'
                          : isThird
                          ? 'bg-orange-600 text-white'
                          : 'bg-white/10 text-white/60'
                      )}
                    >
                      {rank}
                    </div>

                    {/* 队伍标识 */}
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          backgroundColor: team.color,
                          boxShadow: `0 0 10px ${team.color}80`,
                        }}
                      />
                      <span
                        className={cn(
                          'font-rajdhani text-xl font-semibold truncate',
                          isChampion ? 'text-cyber-yellow' : 'text-white'
                        )}
                      >
                        {team.name}
                      </span>
                      {isChampion && (
                        <span className="text-2xl animate-bounce">🏆</span>
                      )}
                    </div>

                    {/* 最终积分 */}
                    <div
                      className="font-orbitron text-3xl font-black shrink-0"
                      style={{
                        color: team.color,
                        textShadow: `0 0 15px ${team.color}80`,
                      }}
                    >
                      {team.score}
                    </div>

                    {/* 积分单位 */}
                    <span className="font-orbitron text-sm text-white/40 shrink-0">
                      分
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 返回大厅按钮 */}
          <div className="flex justify-center">
            <button
              onClick={handleBackToLobby}
              className="neon-button px-12 py-4 text-xl"
            >
              返回大厅
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relative w-full min-h-screen">
      {displayMode === 'round' ? renderRoundResult() : renderFinalResult()}
    </div>
  );
}
