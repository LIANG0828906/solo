import { useState, useEffect, useCallback, useRef } from 'react';
import { useKeyStore } from '@/store/keyStore';
import {
  KeyRound,
  Shield,
  Eye,
  FileText,
  Copy,
  CheckCircle,
  Layers,
  Plus,
  Minus,
  X,
} from 'lucide-react';

interface BatchKey {
  id: string;
  name: string;
  rawKey: string;
  revealUntil: number;
}

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function KeyGenerator() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'reader'>('reader');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [batchCount, setBatchCount] = useState(3);
  const [batchCountInput, setBatchCountInput] = useState('3');
  const [batchCountError, setBatchCountError] = useState('');
  const [batchKeys, setBatchKeys] = useState<BatchKey[]>([]);
  const [copiedBatchIds, setCopiedBatchIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const tickRef = useRef<number | null>(null);
  const batchHideTimerRef = useRef<number | null>(null);

  const addKey = useKeyStore((s) => s.addKey);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  useEffect(() => {
    if (batchKeys.length === 0) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (batchHideTimerRef.current) {
        window.clearTimeout(batchHideTimerRef.current);
        batchHideTimerRef.current = null;
      }
      return;
    }

    if (!tickRef.current) {
      tickRef.current = window.setInterval(() => {
        setBatchKeys((prev) =>
          prev.map((k) => ({ ...k }))
        );
      }, 1000);
    }

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [batchKeys.length]);

  const charCount = name.length;
  const maxChars = batchMode ? 45 : 50;
  const nearLimit = charCount > 40;
  const atLimit = charCount >= maxChars;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length > maxChars) {
      setName(newValue.substring(0, maxChars));
    } else {
      setName(newValue);
    }
    if (error) setError('');
  };

  const handleBatchCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setBatchCountInput(rawValue);
    setBatchCountError('');

    if (rawValue === '') {
      setBatchCountError('请输入生成数量');
      return;
    }

    if (rawValue.includes('.')) {
      setBatchCountError('请输入整数，不支持小数');
      return;
    }

    if (!/^\d+$/.test(rawValue)) {
      setBatchCountError('请输入有效的数字');
      return;
    }

    const val = parseInt(rawValue, 10);
    if (val < 1 || val > 10) {
      setBatchCountError('生成数量需在 1-10 之间');
      return;
    }

    setBatchCount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入密钥名称');
      return;
    }
    if (trimmed.length > maxChars) {
      setError(`名称不能超过${maxChars}个字符`);
      return;
    }
    setError('');
    const rawKey = addKey(trimmed, role);
    setRevealedKey(rawKey);
    setTimeLeft(15);
    setName('');
    setCopied(false);
  };

  const clearAllBatchKeys = useCallback(() => {
    setBatchKeys([]);
    if (batchHideTimerRef.current) {
      window.clearTimeout(batchHideTimerRef.current);
      batchHideTimerRef.current = null;
    }
  }, []);

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入密钥名称前缀');
      return;
    }
    if (trimmed.length > maxChars) {
      setError(`名称前缀不能超过${maxChars}个字符`);
      return;
    }
    if (batchCountError) {
      setError(batchCountError);
      return;
    }
    if (batchCount < 1 || batchCount > 10) {
      setError('批量生成数量需在 1-10 之间');
      return;
    }
    setError('');

    const now = Date.now();
    const newKeys: BatchKey[] = [];

    for (let i = 1; i <= batchCount; i++) {
      const keyName = `${trimmed}-${i.toString().padStart(2, '0')}`;
      const rawKey = addKey(keyName, role);
      newKeys.push({
        id: `batch-${now}-${i}`,
        name: keyName,
        rawKey,
        revealUntil: now + 15000,
      });
    }

    setBatchKeys((prev) => [...newKeys, ...prev].slice(0, 20));
    setName('');

    if (batchHideTimerRef.current) {
      window.clearTimeout(batchHideTimerRef.current);
    }
    batchHideTimerRef.current = window.setTimeout(() => {
      clearAllBatchKeys();
    }, 15000);
  };

  const handleCopySingle = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      showToast('已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 1500);
      setTimeLeft(15);
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  };

  const handleCopyBatch = async (batchId: string, rawKey: string) => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopiedBatchIds((prev) => {
        const next = new Set(prev);
        next.add(batchId);
        return next;
      });
      showToast('已复制到剪贴板', 'success');
      setTimeout(() => {
        setCopiedBatchIds((prev) => {
          const next = new Set(prev);
          next.delete(batchId);
          return next;
        });
      }, 1500);

      setBatchKeys((prev) =>
        prev.map((k) =>
          k.id === batchId
            ? { ...k, revealUntil: Date.now() + 15000 }
            : k
        )
      );
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  };

  const roleOptions = [
    {
      value: 'admin' as const,
      label: 'Admin',
      desc: '完全控制',
      icon: Shield,
      color: '#EF4444',
    },
    {
      value: 'editor' as const,
      label: 'Editor',
      desc: '读写权限',
      icon: FileText,
      color: '#3B82F6',
    },
    {
      value: 'reader' as const,
      label: 'Reader',
      desc: '只读查看',
      icon: Eye,
      color: '#10B981',
    },
  ];

  const getBatchTimeLeft = (revealUntil: number) => {
    const left = Math.max(0, Math.ceil((revealUntil - Date.now()) / 1000));
    return left;
  };

  return (
    <div className="relative rounded-2xl border border-vault-border bg-vault-card p-6 card-shadow">
      {toasts.length > 0 && (
        <div className="absolute right-6 top-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`animate-fade-in-up flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-500/95 text-white'
                  : 'bg-red-500/95 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-1 rounded p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-btn">
          <KeyRound className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">生成新密钥</h2>
          <p className="text-xs text-gray-400">创建一个新的API密钥</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-1 rounded-lg bg-[#1E1E2E] p-1">
        <button
          type="button"
          onClick={() => setBatchMode(false)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            !batchMode
              ? 'bg-vault-accent1/20 text-vault-accent1'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          单个生成
        </button>
        <button
          type="button"
          onClick={() => setBatchMode(true)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            batchMode
              ? 'bg-vault-accent1/20 text-vault-accent1'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          批量生成
        </button>
      </div>

      <form
        onSubmit={batchMode ? handleBatchGenerate : handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            {batchMode ? '密钥名称前缀' : '密钥名称'}
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            maxLength={maxChars}
            placeholder={
              batchMode ? '例如：dev-key' : '例如：生产环境API密钥'
            }
            className={`w-full rounded-lg border bg-[#1E1E2E] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-1 ${
              atLimit
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : nearLimit
                  ? 'border-orange-500 focus:border-vault-accent1 focus:ring-vault-accent1/30'
                  : 'border-vault-border focus:border-vault-accent1 focus:ring-vault-accent1/30'
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
            ) : (
              <span className="text-xs text-gray-500">&nbsp;</span>
            )}
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                atLimit
                  ? 'text-red-400'
                  : nearLimit
                    ? 'text-orange-400'
                    : 'text-gray-500'
              }`}
            >
              {charCount}/{maxChars}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            角色权限
          </label>
          <div className="space-y-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-500/10 shadow-md ring-1 ring-blue-500/30'
                      : 'border-vault-border bg-[#1E1E2E]/50 hover:border-gray-500'
                  }`}
                  style={{
                    borderColor: isSelected ? '#3B82F6' : undefined,
                  }}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-500/20'
                        : 'bg-vault-card'
                    }`}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{
                        color: isSelected ? opt.color : '#9CA3AF',
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-semibold transition-colors duration-200 ${
                        isSelected ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {batchMode && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              生成数量
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.max(1, batchCount - 1);
                  setBatchCount(newVal);
                  setBatchCountInput(String(newVal));
                  setBatchCountError('');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vault-border bg-[#1E1E2E] text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
                aria-label="减少"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={batchCountInput}
                    onChange={handleBatchCountInputChange}
                    onBlur={() => {
                      if (!batchCountError && batchCountInput) {
                        setBatchCountInput(String(batchCount));
                      }
                    }}
                    className={`w-full rounded-lg border bg-[#1E1E2E] px-4 py-2 text-center text-sm font-semibold text-white outline-none transition-all duration-200 focus:ring-1 ${
                      batchCountError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-vault-border focus:border-vault-accent1 focus:ring-vault-accent1/30'
                    }`}
                  />
                </div>
                {batchCountError && (
                  <span className="mt-1 block text-xs text-red-400">
                    {batchCountError}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.min(10, batchCount + 1);
                  setBatchCount(newVal);
                  setBatchCountInput(String(newVal));
                  setBatchCountError('');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vault-border bg-[#1E1E2E] text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
                aria-label="增加"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[1, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setBatchCount(num);
                    setBatchCountInput(String(num));
                    setBatchCountError('');
                  }}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
                    batchCount === num
                      ? 'bg-vault-accent1/20 text-vault-accent1'
                      : 'bg-[#1E1E2E] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="gradient-btn flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        >
          {batchMode ? (
            <>
              <Layers className="h-4 w-4" />
              批量生成 {batchCount} 个密钥
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              生成密钥
            </>
          )}
        </button>
      </form>

      {!batchMode && revealedKey && (
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
          <button
            onClick={handleCopySingle}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              copied
                ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                : 'bg-vault-accent1/15 text-vault-accent1 hover:bg-vault-accent1/25'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                已复制到剪贴板
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                复制到剪贴板
              </>
            )}
          </button>
        </div>
      )}

      {batchMode && batchKeys.length > 0 && (
        <div className="animate-fade-in-up mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-400">
              ⚠ 密钥明文仅展示15秒，请及时复制
            </span>
            <span className="text-xs text-gray-500">
              共 {batchKeys.length} 个
            </span>
          </div>
          <div className="space-y-2">
            {batchKeys.map((bk) => {
              const isCopied = copiedBatchIds.has(bk.id);
              const secondsLeft = getBatchTimeLeft(bk.revealUntil);
              return (
                <div
                  key={bk.id}
                  className="flex items-center gap-3 rounded-lg border border-vault-border bg-[#1E1E2E] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 truncate text-xs font-medium text-gray-400">
                      {bk.name}
                    </div>
                    <div className="key-reveal-highlight break-all text-xs">
                      {bk.rawKey}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-xs text-yellow-500">
                      {secondsLeft}s
                    </span>
                    <button
                      onClick={() => handleCopyBatch(bk.id, bk.rawKey)}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
                        isCopied
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-vault-accent1/15 text-vault-accent1 hover:bg-vault-accent1/25'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
