import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Sun, Moon } from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function Home() {
  const navigate = useNavigate();
  const { setUserName, setRoomId } = useYjsStore();
  const { toggleTheme, isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('coedit-userName');
    if (savedName) setUsername(savedName);
  }, []);

  const handleGenerateRoomId = () => {
    setRoomIdInput(generateRoomId());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const finalRoomId = roomIdInput.trim() || generateRoomId();
    setUserName(username.trim());
    setRoomId(finalRoomId);
    navigate(`/editor/${finalRoomId}`);
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4 relative overflow-hidden',
        'bg-gradient-to-br from-editor-light via-white to-blue-50',
        'dark:from-editor-dark dark:via-surface-dark dark:to-blue-950'
      )}
    >
      <div
        className={cn(
          'absolute top-6 right-6 z-10',
          'w-10 h-10 rounded-full flex items-center justify-center cursor-pointer',
          'bg-white/50 dark:bg-surface-dark/50',
          'backdrop-blur-md border border-border-light dark:border-border-dark',
          'text-text-light dark:text-text-dark',
          'hover:bg-white/70 dark:hover:bg-surface-dark/70',
          'transition-all duration-200'
        )}
        onClick={toggleTheme}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </div>

      <div
        className={cn(
          'absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl',
          'bg-accent/40 dark:bg-accent/20'
        )}
      />
      <div
        className={cn(
          'absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl',
          'bg-purple-400/40 dark:bg-purple-600/20'
        )}
      />

      <div
        className={cn(
          'w-full max-w-md rounded-2xl p-8 relative z-0',
          'bg-white/60 dark:bg-surface-dark/60',
          'backdrop-blur-xl border border-border-light dark:border-border-dark',
          'shadow-2xl animate-fade-in'
        )}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-1">CoEdit</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">实时协作编辑器</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-light dark:text-text-dark mb-1.5">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入你的用户名"
              className={cn(
                'w-full px-4 py-2.5 rounded-lg text-sm border outline-none transition-all duration-200',
                'bg-white/50 dark:bg-surface-dark/50',
                'border-border-light dark:border-border-dark',
                'text-text-light dark:text-text-dark',
                'placeholder:text-muted-light dark:placeholder:text-muted-dark',
                'focus:ring-2 focus:ring-accent/30 focus:border-accent/50'
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-light dark:text-text-dark mb-1.5">
              房间号
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="输入房间号或点击生成"
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition-all duration-200',
                  'bg-white/50 dark:bg-surface-dark/50',
                  'border-border-light dark:border-border-dark',
                  'text-text-light dark:text-text-dark',
                  'placeholder:text-muted-light dark:placeholder:text-muted-dark',
                  'focus:ring-2 focus:ring-accent/30 focus:border-accent/50'
                )}
              />
              <button
                type="button"
                onClick={handleGenerateRoomId}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  'bg-white/50 dark:bg-surface-dark/50',
                  'border border-border-light dark:border-border-dark',
                  'text-text-light dark:text-text-dark',
                  'hover:bg-white/70 dark:hover:bg-surface-dark/70',
                  'active:scale-95'
                )}
                title="生成随机房间号"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              'bg-accent text-white hover:bg-accent/85',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'active:scale-[0.98]'
            )}
          >
            加入房间
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
