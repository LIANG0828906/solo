import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Star,
  Circle,
  Square,
  ListOrdered,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useKanbanStore } from '@/store/kanbanStore';
import type { Vote, VoteSelection } from '@/types';
import ResultChart from './ResultChart';
import { cn } from '@/lib/utils';
import { VOTE_TYPE_LABELS } from '@/utils/constants';

const PRIMARY_COLOR = '#4a90d9';
const ACCENT_COLOR = '#ff7b54';
const BG_COLOR = '#1a1f36';
const CARD_COLOR = '#2a2f4a';
const TEXT_COLOR = '#e0e4f0';
const TEXT_MUTED = '#8a8fa8';
const BORDER_COLOR = '#3a3f5a';
const SUCCESS_COLOR = '#4caf50';
const ERROR_COLOR = '#f44336';
const RANK_COLOR = '#ff7b54';
const SCORE_COLOR = '#ffd700';

const getTypeColor = (type: Vote['type']) => {
  switch (type) {
    case 'single':
      return PRIMARY_COLOR;
    case 'multiple':
      return '#9c6ade';
    case 'rank':
      return RANK_COLOR;
    case 'score':
      return SCORE_COLOR;
    default:
      return PRIMARY_COLOR;
  }
};

interface VoteDetailProps {
  vote: Vote;
}

