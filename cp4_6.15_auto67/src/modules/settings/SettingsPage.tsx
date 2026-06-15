import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useSkillsStore } from '@/store/skillsStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userProfile, updateProfile, skills, removeSkill } = useSkillsStore();

  const [username, setUsername] = useState(userProfile.username);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio);

  const publishedSkills = skills.filter((s) => s.published);

  const handleSave = () => {
    updateProfile({ username, avatar, bio });
    navigate(-1);
  };

  return (
    <div className="animate-slide-in-right min-h-screen bg-[#F5F3EE] px-4 pb-8 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">设置</h1>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-gray-500">个人资料</h2>

          <label className="mb-3 block">
            <span className="mb-1 block text-sm text-gray-600">用户名</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-[#F5F3EE] px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#246A73]"
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-sm text-gray-600">头像URL</span>
            <div className="flex items-center gap-3">
              {avatar && (
                <img
                  src={avatar}
                  alt="avatar preview"
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
                />
              )}
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-[#F5F3EE] px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#246A73]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600">个人简介</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-[#F5F3EE] px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#246A73]"
            />
          </label>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-gray-500">已发布技能</h2>

          {publishedSkills.length === 0 && (
            <p className="text-sm text-gray-400">暂无已发布技能</p>
          )}

          <ul className="space-y-2">
            {publishedSkills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between rounded-lg bg-[#F5F3EE] px-3 py-2"
              >
                <span className="text-sm text-gray-700">{skill.name}</span>
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <button
          onClick={handleSave}
          className="w-full rounded-xl bg-[#246A73] py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
        >
          保存
        </button>
      </div>
    </div>
  );
}
