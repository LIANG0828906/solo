import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { postsApi } from '@/services/api';
import type { Post, Platform } from '@/types';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types';
import moment from 'moment';

type ViewMode = 'month' | 'week';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(moment());
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [draggingPost, setDraggingPost] = useState<Post | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postsApi.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const days: { date: moment.Moment; isCurrentMonth: boolean }[] = [];

    const startOfPrevMonth = startOfMonth.clone().subtract(startDay, 'days');
    for (let i = 0; i < startDay; i++) {
      days.push({
        date: startOfPrevMonth.clone().add(i, 'days'),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: startOfMonth.clone().date(i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    const startOfNextMonth = endOfMonth.clone().add(1, 'days');
    for (let i = 0; i < remaining; i++) {
      days.push({
        date: startOfNextMonth.clone().add(i, 'days'),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = currentDate.clone().startOf('week');
    const days: { date: moment.Moment; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.clone().add(i, 'days');
      days.push({ date: day, isCurrentMonth: day.month() === currentDate.month() });
    }
    return days;
  };

  const getPostsForDate = (date: moment.Moment) => {
    return posts.filter((post) => {
      const postDate = moment(post.scheduledAt);
      return postDate.isSame(date, 'day');
    });
  };

  const handleDotClick = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const calendarContainer = (e.currentTarget as HTMLElement).closest('.calendar-container');
    const containerRect = calendarContainer?.getBoundingClientRect();

    let x = rect.left - (containerRect?.left || 0) + rect.width / 2;
    let y = rect.top - (containerRect?.top || 0) + rect.height / 2;

    x = Math.min(Math.max(x, 180), (containerRect?.width || 800) - 180);
    y = Math.min(Math.max(y, 100), (containerRect?.height || 600) - 100);

    setCardPosition({ x, y });
    setSelectedPost(post);
  };

  const closeCard = () => {
    setSelectedPost(null);
  };

  const handleDragStart = (e: React.DragEvent, post: Post) => {
    setDraggingPost(post);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', post.id);
  };

  const handleDragEnd = () => {
    setDraggingPost(null);
    setHoveredDate(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredDate(dateStr);
  };

  const handleDragLeave = () => {
    setHoveredDate(null);
  };

  const handleDrop = async (e: React.DragEvent, date: moment.Moment) => {
    e.preventDefault();
    if (!draggingPost) return;

    try {
      const currentScheduled = moment(draggingPost.scheduledAt);
      const newScheduled = date
        .clone()
        .hour(currentScheduled.hour())
        .minute(currentScheduled.minute());

      const updatedPost = await postsApi.updatePost(draggingPost.id, {
        scheduledAt: newScheduled.toISOString(),
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === draggingPost.id ? updatedPost : p))
      );
    } catch (error) {
      console.error('Failed to update post date:', error);
    } finally {
      setDraggingPost(null);
      setHoveredDate(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await postsApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const goToPrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.clone().subtract(1, 'month'));
    } else {
      setCurrentDate(currentDate.clone().subtract(1, 'week'));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.clone().add(1, 'month'));
    } else {
      setCurrentDate(currentDate.clone().add(1, 'week'));
    }
  };

  const goToToday = () => {
    setCurrentDate(moment());
  };

  const getCountdown = (scheduledAt: string) => {
    const diff = moment(scheduledAt).diff(moment());
    if (diff <= 0) return '已到期';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}天${hours}小时后发布`;
    if (hours > 0) return `${hours}小时${minutes}分钟后发布`;
    return `${minutes}分钟后发布`;
  };

  const days = viewMode === 'month' ? getDaysInMonth() : getWeekDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const renderListView = () => (
    <div className="space-y-3">
      {posts
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/editor/${post.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
                  />
                  <span className="text-xs text-gray-500">{PLATFORM_NAMES[post.platform]}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === 'draft'
                        ? 'bg-gray-100 text-gray-600'
                        : post.status === 'queued'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {post.status === 'draft' ? '草稿' : post.status === 'queued' ? '已排期' : '已发布'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.summary}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{moment(post.scheduledAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
              <Edit2 size={16} className="text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
    </div>
  );

  const renderCalendarView = () => (
    <div className="calendar-container relative bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = date.format('YYYY-MM-DD');
          const dayPosts = getPostsForDate(date);
          const isToday = date.isSame(moment(), 'day');
          const isHovered = hoveredDate === dateStr;

          return (
            <div
              key={idx}
              className={`relative min-h-[100px] md:min-h-[120px] border-b border-r border-gray-100 p-2 transition-all duration-300 ${
                !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
              } ${isHovered ? 'bg-blue-50/50' : ''}`}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => {
                if (!selectedPost) {
                  const scheduledAt = date.format('YYYY-MM-DD') + 'T09:00:00';
                  navigate('/editor', { state: { scheduledAt } });
                }
              }}
            >
              {isHovered && draggingPost && (
                <div className="absolute inset-1 border-2 border-dashed border-blue-400 rounded-lg opacity-60 pointer-events-none z-10 bg-blue-50/30 transition-all duration-200" />
              )}

              <div
                className={`text-sm mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-[#1a2332] text-white font-medium'
                    : isCurrentMonth
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {date.date()}
              </div>

              <div className="space-y-1">
                {dayPosts.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, post)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleDotClick(e, post)}
                    className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-sm ${
                      draggingPost?.id === post.id ? 'opacity-50 scale-95' : ''
                    }`}
                    style={{
                      backgroundColor: `${PLATFORM_COLORS[post.platform]}15`,
                      borderLeft: `3px solid ${PLATFORM_COLORS[post.platform]}`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                      style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
                    />
                    <span className="truncate text-gray-700">{post.title}</span>
                  </div>
                ))}
                {dayPosts.length > 4 && (
                  <div className="text-xs text-gray-400 pl-2">+{dayPosts.length - 4} 更多</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">发布日历</h1>
            <p className="text-gray-500 mt-1">规划和管理您的内容发布计划</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                月视图
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  viewMode === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                周视图
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={goToPrev}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                今天
              </button>
              <button
                onClick={goToNext}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-lg font-semibold text-gray-900 ml-2">
                {viewMode === 'month'
                  ? currentDate.format('YYYY年M月')
                  : currentDate.format('YYYY年M月D周')}
              </span>
            </div>

            <button
              onClick={() => navigate('/editor')}
              className="btn btn-primary gap-2"
            >
              <Plus size={16} />
              新建内容
            </button>
          </div>
        </div>

        {isMobile ? renderListView() : renderCalendarView()}

        {selectedPost && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={closeCard}
              style={{ animation: 'fadeIn 0.2s ease' }}
            />
            <div
              ref={cardRef}
              className="fixed z-50 bg-white rounded-xl shadow-2xl w-80 overflow-hidden"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transformOrigin: `${cardPosition.x}px ${cardPosition.y}px`,
              }}
            >
              <div
                className="px-5 py-4 text-white"
                style={{
                  backgroundColor: PLATFORM_COLORS[selectedPost.platform],
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs opacity-80">{PLATFORM_NAMES[selectedPost.platform]}</p>
                    <h3 className="text-lg font-semibold mt-1">{selectedPost.title}</h3>
                  </div>
                  <button
                    onClick={closeCard}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedPost.summary || '暂无摘要'}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>{moment(selectedPost.scheduledAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        selectedPost.status === 'draft'
                          ? 'bg-gray-100 text-gray-600'
                          : selectedPost.status === 'queued'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {selectedPost.status === 'draft'
                        ? '草稿'
                        : selectedPost.status === 'queued'
                        ? '已排期'
                        : '已发布'}
                    </span>
                    <span className="text-xs text-gray-400">{getCountdown(selectedPost.scheduledAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => navigate(`/editor/${selectedPost.id}`)}
                    className="flex-1 btn btn-secondary gap-1.5 text-sm"
                  >
                    <Edit2 size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPost.id)}
                    className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </Layout>
  );
}
