import { useState, useEffect, useRef } from 'react';
import { useCapsuleStore } from '@/store/capsuleStore';
import { verifyPassword } from '@/utils/crypto';

interface PasswordModalProps {
  capsuleId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PasswordModal({ capsuleId, onSuccess, onClose }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const capsule = useCapsuleStore((s) => s.capsules.find((c) => c.id === capsuleId));
  const recordFailedAttempt = useCapsuleStore((s) => s.recordFailedAttempt);
  const resetFailedAttempts = useCapsuleStore((s) => s.resetFailedAttempts);
  const refresh = useCapsuleStore((s) => s.refreshCapsules);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!capsule?.lockUntil) return;

    const updateLock = () => {
      const now = Date.now();
      const until = new Date(capsule.lockUntil!).getTime();
      const remaining = Math.max(0, Math.ceil((until - now) / 1000));
      setLockRemaining(remaining);
    };

    updateLock();
    const timer = setInterval(updateLock, 1000);
    return () => clearInterval(timer);
  }, [capsule?.lockUntil]);

  useEffect(() => {
    if (lockRemaining === 0 && capsule?.lockUntil) {
      refresh();
    }
  }, [lockRemaining, capsule?.lockUntil, refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || lockRemaining > 0) return;
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (!capsule?.passwordHash) return;

    setIsVerifying(true);
    setError(null);

    const valid = await verifyPassword(password, capsule.passwordHash);
    setIsVerifying(false);

    if (valid) {
      await resetFailedAttempts(capsuleId);
      onSuccess();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setError('密码错误');
      const locked = await recordFailedAttempt(capsuleId);
      if (locked) {
        setPassword('');
      }
      setPassword('');
    }
  };

  const isLocked = lockRemaining > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="password-modal-icon">🔒</div>
        <div className="password-modal-title">私密胶囊</div>
        <div className="password-modal-desc">请输入密码以开启此胶囊</div>

        {isLocked && (
          <div className="password-lock-info">
            尝试次数过多，请 {lockRemaining} 秒后再试
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="password-input-wrapper">
            <input
              ref={inputRef}
              type="password"
              className={`password-input ${isShaking ? 'error' : ''}`}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked || isVerifying}
              autoComplete="off"
            />
          </div>

          {error && !isLocked && <div className="password-error">{error}</div>}

          <div className="password-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isVerifying}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLocked || isVerifying}>
              {isVerifying ? <span className="loading-spinner" /> : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
