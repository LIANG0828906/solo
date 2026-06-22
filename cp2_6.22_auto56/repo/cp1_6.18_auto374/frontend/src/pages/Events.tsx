import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EmptyState from '@/components/EmptyState';
import { eventsAPI } from '@/services/api';
import type { Event, CreateEventData } from '@/types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: '春季读书分享会',
    description: '一起分享这个春天读过的好书，交流读书心得，认识志同道合的朋友。',
    date: '2024-04-15T14:00:00Z',
    location: '城市图书馆三楼会议室',
    status: 'upcoming',
    participants: ['1', '2', '3'],
    participantCount: 3,
    maxParticipants: 20,
    createdAt: '2024-03-01',
    creatorId: '2',
  },
  {
    id: '2',
    title: '《三体》主题讨论会',
    description: '深入探讨刘慈欣的科幻巨作《三体》，讨论黑暗森林法则、宇宙社会学等话题。',
    date: '2024-03-20T19:00:00Z',
    location: '线上腾讯会议',
    status: 'ongoing',
    participants: ['1', '2', '3', '4', '5'],
    participantCount: 5,
    maxParticipants: 50,
    createdAt: '2024-02-15',
    creatorId: '3',
  },
  {
    id: '3',
    title: '年终读书总结',
    description: '回顾这一年读过的书，分享你的年度书单和阅读感悟。',
    date: '2023-12-28T15:00:00Z',
    location: '时光咖啡馆',
    status: 'ended',
    participants: ['1', '2', '3', '4', '5', '6', '7', '8'],
    participantCount: 8,
    maxParticipants: 30,
    createdAt: '2023-12-01',
    creatorId: '1',
  },
];

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents();
      setEvents(response.events);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.date) return;

    setSubmitting(true);
    try {
      const response = await eventsAPI.createEvent(formData);
      setEvents([...events, response.event]);
      resetForm();
    } catch (error) {
      const newEvent: Event = {
        id: uuidv4(),
        ...formData,
        status: 'upcoming',
        participants: [],
        participantCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        creatorId: '1',
      } as Event;
      setEvents([newEvent, ...events]);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await eventsAPI.joinEvent(eventId);
      setEvents(events.map((e) => (e.id === eventId ? response.event : e)));
    } catch (error) {
      console.error('Failed to join event:', error);
      setEvents(
        events.map((e) =>
          e.id === eventId
            ? { ...e, participantCount: e.participantCount + 1 }
            : e
        )
      );
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      maxParticipants: undefined,
    });
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return '#3498DB';
      case 'ongoing':
        return '#2ECC71';
      case 'ended':
        return '#E74C3C';
      default:
        return '#3498DB';
    }
  };

  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return '未开始';
      case 'ongoing':
        return '进行中';
      case 'ended':
        return '已结束';
      default:
        return '未开始';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-nord-textDark">活动中心</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-5 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium
            transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建活动
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-nord-textDark">创建活动</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活动标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                  placeholder="请输入活动标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活动描述 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200 resize-none"
                  placeholder="请输入活动描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活动时间 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活动地点
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                  placeholder="请输入活动地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大参与人数
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                  placeholder="不填则不限制"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title || !formData.description || !formData.date}
                  className="flex-1 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">加载中...</div>
      ) : events.length === 0 ? (
        <EmptyState message="暂无活动，来创建第一个吧" />
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="relative pl-10"
              >
                <div
                  className="absolute left-2 top-6 w-4 h-4 rounded-full border-4 border-white shadow-md z-10"
                  style={{ backgroundColor: getStatusColor(event.status) }}
                />
                <div
                  className="w-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ borderLeft: `3px solid ${getStatusColor(event.status)}` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-nord-textDark mb-1">
                          {event.title}
                        </h3>
                        <span
                          className="inline-block px-3 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(event.status) }}
                        >
                          {getStatusText(event.status)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleJoinEvent(event.id)}
                        disabled={event.status === 'ended'}
                        className={`px-4 py-2 rounded-lg font-medium transition-all
                          ${event.status === 'ended'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-nord-accent hover:bg-[#5E81AC] text-white'
                          }`}
                      >
                        {event.status === 'ended' ? '已结束' : '报名参加'}
                      </button>
                    </div>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.participantCount}人参加
                        {event.maxParticipants && ` / ${event.maxParticipants}人`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
