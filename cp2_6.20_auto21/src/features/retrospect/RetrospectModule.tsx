import React, { useState, useMemo, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  User,
  Send,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useRetroStore } from '@/store/useRetroStore';
import type { Comment, Answer, QuestionStats, TemplatePhase } from '@/types';
import { cn } from '@/lib/utils';

const RetrospectModule: React.FC = () => {
  const {
    phases,
    currentPhaseIndex,
    setCurrentPhase,
    questionStats,
    currentUser,
    updateAnswer,
    addComment,
    toggleLike,
    comments,
  } = useRetroStore();

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const currentPhase = phases[currentPhaseIndex];
  const currentPhaseQuestions = currentPhase?.questions ?? [];

  const getUserAnswer = useCallback(
    (questionId: string): Answer | undefined => {
      const stat = questionStats.find((s) => s.questionId === questionId);
      return stat?.answers.find((a) => a.memberId === currentUser.id);
    },
    [questionStats, currentUser.id]
  );

  const getQuestionStats = useCallback(
    (questionId: string): QuestionStats | undefined => {
      return questionStats.find((s) => s.questionId === questionId);
    },
    [questionStats]
  );

  const getAnswerComments = useCallback(
    (answerId: string): Comment[] => {
      return comments.filter((c) => c.answerId === answerId && !c.parentId);
    },
    [comments]
  );

  const handleRatingChange = useCallback(
    (questionId: string, rating: number) => {
      const currentAnswer = getUserAnswer(questionId);
      updateAnswer(questionId, currentAnswer?.content ?? '', rating);
    },
    [getUserAnswer, updateAnswer]
  );

  const handleContentChange = useCallback(
    (questionId: string, content: string) => {
      const currentAnswer = getUserAnswer(questionId);
      updateAnswer(questionId, content, currentAnswer?.rating);
    },
    [getUserAnswer, updateAnswer]
  );

  const handleAddComment = useCallback(
    (answerId: string, parentId?: string) => {
      const key = parentId ? `${answerId}-${parentId}` : answerId;
      const content = commentInputs[key]?.trim();
      if (!content) return;

      addComment(answerId, content, parentId);
      setCommentInputs((prev) => ({ ...prev, [key]: '' }));
      setReplyingTo(null);
    },
    [commentInputs, addComment]
  );

  const handleCommentInputChange = useCallback(
    (key: string, value: string) => {
      setCommentInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const renderRatingStars = (
    questionId: string,
    currentRating: number = 0,
    interactive: boolean = true
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && handleRatingChange(questionId, star)}
            className={cn(
              'transition-all duration-200',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              size={interactive ? 24 : 18}
              className={cn(
                'transition-all duration-200',
                star <= currentRating
                  ? 'star-gold fill-current'
                  : 'text-white/20'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderMiniBarChart = (stat: QuestionStats) => {
    if (stat.questionType !== 'rating') return null;

    const data = stat.ratingDistribution.map((count, index) => ({
      rating: index + 1,
      count,
    }));

    return (
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={8}>
            <defs>
              <linearGradient id={`barGradient-${stat.questionId}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#00bcd4" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00a3b8" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <XAxis type="number" hide />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 35, 50, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} 人`, '评分']}
              labelFormatter={(label) => `${label} 星`}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={`url(#barGradient-${stat.questionId})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderCommentTree = (comment: Comment, answerId: string, depth: number = 0) => {
    return (
      <div
        key={comment.id}
        className={cn(
          'mt-3',
          depth > 0 && 'ml-6 border-l-2 border-white/10 pl-3'
        )}
        style={{ animationDelay: `${depth * 50}ms` }}
      >
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white/90">
                {comment.memberName}
              </span>
              <span className="text-xs text-white/40">
                {new Date(comment.createdAt).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {comment.content}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => toggleLike(comment.id)}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-primary-400 transition-colors"
              >
                <ThumbsUp size={14} />
                <span>{comment.likes}</span>
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-primary-400 transition-colors"
              >
                <MessageSquare size={14} />
                <span>回复</span>
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={commentInputs[`${answerId}-${comment.id}`] ?? ''}
                  onChange={(e) =>
                    handleCommentInputChange(`${answerId}-${comment.id}`, e.target.value)
                  }
                  placeholder="写下你的回复..."
                  className="flex-1 px-3 py-1.5 text-sm bg-dark-400/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50"
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleAddComment(answerId, comment.id)
                  }
                />
                <button
                  type="button"
                  onClick={() => handleAddComment(answerId, comment.id)}
                  className="p-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            )}

            {comment.replies.map((reply) =>
              renderCommentTree(reply, answerId, depth + 1)
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnswerCard = (answer: Answer, stat: QuestionStats) => {
    const answerComments = getAnswerComments(answer.id);
    const isCurrentUser = answer.memberId === currentUser.id;

    return (
      <div
        key={answer.id}
        className="glass-card p-4 glass-card-hover fade-in"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-medium text-white/90">
                {answer.isAnonymous && !isCurrentUser ? '匿名成员' : answer.memberName}
              </span>
              {isCurrentUser && (
                <span className="ml-2 text-xs text-primary-400">(我)</span>
              )}
            </div>
          </div>
          {answer.rating !== undefined && stat.questionType === 'rating' && (
            <div className="flex items-center gap-1">
              {renderRatingStars(stat.questionId, answer.rating, false)}
            </div>
          )}
        </div>

        {answer.content && (
          <p className="text-sm text-white/70 leading-relaxed mb-3">
            {answer.content}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() =>
              answerComments.length > 0 &&
              setReplyingTo(replyingTo === answer.id ? null : answer.id)
            }
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-primary-400 transition-colors"
          >
            <MessageSquare size={14} />
            <span>{answerComments.length} 条评论</span>
          </button>
        </div>

        {replyingTo === answer.id && (
          <div className="mt-3">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={commentInputs[answer.id] ?? ''}
                onChange={(e) => handleCommentInputChange(answer.id, e.target.value)}
                placeholder="写下你的评论..."
                className="flex-1 px-3 py-2 text-sm bg-dark-400/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50"
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleAddComment(answer.id)
                }
              />
              <button
                type="button"
                onClick={() => handleAddComment(answer.id)}
                className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>

            {answerComments.map((comment) =>
              renderCommentTree(comment, answer.id)
            )}
          </div>
        )}
      </div>
    );
  };

  const phaseQuestionCounts = useMemo(() => {
    return phases.map((phase) => ({
      phaseId: phase.id,
      count: phase.questions.length,
    }));
  }, [phases]);

  return (
    <div className="h-full w-full flex gap-4 p-4 bg-dark-500 bg-grid-pattern">
      {/* 左侧阶段列表 - 20% */}
      <aside className="w-[20%] flex-shrink-0 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-white px-2 mb-1">
          复盘阶段
        </h2>
        <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin">
          {phases.map((phase: TemplatePhase, index: number) => {
            const phaseCount = phaseQuestionCounts.find(
              (p) => p.phaseId === phase.id
            )?.count ?? 0;
            const isActive = index === currentPhaseIndex;

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => setCurrentPhase(index)}
                className={cn(
                  'sidebar-indicator glass-card p-4 text-left transition-all duration-300',
                  isActive && 'active bg-white/10 border-primary-500/30',
                  !isActive && 'hover:bg-white/8'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300',
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/5 text-white/60'
                      )}
                    >
                      {phase.order + 1}
                    </span>
                    <span
                      className={cn(
                        'font-medium transition-colors duration-300',
                        isActive ? 'text-white' : 'text-white/70'
                      )}
                    >
                      {phase.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full transition-colors duration-300',
                      isActive
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'bg-white/5 text-white/50'
                    )}
                  >
                    {phaseCount} 题
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 中间问题列表 - 55% */}
      <main className="flex-1 w-[55%] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-semibold text-white">
            {currentPhase?.name || '选择一个阶段'}
          </h2>
          <span className="text-sm text-white/50">
            实时保存中...
          </span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-4">
          {currentPhaseQuestions.map((question, index) => {
            const stat = getQuestionStats(question.id);
            const userAnswer = getUserAnswer(question.id);

            return (
              <div
                key={question.id}
                className={cn(
                  'glass-card p-5 glass-card-hover fade-in animate-stagger-' +
                    (index + 1)
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                        {question.type === 'open' ? '开放性问题' : '评分项'}
                      </span>
                      <span className="text-xs text-white/40">
                        第 {question.order + 1} 题
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-white leading-relaxed">
                      {question.text}
                    </h3>
                  </div>
                </div>

                {question.type === 'rating' && (
                  <div className="mb-4 p-4 bg-dark-400/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        你的评分:
                      </span>
                      {renderRatingStars(
                        question.id,
                        userAnswer?.rating ?? 0
                      )}
                    </div>
                    {userAnswer?.rating && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">团队平均分</span>
                          <span className="font-medium text-primary-400">
                            {stat?.averageRating.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="input-glow">
                  <textarea
                    value={userAnswer?.content ?? ''}
                    onChange={(e) =>
                      handleContentChange(question.id, e.target.value)
                    }
                    placeholder={
                      question.type === 'open'
                        ? '分享你的想法和见解...'
                        : '（可选）补充说明你的评分理由...'
                    }
                    rows={question.type === 'open' ? 4 : 2}
                    className="input-field resize-none"
                  />
                </div>
              </div>
            );
          })}

          {currentPhaseQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <MessageSquare size={48} className="mb-4 opacity-30" />
              <p>当前阶段暂无问题</p>
            </div>
          )}
        </div>
      </main>

      {/* 右侧统计面板 - 25% */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out',
          panelCollapsed ? 'w-12' : 'w-[25%]'
        )}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          {!panelCollapsed && (
            <h2 className="text-lg font-semibold text-white">匿名汇总</h2>
          )}
          <button
            type="button"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            {panelCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {!panelCollapsed && (
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-4">
            {currentPhaseQuestions.map((question, qIndex) => {
              const stat = getQuestionStats(question.id);
              if (!stat) return null;

              return (
                <div
                  key={question.id}
                  className={cn(
                    'glass-card p-4 fade-in animate-stagger-' + (qIndex + 1)
                  )}
                >
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-white/90 line-clamp-2 mb-2">
                      {question.text}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>{stat.answerCount} 人已回答</span>
                      {stat.questionType === 'rating' && (
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-gold-400 fill-current" />
                          {stat.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {stat.questionType === 'rating' && (
                    <div className="mb-4">
                      {renderMiniBarChart(stat)}
                    </div>
                  )}

                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                    {stat.answers
                      .filter((a) => a.content || a.rating !== undefined)
                      .map((answer, aIndex) => (
                        <div
                          key={answer.id}
                          className="fade-in"
                          style={{ animationDelay: `${(qIndex * 3 + aIndex) * 30}ms` }}
                        >
                          {renderAnswerCard(answer, stat)}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
};

export default RetrospectModule;
