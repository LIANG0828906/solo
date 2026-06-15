import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, FileText, ListTodo, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMeetingStore } from '@/modules/meeting/MeetingStore';
import { useTaskStore } from '@/modules/task/TaskStore';

export default function Home() {
  const navigate = useNavigate();
  const {
    meetings,
    fetchMeetings,
    deleteMeeting,
    searchKeyword,
    dateFrom,
    dateTo,
    setSearchKeyword,
    setDateFilter,
    getFilteredMeetings,
  } = useMeetingStore();
  const { todos, fetchTodos } = useTaskStore();

  useEffect(() => {
    fetchMeetings();
    fetchTodos();
  }, [fetchMeetings, fetchTodos]);

  const filteredMeetings = useMemo(() => getFilteredMeetings(), [
    getFilteredMeetings,
    searchKeyword,
    dateFrom,
    dateTo,
    meetings,
  ]);

  const getTodoCount = (meetingId: string) => {
    return todos.filter((t) => t.meetingId === meetingId).length;
  };

  const getCompletedCount = (meetingId: string) => {
    return todos.filter((t) => t.meetingId === meetingId && t.status === 'completed').length;
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个会议吗？相关的待办事项也会一并删除。')) {
      await deleteMeeting(id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy年MM月dd日');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <h1 className="text-xl font-semibold">智能会议纪要</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ListTodo size={16} />
              <span className="hidden sm:inline">任务看板</span>
            </button>
            <button
              onClick={() => navigate('/meeting/new')}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-white text-primary font-medium rounded-lg hover:bg-surface-100 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">新建会议</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-surface-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">搜索会议</label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="按标题关键词搜索..."
                  className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-36">
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFilter(e.target.value, dateTo)}
                    className="w-full pl-9 pr-2 py-2 border border-surface-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="w-36">
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateFilter(dateFrom, e.target.value)}
                    className="w-full pl-9 pr-2 py-2 border border-surface-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {(searchKeyword || dateFrom || dateTo) && (
            <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                找到 {filteredMeetings.length} 个会议（共 {meetings.length} 个）
              </span>
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setDateFilter('', '');
                }}
                className="text-primary hover:underline"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm">
              {meetings.length === 0 ? '还没有会议记录' : '没有找到匹配的会议'}
            </p>
            <button
              onClick={() => navigate('/meeting/new')}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus size={16} />
              创建第一个会议
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeetings.map((meeting) => {
              const todoCount = getTodoCount(meeting.id);
              const completedCount = getCompletedCount(meeting.id);
              const progress = todoCount > 0 ? (completedCount / todoCount) * 100 : 0;

              return (
                <div
                  key={meeting.id}
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  className="
                    relative group bg-white rounded-lg border border-surface-200 p-4
                    cursor-pointer transition-all duration-200
                    hover:bg-primary-50 hover:border-primary-200 hover:shadow-md
                  "
                >
                  <button
                    onClick={(e) => handleDelete(e, meeting.id)}
                    className="
                      absolute top-3 right-3 p-1.5 rounded-md
                      opacity-0 group-hover:opacity-100
                      text-gray-400 hover:text-danger hover:bg-white
                      transition-all z-10
                    "
                    title="删除会议"
                  >
                    <Trash2 size={14} />
                  </button>

                  <h3 className="text-sm font-semibold text-gray-800 mb-2 pr-6 line-clamp-2">
                    {meeting.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar size={12} />
                    <span>{formatDate(meeting.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <ListTodo size={12} />
                    <span>
                      {todoCount} 个待办 · 已完成 {completedCount}
                    </span>
                  </div>

                  {todoCount > 0 && (
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
