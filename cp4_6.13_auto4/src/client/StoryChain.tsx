import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Send, Lock, PenTool } from 'lucide-react';

interface StoryChainProps {
  storyId: string;
  userId: string;
  isAdmin: boolean;
}

interface PromptData {
  hint: string;
  isMyTurn: boolean;
  isLocked: boolean;
  currentAuthor: string;
  currentAuthorName: string;
  timeLeft: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 36;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function StoryChain({ storyId, userId, isAdmin }: StoryChainProps) {
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchPrompt = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/prompt?userId=${userId}`);
      if (res.ok) {
        const data: PromptData = await res.json();
        setPromptData(data);
        setTimeLeft(data.timeLeft);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [storyId, userId]);

  useEffect(() => {
    fetchPrompt();
    const interval = setInterval(fetchPrompt, 5000);
    return () => clearInterval(interval);
  }, [fetchPrompt]);

  useEffect(() => {
    if (!promptData || promptData.isLocked || !promptData.isMyTurn) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [promptData, promptData?.isMyTurn, promptData?.isLocked]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/fragments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content: content.trim() }),
      });
      if (res.ok) {
        setContent('');
        await fetchPrompt();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, storyId, userId, fetchPrompt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[#9B8EA8] text-lg animate-pulse">加载中...</span>
      </div>
    );
  }

  if (!promptData) return null;

  const { hint, isMyTurn, isLocked, currentAuthorName } = promptData;

  if (isLocked) {
    return (
      <div className="glass-strong rounded-xl p-8 text-center">
        <Lock className="mx-auto mb-3 text-[#9B8EA8]" size={32} />
        <p className="text-[#9B8EA8] text-lg mb-2">故事已锁定</p>
        <a
          href={`/stories/${storyId}/timeline`}
          className="text-[#D4722A] underline hover:opacity-80"
        >
          查看时间线
        </a>
      </div>
    );
  }

  const dashOffset = CIRCUMFERENCE * (1 - timeLeft / 300);

  return (
    <div className="card-hover glass rounded-xl p-6 space-y-5">
      {hint && (
        <div className="bg-[#9B8EA8]/20 rounded-lg p-4 border border-[#9B8EA8]/30">
          <p className="text-[#3D3229] italic text-base leading-relaxed">{hint}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool size={18} className={isMyTurn ? 'text-[#D4722A]' : 'text-[#9B8EA8]'} />
          {isMyTurn ? (
            <span className="text-[#D4722A] font-semibold text-lg">轮到你了</span>
          ) : (
            <span className="text-[#9B8EA8] text-lg">等待 {currentAuthorName} 续写...</span>
          )}
        </div>

        <div className="relative" style={{ width: 80, height: 80 }}>
          <svg width="80" height="80" className="-rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#EDE6D8"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#D4722A"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {timeLeft > 0 ? (
              <span className="text-[#3D3229] text-sm font-medium">
                {formatTime(timeLeft)}
              </span>
            ) : (
              <span className="text-[#D4722A] text-xs font-semibold">时间到</span>
            )}
          </div>
          <Clock size={0} className="hidden" />
        </div>
      </div>

      {isMyTurn && !isLocked && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="续写故事..."
              className="w-full rounded-lg border-2 border-[#EDE6D8] bg-white/60 p-3 text-[#3D3229] placeholder-[#9B8EA8]/60 focus:border-[#D4722A] focus:ring-2 focus:ring-[#D4722A]/30 focus:outline-none resize-none transition-colors"
            />
            <span className="absolute bottom-2 right-3 text-xs text-[#9B8EA8]">
              {content.length}/500
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 rounded-lg bg-[#D4722A] px-5 py-2.5 text-white font-medium hover:bg-[#D4722A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {submitting ? '提交中...' : '提交续写'}
          </button>
        </div>
      )}
    </div>
  );
}
