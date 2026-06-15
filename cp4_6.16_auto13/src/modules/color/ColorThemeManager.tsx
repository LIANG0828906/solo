import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { X, Check, Paintbrush } from 'lucide-react';
import type { ColorTheme } from '@/types';

export default function ColorThemeManager() {
  const {
    colorThemes,
    colorThemeId,
    setActivePanel,
    switchColorTheme,
    getCurrentTheme,
  } = useEditorStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const currentTheme = getCurrentTheme();

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

  const handleApplyBackground = (theme: ColorTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    useEditorStore.setState({ canvasBackground: theme.colors.background });
    if (colorThemeId !== theme.id) {
      switchColorTheme(theme.id);
    }
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
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes itemFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3),
                        0 8px 24px -4px rgba(102, 126, 234, 0.35);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.45),
                        0 12px 32px -4px rgba(102, 126, 234, 0.5);
          }
        }
      `}</style>

      <div
        ref={panelRef}
        className="relative w-[440px] max-h-[82vh] flex flex-col
          bg-white/60 backdrop-blur-2xl
          border border-white/70
          rounded-3xl shadow-2xl shadow-slate-400/30
          animate-[slideUp_0.35s_ease-out]"
      >
        <div
          className="flex items-center justify-between px-7 py-5
            border-b border-white/70
            bg-gradient-to-r from-white/80 via-purple-50/40 to-white/80 backdrop-blur-md
            rounded-t-3xl"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-purple-400 to-pink-500
                shadow-lg shadow-purple-200/60"
            >
              <Paintbrush className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                配色方案
              </h2>
              <p className="text-[11px] text-slate-500">
                当前：{currentTheme.name} · 共 {colorThemes.length} 套
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5 scrollbar-thin">
          {colorThemes.map((theme, idx) => {
            const isSelected = colorThemeId === theme.id;
            return (
              <div
                key={theme.id}
                style={{
                  animation: `itemFadeIn 0.35s ease-out ${idx * 0.08}s both`,
                }}
              >
                <button
                  onClick={() => switchColorTheme(theme.id)}
                  className={`w-full p-4 rounded-2xl
                    flex items-center gap-4
                    transition-all duration-300 ease-out
                    text-left
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-white/90 to-indigo-50/70 backdrop-blur-md border-2 border-transparent animate-[pulseGlow_2.5s_ease-in-out_infinite]'
                        : 'bg-white/40 backdrop-blur-sm border-2 border-transparent hover:bg-white/60 hover:border-indigo-200/60 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-0.5'
                    }`}
                  style={
                    isSelected
                      ? {
                          borderImage:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1',
                        }
                      : undefined
                  }
                >
                  <div className="flex -space-x-2.5 shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
                        isSelected ? 'scale-110' : ''
                      }`}
                      style={{ backgroundColor: theme.colors.primary }}
                      title="主色"
                    />
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
                        isSelected ? 'scale-110' : ''
                      }`}
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="辅色"
                    />
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
                        isSelected ? 'scale-110' : ''
                      }`}
                      style={{ backgroundColor: theme.colors.background }}
                      title="背景色"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-bold transition-colors duration-200 ${
                          isSelected
                            ? 'text-indigo-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {theme.name}
                      </h3>
                      {isSelected && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200/50">
                          <Check className="w-3 h-3" strokeWidth={3.5} />
                          使用中
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        {theme.colors.primary}
                      </span>
                      <span className="text-slate-300 mx-1">·</span>
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        {theme.colors.secondary}
                      </span>
                      <span className="text-slate-300 mx-1">·</span>
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.background }}
                      />
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        {theme.colors.background}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200/60">
                        <Check
                          className="w-4 h-4 text-white"
                          strokeWidth={3.5}
                        />
                      </div>
                    </div>
                  )}
                </button>

                <div className="mt-2 px-1">
                  <button
                    onClick={(e) => handleApplyBackground(theme, e)}
                    className={`w-full h-9 rounded-xl text-xs font-semibold
                      flex items-center justify-center gap-1.5
                      transition-all duration-250
                      ${
                        isSelected &&
                        currentTheme.colors.background ===
                          theme.colors.background
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/70 cursor-default'
                          : 'bg-white/60 text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 border border-white/80 hover:border-indigo-200/60 hover:shadow-md hover:shadow-indigo-100/40'
                      }`}
                  >
                    {isSelected &&
                    currentTheme.colors.background === theme.colors.background ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        已应用为画布背景
                      </>
                    ) : (
                      <>
                        <Paintbrush className="w-3.5 h-3.5" />
                        应用背景到画布
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="px-6 py-3.5
            border-t border-white/70
            bg-gradient-to-r from-white/60 to-purple-50/40 backdrop-blur-md
            rounded-b-3xl
            flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: currentTheme.colors.primary }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: currentTheme.colors.secondary }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              当前背景预览
            </p>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="px-4 h-8 rounded-lg text-xs font-semibold
              bg-gradient-to-r from-indigo-500 to-purple-500 text-white
              hover:shadow-lg hover:shadow-indigo-200/60
              hover:-translate-y-0.5
              transition-all duration-200"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
