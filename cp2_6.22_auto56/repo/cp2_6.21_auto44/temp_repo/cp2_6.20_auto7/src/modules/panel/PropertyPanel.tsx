import { useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { FONT_OPTIONS, FONT_WEIGHT_OPTIONS } from '@/store/types';
import { X, Type, Palette, MousePointerClick } from 'lucide-react';

export default function PropertyPanel() {
  const selectedId = useResumeStore((s) => s.selectedId);
  const components = useResumeStore((s) => s.components);
  const updateComponent = useResumeStore((s) => s.updateComponent);
  const updateComponentStyle = useResumeStore((s) => s.updateComponentStyle);
  const selectComponent = useResumeStore((s) => s.selectComponent);
  const pushHistory = useResumeStore((s) => s.pushHistory);

  const selected = components.find((c) => c.id === selectedId);

  const handleContentChange = useCallback(
    (id: string, value: string) => {
      updateComponent(id, { content: value });
    },
    [updateComponent]
  );

  const handleContentBlur = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const handleStyleChange = useCallback(
    (id: string, updates: Partial<{ fontFamily: string; fontSize: number; color: string; backgroundColor: string; fontWeight: string }>) => {
      updateComponentStyle(id, updates);
    },
    [updateComponentStyle]
  );

  const handleStyleBlur = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const handleSizeChange = useCallback(
    (id: string, field: 'width' | 'height', value: number) => {
      updateComponent(id, { [field]: Math.max(field === 'width' ? 60 : 30, value) });
    },
    [updateComponent]
  );

  const handleSizeBlur = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  if (!selected) {
    return (
      <aside className="w-[280px] flex-shrink-0 bg-white border-l border-slate-200/60 flex flex-col h-full animate-slide-in">
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">属性面板</h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <MousePointerClick size={22} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">请选择一个组件</p>
          <p className="text-xs text-slate-300 text-center leading-relaxed">
            点击画布上的任意组件即可查看和编辑其属性
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white border-l border-slate-200/60 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">属性面板</h2>
        </div>
        <button
          onClick={() => selectComponent(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">文本内容</label>
          <textarea
            value={selected.content}
            onChange={(e) => handleContentChange(selected.id, e.target.value)}
            onBlur={handleContentBlur}
            className="w-full h-28 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
            <Type size={12} />
            字体
          </label>
          <select
            value={selected.style.fontFamily}
            onChange={(e) => {
              handleStyleChange(selected.id, { fontFamily: e.target.value });
              handleStyleBlur();
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all bg-white"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">字号: {selected.style.fontSize}px</label>
          <input
            type="range"
            min={10}
            max={48}
            value={selected.style.fontSize}
            onChange={(e) => handleStyleChange(selected.id, { fontSize: Number(e.target.value) })}
            onMouseUp={handleStyleBlur}
            onTouchEnd={handleStyleBlur}
            className="w-full accent-blue-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">字重</label>
          <div className="grid grid-cols-4 gap-1.5">
            {FONT_WEIGHT_OPTIONS.map((w) => (
              <button
                key={w.value}
                onClick={() => {
                  handleStyleChange(selected.id, { fontWeight: w.value });
                  handleStyleBlur();
                }}
                className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                  selected.style.fontWeight === w.value
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">文字颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selected.style.color === 'transparent' ? '#000000' : selected.style.color}
              onChange={(e) => handleStyleChange(selected.id, { color: e.target.value })}
              onBlur={handleStyleBlur}
              className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={selected.style.color}
              onChange={(e) => handleStyleChange(selected.id, { color: e.target.value })}
              onBlur={handleStyleBlur}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">背景颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selected.style.backgroundColor === 'transparent' ? '#ffffff' : selected.style.backgroundColor}
              onChange={(e) => handleStyleChange(selected.id, { backgroundColor: e.target.value })}
              onBlur={handleStyleBlur}
              className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={selected.style.backgroundColor}
              onChange={(e) => handleStyleChange(selected.id, { backgroundColor: e.target.value })}
              onBlur={handleStyleBlur}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">尺寸</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">宽度</span>
              <input
                type="number"
                value={selected.width}
                onChange={(e) => handleSizeChange(selected.id, 'width', Number(e.target.value))}
                onBlur={handleSizeBlur}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">高度</span>
              <input
                type="number"
                value={selected.height}
                onChange={(e) => handleSizeChange(selected.id, 'height', Number(e.target.value))}
                onBlur={handleSizeBlur}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
