import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Star,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useKanbanStore } from '@/store/kanbanStore';
import type { VoteSelection } from '@/types';
import ResultChart from './ResultChart';
import { cn } from '@/lib/utils';

const PRIMARY_COLOR = '#4a90d9';
const ACCENT_COLOR = '#ff7b54';
const BG_COLOR = '#1a1f36';
const CARD_COLOR = '#2a2f4a';
const TEXT_COLOR = '#e0e4f0';
const TEXT_MUTED = '#8a8fa8';
const BORDER_COLOR = '#3a3f5a';
const SUCCESS_COLOR = '#4caf50';
const ERROR_COLOR = '#f44336';

export default function VoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { fetchVote, submitVote } = useKanbanStore();
  const votes = useKanbanStore((state) => state.votes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vote = useMemo(() => (id ? fetchVote(id) : undefined), [id, votes, fetchVote]);

  // 状态管理
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [rankedOptions, setRankedOptions] = useState<string[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // 初始化排名选项
  useEffect(() => {
    if (vote && vote.type === 'rank') {
      setRankedOptions(vote.options.map((o) => o.id));
    }
    if (vote && vote.type === 'score') {
      const initial: Record<string, number> = {};
      vote.options.forEach((o) => {
        initial[o.id] = 0;
      });
      setScoreMap(initial);
    }
  }, [vote]);

  // 倒计时逻辑
  useEffect(() => {
    if (!vote) return;

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
  }, [vote]);

  // 判断投票是否已结束
  const isEnded = useMemo(() => {
    if (!vote) return true;
    if (vote.status === 'ended') return true;
    return dayjs(vote.deadline).isBefore(dayjs());
  }, [vote]);

  // 判断投票是否已满员
  const isFull = useMemo(() => {
    if (!vote) return true;
    return vote.currentVoters >= vote.maxVoters;
  }, [vote]);

  // 进度条百分比和颜色
  const progressInfo = useMemo(() => {
    if (!vote) return { percentage: 0, color: SUCCESS_COLOR };
    const percentage = (vote.currentVoters / vote.maxVoters) * 100;
    // 从绿色渐变到红色
    const ratio = percentage / 100;
    const r = Math.round(
      parseInt(SUCCESS_COLOR.slice(1, 3), 16) * (1 - ratio) +
        parseInt(ERROR_COLOR.slice(1, 3), 16) * ratio,
    );
    const g = Math.round(
      parseInt(SUCCESS_COLOR.slice(3, 5), 16) * (1 - ratio) +
        parseInt(ERROR_COLOR.slice(3, 5), 16) * ratio,
    );
    const b = Math.round(
      parseInt(SUCCESS_COLOR.slice(5, 7), 16) * (1 - ratio) +
        parseInt(ERROR_COLOR.slice(5, 7), 16) * ratio,
    );
    return {
      percentage: Math.min(100, percentage),
      color: `rgb(${r}, ${g}, ${b})`,
    };
  }, [vote]);

  // 单选/多选切换
  const toggleOption = (optionId: string) => {
    if (isEnded || isFull) return;

    if (vote?.type === 'single') {
      setSelectedOptions([optionId]);
    } else if (vote?.type === 'multiple') {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    }
  };

  // 排名拖拽开始
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  // 排名拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newRanked = [...rankedOptions];
    const [dragged] = newRanked.splice(dragIndex, 1);
    newRanked.splice(index, 0, dragged);
    setRankedOptions(newRanked);
    setDragIndex(index);
  };

  // 排名拖拽结束
  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // 排名上移/下移按钮
  const moveRank = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rankedOptions.length - 1) return;

    const newRanked = [...rankedOptions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRanked[index], newRanked[targetIndex]] = [newRanked[targetIndex], newRanked[index]];
    setRankedOptions(newRanked);
  };

  // 评分变更
  const handleScoreChange = (optionId: string, value: number) => {
    if (isEnded || isFull) return;
    const maxScore = vote?.maxScore ?? 10;
    const clampedValue = Math.max(0, Math.min(maxScore, value));
    setScoreMap((prev) => ({ ...prev, [optionId]: clampedValue }));
  };

  // 校验是否可以提交
  const canSubmit = useMemo(() => {
    if (!vote || isEnded || isFull) return false;

    switch (vote.type) {
      case 'single':
        return selectedOptions.length === 1;
      case 'multiple':
        return selectedOptions.length >= 1;
      case 'rank':
        return rankedOptions.length === vote.options.length;
      case 'score':
        return Object.values(scoreMap).every((v) => v >= 0);
      default:
        return false;
    }
  }, [vote, isEnded, isFull, selectedOptions, rankedOptions, scoreMap]);

  // 构建提交数据
  const buildSelections = (): VoteSelection[] => {
    if (!vote) return [];

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

  // 提交投票
  const handleSubmit = async () => {
    if (!vote || !id) return;

    // 检查是否结束或满员
    if (isEnded) {
      setError('投票已结束，无法提交');
      return;
    }
    if (isFull) {
      setError('投票人数已满，无法提交');
      return;
    }
    if (!canSubmit) {
      setError('请完成所有选项后再提交');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const selections = buildSelections();
      const result = await submitVote(id, {
        selections,
        userId: 'user-' + Date.now(),
        userName: '匿名用户',
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || '提交失败，请重试');
      }
    } catch {
      setError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vote) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: BG_COLOR }}
      >
        <div className="text-center" style={{ color: TEXT_MUTED }}>
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="text-lg">投票不存在</p>
        </div>
      </div>
    );
  }

  // 已结束或已提交直接显示结果
  if (isEnded || submitted) {
    return (
      <div
        className="min-h-screen px-4 py-8"
        style={{ backgroundColor: BG_COLOR }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold" style={{ color: TEXT_COLOR }}>
              {vote.title}
            </h1>
            <p style={{ color: TEXT_MUTED }}>{vote.description}</p>
            {submitted && !isEnded && (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3"
                style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', color: SUCCESS_COLOR }}
              >
                <CheckCircle size={20} className="animate-bounce" />
                <span>投票提交成功！</span>
              </div>
            )}
          </div>
          <ResultChart vote={vote} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: BG_COLOR }}
    >
      <div className="mx-auto max-w-4xl">
        {/* 标题和描述 */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold" style={{ color: TEXT_COLOR }}>
            {vote.title}
          </h1>
          <p style={{ color: TEXT_MUTED }}>{vote.description}</p>
        </div>

        {/* 进度条和倒计时区域 */}
        <div
          className="mb-6 rounded-xl p-5"
          style={{ backgroundColor: CARD_COLOR }}
        >
          {/* 进度条 */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: TEXT_COLOR }}>
                <Users size={16} />
                <span className="text-sm font-medium">参与人数</span>
              </div>
              <span className="text-sm" style={{ color: TEXT_MUTED }}>
                {vote.currentVoters} / {vote.maxVoters}
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: BORDER_COLOR }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressInfo.percentage}%`,
                  backgroundColor: progressInfo.color,
                }}
              />
            </div>
          </div>

          {/* 倒计时 */}
          <div className="flex items-center gap-2" style={{ color: TEXT_COLOR }}>
            <Clock size={16} />
            <span className="text-sm font-medium">距离截止还有：</span>
            <span
              className="text-sm font-semibold"
              style={{ color: countdown === '已结束' ? ERROR_COLOR : ACCENT_COLOR }}
            >
              {countdown}
            </span>
          </div>
        </div>

        {/* 投票选项区域 */}
        <div
          className="mb-6 rounded-xl p-5"
          style={{ backgroundColor: CARD_COLOR }}
        >
          {/* 单选 */}
          {vote.type === 'single' && (
            <div className="space-y-3">
              {vote.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all duration-200',
                  )}
                  style={{
                    borderColor: selectedOptions.includes(option.id)
                      ? PRIMARY_COLOR
                      : BORDER_COLOR,
                    backgroundColor: selectedOptions.includes(option.id)
                      ? 'rgba(74, 144, 217, 0.1)'
                      : 'transparent',
                  }}
                >
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200"
                    style={{
                      borderColor: selectedOptions.includes(option.id)
                        ? PRIMARY_COLOR
                        : TEXT_MUTED,
                    }}
                  >
                    {selectedOptions.includes(option.id) && (
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      />
                    )}
                  </div>
                  <span style={{ color: TEXT_COLOR }}>{option.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 多选 */}
          {vote.type === 'multiple' && (
            <div className="space-y-3">
              {vote.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all duration-200"
                  style={{
                    borderColor: selectedOptions.includes(option.id)
                      ? PRIMARY_COLOR
                      : BORDER_COLOR,
                    backgroundColor: selectedOptions.includes(option.id)
                      ? 'rgba(74, 144, 217, 0.1)'
                      : 'transparent',
                  }}
                >
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200"
                    style={{
                      borderColor: selectedOptions.includes(option.id)
                        ? PRIMARY_COLOR
                        : TEXT_MUTED,
                      backgroundColor: selectedOptions.includes(option.id)
                        ? PRIMARY_COLOR
                        : 'transparent',
                    }}
                  >
                    {selectedOptions.includes(option.id) && (
                      <CheckCircle size={14} color="white" />
                    )}
                  </div>
                  <span style={{ color: TEXT_COLOR }}>{option.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 排名 */}
          {vote.type === 'rank' && (
            <div className="space-y-2">
              <p className="mb-3 text-sm" style={{ color: TEXT_MUTED }}>
                拖拽或使用上下箭头调整排名顺序（越靠前排名越高）
              </p>
              {rankedOptions.map((optionId, index) => {
                const option = vote.options.find((o) => o.id === optionId);
                if (!option) return null;
                return (
                  <div
                    key={optionId}
                    draggable={!isEnded && !isFull}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200',
                      dragIndex === index && 'opacity-50 shadow-lg',
                    )}
                    style={{
                      borderColor: BORDER_COLOR,
                      cursor: isEnded || isFull ? 'not-allowed' : 'grab',
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}
                    >
                      {index + 1}
                    </div>
                    <GripVertical
                      size={20}
                      style={{ color: TEXT_MUTED, cursor: 'grab' }}
                    />
                    <span className="flex-1" style={{ color: TEXT_COLOR }}>
                      {option.text}
                    </span>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveRank(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 transition-colors duration-200 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronUp size={16} style={{ color: TEXT_MUTED }} />
                      </button>
                      <button
                        onClick={() => moveRank(index, 'down')}
                        disabled={index === rankedOptions.length - 1}
                        className="rounded p-1 transition-colors duration-200 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronDown size={16} style={{ color: TEXT_MUTED }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 评分 */}
          {vote.type === 'score' && (
            <div className="space-y-4">
              {vote.options.map((option) => {
                const score = scoreMap[option.id] ?? 0;
                const maxScore = vote.maxScore ?? 10;
                return (
                  <div
                    key={option.id}
                    className="rounded-lg border-2 p-4"
                    style={{ borderColor: BORDER_COLOR }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span style={{ color: TEXT_COLOR }}>{option.text}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxScore}
                          value={score}
                          onChange={(e) =>
                            handleScoreChange(option.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border px-3 py-1 text-center text-sm"
                          style={{
                            backgroundColor: BG_COLOR,
                            borderColor: BORDER_COLOR,
                            color: TEXT_COLOR,
                          }}
                        />
                        <span className="text-sm" style={{ color: TEXT_MUTED }}>
                          / {maxScore}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={maxScore}
                      step={1}
                      value={score}
                      onChange={(e) =>
                        handleScoreChange(option.id, parseInt(e.target.value))
                      }
                      className="w-full accent-[#4a90d9]"
                      style={{ accentColor: PRIMARY_COLOR }}
                    />
                    <div className="mt-2 flex justify-center gap-1">
                      {Array.from({ length: maxScore }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < score ? ACCENT_COLOR : 'none'}
                          color={i < score ? ACCENT_COLOR : TEXT_MUTED}
                          className="cursor-pointer transition-all duration-200 hover:scale-110"
                          onClick={() => handleScoreChange(option.id, i + 1)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3"
            style={{ backgroundColor: 'rgba(244, 67, 54, 0.15)', color: ERROR_COLOR }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              'rounded-xl px-10 py-3 text-base font-semibold text-white transition-all duration-200',
              canSubmit && !isSubmitting
                ? 'hover:scale-105 hover:shadow-lg active:scale-95'
                : 'cursor-not-allowed opacity-50',
            )}
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {isSubmitting ? '提交中...' : '提交投票'}
          </button>
        </div>
      </div>
    </div>
  );
}
