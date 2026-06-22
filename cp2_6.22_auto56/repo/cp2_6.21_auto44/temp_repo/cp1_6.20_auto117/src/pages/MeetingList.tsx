import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Edit, Eye, FileText, CheckSquare, ListTodo, X, Loader2 } from 'lucide-react';
import type { Meeting } from '../types';

interface MeetingListItem {
  id: string;
  name: string;
  participants: string[];
  duration: number;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed';
  transcriptionProgress: number;
  summaryCount: {
    topics: number;
    decisions: number;
    todos: number;
  };
}

interface CreateMeetingForm {
  name: string;
  participants: string;
  duration: string;
}

const BATCH_SIZE = 12;
const DEBOUNCE_DELAY = 250;

export default function MeetingList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingForm>({
    name: '',
    participants: '',
    duration: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateMeetingForm>>({});
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_DELAY);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meetings');
      const result = await response.json();
      if (result.success) {
        setMeetings(result.data);
      }
    } catch (error) {
      console.error('获取会议列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const matchesSearch = debouncedSearch === '' ||
        meeting.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        meeting.participants.some(p => p.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const matchesDate = dateFilter === '' ||
        meeting.createdAt.startsWith(dateFilter);
      
      return matchesSearch && matchesDate;
    });
  }, [meetings, debouncedSearch, dateFilter]);

  const visibleMeetings = useMemo(() => {
    return filteredMeetings.slice(0, visibleCount);
  }, [filteredMeetings, visibleCount]);

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && visibleCount < filteredMeetings.length && !loading) {
      setVisibleCount(prev => prev + BATCH_SIZE);
    }
  }, [filteredMeetings.length, visibleCount, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '200px'
    });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [observerCallback]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<CreateMeetingForm> = {};
    if (!formData.name.trim()) {
      errors.name = '请输入会议名称';
    }
    if (!formData.participants.trim()) {
      errors.participants = '请输入参会人员';
    }
    if (!formData.duration || Number(formData.duration) <= 0) {
      errors.duration = '请输入有效的预计时长';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCreateMeeting = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          participants: formData.participants.split('\n').filter(Boolean).map(p => p.trim()),
          duration: Number(formData.duration)
        })
      });
      const result = await response.json();
      if (result.success) {
        setMeetings(prev => [result.data, ...prev]);
        setShowModal(false);
        setFormData({ name: '', participants: '', duration: '' });
        setFormErrors({});
      } else {
        alert(result.message || '创建会议失败');
      }
    } catch (error) {
      console.error('创建会议失败:', error);
      alert('创建会议失败，请稍后重试');
    } finally {
      setCreating(false);
    }
  }, [formData, validateForm]);

  const handleViewDetail = useCallback((id: string) => {
    navigate(`/meeting/${id}`);
  }, [navigate]);

  const handleEdit = useCallback((id: string) => {
    console.log('编辑会议:', id);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }, []);

  const getStatusBadge = useCallback((status: Meeting['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    const labels = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成'
    };
    return { style: styles[status], label: labels[status] };
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
  }, []);

  const handleInputChange = useCallback((field: keyof CreateMeetingForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setFormData({ name: '', participants: '', duration: '' });
    setFormErrors({});
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  }, [handleCloseModal]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a237e]">会议列表</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-lg hover:bg-[#0d165c] transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>创建新会议</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索会议名称或参会人员..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42a5f5] focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42a5f5] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {loading && visibleMeetings.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#1a237e]" size={40} />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">暂无会议数据</p>
          <p className="text-sm mt-2">点击右上角按钮创建第一个会议</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleMeetings.map((meeting) => {
              const statusBadge = getStatusBadge(meeting.status);
              return (
                <div
                  key={meeting.id}
                  className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 ease-in-out"
                  style={{
                    transform: hoveredCard === meeting.id ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hoveredCard === meeting.id
                      ? '0 12px 24px rgba(0, 0, 0, 0.15)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={() => setHoveredCard(meeting.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1 mr-2">
                        {meeting.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                      <Calendar size={16} />
                      <span>{formatDate(meeting.createdAt)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{meeting.duration}分钟</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1 text-orange-600">
                        <FileText size={16} />
                        <span>{meeting.summaryCount.topics}议题</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckSquare size={16} />
                        <span>{meeting.summaryCount.decisions}决策</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <ListTodo size={16} />
                        <span>{meeting.summaryCount.todos}待办</span>
                      </div>
                    </div>

                    {meeting.status === 'processing' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>处理进度</span>
                          <span>{meeting.transcriptionProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${meeting.transcriptionProgress}%`,
                              background: 'linear-gradient(90deg, #42a5f5, #1a237e)'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      {meeting.participants.slice(0, 3).join('、')}
                      {meeting.participants.length > 3 && ` 等${meeting.participants.length}人`}
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-300"
                    style={{
                      opacity: hoveredCard === meeting.id ? 1 : 0,
                      pointerEvents: hoveredCard === meeting.id ? 'auto' : 'none'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(meeting.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      <Edit size={18} />
                      <span>编辑</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(meeting.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#42a5f5] text-white rounded-lg hover:bg-[#1e88e5] transition-colors shadow-lg"
                    >
                      <Eye size={18} />
                      <span>查看详情</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filteredMeetings.length && (
            <div ref={observerRef} className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#1a237e]" size={24} />
            </div>
          )}
        </>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1a237e]">创建新会议</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会议名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入会议名称"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42a5f5] transition-all ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参会人员 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.participants}
                  onChange={(e) => handleInputChange('participants', e.target.value)}
                  placeholder="每行一个参会人员姓名"
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42a5f5] transition-all resize-none ${
                    formErrors.participants ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.participants && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.participants}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预计时长（分钟） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="请输入预计时长"
                  min="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42a5f5] transition-all ${
                    formErrors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.duration && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.duration}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-lg hover:bg-[#0d165c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>创建中...</span>
                    </>
                  ) : (
                    <span>创建</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
