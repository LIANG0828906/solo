import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import Sidebar from '@/components/Sidebar';
import MeetingView from '@/components/MeetingView';
import TaskBoard from '@/components/TaskBoard';
import CreateMeetingModal from '@/components/CreateMeetingModal';
import { meetingWS } from '@/api';
import { ListTodo, Users, Calendar, Clock } from 'lucide-react';

type ViewType = 'meeting' | 'tasks' | 'welcome';

function App() {
  const {
    selectedMeetingId,
    selectMeeting,
    createModalOpen,
    setCreateModalOpen,
    meetings,
    tasks,
    sidebarOpen,
    toggleSidebar,
  } = useAppStore();

  const [currentView, setCurrentView] = useState<ViewType>('welcome');

  useEffect(() => {
    if (selectedMeetingId) {
      setCurrentView('meeting');
    }
  }, [selectedMeetingId]);

  useEffect(() => {
    if (selectedMeetingId && currentView === 'meeting') {
      // meetingWS.connect(selectedMeetingId);
      // return () => meetingWS.disconnect();
    }
  }, [selectedMeetingId, currentView]);

  const handleBack = () => {
    selectMeeting(null);
    setCurrentView('welcome');
  };

  const handleOpenTaskBoard = () => {
    setCurrentView('tasks');
  };

  const handleBackFromTasks = () => {
    if (selectedMeetingId) {
      setCurrentView('meeting');
    } else {
      setCurrentView('welcome');
    }
  };

  return (
    <div className="h-screen w-screen flex bg-dark-800 text-dark-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 rounded-lg glass-card hover:scale-105 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-dark-300"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {currentView === 'welcome' && (
          <WelcomeView onOpenTaskBoard={handleOpenTaskBoard} />
        )}

        {currentView === 'meeting' && selectedMeetingId && (
          <MeetingView
            meetingId={selectedMeetingId}
            onBack={handleBack}
            onOpenTaskBoard={handleOpenTaskBoard}
          />
        )}

        {currentView === 'tasks' && (
          <TaskBoard onBack={handleBackFromTasks} />
        )}
      </main>

      {createModalOpen && (
        <CreateMeetingModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
}

function WelcomeView({ onOpenTaskBoard }: { onOpenTaskBoard: () => void }) {
  const { meetings, tasks, setCreateModalOpen } = useAppStore();

  const upcomingMeetings = meetings
    .filter((m) => m.status === 'upcoming')
    .slice(0, 5);
  const ongoingMeetings = meetings.filter((m) => m.status === 'ongoing');
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-50 mb-2">
            欢迎回来 👋
          </h1>
          <p className="text-dark-400">
            高效管理会议议程，协作更顺畅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Calendar size={20} />}
            label="总会议数"
            value={meetings.length}
            color="text-primary-400"
            bgColor="bg-primary-500/10"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="进行中"
            value={ongoingMeetings.length}
            color="text-green-400"
            bgColor="bg-green-500/10"
          />
          <StatCard
            icon={<Users size={20} />}
            label="待办任务"
            value={todoCount}
            color="text-yellow-400"
            bgColor="bg-yellow-500/10"
          />
          <StatCard
            icon={<ListTodo size={20} />}
            label="进行中任务"
            value={inProgressCount}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">即将开始的会议</h2>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="text-sm text-primary-400 hover:text-primary-300 hover:scale-105 transition-all"
              >
                + 新建会议
              </button>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <Calendar size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无即将开始的会议</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => useAppStore.getState().selectMeeting(meeting.id)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-[1.02]"
                  >
                    <p className="font-medium text-dark-100 text-sm">{meeting.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-dark-400">
                      <span>{meeting.date}</span>
                      <span>{meeting.time}</span>
                      <span>{meeting.participants.length}人</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">任务看板</h2>
              <button
                onClick={onOpenTaskBoard}
                className="text-sm text-primary-400 hover:text-primary-300 hover:scale-105 transition-all"
              >
                查看全部 →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniTaskColumn label="待办" count={tasks.filter((t) => t.status === 'todo').length} color="bg-dark-300" />
              <MiniTaskColumn label="进行中" count={tasks.filter((t) => t.status === 'in-progress').length} color="bg-primary-500" />
              <MiniTaskColumn label="已完成" count={tasks.filter((t) => t.status === 'done').length} color="bg-green-500" />
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-dark-400">
                <ListTodo size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">暂无任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg bg-white/5 text-sm flex items-center justify-between"
                  >
                    <span className="truncate text-dark-200">{task.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === 'high'
                          ? 'priority-high'
                          : task.priority === 'medium'
                          ? 'priority-medium'
                          : 'priority-low'
                      }`}
                    >
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 hover:scale-105 transition-all cursor-default">
      <div className={`w-10 h-10 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-dark-50">{value}</p>
      <p className="text-sm text-dark-400">{label}</p>
    </div>
  );
}

function MiniTaskColumn({ label, count, color }: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/5">
      <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-2`} />
      <p className="text-xs text-dark-400">{label}</p>
      <p className="text-lg font-semibold text-dark-100">{count}</p>
    </div>
  );
}

export default App;
