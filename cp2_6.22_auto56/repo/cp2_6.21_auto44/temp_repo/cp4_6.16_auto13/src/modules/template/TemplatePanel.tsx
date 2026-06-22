import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { X } from 'lucide-react';
import type { PosterTemplate } from '@/types';

const categoryMap: Record<PosterTemplate['category'], string> = {
  festival: '节日',
  promotion: '促销',
  morning: '早安',
  other: '其他',
};

const categoryColorMap: Record<PosterTemplate['category'], string> = {
  festival: 'from-rose-400 to-pink-500',
  promotion: 'from-amber-400 to-orange-500',
  morning: 'from-sky-400 to-blue-500',
  other: 'from-slate-400 to-gray-500',
};

export default function TemplatePanel() {
  const {
    templates,
    templateTransitionKey,
    setActivePanel,
    applyTemplate,
  } = useEditorStore();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePanel(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [setActivePanel]);

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId);
    setActivePanel(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-slate-900/20 backdrop-blur-sm
        animate-[fadeOverlay_0.25s_ease-out]"
    >
      <style>{`
        @keyframes fadeOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        ref={panelRef}
        className="relative w-[520px] max-h-[85vh] flex flex-col
          bg-white/60 backdrop-blur-2xl
          border border-white/70
          rounded-3xl shadow-2xl shadow-slate-400/30
          animate-[scaleIn_0.3s_ease-out]"
      >
        <div
          className="flex items-center justify-between px-7 py-5
            border-b border-white/70
            bg-gradient-to-r from-white/80 via-indigo-50/40 to-white/80 backdrop-blur-md
            rounded-t-3xl"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-indigo-400 to-purple-500
                shadow-lg shadow-indigo-200/60"
            >
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                模板库
              </h2>
              <p className="text-[11px] text-slate-500">
                共 {templates.length} 个精美模板
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="w-9 h-9 flex items-center justify-center rounded-xl
              text-slate-500 hover:text-slate-800
              hover:bg-white/80 transition-all duration-200
              border border-transparent hover:border-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          key={templateTransitionKey}
          className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin"
        >
          <div className="grid grid-cols-2 gap-4">
            {templates.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl.id)}
                className="group relative flex flex-col
                  w-[220px] h-[340px]
                  bg-white/50 backdrop-blur-md
                  border border-white/70
                  rounded-2xl overflow-hidden
                  shadow-md shadow-slate-200/50
                  transition-all duration-300 ease-out
                  hover:-translate-y-1
                  hover:shadow-2xl hover:shadow-indigo-200/60
                  hover:border-indigo-300/60
                  focus:outline-none focus:ring-4 focus:ring-indigo-200/60"
                style={{
                  animation: `cardFadeUp 0.4s ease-out ${idx * 0.06}s both`,
                }}
              >
                <div className="relative w-full h-[280px] overflow-hidden">
                  <img
                    src={tpl.thumbnail}
                    alt={tpl.name}
                    className="w-full h-full object-cover
                      transition-transform duration-500 ease-out
                      group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0
                      bg-gradient-to-t from-black/30 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-all duration-300
                      bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                      backdrop-blur-[2px]"
                  >
                    <div
                      className="px-5 py-2.5 rounded-full
                        bg-white/95 backdrop-blur-md
                        shadow-xl shadow-slate-400/30
                        border border-white
                        flex items-center gap-2
                        transform translate-y-2 group-hover:translate-y-0
                        transition-transform duration-300"
                    >
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-sm font-bold text-indigo-700">
                        应用模板
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 px-4 py-3 flex flex-col justify-center gap-2
                    bg-gradient-to-b from-white/60 to-white/80 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-sm font-bold text-slate-800 truncate
                        group-hover:text-indigo-700 transition-colors duration-200"
                    >
                      {tpl.name}
                    </h3>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white
                        bg-gradient-to-r ${categoryColorMap[tpl.category]}
                        shadow-sm`}
                    >
                      {categoryMap[tpl.category]}
                    </span>
                  </div>
                </div>

                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none
                    ring-0 group-hover:ring-2
                    ring-indigo-400/40
                    transition-all duration-300"
                />
              </button>
            ))}
          </div>
        </div>

        <div
          className="px-6 py-3.5
            border-t border-white/70
            bg-gradient-to-r from-white/60 to-indigo-50/40 backdrop-blur-md
            rounded-b-3xl
            flex items-center justify-between"
        >
          <p className="text-[11px] text-slate-500">
            点击卡片即可应用对应模板
          </p>
          <button
            onClick={() => setActivePanel(null)}
            className="px-4 h-8 rounded-lg text-xs font-medium
              text-slate-600 hover:text-slate-800
              hover:bg-white/80 transition-all duration-200"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
