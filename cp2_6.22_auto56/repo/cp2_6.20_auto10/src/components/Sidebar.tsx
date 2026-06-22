import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Menu, Calendar, Users, Clock } from 'lucide-react';
import { useAppStore } from '@/store';

interface SidebarProps {
  onSelectMeeting: (id: string) => void;
}

export default function Sidebar({ onSelectMeeting }: SidebarProps) {
  const {
    meetings,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    toggleSidebar,
    selectedMeetingId,
    setCreateModalOpen,
  } = useAppStore();

  const [displayCount, setDisplayCount] = useState(50);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const query = searchQuery.toLowerCase();
    const result: typeof meetings = [];
    for (let i = 0; i < meetings.length; i++) {
      if (meetings[i].title.toLowerCase().includes(query)) {
        result.push(meetings[i]);
      }
    }
    return result;
  }, [meetings, searchQuery]);

  const displayedMeetings = useMemo(() => {
    return filteredMeetings.slice(0, displayCount);
  }, [filteredMeetings, displayCount]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setDisplayCount(50);
    }, 150);
  };

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      if (displayCount < filteredMeetings.length) {
        setDisplayCount((prev) => Math.min(prev + 30, filteredMeetings.length));
      }
    }
  };

  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      listEl.addEventListener('scroll', handleScroll);
      return () => listEl.removeEventListener('scroll', handleScroll);
    }
  }, [displayCount, filteredMeetings.length]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleMeetingClick = (id: string) => {
    onSelectMeeting(id);
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-900/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`glass-sidebar h-full flex flex-col z-30 transition-all duration-300 ${
          sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
        } fixed lg:relative inset-y-0 left-0 overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                会议协作
              </h1>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              >
                <Menu size={20} className="text-dark-300" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <Menu size={20} className="text-dark-300" />
            </button>
          )}
        </div>

        {sidebarOpen && (
          <>
            <div className="p-4">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>新建会议</span>
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
                />
                <input
                  type="text"
                  placeholder="搜索会议标题..."
                  defaultValue={searchQuery}
                  onChange={handleSearch}
                  className="input-field pl-10 text-sm"
                />
              </div>
              {searchQuery && (
                <p className="text-xs text-dark-400 mt-2">
                  找到 {filteredMeetings.length} 场会议
                </p>
              )}
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-2 pb-4"
              style={{ willChange: 'transform' }}
            >
              {displayedMeetings.length === 0 ? (
                <div className="text-center text-dark-400 py-8 text-sm">
                  暂无会议记录
                </div>
              ) : (
                <div className="space-y-1">
                  {displayedMeetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      onClick={() => handleMeetingClick(meeting.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedMeetingId === meeting.id
                          ? 'bg-primary-500/20 border border-primary-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm truncate text-dark-100">
                        {meeting.title}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {meeting.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {meeting.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-xs text-dark-400">
                          <Users size={12} />
                          {meeting.participants.length}人
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            meeting.status === 'ongoing'
                              ? 'bg-primary-500/20 text-primary-300'
                              : meeting.status === 'ended'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-dark-400/20 text-dark-300'
                          }`}
                        >
                          {meeting.status === 'ongoing'
                            ? '进行中'
                            : meeting.status === 'ended'
                            ? '已结束'
                            : '待开始'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {displayCount < filteredMeetings.length && (
                <div className="text-center text-dark-500 text-xs py-4">
                  加载中...
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
