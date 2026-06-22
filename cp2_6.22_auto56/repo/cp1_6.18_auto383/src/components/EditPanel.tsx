import { X, Calendar, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/dataManager';
import { useState, useRef, useEffect } from 'react';

type PanelTab = 'event' | 'connection';

export default function EditPanel() {
  const showEventForm = useTimelineStore((s) => s.showEventForm);
  const showConnectionForm = useTimelineStore((s) => s.showConnectionForm);
  const editingEvent = useTimelineStore((s) => s.editingEvent);
  const editingConnection = useTimelineStore((s) => s.editingConnection);

  const hideEventForm = useTimelineStore((s) => s.hideEventForm);
  const hideConnectionForm = useTimelineStore((s) => s.hideConnectionForm);

  const [activeTab, setActiveTab] = useState<PanelTab>('event');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerY, setDrawerY] = useState(0);
  const startYRef = useRef(0);
  const startDrawerYRef = useRef(0);
  const draggingRef = useRef(false);

  const isOpen = showEventForm || showConnectionForm;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    if (isOpen) {
      setDrawerOpen(true);
      setDrawerY(0);
      if (showConnectionForm && !showEventForm) {
        setActiveTab('connection');
      } else if (showEventForm && !showConnectionForm) {
        setActiveTab('event');
      }
    }
  }, [isOpen, showEventForm, showConnectionForm]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    if (activeTab === 'event') {
      hideEventForm();
    } else {
      hideConnectionForm();
    }
    setDrawerOpen(false);
  };

  const handleCloseAll = () => {
    hideEventForm();
    hideConnectionForm();
    setDrawerOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    startDrawerYRef.current = drawerY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    const newY = Math.max(0, startDrawerYRef.current + delta);
    setDrawerY(newY);
  };

  const handleTouchEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const threshold = 120;
    if (drawerY > threshold) {
      handleCloseAll();
    } else {
      setDrawerY(0);
    }
  };

  if (!isOpen) return null;

  const panelContent = (
    <div className="flex flex-col h-full bg-white">
      <div
        className={cn(
          'flex items-center justify-between border-b border-border px-2.5 py-3',
          'flex-shrink-0',
        )}
      >
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setActiveTab('event')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-colors duration-200',
              activeTab === 'event'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            <Calendar className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">事件</span>
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-colors duration-200',
              activeTab === 'connection'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            <GitBranch className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">关联线</span>
          </button>
        </div>
        <button
          onClick={handleCloseAll}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'transition-colors duration-200',
          )}
          aria-label="关闭面板"
        >
          <X className="w-5 h-5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {activeTab === 'event' ? (
          editingEvent ? (
            <EventForm />
          ) : (
            <EmptyState
              icon={<Calendar className="w-10 h-10 text-gray-300" strokeWidth={1.5} />}
              title="暂无编辑事件"
              subtitle="点击工具栏新增，或点击画布事件节点编辑"
            />
          )
        ) : editingConnection ? (
          <ConnectionForm />
        ) : (
          <EmptyState
            icon={<GitBranch className="w-10 h-10 text-gray-300" strokeWidth={1.5} />}
            title="暂无编辑关联线"
            subtitle="点击画布上的关联线进行编辑"
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile && (
        <>
          <div
            className={cn(
              'fixed inset-0 bg-black/30 z-40 transition-opacity duration-200',
              drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={handleCloseAll}
          />
          <aside
            className={cn(
              'fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl',
              'transition-transform duration-300 ease-out',
              drawerOpen ? 'translate-y-0' : 'translate-y-full',
            )}
            style={{
              height: '60vh',
              transform: `translateY(${drawerY}px)`,
              maxHeight: '60vh',
            }}
          >
            <div
              className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="h-[calc(60vh-32px)]">{panelContent}</div>
          </aside>
        </>
      )}

      {!isMobile && (
        <aside
          className={cn(
            'fixed top-[60px] right-0 bottom-0 z-30 w-[320px]',
            'bg-white border-l border-border shadow-lg',
            'animate-[slideInRight_0.25s_ease-out]',
          )}
        >
          {panelContent}
        </aside>
      )}
    </>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{subtitle}</p>
    </div>
  );
}

