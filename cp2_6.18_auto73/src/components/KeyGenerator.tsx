import { useState, useEffect, useCallback } from 'react';
import { useKeyStore } from '@/store/keyStore';
import { KeyRound, Shield, Eye, FileText } from 'lucide-react';

export default function KeyGenerator() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'reader'>('reader');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');

  const addKey = useKeyStore((s) => s.addKey);

  const clearReveal = useCallback(() => {
    setRevealedKey(null);
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (revealedKey) clearReveal();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, revealedKey, clearReveal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入密钥名称');
      return;
    }
    if (trimmed.length > 50) {
      setError('名称不能超过50个字符');
      return;
    }
    setError('');
    const rawKey = addKey(trimmed, role);
    setRevealedKey(rawKey);
    setTimeLeft(15);
    setName('');
  };

  const roleOptions = [
    { value: 'admin' as const, label: 'Admin', color: '#EF4444', icon: Shield },
    { value: 'editor' as const, label: 'Editor', color: '#3B82F6', icon: FileText },
    { value: 'reader' as const, label: 'Reader', color: '#10B981', icon: Eye },
  ];

  return (
    <div className="rounded-2xl border border-vault-border bg-vault-card p-6 card-shadow">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-btn">
          <KeyRound className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">生成新密钥</h2>
          <p className="text-xs text-gray-400">创建一个新的API密钥</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            密钥名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            maxLength={50}
            placeholder="例如：生产环境API密钥"
            className="w-full rounded-lg border border-vault-border bg-[#1E1E2E] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-vault-accent1 focus:ring-1 focus:ring-vault-accent1/30"
          />
          <div className="mt-1 flex items-center justify-between">
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
            ) : (
              <span className="text-xs text-gray-500">&nbsp;</span>
            )}
            <span className="text-xs text-gray-500">{name.length}/50</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            角色权限
          </label>
          <div className="grid grid-cols-3 gap-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200 ${
                    isSelected
                      ? 'border-opacity-100 bg-opacity-10'
                      : 'border-vault-border bg-transparent hover:border-gray-500'
                  }`}
                  style={{
                    borderColor: isSelected ? opt.color : undefined,
                    backgroundColor: isSelected ? `${opt.color}15` : undefined,
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: isSelected ? opt.color : '#9CA3AF' }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: isSelected ? opt.color : '#9CA3AF' }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="gradient-btn w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        >
          生成密钥
        </button>
      </form>

      {revealedKey && (
        <div className="animate-fade-in-up mt-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-400">
              ⚠ 密钥明文仅展示一次，请立即复制
            </span>
            <span className="font-mono text-xs text-yellow-500">
              {timeLeft}s
            </span>
          </div>
          <div className="key-reveal-highlight break-all">{revealedKey}</div>
        </div>
      )}
    </div>
  );
}
