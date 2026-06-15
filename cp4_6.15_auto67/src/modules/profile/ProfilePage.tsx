import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/store/skillsStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/mockSkills';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F59E0B' },
  accepted: { label: '已接受', color: '#22C55E' },
  rejected: { label: '已拒绝', color: '#EF4444' },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, skills, exchangeRequests } = useSkillsStore();
  const [displayPoints, setDisplayPoints] = useState(0);

  const publishedSkills = skills.slice(0, 3);

  useEffect(() => {
    const target = userProfile.points;
    const duration = 500;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayPoints(target);
        clearInterval(timer);
      } else {
        setDisplayPoints(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [userProfile.points]);

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <div
        className="relative h-40"
        style={{ background: 'linear-gradient(135deg, #246A73, #2D8A95)' }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <Settings size={24} />
        </button>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img
            src={userProfile.avatar}
            alt={userProfile.username}
            className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
          />
          <span className="mt-2 text-lg font-semibold text-gray-900">
            {userProfile.username}
          </span>
        </div>
      </div>

      <div className="pt-14 px-6">
        <p className="text-center text-sm text-gray-500">{userProfile.bio}</p>

        <div className="mt-6 bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-1">积分余额</p>
          <p className="text-4xl font-bold text-[#246A73] tabular-nums">
            {displayPoints}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">已发布技能</h2>
          <div className="grid grid-cols-3 gap-4">
            {publishedSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[skill.category] }}
                  />
                  <span className="text-xs text-gray-500">
                    {CATEGORY_LABELS[skill.category]}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {skill.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {skill.pointsCost} 积分
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">已申请技能</h2>
          {exchangeRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400">暂无申请记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exchangeRequests.map((req) => {
                const skill = skills.find((s) => s.id === req.skillId);
                const status = STATUS_MAP[req.status];
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {skill?.title ?? '未知技能'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{req.date}</p>
                    </div>
                    <span
                      className="ml-4 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        color: status.color,
                        backgroundColor: `${status.color}15`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