function EventForm() {
  const editingEvent = useTimelineStore((s) => s.editingEvent)!;
  const submitEventForm = useTimelineStore((s) => s.submitEventForm);
  const hideEventForm = useTimelineStore((s) => s.hideEventForm);
  const removeEvent = useTimelineStore((s) => s.removeEvent);
  const showNotification = useTimelineStore((s) => s.showNotification);

  const [title, setTitle] = useState(editingEvent.title);
  const [description, setDescription] = useState(editingEvent.description);
  const [date, setDate] = useState(editingEvent.date);
  const [type, setType] = useState(editingEvent.type);
  const [mediaUrl, setMediaUrl] = useState(editingEvent.mediaUrl ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEventForm({
      title: title.trim(),
      description: description.trim(),
      date,
      type,
      mediaUrl: mediaUrl.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (editingEvent.id) {
      removeEvent(editingEvent.id);
      showNotification('事件已删除', 'success');
      hideEventForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="标题" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入事件标题"
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-border bg-white',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400',
            'transition-all duration-150',
          )}
          maxLength={80}
        />
      </Field>

      <Field label="日期" required>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-border bg-white',
            'text-sm text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400',
            'transition-all duration-150',
          )}
        />
      </Field>

      <Field label="类型">
        <div className="flex gap-2">
          {(
            [
              { value: 'text', label: '文字' },
              { value: 'image', label: '图片' },
              { value: 'video', label: '视频' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                type === opt.value
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-border text-gray-600 hover:bg-gray-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      {type !== 'text' && (
        <Field label={type === 'image' ? '图片 URL' : '视频 URL'}>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder={type === 'image' ? 'https://...' : 'YouTube / Vimeo 链接'}
            className={cn(
              'w-full px-3 py-2 rounded-lg border border-border bg-white',
              'text-sm text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400',
              'transition-all duration-150',
            )}
          />
        </Field>
      )}

      <Field label="描述">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入事件描述...（可选）"
          rows={4}
          maxLength={500}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-border bg-white resize-none',
            'text-sm text-gray-900 placeholder:text-gray-400 leading-relaxed',
            'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400',
            'transition-all duration-150',
          )}
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {description.length}/500
        </p>
      </Field>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          className={cn(
            'w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium',
            'hover:bg-primary-600 active:bg-primary-700',
            'transition-colors duration-150 shadow-sm',
          )}
        >
          {editingEvent.id ? '保存修改' : '创建事件'}
        </button>
        {editingEvent.id && (
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              'w-full py-2 rounded-lg border border-danger/30 text-danger',
              'text-sm font-medium hover:bg-red-50',
              'transition-colors duration-150',
            )}
          >
            删除事件
          </button>
        )}
      </div>
    </form>
  );
}

function ConnectionForm() {
  const editingConnection = useTimelineStore((s) => s.editingConnection)!;
  const getEvent = useTimelineStore((s) => s.getEvent);
  const submitConnectionForm = useTimelineStore((s) => s.submitConnectionForm);
  const hideConnectionForm = useTimelineStore((s) => s.hideConnectionForm);
  const removeConnection = useTimelineStore((s) => s.removeConnection);
  const showNotification = useTimelineStore((s) => s.showNotification);
  const { PRESET_COLORS } = require('@/types') as typeof import('@/types');

  const [color, setColor] = useState(editingConnection.color);
  const [width, setWidth] = useState(editingConnection.width);
  const [animation, setAnimation] = useState(editingConnection.animation);

  const fromEvent = getEvent(editingConnection.fromEventId);
  const toEvent = getEvent(editingConnection.toEventId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitConnectionForm({ color, width, animation });
  };

  const handleDelete = () => {
    removeConnection(editingConnection.id);
    showNotification('关联线已删除', 'success');
    hideConnectionForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className={cn(
          'p-3 rounded-lg bg-gray-50 border border-border space-y-2',
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 w-12 flex-shrink-0">从</span>
          <span className="text-gray-900 font-medium truncate">
            {fromEvent?.title ?? '(已删除)'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 w-12 flex-shrink-0">到</span>
          <span className="text-gray-900 font-medium truncate">
            {toEvent?.title ?? '(已删除)'}
          </span>
        </div>
      </div>

      <Field label="颜色">
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'aspect-square rounded-md border-2 transition-all duration-150',
                color === c
                  ? 'border-gray-900 scale-110 shadow-sm'
                  : 'border-transparent hover:border-gray-300',
              )}
              style={{ backgroundColor: c }}
              aria-label={`选择颜色 ${c}`}
            />
          ))}
        </div>
      </Field>

      <Field label={`线宽 (${width}px)`}>
        <input
          type="range"
          min={2}
          max={6}
          step={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>2px</span>
          <span>4px</span>
          <span>6px</span>
        </div>
      </Field>

      <Field label="动画效果">
        <div className="flex flex-col gap-1.5">
          {(
            [
              { value: 'none', label: '无动画' },
              { value: 'flowing', label: '流动' },
              { value: 'wave', label: '波浪' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAnimation(opt.value)}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                animation === opt.value
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-border text-gray-600 hover:bg-gray-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          className={cn(
            'w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium',
            'hover:bg-primary-600 active:bg-primary-700',
            'transition-colors duration-150 shadow-sm',
          )}
        >
          保存修改
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            'w-full py-2 rounded-lg border border-danger/30 text-danger',
            'text-sm font-medium hover:bg-red-50',
            'transition-colors duration-150',
          )}
        >
          删除关联线
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
