import { useState, useMemo, useRef } from 'react';
import { Plus, X, CheckCircle, Clock, AlertCircle, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useStore } from '@/shared/store';
import type { ProgressLog, LogStatus, Task } from '@/shared/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<LogStatus, { label: string; icon: typeof CheckCircle; color: string; dotClass: string; bgClass: string }> = {
  completed: { label: '完成', icon: CheckCircle, color: 'text-log-completed', dotClass: 'bg-log-completed', bgClass: 'bg-log-completed/10' },
  progress: { label: '推进', icon: Clock, color: 'text-log-progress', dotClass: 'bg-log-progress', bgClass: 'bg-log-progress/10' },
  blocked: { label: '阻塞', icon: AlertCircle, color: 'text-log-blocked', dotClass: 'bg-log-blocked', bgClass: 'bg-log-blocked/10' },
};

interface TaskTimelineProps {
  task: Task;
}

export default function TaskTimeline({ task }: TaskTimelineProps) {
  const allLogs = useStore((s) => s.progressLogs);
  const addProgressLog = useStore((s) => s.addProgressLog);
  const deleteProgressLog = useStore((s) => s.deleteProgressLog);

  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<LogStatus>('progress');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logs = useMemo(() => {
    return allLogs
      .filter((l) => l.taskId === task.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allLogs, task.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setImageUrl(result);
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addProgressLog({
        taskId: task.id,
        content: content.trim(),
        status,
        imageUrl,
      });
      setIsAdding(false);
      setContent('');
      setStatus('progress');
      setImageUrl(null);
    } catch (err) {
      console.error('Failed to add log:', err);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-white text-lg">
          进度日志
          <span className="ml-2 text-sm font-normal text-forge-muted">
            ({logs.length})
          </span>
        </h4>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={cn(
              'btn-elastic px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-forge-accent/15 text-forge-accent hover:bg-forge-accent/25',
              'flex items-center gap-1.5',
            )}
          >
            <Plus size={14} />
            添加日志
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">新建进度日志</span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setContent('');
                setImageUrl(null);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-forge-muted"
            >
              <X size={16} />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="记录今天的进展...（可直接粘贴图片）"
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg bg-forge-bg/60 border border-forge-border',
              'text-white placeholder-forge-muted/60 text-sm focus:outline-none focus:border-forge-accent',
              'resize-none',
            )}
          />

          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="Preview" className="max-h-32 rounded-lg" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-forge-muted">状态：</span>
            {(Object.keys(statusConfig) as LogStatus[]).map((s) => {
              const config = statusConfig[s];
              const Icon = config.icon;
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'btn-elastic px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1',
                    active ? cn(config.bgClass, config.color) : 'text-forge-muted hover:text-white',
                  )}
                >
                  <Icon size={12} />
                  {config.label}
                </button>
              );
            })}
            <div className="flex-1" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-elastic px-2.5 py-1 rounded-md text-xs text-forge-muted hover:text-white flex items-center gap-1"
            >
              <Upload size={12} />
              上传图片
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className={cn(
                'btn-elastic px-4 py-1.5 rounded-lg text-sm font-medium text-white',
                'bg-forge-accent hover:bg-forge-accent-hover',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              )}
            >
              保存
            </button>
          </div>
        </form>
      )}

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-forge-border/70" />
        {logs.length === 0 ? (
          <div className="py-8 text-center">
            <ImageIcon size={28} className="mx-auto mb-2 text-forge-muted/50" />
            <p className="text-sm text-forge-muted">还没有进度日志</p>
            <p className="text-xs text-forge-muted/70">点击上方按钮开始记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                formatDate={formatDate}
                onDelete={() => {
                  if (confirm('确定要删除这条日志吗？')) {
                    deleteProgressLog(log.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LogItemProps {
  log: ProgressLog;
  formatDate: (ts: number) => string;
  onDelete: () => void;
}

function LogItem({ log, formatDate, onDelete }: LogItemProps) {
  const config = statusConfig[log.status];
  const Icon = config.icon;

  return (
    <div className="relative group">
      <div
        className={cn(
          'absolute -left-[13px] top-4 w-4 h-4 rounded-full border-2 border-forge-bg z-10 flex items-center justify-center',
          config.dotClass,
        )}
      >
        <Icon size={8} className="text-forge-bg" strokeWidth={3} />
      </div>
      <div
        className={cn(
          'glass-card rounded-xl p-4 ml-2 transition-all',
          'hover:shadow-lg',
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                config.bgClass,
                config.color,
              )}
            >
              <Icon size={10} />
              {config.label}
            </span>
            <span className="text-xs text-forge-muted">
              {formatDate(log.createdAt)}
            </span>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-forge-muted hover:text-red-400 transition-opacity"
            aria-label="删除日志"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-sm text-forge-text whitespace-pre-wrap leading-relaxed">
          {log.content}
        </p>
        {log.imageUrl && (
          <div className="mt-3">
            <img
              src={log.imageUrl}
              alt="Progress"
              className="max-w-full max-h-64 rounded-lg border border-forge-border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
