import { useState, useMemo } from 'react';
import * as Y from 'yjs';
import { X, FileText, MessageSquare, ListTodo, CheckCircle2 } from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { cn } from '@/lib/utils';
import TaskBoard from '@/components/TaskBoard';
import type { IComment } from '@/shared/types';

interface PropertyPanelProps {
  doc: Y.Doc;
  onClose: () => void;
}

type TabId = 'info' | 'comments' | 'tasks';

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'info', label: '文档信息', icon: FileText },
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'tasks', label: '任务', icon: ListTodo },
];

export default function PropertyPanel({ doc, onClose }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const { comments, resolveComment, roomId, users } = useYjsStore();

  const docInfo = useMemo(() => {
    const fragment = doc.getXmlFragment('content');
    const text = fragment.toString();
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return { chars, words, text };
  }, [doc]);

  const roomComments = comments.filter((c) => c.roomId === roomId);

  const handleCommentClick = (comment: IComment) => {
    window.dispatchEvent(
      new CustomEvent('editor-highlight-range', {
        detail: { from: comment.from, to: comment.to },
      })
    );
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'w-80 h-full flex flex-col shrink-0',
        'bg-white/70 dark:bg-surface-dark/70',
        'backdrop-blur-xl border-l border-border-light dark:border-border-dark',
        'animate-slide-in-right'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light/50 dark:border-border-dark/50">
        <span className="text-sm font-semibold text-text-light dark:text-text-dark">
          属性面板
        </span>
        <button
          onClick={onClose}
          className="text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex border-b border-border-light/50 dark:border-border-dark/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs transition-colors duration-200',
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase mb-2">
                统计
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={cn(
                    'rounded-lg p-3',
                    'bg-white/50 dark:bg-surface-dark/50',
                    'border border-border-light/30 dark:border-border-dark/30'
                  )}
                >
                  <div className="text-lg font-bold text-accent">{docInfo.words}</div>
                  <div className="text-[10px] text-muted-light dark:text-muted-dark">词数</div>
                </div>
                <div
                  className={cn(
                    'rounded-lg p-3',
                    'bg-white/50 dark:bg-surface-dark/50',
                    'border border-border-light/30 dark:border-border-dark/30'
                  )}
                >
                  <div className="text-lg font-bold text-accent">{docInfo.chars}</div>
                  <div className="text-[10px] text-muted-light dark:text-muted-dark">字符数</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase mb-2">
                最近保存
              </h4>
              <p className="text-xs text-text-light dark:text-text-dark">
                {new Date().toLocaleString('zh-CN')}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase mb-2">
                在线用户
              </h4>
              {users.length === 0 ? (
                <p className="text-xs text-muted-light dark:text-muted-dark">暂无在线用户</p>
              ) : (
                <div className="space-y-1.5">
                  {users.map((user) => (
                    <div key={user.userId} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name[0]}
                      </div>
                      <span className="text-xs text-text-light dark:text-text-dark">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-4 space-y-2">
            {roomComments.length === 0 ? (
              <p className="text-xs text-muted-light dark:text-muted-dark py-4 text-center">
                暂无评论
              </p>
            ) : (
              roomComments.map((comment) => (
                <div
                  key={comment.id}
                  onClick={() => handleCommentClick(comment)}
                  className={cn(
                    'rounded-lg p-3 cursor-pointer transition-all duration-200',
                    'bg-white/50 dark:bg-surface-dark/50',
                    'border border-border-light/30 dark:border-border-dark/30',
                    'hover:bg-accent/5',
                    comment.resolved && 'opacity-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: comment.authorColor }}
                    >
                      {comment.author[0]}
                    </div>
                    <span className="text-xs font-medium text-text-light dark:text-text-dark flex-1 truncate">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-muted-light dark:text-muted-dark">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-light dark:text-text-dark pl-7 line-clamp-2">
                    {comment.text}
                  </p>
                  {!comment.resolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveComment(comment.id);
                      }}
                      className="flex items-center gap-1 mt-1.5 pl-7 text-[10px] text-success hover:underline"
                    >
                      <CheckCircle2 size={10} />
                      解决
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-3 h-full">
            <TaskBoard doc={doc} />
          </div>
        )}
      </div>
    </div>
  );
}
