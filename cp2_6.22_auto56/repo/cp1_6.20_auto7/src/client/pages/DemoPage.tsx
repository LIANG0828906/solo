import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, ThumbsDown, MessageSquare, Send, Gamepad2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Demo, Feedback } from '../types';
import { cn } from '../lib/utils';

export const DemoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [hasVoted, setHasVoted] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      fetchDemo(id);
    }
  }, [id]);

  const fetchDemo = async (demoId: string) => {
    try {
      const response = await fetch(`/api/demos/${demoId}`);
      const data = await response.json();
      setDemo(data.demo);
    } catch (error) {
      console.error('Failed to fetch demo:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (type: 'like' | 'dislike' | 'text', content?: string) => {
    if (!demo || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const feedback: Omit<Feedback, 'id' | 'timestamp'> = {
        demoId: demo.id,
        type,
        content
      };

      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });

      if (type === 'like') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#4ade80', '#86efac']
        });
      }

      if (type !== 'text') {
        setHasVoted(type);
      } else {
        setFeedbackText('');
      }

      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      submitFeedback('text', feedbackText.trim());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="animate-pulse text-[#e94560] text-xl">加载中...</div>
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-white text-xl mb-4">Demo不存在</div>
          <p className="text-gray-400">请检查链接是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {showThanks && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          感谢您的反馈！
        </div>
      )}

      <header className="bg-[#16213e]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-[#e94560]" />
            <div>
              <h1 className="text-lg font-bold text-white">{demo.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#16213e] rounded-2xl overflow-hidden border border-white/10 mb-8">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              poster={demo.coverImage}
            >
              <source src={demo.videoUrl} type="video/mp4" />
              <img src={demo.coverImage} alt={demo.title} className="w-full h-full object-cover" />
            </video>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              静音播放
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-300 leading-relaxed">{demo.description}</p>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            您觉得这个Demo怎么样？
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => submitFeedback('like')}
              disabled={isSubmitting}
              className={cn(
                'flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300',
                hasVoted === 'like'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                  : 'bg-[#1a1a2e] text-green-400 border-2 border-green-400/30 hover:border-green-400 hover:bg-green-400/10 hover:scale-105'
              )}
            >
              <Heart className={cn('w-6 h-6', hasVoted === 'like' && 'fill-current')} />
              喜欢
              <span className="text-sm opacity-70">({demo.likes})</span>
            </button>

            <button
              onClick={() => submitFeedback('dislike')}
              disabled={isSubmitting}
              className={cn(
                'flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300',
                hasVoted === 'dislike'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-[#1a1a2e] text-red-400 border-2 border-red-400/30 hover:border-red-400 hover:bg-red-400/10 hover:scale-105'
              )}
            >
              <ThumbsDown className="w-6 h-6" />
              不喜欢
              <span className="text-sm opacity-70">({demo.dislikes})</span>
            </button>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#e94560]" />
              留下您的文字反馈
            </h3>
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="告诉开发者您的想法..."
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] resize-none transition-all"
                rows={4}
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!feedbackText.trim() || isSubmitting}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-300',
                    feedbackText.trim() && !isSubmitting
                      ? 'bg-[#e94560] text-white hover:bg-[#e94560]/90 hover:shadow-lg hover:shadow-[#e94560]/30'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                  发送反馈
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>您的反馈将实时发送给开发者</p>
        </footer>
      </main>
    </div>
  );
};
