import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { User, Lock, LogIn, UserPlus, Plus, X, Star, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { Skill } from '@/types';
import './Login.css';

type TabType = 'login' | 'register';

interface FormErrors {
  nickname?: string;
  password?: string;
  avatar?: string;
  bio?: string;
  skills?: string;
}

interface SkillFormData {
  name: string;
  level: number;
  hoursPerWeek: number;
  availability: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<SkillFormData[]>([]);

  const triggerError = (field: string) => {
    setErrorFields((prev) => new Set(prev).add(field));
    setTimeout(() => {
      setErrorFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 500);
  };

  const addSkill = () => {
    if (skills.length >= 5) return;
    setSkills([...skills, { name: '', level: 3, hoursPerWeek: 5, availability: '灵活' }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof SkillFormData, value: string | number) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setSkills(newSkills);
  };

  const validateLogin = (): boolean => {
    const newErrors: FormErrors = {};
    if (!nickname.trim()) {
      newErrors.nickname = '请输入昵称';
      triggerError('nickname');
    }
    if (!password) {
      newErrors.password = '请输入密码';
      triggerError('password');
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
      triggerError('password');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = (): boolean => {
    const newErrors: FormErrors = {};
    if (!nickname.trim()) {
      newErrors.nickname = '请输入昵称';
      triggerError('nickname');
    }
    if (!password) {
      newErrors.password = '请输入密码';
      triggerError('password');
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
      triggerError('password');
    }
    if (!avatar.trim()) {
      newErrors.avatar = '请输入头像URL';
      triggerError('avatar');
    }
    if (!bio.trim()) {
      newErrors.bio = '请输入自我介绍';
      triggerError('bio');
    }
    if (skills.length < 1) {
      newErrors.skills = '请至少添加1个技能';
      triggerError('skills');
    } else if (skills.length > 5) {
      newErrors.skills = '最多添加5个技能';
      triggerError('skills');
    }
    const hasInvalidSkill = skills.some((s) => !s.name.trim() || s.hoursPerWeek <= 0);
    if (hasInvalidSkill) {
      newErrors.skills = '请填写完整的技能信息';
      triggerError('skills');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { nickname, password });
      const user = response.data;
      const token = uuidv4();
      setToken(token);
      setUser({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        bio: user.bio,
        skills: user.skills?.map((s: any) => ({
          id: s.id,
          name: s.name,
          level: s.level,
          hoursPerWeek: s.availableHours || s.hoursPerWeek,
        })) || [],
      });
      navigate('/home');
    } catch {
      setErrors({ password: '登录失败，请检查账号密码' });
      triggerError('password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setLoading(true);
    try {
      const skillData: Omit<Skill, 'id'>[] = skills.map((s) => ({
        name: s.name,
        level: s.level,
        hoursPerWeek: s.hoursPerWeek,
      }));

      const response = await axios.post('/api/auth/register', {
        nickname,
        password,
        avatarUrl: avatar,
        bio,
        skills: skills.map((s) => ({
          name: s.name,
          level: s.level,
          availableHours: s.hoursPerWeek,
          availability: s.availability,
        })),
      });
      const user = response.data;
      const token = uuidv4();
      setToken(token);
      setUser({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        bio: user.bio,
        skills: user.skills?.map((s: any) => ({
          id: s.id,
          name: s.name,
          level: s.level,
          hoursPerWeek: s.availableHours || s.hoursPerWeek,
        })) || [],
      });
      navigate('/home');
    } catch {
      setErrors({ nickname: '注册失败，请稍后重试' });
      triggerError('nickname');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (level: number, onChange: (level: number) => void) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${i < level ? 'text-[#e8a838] fill-current' : 'text-gray-600'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const InputField = ({
    icon: Icon,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    fieldName,
    textarea = false,
    rows = 1,
  }: {
    icon: any;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    error?: string;
    fieldName: string;
    textarea?: boolean;
    rows?: number;
  }) => (
    <div
      className={`input-focus-underline ${
        errorFields.has(fieldName) || error ? 'input-error' : ''
      }`}
    >
      <div className="input-wrapper">
        <div className="flex items-center pb-2">
          <Icon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          {textarea ? (
            <textarea
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              rows={rows}
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 resize-none"
            />
          ) : (
            <input
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-bg">
      <div className="w-full login-card bg-white rounded-[20px] shadow-2xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-4 font-semibold transition-all duration-300 relative ${
              activeTab === 'login' ? 'text-[#e8a838]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              登录
            </div>
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e8a838] to-[#b8860b]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 font-semibold transition-all duration-300 relative ${
              activeTab === 'register' ? 'text-[#e8a838]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              注册
            </div>
            {activeTab === 'register' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e8a838] to-[#b8860b]" />
            )}
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
                <p className="text-gray-500 mt-1">登录您的技能交换账号</p>
              </div>

              <InputField
                icon={User}
                placeholder="昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                error={errors.nickname}
                fieldName="nickname"
              />

              <InputField
                icon={Lock}
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                fieldName="password"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e8a838] text-white font-semibold rounded-xl hover:scale-105 transition-all duration-200 btn-shine disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setNickname('技术小哥');
                    setPassword('123456');
                  }}
                  className="text-xs text-gray-400 hover:text-[#e8a838] transition-colors"
                >
                  点击使用演示账号登录
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">创建账号</h1>
                <p className="text-gray-500 mt-1">加入技能交换社区</p>
              </div>

              <InputField
                icon={User}
                placeholder="昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                error={errors.nickname}
                fieldName="nickname"
              />

              <InputField
                icon={User}
                placeholder="头像URL"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                error={errors.avatar}
                fieldName="avatar"
              />

              <InputField
                icon={User}
                placeholder="自我介绍"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                error={errors.bio}
                fieldName="bio"
                textarea
                rows={2}
              />

              <InputField
                icon={Lock}
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                fieldName="password"
              />

              <div className={errorFields.has('skills') ? 'shake-animation' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-700 font-medium text-sm">技能列表 ({skills.length}/5)</label>
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={skills.length >= 5}
                    className="flex items-center gap-1 text-[#e8a838] text-sm hover:text-[#c88a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    添加技能
                  </button>
                </div>
                {errors.skills && <p className="text-red-500 text-sm mb-2">{errors.skills}</p>}

                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-3 relative">
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-2 pr-6">
                        <input
                          type="text"
                          placeholder="技能名称（如：Python编程）"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#e8a838] transition-colors"
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#e8a838] fill-current" />
                            {renderStars(skill.level, (level) => updateSkill(index, 'level', level))}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              min="1"
                              max="168"
                              value={skill.hoursPerWeek}
                              onChange={(e) => updateSkill(index, 'hoursPerWeek', parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 outline-none focus:border-[#e8a838] transition-colors"
                            />
                            <span className="text-gray-500 text-xs">小时/周</span>
                          </div>
                        </div>
                        <select
                          value={skill.availability}
                          onChange={(e) => updateSkill(index, 'availability', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#e8a838] transition-colors"
                        >
                          <option value="工作日晚上">工作日晚上</option>
                          <option value="周末">周末</option>
                          <option value="灵活">灵活安排</option>
                          <option value="周一至周五">周一至周五</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e8a838] text-white font-semibold rounded-xl hover:scale-105 transition-all duration-200 btn-shine disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
