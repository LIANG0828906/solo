import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ApiService } from '@/services/ApiService';
import { wsService } from '@/services/WebSocketService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationContainer } from '@/components/Notification';
import { RadarChart } from '@/components/RadarChart';
import { CommentCard } from '@/components/CommentCard';
import { FeedbackResponse } from '@/types';

export function FeedbackDashboard() {
  const navigate = useNavigate();
  const [feedbackData, setFeedbackData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const room = useStore((state) => state.room);
  const addNotification = useStore((state) => state.addNotification);
  
  useEffect(() => {
    if (!user || !room) {
      navigate('/login');
      return;
    }
    
    loadFeedback();
    
    wsService.subscribe('review_update', (message) => {
      if (message.data.roomId === room.id) {
        addNotification('有新的评分提交，正在更新...', 'info');
        loadFeedback();
      }
    });
  }, [user, room, navigate]);
  
  const loadFeedback = async () => {
    if (!user || !room) return;
    
    setLoading(true);
    try {
      const data = await ApiService.getFeedback(user.id, room.id);
      setFeedbackData(data);
    } catch {
      addNotification('获取反馈数据失败', 'info');
    }
    setLoading(false);
  };
  
  if (!user || !room) {
    return null;
  }
  
  return (
    <div
      className={`min-h-screen transition-theme duration-300 ${
        theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
      }`}
    >
      <NotificationContainer />
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="p-4 max-w-4xl mx-auto">
        <div
          className={`mb-6 p-6 rounded-lg ${
            theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-2xl font-bold font-inter ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}
              >
                📊 反馈看板
              </h1>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                }`}
              >
                房间码: {room.code} | 昵称: {user.nickname}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-dark-accent1' : 'bg-light-accent1/20'
              }`}
            >
              <span
                className={`text-sm ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-accent1'
                }`}
              >
                共收到 {feedbackData?.totalReviews || 0} 条评价
              </span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div
            className={`text-center py-12 ${
              theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
            }`}
          >
            <div className="animate-spin text-4xl mb-4">⏳</div>
            正在加载反馈数据...
          </div>
        ) : feedbackData ? (
          <>
            <div
              className={`mb-6 p-6 rounded-lg ${
                theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}
              >
                🎯 个人能力雷达图
              </h2>
              
              <div className="flex justify-center">
                <RadarChart data={feedbackData.radarData} size={350} />
              </div>
              
              <div className="mt-6 grid grid-cols-5 gap-2">
                {feedbackData.radarData.map((point) => (
                  <div
                    key={point.dimensionKey}
                    className={`text-center p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-dark-accent1' : 'bg-gray-100'
                    }`}
                  >
                    <div
                      className={`text-xs ${
                        theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                      }`}
                    >
                      {point.dimension}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                      }`}
                      style={{
                        color: point.score <= 2 ? '#e74c3c' : point.score <= 3 ? '#f1c40f' : '#2ecc71',
                      }}
                    >
                      {point.score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div
              className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}
              >
                💬 评语时间线
              </h2>
              
              {feedbackData.comments.length === 0 ? (
                <div
                  className={`text-center py-8 ${
                    theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                  }`}
                >
                  暂无评语，等待其他同学完成互评...
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackData.comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  wsService.disconnect();
                  useStore.getState().reset();
                  navigate('/login');
                }}
                className={`px-6 py-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-dark-accent1 hover:bg-dark-accent1/80 text-dark-text'
                    : 'bg-gray-100 hover:bg-gray-200 text-light-text'
                }`}
              >
                🔄 重新开始
              </button>
            </div>
          </>
        ) : (
          <div
            className={`text-center py-12 ${
              theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
            }`}
          >
            暂无反馈数据
          </div>
        )}
      </div>
    </div>
  );
}