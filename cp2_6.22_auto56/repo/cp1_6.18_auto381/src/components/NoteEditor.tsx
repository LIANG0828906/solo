import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useMeetingStore, type SaveStatus } from '@/hooks/useMeetingStore';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  meetingId: string;
  initialNotes?: string;
  className?: string;
}

export function NoteEditor({ meetingId, initialNotes = '', className }: NoteEditorProps) {
  const updateNotes = useMeetingStore(state => state.updateNotes);
  const saveStatus = useMeetingStore(state => state.saveStatus);
  const setSaveStatus = useMeetingStore(state => state.setSaveStatus);

  const [notes, setNotes] = useState(initialNotes);
  const lastSavedRef = useRef<string>(initialNotes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(initialNotes);
    lastSavedRef.current = initialNotes;
  }, [initialNotes]);

  const handleSave = useCallback(async () => {
    if (notes === lastSavedRef.current || saveStatus === 'saving') return;

    lastSavedRef.current = notes;
    await updateNotes(meetingId, notes);
  }, [notes, meetingId, updateNotes, saveStatus]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (notes !== lastSavedRef.current) {
      setSaveStatus('idle');
      timerRef.current = setTimeout(() => {
        handleSave();
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notes, handleSave, setSaveStatus]);

  const getSaveStatusConfig = (status: SaveStatus) => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: '保存中...',
          className: 'text-primary',
        };
      case 'saved':
        return {
          icon: <Check className="w-4 h-4" />,
          text: '已保存',
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: '保存失败',
          className: 'text-red-500',
        };
      default:
        return {
          icon: null,
          text: '编辑中',
          className: 'text-text-muted',
        };
    }
  };

  const statusConfig = getSaveStatusConfig(saveStatus);
  const hasChanges = notes !== lastSavedRef.current;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">会议笔记</h3>
        <div className={cn('flex items-center gap-1.5 text-sm', statusConfig.className)}>
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
          {hasChanges && saveStatus === 'idle' && (
            <span className="ml-1 text-xs text-text-muted">(5秒后自动保存)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-light">Markdown 编辑</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`# 会议标题\n\n## 讨论要点\n- 要点1\n- 要点2\n\n## 待办事项\n- [ ] 待办1\n- [ ] 待办2`}
            className={cn(
              'w-full min-h-[400px] p-4 rounded-lg bg-white',
              'border-2 border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20',
              'shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
              'text-text placeholder:text-text-muted',
              'focus:outline-none transition-all duration-200',
              'resize-y font-mono text-sm leading-relaxed'
            )}
          />
          <p className="text-xs text-text-muted">
            支持 Markdown 格式，使用 "- [ ] 任务" 格式可自动提取待办事项
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-light">实时预览</label>
          <div
            className={cn(
              'w-full min-h-[400px] p-4 rounded-lg bg-background-preview',
              'border border-primary/10',
              'overflow-auto prose prose-sm max-w-none'
            )}
          >
            {notes ? (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-text mb-4 pb-2 border-b border-primary/10">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-text mt-6 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-text mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-text-light leading-relaxed mb-3">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 mb-3 text-text-light">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 mb-3 text-text-light">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-text-light">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-white px-1.5 py-0.5 rounded text-secondary-dark text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-white p-4 rounded-lg overflow-x-auto mb-3 border border-primary/10">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-secondary pl-4 py-1 my-3 bg-secondary/5 rounded-r-lg text-text-light italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {notes}
              </ReactMarkdown>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                开始输入以查看实时预览
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
