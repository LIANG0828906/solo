import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Gamepad2, BarChart3, Users, Zap } from 'lucide-react';
import { DemoCard } from '../components/DemoCard';
import { NotificationBar } from '../components/NotificationBar';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Demo, NotificationItem, Feedback, CrashReport } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { on } = useWebSocket();

  useEffect(() => {
    fetchDemos();
  }, []);

  const fetchDemos = async () => {
    try {
      const response = await fetch('/api/demos');
      const data = await response.json();
      setDemos(data);
    } catch (error) {
      console.error('Failed to fetch demos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = useCallback((feedback: Feedback) => {
    const demo = demos.find((d) => d.id === feedback.demoId);
    if (!demo) return;

    const typeText = feedback.type === 'like' ? '喜欢' : feedback.type === 'dislike' ? '不喜欢' : '文字反馈';
    const message = feedback.type === 'text' && feedback.content
      ? `收到新反馈: "${feedback.content.substring(0, 30)}..."`
      : `收到新的${typeText}反馈`;

    setNotifications((prev) => [
      {
        id: feedback.id,
        type: 'feedback',
        message,
        demoId: feedback.demoId,
        demoTitle: demo.title,
        timestamp: feedback.timestamp
      },
      ...prev
    ]);

    setDemos((prev) =>
      prev.map((d) =>
        d.id === feedback.demoId
          ? {
              ...d,
              likes: d.likes + (feedback.type === 'like' ? 1 : 0),
              dislikes: d.dislikes + (feedback.type === 'dislike' ? 1 : 0),
              feedbackCount: d.feedbackCount + 1
            }
          : d
      )
    );
  }, [demos]);

  const handleCrash = useCallback((crash: CrashReport) => {
    const demo = demos.find((d) => d.id === crash.demoId);
    if (!demo) return;

    setNotifications((prev) => [
      {
        id: crash.id,
        type: 'crash',
        message: `收到崩溃报告: ${crash.message.substring(0, 30)}...`,
        demoId: crash.demoId,
        demoTitle: demo.title,
        timestamp: crash.timestamp
      },
      ...prev
    ]);

    setDemos((prev) =>
      prev.map((d) =>
        d.id === crash.demoId
          ? { ...d, crashCount: d.crashCount + 1 }
          : d
      )
    );
  }, [demos]);

  useEffect(() => {
    on('feedback', handleFeedback);
    on('crash', handleCrash);

    return () => {
      // Cleanup handled by hook
    };
  }, [on, handleFeedback, handleCrash]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const totalLikes = demos.reduce((sum, d) => sum + d.likes, 0);
  const totalDislikes = demos.reduce((sum, d) => sum + d.dislikes, 0);
  const totalFeedbacks = demos.reduce((sum, d) => sum + d.feedbackCount, 0);
  const totalCrashes = demos.reduce((sum, d) => sum + d.crashCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="animate-pulse text-[#e94560] text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <NotificationBar
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <header className="bg-[#16213e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-[#e94560]" />
              <div>
                <h1 className="text-2xl font-bold text-white">开发者仪表盘</h1>
                <p className="text-gray-400 text-sm">实时监控您的游戏Demo反馈</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 bg-[#e94560] hover:bg-[#e94560]/90 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#e94560]/30"
            >
              <Plus className="w-5 h-5" />
              上传Demo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-400/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">总喜欢</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalLikes}</div>
          </div>

          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-400/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">总不喜欢</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalDislikes}</div>
          </div>

          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-400/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">文字反馈</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalFeedbacks}</div>
          </div>

          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-400/20 rounded-lg">
                <Gamepad2 className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-gray-400 text-sm">崩溃报告</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalCrashes}</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">我的Demo</h2>
          {demos.length === 0 ? (
            <div className="bg-[#16213e] rounded-xl p-12 text-center border border-white/10">
              <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">还没有Demo</h3>
              <p className="text-gray-400 mb-6">上传您的第一个游戏Demo，开始收集玩家反馈</p>
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#e94560]/90 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                上传Demo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {demos.map((demo) => (
                <DemoCard key={demo.id} demo={demo} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
