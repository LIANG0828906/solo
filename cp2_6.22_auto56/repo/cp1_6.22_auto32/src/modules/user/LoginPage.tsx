import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { Eye, EyeOff, User, Lock, AtSign, Feather } from 'lucide-react';

type Mode = 'login' | 'register';

interface FormErrors {
  username?: string;
  password?: string;
  nickname?: string;
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shake, setShake] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { login, register, isLoading, error, clearError } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (mode === 'register' && password) {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-zA-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password, mode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (mode === 'register') {
      if (password.length < 8) {
        newErrors.password = '密码至少8位';
      } else if (!/[a-zA-Z]/.test(password)) {
        newErrors.password = '密码必须包含字母';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = '密码必须包含数字';
      }
    }

    if (mode === 'register') {
      if (!nickname.trim()) {
        newErrors.nickname = '请输入昵称';
      } else if (nickname.length < 2) {
        newErrors.nickname = '昵称至少2个字符';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, nickname.trim());
      }
      navigate('/explore');
    } catch (_err) {
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setErrors({});
    clearError();
    setUsername('');
    setPassword('');
    setNickname('');
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength === 1) return 'bg-red-400';
    if (passwordStrength === 2) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return '弱';
    if (passwordStrength === 2) return '中';
    return '强';
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md bg-white rounded-xl shadow-soft overflow-hidden ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-full mb-4">
              <Feather className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-brown-500">诗韵社区</h1>
            <p className="text-brown-300 mt-2 text-sm">以诗会友，韵传千古</p>
          </div>

          <div className="flex mb-6 bg-cream-50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-brown-500 shadow-sm'
                  : 'text-brown-300 hover:text-brown-400'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-brown-500 shadow-sm'
                  : 'text-brown-300 hover:text-brown-400'
              }`}
            >
              注册
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-400 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-200" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) {
                      setErrors({ ...errors, username: undefined });
                    }
                  }}
                  placeholder="请输入用户名"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-brown-500 placeholder-brown-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition-all ${
                    errors.username ? 'border-red-400' : 'border-brown-100'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-brown-400 mb-1.5">
                  昵称
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-200" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (errors.nickname) {
                        setErrors({ ...errors, nickname: undefined });
                      }
                    }}
                    placeholder="请输入昵称"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-brown-500 placeholder-brown-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition-all ${
                      errors.nickname ? 'border-red-400' : 'border-brown-100'
                    }`}
                  />
                </div>
                {errors.nickname && (
                  <p className="mt-1 text-xs text-red-500">{errors.nickname}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brown-400 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-200" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  placeholder="请输入密码"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-brown-500 placeholder-brown-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition-all ${
                    errors.password ? 'border-red-400' : 'border-brown-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-200 hover:text-brown-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
              {mode === 'register' && password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-brown-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-brown-300 w-6">
                      {getStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-green-700 hover:bg-green-900 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot [animation-delay:-0.32s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot [animation-delay:-0.16s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot" />
                  </span>
                  <span className="text-sm">
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </span>
                </>
              ) : (
                <span>{mode === 'login' ? '登录' : '注册'}</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-brown-300 mt-6">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-green-700 hover:text-green-900 font-medium ml-1"
            >
              {mode === 'login' ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
