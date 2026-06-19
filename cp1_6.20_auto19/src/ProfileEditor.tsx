import React, { useState } from 'react';
import { Check, Save } from 'lucide-react';
import { Profile } from './types';

interface ProfileEditorProps {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onSave: (profile: Profile) => Promise<boolean>;
}

export default function ProfileEditor({
  profile,
  onChange,
  onSave,
}: ProfileEditorProps) {
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof Profile, value: string) => {
    onChange({
      ...profile,
      [field]: value,
    });
  };

  const handleSave = async () => {
    const success = await onSave(profile);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-cream rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-dark-green mb-6">编辑个人资料</h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-dark-green mb-2">
            头像 URL
          </label>
          <input
            type="text"
            value={profile.avatar}
            onChange={(e) => handleChange('avatar', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-2 border-2 border-dark-green/20 rounded-lg focus:border-amber focus:outline-none transition-colors bg-white"
          />
          {profile.avatar && (
            <div className="mt-3 flex justify-center">
              <img
                src={profile.avatar}
                alt="头像预览"
                className="w-24 h-24 rounded-full object-cover border-4 border-amber shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-green mb-2">
            姓名
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入您的姓名"
            className="w-full px-4 py-2 border-2 border-dark-green/20 rounded-lg focus:border-amber focus:outline-none transition-colors bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-green mb-2">
            个人简介
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="介绍一下自己..."
            rows={4}
            className="w-full px-4 py-2 border-2 border-dark-green/20 rounded-lg focus:border-amber focus:outline-none transition-colors resize-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-green mb-2">
            个人网站
          </label>
          <input
            type="url"
            value={profile.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://your-website.com"
            className="w-full px-4 py-2 border-2 border-dark-green/20 rounded-lg focus:border-amber focus:outline-none transition-colors bg-white"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all duration-300 bg-dark-green text-white hover:bg-dark-green/90 active:scale-98"
        >
          {saved ? (
            <>
              <Check size={20} className="text-green-400" />
              <span>已保存</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>保存资料</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
