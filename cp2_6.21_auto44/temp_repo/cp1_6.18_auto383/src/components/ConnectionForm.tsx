import { useState, useEffect } from 'react';
import {
  X as CloseIcon,
  Save as SaveIcon,
  Trash2 as TrashIcon,
  ArrowRight as ArrowRightIcon,
  CircleDot as CircleDotIcon,
  Minus as MinusIcon,
  Waves as WavesIcon,
} from 'lucide-react';
import { useTimelineStore } from '@/dataManager';
import { createUIController } from '@/uiController';
import { cn } from '@/lib/utils';
import { PRESET_COLORS, LineAnimation, Connection } from '@/types';

const ui = createUIController();

const animationOptions: { key: LineAnimation; label: string; Icon: typeof MinusIcon }[] = [
  { key: 'none', label: '无', Icon: MinusIcon },
  { key: 'flowing', label: '流动光点', Icon: CircleDotIcon },
  { key: 'wave', label: '波浪', Icon: WavesIcon },
];

function AnimationPreview({ type, color, width }: { type: LineAnimation; color: string; width: number }) {
  if (type === 'none') {
    return (
      <svg viewBox="0 0 80 24" className="h-6 w-20">
        <line x1="2" y1="12" x2="78" y2="12" stroke={color} strokeWidth={width} strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'flowing') {
    return (
      <svg viewBox="0 0 80 24" className="h-6 w-20">
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <line x1="2" y1="12" x2="78" y2="12" stroke="url(#flowGrad)" strokeWidth={width} strokeLinecap="round" />
        <circle cx="40" cy="12" r={Math.max(2, width - 0.5)} fill={color} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20">
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M 2 12 Q 12 4 22 12 T 42 12 T 62 12 T 78 12"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth={width}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ConnectionForm() {
  const showConnectionForm = useTimelineStore((s) => s.showConnectionForm);
  const editingConnection = useTimelineStore((s) => s.editingConnection);
  const getEvent = useTimelineStore((s) => s.getEvent);
  const removeConnection = useTimelineStore((s) => s.removeConnection);

  const [color, setColor] = useState(PRESET_COLORS[2]);
  const [width, setWidth] = useState(2);
  const [animation, setAnimation] = useState<LineAnimation>('none');

  useEffect(() => {
    if (editingConnection) {
      setColor(editingConnection.color);
      setWidth(editingConnection.width);
      setAnimation(editingConnection.animation);
    }
  }, [editingConnection]);

  if (!showConnectionForm || !editingConnection) return null;

  const fromEvent = getEvent(editingConnection.fromEventId);
  const toEvent = getEvent(editingConnection.toEventId);

  const handleClose = () => ui.hideConnectionForm();

  const handleDelete = () => {
    if (editingConnection.id) {
      removeConnection(editingConnection.id);
      useTimelineStore.getState().showNotification('关联线已删除', 'success');
      ui.hideConnectionForm();
    }
  };

  const handleSave = () => {
    ui.submitConnectionForm({ color, width, animation });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-[420px] max-w-[92vw] rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">关联线样式</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-3 dark:from-gray-800 dark:to-gray-800/70">
            <div className="flex flex-1 min-w-0 flex-col items-start rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
              <span className="text-[11px] text-gray-400">源节点</span>
              <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {fromEvent?.title || '(未知)'}
              </span>
            </div>
            <div className="flex items-center justify-center text-[#6366F1]">
              <ArrowRightIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-1 min-w-0 flex-col items-end rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
              <span className="text-[11px] text-gray-400">目标节点</span>
              <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {toEvent?.title || '(未知)'}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              颜色
            </label>
            <div className="grid grid-cols-4 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              {PRESET_COLORS.map((c) => {
                const selected = color === c;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-6 w-6 rounded transition',
                      selected
                        ? 'ring-[3px] ring-[#6366F1] ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>线宽</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{width}px</span>
            </label>
            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#6366F1] dark:bg-gray-700"
              />
              <div className="flex items-center justify-center rounded-md bg-white py-3 dark:bg-gray-900">
                <svg viewBox="0 0 200 24" className="h-6 w-full max-w-[180px]">
                  <line
                    x1="10"
                    y1="12"
                    x2="190"
                    y2="12"
                    stroke={color}
                    strokeWidth={width}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              动画效果
            </label>
            <div className="grid grid-cols-3 gap-2">
              {animationOptions.map(({ key, label, Icon }) => {
                const active = animation === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAnimation(key)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-3 transition',
                      active
                        ? 'border-[#6366F1] bg-indigo-50 dark:border-[#6366F1] dark:bg-indigo-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
                    )}
                  >
                    <AnimationPreview type={key} color={active ? '#6366F1' : color} width={2} />
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        active ? 'text-[#6366F1]' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        active
                          ? 'text-[#6366F1]'
                          : 'text-gray-600 dark:text-gray-300'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashIcon className="h-4 w-4" />
            删除关联线
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#4F46E5]"
            >
              <SaveIcon className="h-4 w-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
