import { useState, useEffect, useCallback } from 'react';
import { useKeyStore, decryptValue } from '@/store/keyStore';
import type { Key } from '@/store/keyStore';
import { Copy, Ban, Clock, CheckCircle, X } from 'lucide-react';

function RoleBadge({ role }: { role: Key['role'] }) {
  const config = {
    admin: { label: 'Admin', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    editor: { label: 'Editor', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    reader: { label: 'Reader', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  };
  const c = config[role];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function KeyCard({
  keyData,
  onRevoke,
}: {
  keyData: Key;
  onRevoke: (keyData: Key) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isRevoked = keyData.status === 'revoked';
  const isActive = keyData.status === 'active';

  useEffect(() => {
    if (keyData.revealUntil && keyData.revealUntil > Date.now()) {
      setIsRevealed(true);
      const remaining = keyData.revealUntil - Date.now();
      const timer = setTimeout(() => setIsRevealed(false), remaining);
      return () => clearTimeout(timer);
    } else {
      setIsRevealed(false);
    }
  }, [keyData.revealUntil]);

  const handleCopy = useCallback(async () => {
    if (isRevoked) return;
    try {
      const rawKey = decryptValue(keyData.encryptedValue);
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  }, [keyData.encryptedValue, isRevoked]);

  const createdDate = new Date(keyData.createdAt);
  const dateStr = createdDate.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`animate-fade-in-up rounded-2xl border border-vault-border bg-vault-card p-5 card-shadow transition-all duration-300 ${
        isRevoked ? 'opacity-50' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">
            {keyData.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <RoleBadge role={keyData.role} />
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                isActive ? 'text-green-400' : 'text-gray-500'
              }`}
            >
              {isActive ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Ban className="h-3 w-3" />
              )}
              {isActive ? '活跃' : '已吊销'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-vault-border bg-[#1E1E2E] px-3 py-2">
        {isRevealed ? (
          <div className="key-reveal-highlight inline-block break-all">
            {decryptValue(keyData.encryptedValue)}
          </div>
        ) : (
          <span className="font-mono text-xs tracking-wider text-gray-400">
            {keyData.prefix}...
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{dateStr}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          disabled={isRevoked}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            copied
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : isRevoked
                ? 'cursor-not-allowed border-vault-border bg-transparent text-gray-600'
                : 'border-vault-border bg-transparent text-gray-300 hover:border-gray-500 hover:text-white'
          }`}
        >
          {copied ? (
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

        {isActive && (
          <button
            onClick={() => onRevoke(keyData)}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-transparent px-3 py-1.5 text-xs font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10"
          >
            <Ban className="h-3 w-3" />
            吊销
          </button>
        )}
      </div>
    </div>
  );
}

function RevokeModal({
  keyData,
  onConfirm,
  onCancel,
}: {
  keyData: Key;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-fade-in-up mx-4 w-full max-w-md rounded-2xl border border-vault-border bg-vault-card p-6 card-shadow">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
            <Ban className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">吊销密钥</h3>
        </div>
        <p className="mb-6 text-sm text-gray-300">
          确定要吊销密钥
          <span className="mx-1 font-semibold text-white">「{keyData.name}」</span>
          吗？此操作不可撤销。
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-vault-border bg-transparent px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            确认吊销
          </button>
        </div>
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-gray-500 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function KeyList() {
  const keys = useKeyStore((s) => s.keys);
  const revokeKey = useKeyStore((s) => s.revokeKey);
  const [revokeTarget, setRevokeTarget] = useState<Key | null>(null);

  const handleRevokeConfirm = () => {
    if (revokeTarget) {
      revokeKey(revokeTarget.id);
      setRevokeTarget(null);
    }
  };

  if (keys.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-vault-border bg-vault-card/50 p-8">
        <KeyRound className="mb-3 h-12 w-12 text-gray-600" />
        <p className="text-sm text-gray-500">还没有密钥，快去生成一个吧</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {keys.map((k) => (
          <KeyCard key={k.id} keyData={k} onRevoke={setRevokeTarget} />
        ))}
      </div>

      {revokeTarget && (
        <RevokeModal
          keyData={revokeTarget}
          onConfirm={handleRevokeConfirm}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </>
  );
}

function KeyRound(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.3 9.3" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}
