import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, ChevronRight, Check, X, Crown, Medal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { challengeApi } from '../../services/api';
import type { Challenge, ChallengeParticipant } from '../habits/types';

export default function ChallengeBoard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [ranking, setRanking] = useState<ChallengeParticipant[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showRankingModal, setShowRankingModal] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = await challengeApi.getChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('加载挑战失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (challengeId: string) => {
    setJoiningId(challengeId);
    try {
      const updated = await challengeApi.joinChallenge(challengeId);
      setChallenges(prev => prev.map(c => c.id === challengeId ? updated : c));
    } catch (error) {
      console.error('加入挑战失败:', error);
    } finally {
      setJoiningId(null);
    }
  };

  const viewRanking = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setRanking(challenge.participants);
    setShowRankingModal(true);
  };

  const getDaysLeft = (endDate: string) => {
    const end = parseISO(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={16} className="text-yellow-400" />;
      case 2: return <Medal size={16} className="text-gray-300" />;
      case 3: return <Medal size={16} className="text-amber-600" />;
      default: return <span className="text-xs text-text-muted font-medium w-4 text-center">{rank}</span>;
    }
  };

  const joinedChallenges = challenges.filter(c => c.joined);
  const availableChallenges = challenges.filter(c => !c.joined);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">社区挑战</h1>

      {joinedChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-warning" />
            我参与的挑战
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {joinedChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-accent/30 hover:border-accent/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                  <h3 className="font-semibold text-text-primary text-lg">{challenge.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{challenge.description}</p>
                  </div>
                <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
                  进行中
                </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    剩余 {getDaysLeft(challenge.endDate)} 天
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {challenge.participantCount} 人参与
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-text-muted">我的进度</span>
                    <span className="text-text-primary font-medium">{challenge.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => viewRanking(challenge)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors font-medium"
                >
                  <Trophy size={16} />
                  查看排行
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Users size={20} className="text-accent" />
          全部挑战
        </h2>
        
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-bg-card rounded-2xl p-5 h-40 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-2/3 mb-3" />
                <div className="h-4 bg-white/5 rounded w-full mb-4" />
                <div className="h-8 bg-white/10 rounded-full mb-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/20 group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg">{challenge.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{challenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(parseISO(challenge.startDate), 'M月d日', { locale: zhCN })} - {format(parseISO(challenge.endDate), 'M月d日', { locale: zhCN })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {challenge.participantCount} 人
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-text-muted">挑战进度</span>
                    <span className="text-text-primary font-medium">{challenge.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success to-success/70 rounded-full transition-all duration-500"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoin(challenge.id)}
                    disabled={joiningId === challenge.id}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 ease-out
                      ${challenge.joined 
                        ? 'bg-success/20 text-success cursor-default'
                        : 'bg-accent hover:bg-accent-hover text-white hover:shadow-lg hover:shadow-accent/30 disabled:opacity-60'
                      }
                    `}
                  >
                    {joiningId === challenge.id ? (
                      <span className="animate-pulse">加入中...</span>
                    ) : challenge.joined ? (
                      <>
                        <Check size={16} />
                        已加入
                      </>
                    ) : (
                      '加入挑战'
                    )}
                  </button>
                  
                  <button
                    onClick={() => viewRanking(challenge)}
                    className="px-4 py-2.5 bg-white/5 text-text-secondary rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Trophy size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRankingModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary">挑战排行</h2>
                <p className="text-sm text-text-secondary mt-1">{selectedChallenge.title}</p>
              </div>
              <button
                onClick={() => setShowRankingModal(false)}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {ranking.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy size={40} className="mx-auto text-text-muted mb-3" />
                  <p className="text-text-secondary">暂无排行数据</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ranking.map((participant, index) => {
                    const isMe = participant.name === '我';
                    return (
                      <div
                        key={participant.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl transition-colors
                          ${isMe ? 'bg-accent/20 border border-accent/30' : 'bg-white/5 hover:bg-white/10'}
                        `}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {getRankIcon(participant.rank)}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${isMe ? 'text-accent' : 'text-text-primary'}`}>
                            {participant.name}
                            {isMe && <span className="text-xs text-accent ml-2">(我)</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-32">
                              <div
                                className={`h-full rounded-full ${isMe ? 'bg-accent' : 'bg-success'}`}
                                style={{ width: `${participant.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted">{participant.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">总参与人数</span>
                <span className="text-text-primary font-medium">{selectedChallenge.participantCount} 人</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
