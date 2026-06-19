import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, ThumbsDown, MessageSquare, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { Heatmap } from '../components/Heatmap';
import { NotificationBar } from '../components/NotificationBar';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Demo, Feedback, CrashReport, HeatmapPoint, NotificationItem } from '../types';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [crashReports, setCrashReports] = useState<CrashReport[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const feedbackListRef = useRef<HTMLDivElement>(null);

  const { on } = useWebSocket(id);

  useEffect(() => {
    if (id) {
      fetchDemoDetail(id);
    }
  }, [id]);

  const fetchDemoDetail = async (demoId: string) => {
    try {
      const response = await fetch(`/api/demos/${demoId}`);
      const data = await response.json();
      setDemo(data.demo);
      setFeedbacks(data.feedbacks || []);
      setCrashReports(data.crashReports || []);
      setHeatmapData(data.heatmapData || []);
    } catch (error) {
      console.error('Failed to fetch demo detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = useCallback((feedback: Feedback) => {
    if (!demo || feedback.demoId !== id) return;

    setNotifications((prev) => [
      {
        id: feedback.id,
        type: 'feedback',
        message: feedback.type === 'text' && feedback.content
          ? `收到新反馈: "${feedback.content.substring(0, 30)}..."`
          : `收到新的${feedback.type === 'like' ? '喜欢' : '不喜欢'}反馈`,
        demoId: feedback.demoId,
        demoTitle: demo.title,
        timestamp: feedback.timestamp
      },
      ...prev
    ]);

    setFeedbacks((prev) => [feedback, ...prev]);

    setDemo((prev) => prev ? {
      ...prev,
      likes: prev.likes + (feedback.type === 'like' ? 1 : 0),
      dislikes: prev.dislikes + (feedback.type === 'dislike' ? 1 : 0),
      feedbackCount: prev.feedbackCount + 1
    } : null);

    setHeatmapData((prev) => [
      ...prev,
      {
        x: Math.random() * 800,
        y: Math.random() * 300,
        value: feedback.type === 'like' ? 30 : feedback.type === 'dislike' ? 20 : 10,
        timestamp: feedback.timestamp
      }
    ]);

    setTimeout(() => {
      if (feedbackListRef.current) {
        feedbackListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }, [demo, id]);

  const handleCrash = useCallback((crash: CrashReport) => {
    if (!demo || crash.demoId !== id) return;

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

    setCrashReports((prev) => [crash, ...prev]);

    setDemo((prev) => prev ? {
      ...prev,
      crashCount: prev.crashCount + 1
    } : null);
  }, [demo, id]);

  useEffect(() => {
    on('feedback', handleFeedback);
    on('crash', handleCrash);

    return () => {};
  }, [on, handleFeedback, handleCrash]);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const copyDemoUrl = async () => {
    if (demo) {
      const url = `${window.location.origin}/demo/${demo.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'like': return { icon: <Heart className="w-4 h-4" />, color: 'text-green-400', label: '喜欢' };
      case 'dislike': return { icon: <ThumbsDown className="w-4 h-4" />, color: 'text-red-400', label: '不喜欢' };
      case 'text': return { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-400', label: '文字反馈' };
      default: return { icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-400', label: type };
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
          <div className="text-white text-xl mb-4">Demo不存在</div>
          <button
            onClick={() => navigate('/')}
            className="text-[#e94560] hover:underline"
          >
            返回仪表盘
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <NotificationBar
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <header className="bg-[#16213e] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                返回
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{demo.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={copyDemoUrl}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-white/20 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制链接'}
              </button>
              <Link
                to={`/demo/${demo.id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-[#e94560] text-white rounded-lg hover:bg-[#e94560]/90 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                预览
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">喜欢</span>
            </div>
            <div className="text-3xl font-bold text-white">{demo.likes}</div>
          </div>
          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <ThumbsDown className="w-5 h-5 text-red-400" />
              <span className="text-gray-400 text-sm">不喜欢</span>
            </div>
            <div className="text-3xl font-bold text-white">{demo.dislikes}</div>
          </div>
          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">文字反馈</span>
            </div>
            <div className="text-3xl font-bold text-white">{demo.feedbackCount}</div>
          </div>
          <div className="bg-[#16213e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">崩溃报告</span>
            </div>
            <div className="text-3xl font-bold text-white">{demo.crashCount}</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">反馈热力图</h2>
          <Heatmap data={heatmapData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#e94560]" />
              反馈列表
              <span className="text-sm font-normal text-gray-400">({feedbacks.length})</span>
            </h2>
            <div
              ref={feedbackListRef}
              className="bg-[#16213e] rounded-xl border border-white/10 max-h-96 overflow-y-auto"
            >
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  暂无反馈数据
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {feedbacks.map((feedback) => {
                    const typeInfo = getFeedbackTypeLabel(feedback.type);
                    return (
                      <div key={feedback.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                            {typeInfo.icon}
                            <span className="text-sm font-medium">{typeInfo.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(feedback.timestamp)}</span>
                        </div>
                        {feedback.content && (
                          <p className="text-gray-300 text-sm">{feedback.content}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              崩溃报告
              <span className="text-sm font-normal text-gray-400">({crashReports.length})</span>
            </h2>
            <div className="bg-[#16213e] rounded-xl border border-white/10 max-h-96 overflow-y-auto">
              {crashReports.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  暂无崩溃报告
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {crashReports.map((crash) => (
                    <div key={crash.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-yellow-400 text-sm font-medium">
                          {crash.message}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(crash.timestamp)}</span>
                      </div>
                      {crash.stack && (
                        <pre className="text-xs text-gray-500 bg-black/30 rounded p-2 overflow-x-auto font-mono">
                          {crash.stack.substring(0, 200)}...
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
