import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, MapPin, Calendar, Info, Tags, Target } from 'lucide-react';
import { createUser, updateUser } from '../api';
import { useStore } from '../store/useStore';
import { INTEREST_OPTIONS, CITY_OPTIONS, AVATAR_COLORS, type ProfileFormData, type User as UserType } from '../types';

interface ProfileFormProps {
  editMode?: boolean;
  initialData?: UserType;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ editMode = false, initialData }) => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, setSidebarOpen } = useStore();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<ProfileFormData>({
    nickname: initialData?.nickname || '',
    birthYear: initialData?.birthYear || currentYear - 25,
    gender: initialData?.gender || 'female',
    city: initialData?.city || '',
    bio: initialData?.bio || '',
    interests: initialData?.interests || [],
    preference: initialData?.preference || {
      minAge: 20,
      maxAge: 35,
      targetCity: '',
      targetInterests: [],
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nickname.trim()) newErrors.nickname = '请输入昵称';
    if (formData.birthYear < currentYear - 100 || formData.birthYear > currentYear - 18) {
      newErrors.birthYear = '请输入有效的出生年份（18-100岁）';
    }
    if (!formData.city) newErrors.city = '请选择城市';
    if (!formData.bio.trim()) newErrors.bio = '请输入个人简介';
    if (formData.interests.length < 3) newErrors.interests = '请至少选择3个兴趣爱好';
    if (formData.preference.minAge >= formData.preference.maxAge) {
      newErrors.ageRange = '最小年龄必须小于最大年龄';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const avatarColor = initialData?.avatarColor || 
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      if (editMode && currentUser) {
        const updated = await updateUser(currentUser.id, {
          ...formData,
          avatarColor,
          lastActive: new Date().toISOString(),
        });
        setCurrentUser(updated);
        setSidebarOpen(false);
      } else {
        const user = await createUser({
          ...formData,
          avatarColor,
        });
        setCurrentUser(user);
        navigate('/discover');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setErrors({ submit: '提交失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string, isPreference: boolean = false) => {
    if (isPreference) {
      setFormData((prev) => ({
        ...prev,
        preference: {
          ...prev.preference,
          targetInterests: prev.preference.targetInterests.includes(interest)
            ? prev.preference.targetInterests.filter((i) => i !== interest)
            : [...prev.preference.targetInterests, interest],
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        interests: prev.interests.includes(interest)
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] mb-4">
          <Heart className="w-8 h-8 text-white" fill="white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {editMode ? '编辑资料' : '心动注册'}
        </h1>
        <p className="text-gray-500">
          {editMode ? '更新您的个人信息' : '填写资料，开启您的缘分之旅'}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
            <User className="w-5 h-5 text-[#FF6B6B]" />
            昵称
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] ${
              errors.nickname ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="请输入您的昵称"
          />
          {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <Calendar className="w-5 h-5 text-[#FF6B6B]" />
              出生年份
            </label>
            <input
              type="number"
              min={currentYear - 100}
              max={currentYear - 18}
              value={formData.birthYear}
              onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) || currentYear - 25 })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] ${
                errors.birthYear ? 'border-red-400' : 'border-gray-200'
              }`}
              placeholder="1995"
            />
            {errors.birthYear && <p className="text-red-500 text-sm mt-1">{errors.birthYear}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="text-[#FF6B6B] font-bold">♂</span>
              性别
            </label>
            <div className="flex gap-4">
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={() => setFormData({ ...formData, gender: 'male' })}
                  className="sr-only"
                />
                <div
                  className={`text-center py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.gender === 'male'
                      ? 'border-[#4D96FF] bg-blue-50 text-[#4D96FF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  👨 男
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={() => setFormData({ ...formData, gender: 'female' })}
                  className="sr-only"
                />
                <div
                  className={`text-center py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.gender === 'female'
                      ? 'border-[#FF6B6B] bg-pink-50 text-[#FF6B6B]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  👩 女
                </div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
            <MapPin className="w-5 h-5 text-[#FF6B6B]" />
            所在城市
          </label>
          <select
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] ${
              errors.city ? 'border-red-400' : 'border-gray-200'
            }`}
          >
            <option value="">请选择城市</option>
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
            <Info className="w-5 h-5 text-[#FF6B6B]" />
            个人简介
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] resize-none ${
              errors.bio ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="简单介绍一下自己吧..."
          />
          {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
            <Tags className="w-5 h-5 text-[#FF6B6B]" />
            兴趣爱好
            <span className="text-sm text-gray-400">(至少选择3个)</span>
            <span className="text-sm text-[#FF6B6B]">({formData.interests.length}/24)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          {errors.interests && <p className="text-red-500 text-sm mt-2">{errors.interests}</p>}
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
            <Target className="w-5 h-5 text-[#FF6B6B]" />
            择偶偏好
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">年龄范围</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={formData.preference.minAge}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preference: {
                        ...formData.preference,
                        minAge: parseInt(e.target.value) || 18,
                      },
                    })
                  }
                  className={`w-24 px-4 py-2 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] ${
                    errors.ageRange ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <span className="text-gray-400">至</span>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={formData.preference.maxAge}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preference: {
                        ...formData.preference,
                        maxAge: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                  className={`w-24 px-4 py-2 rounded-xl border-2 transition-all focus:outline-none focus:border-[#FF6B6B] ${
                    errors.ageRange ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <span className="text-gray-500">岁</span>
              </div>
              {errors.ageRange && <p className="text-red-500 text-sm mt-1">{errors.ageRange}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">目标城市</label>
              <select
                value={formData.preference.targetCity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preference: { ...formData.preference, targetCity: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 transition-all focus:outline-none focus:border-[#FF6B6B]"
              >
                <option value="">不限</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">兴趣偏好（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest, true)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.preference.targetInterests.includes(interest)
                        ? 'bg-[#FFE5E5] text-[#FF6B6B] border border-[#FF6B6B]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">{errors.submit}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '提交中...' : editMode ? '保存修改' : '开启心动之旅 💗'}
      </button>
    </form>
  );
};

export default ProfileForm;
