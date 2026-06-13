import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, ArrowLeft, Home, Grid3X3, Bell, User, Plus } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import MatchMaking from '@/components/MatchMaking';
import { useAuthStore } from '@/store/authStore';
import type { Task, Skill } from '@/types';
import './TaskSquare.css';

export default function TaskSquare() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('全部');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    tasks.forEach((task, index) => {
      setTimeout(() => {
        setVisibleTasks((prev) => [...prev, task.id]);
      }, index * 50);
    });
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks');
      const serverTasks = response.data;
      
      const formattedTasks: Task[] = serverTasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        requiredSkills: [
          {
            id: `rs-${task.id}`,
            name: task.requiredSkill,
            level: 3,
            hoursPerWeek: 10,
          },
        ],
        estimatedHours: Math.ceil(task.estimatedMinutes / 60),
        publisherId: task.publisherId,
        publisher: {
          id: task.publisherId,
          nickname: '发布用户',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.publisherId}`,
          bio: '',
          skills: [],
        },
        createdAt: task.createdAt,
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '全部' || 
      (statusFilter === '开放中' && task.status === 'open') ||
      (statusFilter === '已申请' && task.status === 'applied') ||
      (statusFilter === '已完成' && task.status === 'completed');
    
    return matchesSearch && matchesStatus;
  });

  const handleApply = (task: Task) => {
    setSelectedTask(task);
    setShowMatchModal(true);
  };

  const handleConfirmMatch = (skill: Skill, exchangeId: string) => {
    console.log('匹配成功：', skill.name, '交换ID：', exchangeId);
    setShowMatchModal(false);
    setSelectedTask(null);
    fetchTasks();
    navigate(`/exchange/${exchangeId}`);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      await axios.post('/api/tasks', {
        publisherId: user.id,
        title: formData.get('title'),
        description: formData.get('description'),
        requiredSkill: formData.get('requiredSkill'),
        estimatedMinutes: parseInt(formData.get('estimatedMinutes') as string) || 60,
      });
      
      setShowCreateModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-20">
      <div className="sticky top-0 z-30 bg-[#1a1a2e]/95 backdrop-blur-md border-b border-[#2a2a4e]">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">任务广场</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="ml-auto flex items-center gap-1 bg-[#e8a838] text-[#16213e] px-3 py-1.5 rounded-lg text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            发布
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#16213e] border border-[#2a2a4e] rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-[#e8a838] transition-colors"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-xl border transition-colors ${
                filterOpen
                  ? 'border-[#e8a838] bg-[#e8a838]/10 text-[#e8a838]'
                  : 'border-[#2a2a4e] bg-[#16213e] text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {filterOpen && (
            <div className="mt-3 p-3 bg-[#16213e] rounded-xl border border-[#2a2a4e]">
              <p className="text-sm text-gray-400 mb-2">筛选状态</p>
              <div className="flex gap-2 flex-wrap">
                {['全部', '开放中', '已申请', '已完成'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      statusFilter === status
                        ? 'border-[#e8a838] bg-[#e8a838]/20 text-[#e8a838]'
                        : 'border-[#2a2a4e] text-gray-300 hover:border-[#e8a838] hover:text-[#e8a838]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="task-masonry">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#16213e] rounded-xl p-5 border border-[#2a2a4e] h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="task-masonry">
            {filteredTasks.map((task, index) => (
              <div
                key={task.id}
                className={`task-item ${
                  visibleTasks.includes(task.id) ? 'visible' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TaskCard task={task} onApply={handleApply} />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无符合条件的任务</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#16213e] border-t border-[#2a2a4e] z-40">
        <div className="flex justify-around py-2">
          <button
            onClick={() => {
              setActiveTab('home');
              navigate('/home');
            }}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">主页</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tasks');
              navigate('/tasks');
            }}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'tasks' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Grid3X3 className="w-6 h-6" />
            <span className="text-xs mt-1">任务广场</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
              activeTab === 'notifications' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
              3
            </span>
            <span className="text-xs mt-1">通知</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">我的</span>
          </button>
        </div>
      </div>

      <MatchMaking
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        onConfirm={handleConfirmMatch}
        task={selectedTask}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">发布新任务</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">任务标题</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-[#16213e] border border-[#2a2a4e] rounded-xl text-white outline-none focus:border-[#e8a838] transition-colors"
                  placeholder="如：帮我设计一个个人网站"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">任务描述</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="w-full px-4 py-2 bg-[#16213e] border border-[#2a2a4e] rounded-xl text-white outline-none focus:border-[#e8a838] transition-colors resize-none"
                  placeholder="详细描述您需要帮助的内容..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">需要的技能</label>
                <input
                  name="requiredSkill"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-[#16213e] border border-[#2a2a4e] rounded-xl text-white outline-none focus:border-[#e8a838] transition-colors"
                  placeholder="如：UI设计、Python编程"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">预计耗时（分钟）</label>
                <input
                  name="estimatedMinutes"
                  type="number"
                  min="1"
                  defaultValue="60"
                  className="w-full px-4 py-2 bg-[#16213e] border border-[#2a2a4e] rounded-xl text-white outline-none focus:border-[#e8a838] transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#e8a838] text-[#16213e] font-semibold rounded-xl hover:scale-105 transition-transform btn-shine"
                >
                  发布任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
