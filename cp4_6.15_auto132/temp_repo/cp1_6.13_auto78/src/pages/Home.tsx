import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Home, Grid3X3, Bell, User, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import SkillCard from '@/components/SkillCard';
import type { Skill } from '@/types';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('home');
  const [showAddSkill, setShowAddSkill] = useState(false);

  const mockSkills: Skill[] = [
    { id: '1', name: 'JavaScript开发', level: 5, hoursPerWeek: 10, description: '精通前端开发，React/Vue都很熟练，有5年以上开发经验' },
    { id: '2', name: 'UI设计', level: 4, hoursPerWeek: 8, description: '擅长Figma设计，有丰富的移动端和网页设计经验' },
    { id: '3', name: '英语翻译', level: 3, hoursPerWeek: 5, description: '专业英语八级，可进行中英互译，擅长技术文档翻译' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <p className="text-gray-400">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-20">
      <div className="p-6 bg-gradient-to-b from-[#16213e] to-transparent">
        <div className="flex items-start gap-4">
          <img
            src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={user.nickname}
            className="w-20 h-20 rounded-full border-2 border-[#e8a838] object-cover"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{user.nickname}</h1>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{user.bio}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-[#2a2a4e] px-2 py-1 rounded-md text-xs">
                <Sparkles className="w-3 h-3 text-[#e8a838]" />
                <span>{user.skills?.length || 3} 个技能</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-300 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                退出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="w-full py-4 bg-gradient-to-r from-[#e8a838] to-[#b8860b] text-[#16213e] font-bold rounded-xl hover:scale-102 transition-transform btn-shine flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          发布任务
        </button>
      </div>

      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">我的技能</h2>
          <button
            onClick={() => setShowAddSkill(!showAddSkill)}
            className="flex items-center gap-1 text-[#e8a838] text-sm hover:text-[#c88a1f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>

        <div className="grid gap-3">
          {mockSkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>

      <div className="px-6">
        <h2 className="text-lg font-bold mb-3">最近任务</h2>
        <div className="text-gray-500 text-sm bg-[#16213e] rounded-xl p-4 border border-[#2a2a4e] text-center">
          暂无最近任务
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
    </div>
  );
}
