import { useState, useMemo, useEffect } from 'react';
import {
  Type as TextIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  X as CloseIcon,
  Trash2 as TrashIcon,
  Save as SaveIcon,
  Youtube as YoutubeIcon,
  Film as FilmIcon,
} from 'lucide-react';
import { useTimelineStore } from '@/dataManager';
import { createUIController, isImageUrl, isVideoUrl } from '@/uiController';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_COLORS, EventType } from '@/types';

const TITLE_MAX = 32;
const DESC_MAX = 500;

const ui = createUIController();

export default function EventForm() {
  const showEventForm = useTimelineStore((s) => s.showEventForm);
  const editingEvent = useTimelineStore((s) => s.editingEvent);
  const removeEvent = useTimelineStore((s) => s.removeEvent);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [touched, setTouched] = useState(false);

  const isEditMode = !!editingEvent?.id;

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description);
      setDate(editingEvent.date);
      setType(editingEvent.type);
      setMediaUrl(editingEvent.mediaUrl ?? '');
      setTouched(false);
    }
  }, [editingEvent]);

  if (!showEventForm || !editingEvent) return null;

  const titleValid = title.trim().length > 0 && title.length <= TITLE_MAX;
  const descValid = description.length <= DESC_MAX;

  const mediaValidation = useMemo(() => {
    if (!mediaUrl) return { valid: true, showPreview: false };
    if (type === 'image') {
      const ok = isImageUrl(mediaUrl);
      return { valid: true, showPreview: ok };
    }
    if (type === 'video') {
      const ok = isVideoUrl(mediaUrl);
      const isYoutube = /youtube\.com|youtu\.be/i.test(mediaUrl);
      const isVimeo = /vimeo\.com/i.test(mediaUrl);
      return { valid: true, showPreview: ok, isYoutube, isVimeo };
    }
    return { valid: true, showPreview: false };
  }, [mediaUrl, type]);

  const handleCancel = () => {
    ui.hideEventForm();
  };

  const handleDelete = () => {
    if (editingEvent.id) {
      removeEvent(editingEvent.id);
      useTimelineStore.getState().showNotification('事件已删除', 'success');
      ui.hideEventForm();
    }
  };

  const handleSave = () => {
    setTouched(true);
    if (!titleValid || !descValid) return;
    ui.submitEventForm({
      title: title.trim(),
      description,
      date,
      type,
      mediaUrl: type === 'text' ? undefined : mediaUrl || undefined,
    });
  };

  const typeTabs: { key: EventType; label: string; Icon: typeof TextIcon }[] = [
    { key: 'text', label: '文本', Icon: TextIcon },
    { key: 'image', label: '图片', Icon: ImageIcon },
    { key: 'video', label: '视频', Icon: VideoIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleCancel}>
      <div
        className="w-[440px] max-w-[92vw] rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditMode ? '编辑事件' : '新建事件'}
          </h2>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="输入事件标题..."
              className={cn(
                'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white',
                'focus:border-[#6366F1] focus:ring-0 focus:border-2',
                touched && !titleValid
                  ? 'border-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              )}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={cn(touched && !titleValid ? 'text-red-500' : 'text-transparent')}>
                标题不能为空
              </span>
              <span className="text-gray-400">{title.length}/{TITLE_MAX}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              描述
            </label>
            <textarea
              value={description}
              maxLength={DESC_MAX}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="事件描述（可选）..."
              rows={4}
              className={cn(
                'w-full resize-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white',
                'focus:border-[#6366F1] focus:ring-0 focus:border-2',
                !descValid ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'
              )}
            />
            <div className="mt-1 text-right text-xs text-gray-400">
              {description.length}/{DESC_MAX}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              日期
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="公元前用负号前缀如 -0044-03-15"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-2 focus:border-[#6366F1] focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              事件类型
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {typeTabs.map(({ key, label, Icon }) => {
                const active = type === key;
                const color = EVENT_TYPE_COLORS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: active ? color : undefined }}
                    />
                    <span style={{ color: active ? color : undefined }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {type !== 'text' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                媒体 URL
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={
                    type === 'image'
                      ? 'https://example.com/image.jpg'
                      : 'YouTube / Vimeo / 视频直链'
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-2 focus:border-[#6366F1] focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  {mediaUrl && mediaValidation.showPreview ? (
                    type === 'image' ? (
                      <img
                        src={mediaUrl}
                        alt="preview"
                        className="max-h-24 max-w-full rounded object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-3 rounded-md bg-gray-100 px-4 py-2.5 dark:bg-gray-700">
                        {mediaValidation.isYoutube ? (
                          <YoutubeIcon className="h-6 w-6 text-red-500" />
                        ) : mediaValidation.isVimeo ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1AB7EA] text-white text-xs font-bold">
                            V
                          </div>
                        ) : (
                          <FilmIcon className="h-6 w-6 text-purple-500" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {mediaValidation.isYoutube
                            ? 'YouTube 视频'
                            : mediaValidation.isVimeo
                            ? 'Vimeo 视频'
                            : '视频文件'}
                        </span>
                      </div>
                    )
                  ) : mediaUrl ? (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      {type === 'image' ? (
                        <ImageIcon className="h-7 w-7 opacity-60" />
                      ) : (
                        <VideoIcon className="h-7 w-7 opacity-60" />
                      )}
                      <span className="text-xs">链接无效，将显示占位图标</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      {type === 'image' ? (
                        <ImageIcon className="h-7 w-7 opacity-40" />
                      ) : (
                        <VideoIcon className="h-7 w-7 opacity-40" />
                      )}
                      <span className="text-xs">暂无媒体链接</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              取消
            </button>
            {isEditMode && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="h-4 w-4" />
                删除
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!titleValid || !descValid}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium text-white transition',
              titleValid && descValid
                ? 'bg-[#6366F1] hover:bg-[#4F46E5]'
                : 'cursor-not-allowed bg-gray-300 dark:bg-gray-700'
            )}
          >
            <SaveIcon className="h-4 w-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