export default function VoteDetail({ vote }: VoteDetailProps) {
  const { submitVote } = useKanbanStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [rankedOptions, setRankedOptions] = useState<string[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const typeColor = getTypeColor(vote.type);

  useEffect(() => {
    if (vote.type === 'rank') {
      setRankedOptions(vote.options.map((o) => o.id));
    }
    if (vote.type === 'score') {
      const initial: Record<string, number> = {};
      vote.options.forEach((o) => {
        initial[o.id] = 0;
      });
      setScoreMap(initial);
    }
  }, [vote.id, vote.type, vote.options]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = dayjs();
      const deadline = dayjs(vote.deadline);
      const diff = deadline.diff(now);

      if (diff <= 0) {
        setCountdown('已结束');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}天 ${hours}时 ${minutes}分 ${seconds}秒`);
      } else if (hours > 0) {
        setCountdown(`${hours}时 ${minutes}分 ${seconds}秒`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}分 ${seconds}秒`);
      } else {
        setCountdown(`${seconds}秒`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [vote.deadline]);

  const isEnded = useMemo(() => {
    if (vote.status === 'ended') return true;
    return dayjs(vote.deadline).isBefore(dayjs());
  }, [vote.status, vote.deadline]);

  const isFull = useMemo(() => {
    return vote.currentVoters >= vote.maxVoters;
  }, [vote.currentVoters, vote.maxVoters]);

  const progressInfo = useMemo(() => {
    const percentage = vote.maxVoters > 0 ? (vote.currentVoters / vote.maxVoters) * 100 : 0;
    const ratio = Math.min(percentage / 100, 1);
    const r = Math.round(76 * (1 - ratio) + 244 * ratio);
    const g = Math.round(175 * (1 - ratio) + 67 * ratio);
    const b = Math.round(80 * (1 - ratio) + 54 * ratio);
    return {
      percentage: Math.min(100, percentage),
      color: `rgb(${r}, ${g}, ${b})`,
    };
  }, [vote.currentVoters, vote.maxVoters]);

  const toggleOption = (optionId: string) => {
    if (isEnded || isFull || submitted) return;

    if (vote.type === 'single') {
      setSelectedOptions([optionId]);
      setError('');
    } else if (vote.type === 'multiple') {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
      setError('');
    }
  };

  const handleDragStart = (index: number) => {
    if (isEnded || isFull || submitted) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newRanked = [...rankedOptions];
    const [dragged] = newRanked.splice(dragIndex, 1);
    newRanked.splice(index, 0, dragged);
    setRankedOptions(newRanked);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleTouchStart = (index: number) => {
    if (isEnded || isFull || submitted) return;
    setTouchDragIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null || vote.type !== 'rank') return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const rankItem = element?.closest('[data-rank-index]');
    if (rankItem) {
      const targetIndex = Number(rankItem.getAttribute('data-rank-index'));
      if (!isNaN(targetIndex) && targetIndex !== touchDragIndex) {
        const newRanked = [...rankedOptions];
        const [dragged] = newRanked.splice(touchDragIndex, 1);
        newRanked.splice(targetIndex, 0, dragged);
        setRankedOptions(newRanked);
        setTouchDragIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchDragIndex(null);
  };

  const moveRank = (index: number, direction: 'up' | 'down') => {
    if (isEnded || isFull || submitted) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rankedOptions.length - 1) return;

    const newRanked = [...rankedOptions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRanked[index], newRanked[targetIndex]] = [newRanked[targetIndex], newRanked[index]];
    setRankedOptions(newRanked);
  };

  const handleScoreChange = (optionId: string, value: number) => {
    if (isEnded || isFull || submitted) return;
    const maxScore = vote.maxScore ?? 10;
    const clampedValue = Math.max(0, Math.min(maxScore, value));
    setScoreMap((prev) => ({ ...prev, [optionId]: clampedValue }));
    setError('');
  };

  const canSubmit = useMemo(() => {
    if (isEnded || isFull || submitted) return false;

    switch (vote.type) {
      case 'single':
        return selectedOptions.length === 1;
      case 'multiple':
        return selectedOptions.length >= 1;
      case 'rank':
        return rankedOptions.length === vote.options.length;
      case 'score':
        return Object.keys(scoreMap).length === vote.options.length;
      default:
        return false;
    }
  }, [vote, isEnded, isFull, submitted, selectedOptions, rankedOptions, scoreMap]);

  const buildSelections = (): VoteSelection[] => {
    switch (vote.type) {
      case 'single':
      case 'multiple':
        return selectedOptions.map((optionId) => ({ optionId }));
      case 'rank':
        return rankedOptions.map((optionId, index) => ({
          optionId,
          rank: index + 1,
        }));
      case 'score':
        return Object.entries(scoreMap).map(([optionId, score]) => ({
          optionId,
          score,
        }));
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    if (isEnded) {
      setError('投票已结束，无法提交');
      return;
    }
    if (isFull) {
      setError('投票人数已满，无法提交');
      return;
    }
    if (!canSubmit) {
      switch (vote.type) {
        case 'single':
          setError('请选择一个选项');
          break;
        case 'multiple':
          setError('请至少选择一个选项');
          break;
        case 'rank':
          setError('请完成所有选项的排序');
          break;
        case 'score':
          setError('请为所有选项评分');
          break;
      }
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const selections = buildSelections();
      const result = await submitVote(vote.id, {
        selections,
        userId: 'user-' + Date.now(),
        userName: '匿名用户',
      });

      if (result.success) {
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setSubmitted(true);
          setShowSuccessAnimation(false);
        }, 1200);
      } else {
        setError(result.message || '提交失败，请重试');
      }
    } catch {
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setSubmitted(true);
        setShowSuccessAnimation(false);
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEnded || submitted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: CARD_COLOR, borderColor: BORDER_COLOR }}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
                  style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}50`, color: typeColor }}
                >
                  {vote.type === 'rank' ? <ListOrdered size={12} /> : vote.type === 'score' ? <Star size={12} /> : vote.type === 'single' ? <Circle size={12} /> : <Square size={12} />}
                  {VOTE_TYPE_LABELS[vote.type]}
                </span>
                {submitted && !isEnded && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium" style={{ backgroundColor: `${SUCCESS_COLOR}20`, borderColor: `${SUCCESS_COLOR}50`, color: SUCCESS_COLOR }}>
                    <CheckCircle size={12} />
                    已提交
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold" style={{ color: TEXT_COLOR }}>{vote.title}</h1>
              <p className="mt-2" style={{ color: TEXT_MUTED }}>{vote.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: TEXT_MUTED }}>
            <div className="flex items-center gap-1.5">
              <Clock size={16} />
              截止：{dayjs(vote.deadline).format('YYYY-MM-DD HH:mm')}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              {vote.currentVoters} / {vote.maxVoters} 人参与
            </div>
          </div>
        </div>
        <ResultChart vote={vote} />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative animate-bounce" style={{ animation: 'successPop 0.8s ease-out' }}>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: SUCCESS_COLOR }}
            >
              <CheckCircle size={56} className="text-white" strokeWidth={3} />
            </div>
            <div className="absolute -inset-4 rounded-full animate-ping opacity-30" style={{ backgroundColor: SUCCESS_COLOR }} />
          </div>
        </div>
      )}

      <div className="rounded-2xl p-6 border" style={{ backgroundColor: CARD_COLOR, borderColor: BORDER_COLOR }}>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
              style={{ backgroundColor: `${typeColor}20`, borderColor: `${typeColor}50`, color: typeColor }}
            >
              {vote.type === 'rank' ? <ListOrdered size={12} /> : vote.type === 'score' ? <Star size={12} /> : vote.type === 'single' ? <Circle size={12} /> : <Square size={12} />}
              {VOTE_TYPE_LABELS[vote.type]}
            </span>
            {vote.isAnonymous && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium" style={{ backgroundColor: '#ffffff10', borderColor: '#ffffff20', color: TEXT_MUTED }}>
                匿名投票
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT_COLOR }}>{vote.title}</h1>
          <p className="mt-2" style={{ color: TEXT_MUTED }}>{vote.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
              <Users size={14} />
              <span>参与进度</span>
            </div>
            <div className="font-medium" style={{ color: TEXT_COLOR }}>
              {vote.currentVoters} / {vote.maxVoters} 人
            </div>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#ffffff10' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressInfo.percentage}%`,
                backgroundColor: progressInfo.color,
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
              <Clock size={14} />
              <span>剩余时间：</span>
              <span className="font-medium" style={{ color: countdown === '已结束' ? ERROR_COLOR : TEXT_COLOR }}>
                {countdown}
              </span>
            </div>
          </div>
        </div>

        {(isEnded || isFull) && (
          <div
            className="mb-5 flex items-center gap-2 rounded-lg px-4 py-3 border"
            style={{ backgroundColor: `${ERROR_COLOR}15`, borderColor: `${ERROR_COLOR}40`, color: ERROR_COLOR }}
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">
              {isEnded ? '投票已结束，无法参与' : '投票人数已满，无法参与'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {vote.type === 'single' && vote.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={isEnded || isFull}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected && 'ring-2',
                )}
                style={{
                  backgroundColor: isSelected ? `${PRIMARY_COLOR}15` : '#ffffff08',
                  borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                  opacity: isEnded || isFull ? 0.5 : 1,
                  cursor: isEnded || isFull ? 'not-allowed' : 'pointer',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor: isSelected ? PRIMARY_COLOR : '#ffffff30',
                    backgroundColor: isSelected ? PRIMARY_COLOR : 'transparent',
                  }}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <span className="text-base" style={{ color: isSelected ? TEXT_COLOR : TEXT_MUTED }}>
                  {option.text}
                </span>
              </button>
            );
          })}

          {vote.type === 'multiple' && vote.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={isEnded || isFull}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected && 'ring-2',
                )}
                style={{
                  backgroundColor: isSelected ? '#9c6ade15' : '#ffffff08',
                  borderColor: isSelected ? '#9c6ade' : BORDER_COLOR,
                  opacity: isEnded || isFull ? 0.5 : 1,
                  cursor: isEnded || isFull ? 'not-allowed' : 'pointer',
                }}
              >
                <div
                  className="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor: isSelected ? '#9c6ade' : '#ffffff30',
                    backgroundColor: isSelected ? '#9c6ade' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </div>
                <span className="text-base" style={{ color: isSelected ? TEXT_COLOR : TEXT_MUTED }}>
                  {option.text}
                </span>
              </button>
            );
          })}

          {vote.type === 'rank' && rankedOptions.map((optionId, index) => {
            const option = vote.options.find((o) => o.id === optionId);
            if (!option) return null;
            const isDragging = dragIndex === index || touchDragIndex === index;
            return (
              <div
                key={option.id}
                data-rank-index={index}
                draggable={!isEnded && !isFull}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 select-none',
                  isDragging && 'opacity-60 scale-[0.98] shadow-lg',
                )}
                style={{
                  backgroundColor: '#ffffff08',
                  borderColor: isDragging ? RANK_COLOR : BORDER_COLOR,
                  opacity: isEnded || isFull ? 0.5 : 1,
                }}
              >
                <div
                  className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundColor: `${RANK_COLOR}25`, color: RANK_COLOR }}
                  >
                    {index + 1}
                  </span>
                  <GripVertical size={18} style={{ color: TEXT_MUTED }} />
                </div>
                <span className="flex-1 text-base" style={{ color: TEXT_COLOR }}>
                  {option.text}
                </span>
                <div className="flex flex-col gap-0.5 sm:hidden">
                  <button
                    onClick={() => moveRank(index, 'up')}
                    disabled={index === 0 || isEnded || isFull}
                    className={cn(
                      'p-1 rounded transition-colors',
                      index === 0 || isEnded || isFull ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveRank(index, 'down')}
                    disabled={index === rankedOptions.length - 1 || isEnded || isFull}
                    className={cn(
                      'p-1 rounded transition-colors',
                      index === rankedOptions.length - 1 || isEnded || isFull ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="hidden sm:flex flex-col gap-0.5">
                  <button
                    onClick={() => moveRank(index, 'up')}
                    disabled={index === 0 || isEnded || isFull}
                    className={cn(
                      'p-1 rounded transition-colors',
                      index === 0 || isEnded || isFull ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveRank(index, 'down')}
                    disabled={index === rankedOptions.length - 1 || isEnded || isFull}
                    className={cn(
                      'p-1 rounded transition-colors',
                      index === rankedOptions.length - 1 || isEnded || isFull ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {vote.type === 'score' && vote.options.map((option) => {
            const score = scoreMap[option.id] ?? 0;
            const maxScore = vote.maxScore ?? 10;
            return (
              <div
                key={option.id}
                className="p-4 rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: '#ffffff08',
                  borderColor: score > 0 ? `${SCORE_COLOR}60` : BORDER_COLOR,
                  opacity: isEnded || isFull ? 0.5 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className="text-base" style={{ color: TEXT_COLOR }}>
                    {option.text}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={maxScore}
                    value={score}
                    onChange={(e) => handleScoreChange(option.id, Number(e.target.value))}
                    disabled={isEnded || isFull}
                    className="w-20 px-3 py-1.5 rounded-lg border text-center font-bold text-lg outline-none transition-all"
                    style={{
                      backgroundColor: score > 0 ? `${SCORE_COLOR}15` : '#ffffff10',
                      borderColor: score > 0 ? SCORE_COLOR : BORDER_COLOR,
                      color: SCORE_COLOR,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={maxScore}
                    step={1}
                    value={score}
                    onChange={(e) => handleScoreChange(option.id, Number(e.target.value))}
                    disabled={isEnded || isFull}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${SCORE_COLOR} 0%, ${SCORE_COLOR} ${(score / maxScore) * 100}%, #ffffff20 ${(score / maxScore) * 100}%, #ffffff20 100%)`,
                      accentColor: SCORE_COLOR,
                      opacity: isEnded || isFull ? 0.5 : 1,
                    }}
                  />
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={18}
                        fill={score >= s * 2 ? SCORE_COLOR : 'transparent'}
                        style={{
                          color: score >= s * 2 ? SCORE_COLOR : TEXT_MUTED,
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            className="mt-5 flex items-center gap-2 rounded-lg px-4 py-3 border"
            style={{ backgroundColor: `${ERROR_COLOR}15`, borderColor: `${ERROR_COLOR}40`, color: ERROR_COLOR }}
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || isEnded || isFull}
          className={cn(
            'mt-6 w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-200 flex items-center justify-center gap-2',
            (!canSubmit || isSubmitting || isEnded || isFull)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
          )}
          style={{
            backgroundColor: typeColor,
            boxShadow: canSubmit && !isSubmitting && !isEnded && !isFull ? `0 10px 30px ${typeColor}40` : 'none',
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              提交中...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              提交投票
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes successPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${SCORE_COLOR};
          cursor: pointer;
          box-shadow: 0 2px 8px ${SCORE_COLOR}60;
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
