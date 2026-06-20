import MessageForm from '@/components/MessageForm';
import { useStore } from '@/store';

export default function Messages() {
  const messages = useStore((s) => s.messages);
  const visibleMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--color-text)' }}>留言板</h1>

      <div className="card p-6 mb-8 animate-fade-up">
        <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--color-text)' }}>提交留言</h2>
        <MessageForm />
      </div>

      <div className="space-y-4">
        {visibleMessages.map((msg, idx) => (
          <div
            key={msg.id}
            className="card p-5 animate-fade-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0"
                style={{ backgroundColor: '#6C63FF' }}
              >
                {msg.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{msg.nickname}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{msg.content}</p>
              </div>
            </div>
          </div>
        ))}

        {visibleMessages.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>暂无留言，成为第一个留言者吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
