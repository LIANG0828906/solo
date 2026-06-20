import { useState } from 'react';
import { Check, Trash2, Mail, MailOpen, BarChart3, MessageSquare } from 'lucide-react';
import { useStore } from '@/store';
import StatsPanel from '@/components/StatsPanel';

type Tab = 'messages' | 'stats';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('messages');
  const [statsMountKey, setStatsMountKey] = useState(0);
  const messages = useStore((s) => s.messages);
  const markMessageRead = useStore((s) => s.markMessageRead);
  const deleteMessage = useStore((s) => s.deleteMessage);

  const handleTabSwitch = (next: Tab) => {
    setTab(next);
    if (next === 'stats') {
      setStatsMountKey((k) => k + 1);
    }
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--color-text)' }}>管理后台</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabSwitch('messages')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'messages' ? '#6C63FF' : 'var(--color-sidebar)',
            color: tab === 'messages' ? 'white' : 'var(--color-text)',
            border: '1px solid',
            borderColor: tab === 'messages' ? '#6C63FF' : 'var(--color-border)',
          }}
        >
          <MessageSquare size={16} />
          留言管理
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabSwitch('stats')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'stats' ? '#6C63FF' : 'var(--color-sidebar)',
            color: tab === 'stats' ? 'white' : 'var(--color-text)',
            border: '1px solid',
            borderColor: tab === 'stats' ? '#6C63FF' : 'var(--color-border)',
          }}
        >
          <BarChart3 size={16} />
          统计概览
        </button>
      </div>

      {tab === 'messages' && (
        <div className="space-y-3">
          {sorted.length === 0 && (
            <div className="text-center py-16">
              <p style={{ color: 'var(--color-text-secondary)' }}>暂无留言</p>
            </div>
          )}
          {sorted.map((msg) => (
            <div
              key={msg.id}
              className="card p-4"
              style={{ borderLeft: msg.isRead ? '3px solid transparent' : '3px solid #6C63FF' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0"
                  style={{ backgroundColor: msg.isRead ? 'var(--color-text-secondary)' : '#6C63FF' }}
                >
                  {msg.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {msg.nickname}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {msg.email}
                    </span>
                    {!msg.isRead && (
                      <span className="text-xs bg-brand-500/15 text-brand-500 px-1.5 py-0.5 rounded-full font-medium">
                        新
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {msg.content}
                  </p>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(msg.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!msg.isRead && (
                    <button
                      onClick={() => markMessageRead(msg.id)}
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500"
                      title="标记已读"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                    title="删除留言"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && <StatsPanel key={statsMountKey} />}
    </div>
  );
}
