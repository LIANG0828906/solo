import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/store/skillsStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/mockSkills';
import { useCountUp } from '@/hooks/useCountUp';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '等待对方确认', color: '#EAB308' },
  accepted: { label: '已接受', color: '#22C55E' },
  rejected: { label: '已拒绝', color: '#EF4444' },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, skills, exchangeRequests } = useSkillsStore();
  const displayPoints = useCountUp(userProfile.points);

  const publishedSkills = skills.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F3EE] pb-8">
      <div
        className="relative h-40"
        style={{ background: 'linear-gradient(135deg, #246A73 0%, #2D8A95 60%, #4FB3BF 100%)' }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/90 hover:text-white transition-all duration-200 ease-in-out"
        >
          <Settings size={20} />
        </button>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img
            src={userProfile.avatar}
            alt={userProfile.username}
            loading="lazy"
            className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg bg-gray-50"
          />
          <span className="mt-2 text-lg font-semibold text-gray-900 font-display">
            {userProfile.username}
          </span>
        </div>
      </div>

      <div className="pt-14 px-4 md:px-8 max-w-5xl mx-auto">
        <p className="text-center text-sm text-gray-500 max-w-md mx-auto">{userProfile.bio}</p>

        <div className="mt-6 bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">积分余额</p>
          <div className="flex items-baseline justify-center gap-2">
            <p
              key={userProfile.points}
              className="text-5xl font-bold tabular-nums font-display"
              style={{ color: '#246A73' }}
            >
              {displayPoints}
            </p>
            <span className="text-sm text-gray-400 mb-1">points</span>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
            <span>已发布 {skills.length} 技能</span>
            <span>·</span>
            <span>已申请 {exchangeRequests.length} 次</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 font-display">已发布技能</h2>
            <span className="text-xs text-gray-400">{publishedSkills.length} 项</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {publishedSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 ease-in-out"
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
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                  <span>{skill.pointsCost} 积分</span>
                  <span className="text-[10px] text-gray-300">热度 {skill.searchCount}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 font-display">已申请技能</h2>
            <span className="text-xs text-gray-400">{exchangeRequests.length} 条记录</span>
          </div>
          {exchangeRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">暂无申请记录</p>
              <p className="text-xs text-gray-300 mt-1">去发现页面浏览感兴趣的技能吧</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {exchangeRequests.map((req, idx) => {
                const skill = skills.find((s) => s.id === req.skillId);
                const status = STATUS_MAP[req.status];
                return (
                  <div key={req.id}>
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {skill?.title ?? '未知技能'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{req.date}</p>
                          {req.expectedTime && (
                            <>
                              <span className="text-gray-200">·</span>
                              <p className="text-xs text-gray-400 truncate">{req.expectedTime}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap"
                        style={{
                          color: status.color,
                          backgroundColor: `${status.color}15`,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                    {idx < exchangeRequests.length - 1 && (
                      <div className="h-px bg-gray-100 mx-4" />
                    )}
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
