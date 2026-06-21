import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { cn } from '@/lib/utils';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { setUserName, setRoomId } = useYjsStore();
  const [username, setUsername] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('default');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setUserName(username.trim());
    setRoomId(roomIdInput.trim() || 'default');
    navigate(`/editor/${roomIdInput.trim() || 'default'}`);
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4',
        'bg-gradient-to-br from-editor-light via-white to-blue-50',
        'dark:from-editor-dark dark:via-surface-dark dark:to-blue-950'
      )}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-2xl p-8',
          'bg-white/60 dark:bg-surface-dark/60',
          'backdrop-blur-xl border border-border-light dark:border-border-dark',
          'shadow-2xl animate-fade-in'
        )}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-1">CoEdit</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">实时协作编辑器</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="输入房间号"
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
