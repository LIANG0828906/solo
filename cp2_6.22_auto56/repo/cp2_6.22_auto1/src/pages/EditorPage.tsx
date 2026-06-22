import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff, Hash, User, Send } from 'lucide-react';
import { useYjsConnection } from '@/module-editor/YjsProvider';
import { useYjsStore } from '@/hooks/useYjsStore';
import { useTheme } from '@/hooks/useTheme';
import Sidebar from '@/components/Sidebar';
import PropertyPanel from '@/components/PropertyPanel';
import HistoryPanel from '@/module-history/HistoryPanel';
import CommentPopup from '@/components/CommentPopup';
import Editor from '@/module-editor/Editor';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const userName = useYjsStore((s) => s.userName);
  const setUserName = useYjsStore((s) => s.setUserName);
  const setRoomId = useYjsStore((s) => s.setRoomId);
  const connected = useYjsStore((s) => s.connected);
  const users = useYjsStore((s) => s.users);
  const activePanel = useYjsStore((s) => s.activePanel);
  const setActivePanel = useYjsStore((s) => s.setActivePanel);
  const showCommentPopup = useYjsStore((s) => s.showCommentPopup);
  const commentPopupPosition = useYjsStore((s) => s.commentPopupPosition);
  const setShowCommentPopup = useYjsStore((s) => s.setShowCommentPopup);

  const [usernameInput, setUsernameInput] = useState('');

  const connection = useYjsConnection(roomId || '');

  useEffect(() => {
    if (roomId) {
      setRoomId(roomId);
    }
  }, [roomId, setRoomId]);

  const handleTogglePanel = (panel: string) => {
    if (panel === 'history') {
      setActivePanel(activePanel === 'history' ? 'none' : 'history');
    } else if (panel === 'comments' || panel === 'tasks' || panel === 'settings') {
      setActivePanel(activePanel === 'properties' ? 'none' : 'properties');
    }
  };

  const handleUserNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setUserName(usernameInput.trim());
  };

  if (!userName) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center p-4 transition-colors duration-300',
          'bg-gradient-to-br from-editor-light via-white to-blue-50',
          'dark:from-editor-dark dark:via-surface-dark dark:to-blue-950'
        )}
      >
        <div
          className={cn(
            'w-full max-w-md rounded-2xl p-8 animate-fade-in',
            'bg-white/60 dark:bg-surface-dark/60',
            'backdrop-blur-xl border border-border-light dark:border-border-dark',
            'shadow-2xl'
          )}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-accent mb-1">CoEdit</h1>
            <p className="text-sm text-muted-light dark:text-muted-dark">设置你的用户名</p>
          </div>

          <form onSubmit={handleUserNameSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-light dark:text-text-dark mb-1.5">
                用户名
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="输入你的用户名"
                  autoFocus
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition-all duration-300',
                    'bg-white/50 dark:bg-surface-dark/50',
                    'border-border-light dark:border-border-dark',
                    'text-text-light dark:text-text-dark',
                    'placeholder:text-muted-light dark:placeholder:text-muted-dark',
                    'focus:ring-2 focus:ring-accent/30 focus:border-accent/50'
                  )}
                />
                <button
                  type="submit"
                  disabled={!usernameInput.trim()}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                    'bg-accent text-white hover:bg-accent/85',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'active:scale-[0.98]'
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className={cn(
                'flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-all duration-300',
                'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark',
                'hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <ArrowLeft size={14} />
              返回首页
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center transition-colors duration-300',
          'bg-editor-light dark:bg-editor-dark'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-light dark:text-muted-dark">正在连接...</p>
        </div>
      </div>
    );
  }

  const { doc, provider, awareness } = connection;

  return (
    <div
      className={cn(
        'h-screen flex flex-col transition-colors duration-300 overflow-hidden',
        'bg-editor-light dark:bg-editor-dark'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 h-12 shrink-0',
          'bg-white/70 dark:bg-surface-dark/70',
          'backdrop-blur-xl border-b border-border-light dark:border-border-dark'
        )}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors duration-300',
              'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark'
            )}
          >
            <ArrowLeft size={14} />
            返回
          </button>

          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-accent" />
            <span className="text-sm font-medium text-text-light dark:text-text-dark">
              {roomId}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi size={14} className="text-success" />
            ) : (
              <WifiOff size={14} className="text-danger" />
            )}
            <span
              className={cn(
                'text-xs',
                connected ? 'text-success' : 'text-danger'
              )}
            >
              {connected ? '已连接' : '断开'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {users.length > 0 && (
            <div className="flex -space-x-2">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.userId}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-surface-dark transition-all duration-300'
                  )}
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name[0]?.toUpperCase() || <User size={12} />}
                </div>
              ))}
              {users.length > 5 && (
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-surface-dark',
                    'bg-muted-light dark:bg-muted-dark'
                  )}
                >
                  +{users.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar doc={doc} onTogglePanel={handleTogglePanel} />

        <div className="flex-1 flex flex-col overflow-hidden py-4">
          <Editor doc={doc} awareness={awareness} />
        </div>

        {activePanel === 'properties' && (
          <PropertyPanel
            doc={doc}
            onClose={() => setActivePanel('none')}
          />
        )}

        {activePanel === 'history' && (
          <HistoryPanel
            doc={doc}
            onClose={() => setActivePanel('none')}
          />
        )}
      </div>

      {showCommentPopup && (
        <CommentPopup
          doc={doc}
          position={commentPopupPosition}
          onClose={() => setShowCommentPopup(false)}
        />
      )}
    </div>
  );
}
