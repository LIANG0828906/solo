import { useState, useEffect } from 'react';
import useVaultStore from '@/store/VaultStore';
import { Lock, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';

function MasterPasswordModal() {
  const { isCheckingMaster, isFirstTime, setupAndUnlock, unlock } = useVaultStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const allRequirementsMet = hasMinLength && hasUppercase && hasLowercase && hasDigit;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSetup = async () => {
    if (!allRequirementsMet || !passwordsMatch) return;
    try {
      await setupAndUnlock(password);
    } catch {
      setError('设置失败，请重试');
    }
  };

  const handleUnlock = async () => {
    if (!password) return;
    try {
      await unlock(password);
    } catch {
      setError('主密码错误');
    }
  };

  if (isCheckingMaster) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[rgba(255,255,255,0.1)] border-t-[#38bdf8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        className={`bg-[rgba(15,23,42,0.95)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8 w-full max-w-md transition-all duration-300 ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-7 h-7 text-[#38bdf8]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">
              VaultPass
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            {isFirstTime ? '设置您的主密码以保护数据' : '输入主密码以解锁'}
          </p>
        </div>

        {isFirstTime ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSetup();
            }}
            className="flex flex-col gap-4"
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="主密码"
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="确认主密码"
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <RequirementItem met={hasMinLength} label="至少 8 个字符" />
              <RequirementItem met={hasUppercase} label="包含大写字母" />
              <RequirementItem met={hasLowercase} label="包含小写字母" />
              <RequirementItem met={hasDigit} label="包含数字" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={!allRequirementsMet || !passwordsMatch}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#38bdf8] to-[#818cf8] hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              设置主密码
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock();
            }}
            className="flex flex-col gap-4"
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="主密码"
                autoFocus
                className={`w-full bg-[rgba(255,255,255,0.05)] border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                  error
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-[rgba(255,255,255,0.1)] focus:border-[#38bdf8]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#38bdf8] to-[#818cf8] hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5 inline-block mr-2 -mt-0.5" />
              解锁
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-400' : 'text-gray-500'}`}>
      <CheckCircle className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

export default MasterPasswordModal;
