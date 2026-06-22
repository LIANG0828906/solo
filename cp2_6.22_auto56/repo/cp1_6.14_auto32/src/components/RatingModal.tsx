import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: number, comment: string) => void;
  toUserName: string;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  toUserName,
}: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const displayScore = hoverScore || score;

  const handleSubmit = () => {
    if (score === 0) return;
    onSubmit(score, comment);
    setScore(0);
    setHoverScore(0);
    setComment('');
  };

  const handleClose = () => {
    setScore(0);
    setHoverScore(0);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6',
          'animate-fade-slide'
        )}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">评价交换</h2>
        <p className="mt-1 text-sm text-gray-500">
          为 {toUserName} 打分
        </p>

        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1;
            const filled = starValue <= displayScore;
            return (
              <button
                key={i}
                onClick={() => setScore(starValue)}
                onMouseEnter={() => setHoverScore(starValue)}
                onMouseLeave={() => setHoverScore(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-7 w-7',
                    filled
                      ? 'fill-primary text-primary'
                      : 'fill-none text-gray-300'
                  )}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下你的评价…"
          rows={3}
          className={cn(
            'mt-4 w-full resize-none rounded-lg border border-gray-200 p-3',
            'text-sm text-gray-700 placeholder:text-gray-400',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
          )}
        />

        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium',
              'text-gray-600 hover:bg-gray-100 transition-colors'
            )}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={score === 0}
            className={cn(
              'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white',
              'hover:bg-primary-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            提交评价
          </button>
        </div>
      </div>
    </div>
  );
}
