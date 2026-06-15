import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, User } from 'lucide-react';
import type { Exchange, Task, Skill } from '@/types';
import './ExchangeDetail.css';

export default function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [acceptAnimating, setAcceptAnimating] = useState(false);
  const [rejectAnimating, setRejectAnimating] = useState(false);

  const mockTask: Task = {
    id: id || '1',
    title: '帮我设计一个个人网站首页',
    description: '需要一个简洁现代的个人网站首页设计，包含导航栏、英雄区、技能展示、项目展示等部分。风格偏向简约科技风。',
    status: 'applied',
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
      bio: 'UI/UX设计师，热爱创造美好的用户体验',
      skills: [
        { id: 's1', name: 'UI设计', level: 3, hoursPerWeek: 10 },
      ],
    },
    createdAt: '2024-01-15',
  };

  const mockExchange: Exchange = {
    id: 'ex1',
    taskId: mockTask.id,
    task: mockTask,
    applicantId: 'user1',
    applicant: {
      id: 'user1',
      nickname: '技能达人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      bio: '前端开发工程师，擅长React和Vue',
      skills: [
        { id: 'm1', name: 'JavaScript开发', level: 5, hoursPerWeek: 10 },
        { id: 'm2', name: 'React', level: 4, hoursPerWeek: 8 },
      ],
    },
    status: 'pending',
    matchedSkills: [
      { id: 'm1', name: 'JavaScript开发', level: 5, hoursPerWeek: 10 },
    ],
    createdAt: '2024-01-16',
  };

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < level ? 'text-[#e8a838]' : 'text-gray-600'}`}>
        ★
      </span>
    ));
  };

  const handleAccept = () => {
    setAcceptAnimating(true);
    setTimeout(() => {
      setAcceptAnimating(false);
      console.log('接受交换');
    }, 400);
  };

  const handleReject = () => {
    setRejectAnimating(true);
    setTimeout(() => {
      setRejectAnimating(false);
      console.log('拒绝交换');
    }, 400);
  };

  const getStatusText = (status: Exchange['status']) => {
    switch (status) {
      case 'pending':
        return '待确认';
      case 'accepted':
        return '已接受';
      case 'rejected':
        return '已拒绝';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const getStatusColor = (status: Exchange['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-8">
      <div className="sticky top-0 z-30 bg-[#1a1a2e]/95 backdrop-blur-md border-b border-[#2a2a4e]">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">交换详情</h1>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mockExchange.status)}`}>
            {getStatusText(mockExchange.status)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[#16213e] rounded-xl p-5 border border-[#2a2a4e]">
          <h2 className="text-lg font-bold mb-2">{mockTask.title}</h2>
          <p className="text-gray-400 text-sm mb-4">{mockTask.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>预计 {mockTask.estimatedHours} 小时</span>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-[#2a2a4e]">
          <h3 className="text-base font-semibold mb-3">任务悬赏技能</h3>
          <div className="flex flex-wrap gap-2">
            {mockTask.requiredSkills.map((skill: Skill) => (
              <div
                key={skill.id}
                className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <span className="text-[#e8a838] text-sm">{skill.name}</span>
                <div className="flex">{renderStars(skill.level)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-[#2a2a4e]">
          <h3 className="text-base font-semibold mb-4">交换双方</h3>

          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#2a2a4e]">
            <img
              src={mockTask.publisher.avatar}
              alt={mockTask.publisher.nickname}
              className="w-14 h-14 rounded-full border-2 border-[#2a2a4e]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{mockTask.publisher.nickname}</h4>
                <span className="text-xs bg-[#e8a838]/20 text-[#e8a838] px-2 py-0.5 rounded-full">
                  发布者
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{mockTask.publisher.bio}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {mockTask.publisher.skills.slice(0, 2).map((skill) => (
                  <span key={skill.id} className="text-xs bg-[#2a2a4e] text-gray-300 px-2 py-0.5 rounded">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <img
              src={mockExchange.applicant.avatar}
              alt={mockExchange.applicant.nickname}
              className="w-14 h-14 rounded-full border-2 border-[#e8a838]/50"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{mockExchange.applicant.nickname}</h4>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  申请者
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{mockExchange.applicant.bio}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {mockExchange.applicant.skills.slice(0, 2).map((skill) => (
                  <span key={skill.id} className="text-xs bg-[#2a2a4e] text-gray-300 px-2 py-0.5 rounded">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-[#2a2a4e]">
          <h3 className="text-base font-semibold mb-3">匹配技能</h3>
          <div className="space-y-2">
            {mockExchange.matchedSkills.map((skill: Skill) => (
              <div
                key={skill.id}
                className="bg-[#1a1a2e] border border-[#e8a838]/30 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium">{skill.name}</span>
                  <div className="flex mt-1">{renderStars(skill.level)}</div>
                </div>
                <span className="text-[#e8a838] text-sm">
                  {skill.hoursPerWeek}小时/周
                </span>
              </div>
            ))}
          </div>
        </div>

        {mockExchange.status === 'pending' && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReject}
              className={`flex-1 py-3 rounded-xl font-semibold border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all flex items-center justify-center gap-2 ${
                rejectAnimating ? 'btn-bounce' : ''
              }`}
            >
              <X className="w-5 h-5" />
              拒绝
            </button>
            <button
              onClick={handleAccept}
              className={`flex-1 py-3 rounded-xl font-semibold bg-[#e8a838] text-[#16213e] hover:scale-105 transition-all flex items-center justify-center gap-2 btn-shine ${
                acceptAnimating ? 'btn-bounce' : ''
              }`}
            >
              <Check className="w-5 h-5" />
              接受
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
