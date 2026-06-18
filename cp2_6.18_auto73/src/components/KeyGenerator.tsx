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
} from 'lucide-react';

interface BatchKey {
  id: string;
  name: string;
  rawKey: string;
  revealUntil: number;
}

export default function KeyGenerator() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'reader'>('reader');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [batchCount, setBatchCount] = useState(3);
  const [batchKeys, setBatchKeys] = useState<BatchKey[]>([]);
  const [copiedBatchIds, setCopiedBatchIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const tickRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (batchKeys.length === 0) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    if (!tickRef.current) {
      tickRef.current = window.setInterval(() => {
        const now = Date.now();
        setBatchKeys((prev) =>
          prev.filter((k) => k.revealUntil > now)
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
  const nearLimit = charCount >= 40;
  const atLimit = charCount >= 50;

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
    setCopied(false);
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入密钥名称前缀');
      return;
    }
    if (trimmed.length > 45) {
      setError('名称前缀不能超过45个字符');
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
  };

  const handleCopySingle = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
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
      setTimeout(() => {
        setCopiedBatchIds((prev) => {
          const next = new Set(prev);
          next.delete(batchId);
          return next;
        });
      }, 1500);
    } catch {
      // ignore
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
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            maxLength={batchMode ? 45 : 50}
            placeholder={
              batchMode ? '例如：dev-key' : '例如：生产环境API密钥'
            }
            className="w-full rounded-lg border border-vault-border bg-[#1E1E2E] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-vault-accent1 focus:ring-1 focus:ring-vault-accent1/30"
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
              {charCount}/{batchMode ? 45 : 50}
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
                      ? 'border-vault-accent1 bg-vault-accent1/10 ring-1 ring-vault-accent1/30'
                      : 'border-vault-border bg-[#1E1E2E]/50 hover:border-gray-500'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-vault-accent1/20'
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
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-vault-accent1" />
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
                onClick={() =>
                  setBatchCount((prev) => Math.max(1, prev - 1))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vault-border bg-[#1E1E2E] text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
                aria-label="减少"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={batchCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) return;
                      setBatchCount(Math.min(10, Math.max(1, val)));
                    }}
                    className="w-full rounded-lg border border-vault-border bg-[#1E1E2E] px-4 py-2 text-center text-sm font-semibold text-white outline-none transition-colors focus:border-vault-accent1 focus:ring-1 focus:ring-vault-accent1/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBatchCount((prev) => Math.min(10, prev + 1))
                }
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
                  onClick={() => setBatchCount(num)}
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
