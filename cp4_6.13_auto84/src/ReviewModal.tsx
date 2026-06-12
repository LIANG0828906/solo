import React, { useState, useEffect } from 'react';
import { StarRating } from './components/StarRating';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, content: string) => void;
}

export function ReviewModal({ isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setContent('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (content.trim()) {
      onSubmit(rating, content.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
          <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-stone-800 mb-6" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          写书评
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              评分
            </label>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} size="lg" interactive onChange={setRating} />
              <span className="text-lg font-bold text-amber-500">{rating}.0</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              书评内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的阅读感受..."
              className="w-full h-36 px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none resize-none transition-all text-stone-700"
            />
            <p className="text-xs text-stone-400 mt-1 text-right">{content.length}/500</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交书评
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
