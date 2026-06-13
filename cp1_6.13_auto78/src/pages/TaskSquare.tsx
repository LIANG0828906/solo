import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Home, Grid3X3, Bell, User } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import MatchMaking from '@/components/MatchMaking';
import type { Task, Skill, User as UserType } from '@/types';
import './TaskSquare.css';

export default function TaskSquare() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);

  const mockUser: UserType = {
    id: 'user1',
    nickname: '技能达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    bio: '热爱学习，乐于分享',
    skills: [],
  };

  const mockTasks: Task[] = [
    {
      id: '1',
      title: '帮我设计一个个人网站首页',
      description: '需要一个简洁现代的个人网站首页设计，包含导航栏、英雄区、技能展示、项目展示等部分。风格偏向简约科技风。',
      status: 'open',
      requiredSkills: [
        { id: 's1', name: 'UI设计', level: 3, hoursPerWeek: 10 },
        { id: 's2', name: 'Figma', level: 2, hoursPerWeek: 8 },
      ],
      estimatedHours: 8,
      publisherId: 'user2',
      publisher: {
        id: 'user2',
        nickname: '设计师小王',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer',
        bio: 'UI/UX设计师',
        skills: [],
      },
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: '学习JavaScript基础',
      description: '想系统学习JavaScript基础知识，从变量、函数到DOM操作，希望有人能指导我学习，每周2-3次。',
      status: 'open',
      requiredSkills: [
        { id: 's3', name: 'JavaScript', level: 4, hoursPerWeek: 10 },
      ],
      estimatedHours: 10,
      publisherId: 'user3',
      publisher: {
        id: 'user3',
        nickname: '编程小白',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newbie',
        bio: '正在学习编程的新人',
        skills: [],
      },
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      title: '翻译一份技术文档',
      description: '有一份约5000字的英文技术文档需要翻译成中文，内容是关于React框架的入门指南。',
      status: 'applied',
      requiredSkills: [
        { id: 's4', name: '英语翻译', level: 4, hoursPerWeek: 5 },
      ],
      estimatedHours: 6,
      publisherId: 'user4',
      publisher: {
        id: 'user4',
        nickname: '产品经理',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pm',
        bio: '互联网产品经理',
        skills: [],
      },
      createdAt: '2024-01-13',
    },
    {
      id: '4',
      title: '帮忙剪辑一段vlog视频',
      description: '有一段约10分钟的旅行vlog素材，需要帮忙剪辑成3-5分钟的精彩视频，添加背景音乐和字幕。',
      status: 'open',
      requiredSkills: [
        { id: 's5', name: '视频剪辑', level: 3, hoursPerWeek: 8 },
        { id: 's6', name: 'PR', level: 2, hoursPerWeek: 6 },
      ],
      estimatedHours: 5,
      publisherId: 'user5',
      publisher: {
        id: 'user5',
        nickname: '旅行博主',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel',
        bio: '热爱旅行和记录生活',
        skills: [],
      },
      createdAt: '2024-01-12',
    },
    {
      id: '5',
      title: 'Python数据分析入门指导',
      description: '想学习Python数据分析，从pandas基础开始，希望有经验的朋友带带我。',
      status: 'open',
      requiredSkills: [
        { id: 's7', name: 'Python', level: 4, hoursPerWeek: 10 },
        { id: 's8', name: '数据分析', level: 3, hoursPerWeek: 5 },
      ],
      estimatedHours: 12,
      publisherId: 'user6',
      publisher: {
        id: 'user6',
        nickname: '数据爱好者',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=data',
        bio: '对数据充满好奇',
        skills: [],
      },
      createdAt: '2024-01-11',
    },
    {
      id: '6',
      title: '吉他入门教学',
      description: '零基础想学吉他，希望有人能每周教我1-2次，从基础指法和简单的弹唱开始。',
      status: 'completed',
      requiredSkills: [
        { id: 's9', name: '吉他', level: 4, hoursPerWeek: 10 },
      ],
      estimatedHours: 8,
      publisherId: 'user7',
      publisher: {
        id: 'user7',
        nickname: '音乐小白',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=music',
        bio: '想学会弹吉他',
        skills: [],
      },
      createdAt: '2024-01-10',
    },
  ];

  const mySkills: Skill[] = [
    { id: 'm1', name: 'JavaScript开发', level: 5, hoursPerWeek: 10 },
    { id: 'm2', name: 'UI设计', level: 4, hoursPerWeek: 8 },
    { id: 'm3', name: '英语翻译', level: 3, hoursPerWeek: 5 },
  ];

  useEffect(() => {
    mockTasks.forEach((task, index) => {
      setTimeout(() => {
        setVisibleTasks((prev) => [...prev, task.id]);
      }, index * 50);
    });
  }, []);

  const filteredTasks = mockTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = (task: Task) => {
    setSelectedTask(task);
    setShowMatchModal(true);
  };

  const handleConfirmMatch = (skill: Skill) => {
    console.log('匹配成功：', skill.name);
    setShowMatchModal(false);
    setSelectedTask(null);
    navigate(`/exchange/${selectedTask?.id}`);
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
                    className="px-3 py-1 text-xs rounded-full border border-[#2a2a4e] text-gray-300 hover:border-[#e8a838] hover:text-[#e8a838] transition-colors"
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#16213e] border-t border-[#2a2a4e] z-40">
        <div className="flex justify-around py-2">
          <button
            onClick={() => { setActiveTab('home'); navigate('/home'); }}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">主页</span>
          </button>
          <button
            onClick={() => { setActiveTab('tasks'); navigate('/tasks'); }}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'tasks' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Grid3X3 className="w-6 h-6" />
            <span className="text-xs mt-1">任务广场</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'notifications' ? 'text-[#e8a838]' : 'text-gray-500'
            }`}
          >
            <Bell className="w-6 h-6" />
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
        availableSkills={mySkills}
        taskTitle={selectedTask?.title}
      />
    </div>
  );
}
