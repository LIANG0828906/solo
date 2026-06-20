import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { apiClient } from '../api/client';
import GameEngine from '../game/GameEngine';
import type { Story } from '../types';

const PlayPage: React.FC = () => {
  const { storyId, shortId } = useParams<{ storyId?: string; shortId?: string }>();
  const navigate = useNavigate();
  const setStory = useGameStore((s) => s.setStory);
  const story = useGameStore((s) => s.story);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: Story;
        if (shortId) {
          data = await apiClient.getStoryByShortId(shortId);
        } else if (storyId) {
          data = await apiClient.getStory(storyId);
        } else {
          navigate('/');
          return;
        }
        setStory(data);
        await apiClient.incrementPlayCount(data.id);
      } catch (err) {
        setError('加载故事失败，请检查链接是否正确');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId, shortId, setStory, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📖</div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 opacity-50">😕</div>
          <p className="text-text-main mb-2">{error || '故事不存在'}</p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-2 rounded-lg text-white transition-all duration-300"
            style={{ backgroundColor: '#e94560' }}
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-highlight transition-colors duration-300 text-sm"
          >
            ← 返回作品列表
          </Link>
        </div>
        <div className="h-[calc(100vh-140px)] min-h-[600px]">
          <GameEngine story={story} />
        </div>
      </div>
    </div>
  );
};

export default PlayPage;
