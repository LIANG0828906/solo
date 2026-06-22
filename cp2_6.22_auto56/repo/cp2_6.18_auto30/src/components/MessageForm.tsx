import { useState } from 'react';
import { useStore } from '@/store';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MessageForm() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const addMessage = useStore((s) => s.addMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !email.trim() || !content.trim()) return;

    setStatus('loading');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      addMessage({
        nickname: nickname.trim(),
        email: email.trim(),
        content: content.trim(),
      });
      setStatus('success');
      setNickname('');
      setEmail('');
      setContent('');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称"
          className="input-field"
          required
          disabled={status === 'loading'}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          className="input-field"
          required
          disabled={status === 'loading'}
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="留言内容..."
        className="input-field"
        style={{ minHeight: '100px', resize: 'vertical' }}
        required
        disabled={status === 'loading'}
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary text-sm" disabled={status === 'loading'}>
          提交留言
        </button>
        {status === 'loading' && (
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-slow" />
        )}
        {status === 'success' && (
          <div className="flex items-center gap-1 text-green-500 animate-check-pop">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#22c55e" />
              <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-medium">提交成功</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1 text-red-500 animate-shake">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#ef4444" />
              <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">提交失败</span>
          </div>
        )}
      </div>
    </form>
  );
}
