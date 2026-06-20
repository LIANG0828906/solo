import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSkillsStore } from '@/store/skillsStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/mockSkills';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userProfile, updateProfile, skills } = useSkillsStore();

  const [username, setUsername] = useState(userProfile.username);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio);

  const publishedSkills = skills.slice(0, 5);

  const handleSave = () => {
    updateProfile({ username, avatar, bio });
    navigate(-1);
  };

  return (
    <div className="animate-slide-in-right min-h-screen bg-[#F5F3EE] pb-8">
      <div className="sticky top-0 z-20 bg-[#F5F3EE]/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="flex items-center gap-3 px-4 py-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 font-display">设置</h1>
        </div>
      </div>

      <div className="px-4 max-w-3xl mx-auto space-y-5 mt-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-5 text-sm font-medium text-gray-500 uppercase tracking-wide">个人资料</h2>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm text-gray-600">用户名</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-in-out focus:border-[#246A73] focus:bg-white focus:ring-2 focus:ring-[#246A73]/10"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm text-gray-600">头像 URL</span>
            <div className="flex items-center gap-3">
              {avatar && (
                <img
                  src={avatar}
                  alt="头像预览"
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm bg-gray-50"
                />
              )}
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-in-out focus:border-[#246A73] focus:bg-white focus:ring-2 focus:ring-[#246A73]/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-gray-600">个人简介</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="介绍一下自己吧..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-in-out focus:border-[#246A73] focus:bg-white focus:ring-2 focus:ring-[#246A73]/10"
            />
          </label>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">已发布技能</h2>
            <span className="text-xs text-gray-400">{publishedSkills.length} 项</span>
          </div>

          {publishedSkills.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">暂无已发布技能</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {publishedSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[skill.category] }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-800 block truncate">{skill.title}</span>
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[skill.category]} · {skill.pointsCost} 积分</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          onClick={handleSave}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: '#246A73' }}
        >
          保存更改
        </button>
      </div>
    </div>
  );
}
